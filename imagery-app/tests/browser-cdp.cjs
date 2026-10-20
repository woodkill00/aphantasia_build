'use strict';
/* Dependency-free real-Chrome checks. Run with Node >=22 and preinstalled Google Chrome.
 * No package installation, web server, browser download, or sandbox/security bypass.
 * Inputs are synthetic. Nothing is uploaded. Mobile means viewport/touch emulation only.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {setTimeout: sleep} = require('node:timers/promises');

function settlesWithin(promise, milliseconds) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(false), milliseconds);
    promise.then(() => { clearTimeout(timer); resolve(true); }, error => { clearTimeout(timer); reject(error); });
  });
}
async function stopChild(processHandle, closed, waits = [5000, 2000, 2000]) {
  if (await settlesWithin(closed, waits[0])) return;
  processHandle.kill('SIGTERM');
  if (await settlesWithin(closed, waits[1])) return;
  processHandle.kill('SIGKILL');
  assert.ok(await settlesWithin(closed, waits[2]), 'Chrome child did not close after termination');
}
async function stopChrome(browser, waits) {
  try { await browser.cdp.send('Browser.close'); } catch { /* Closing may disconnect DevTools before its acknowledgement. */ }
  browser.cdp.close();
  await stopChild(browser.processHandle,browser.closed,waits);
}


const root = path.resolve(process.env.IMAGERY_APP_ROOT || path.join(__dirname, '..'));
const M = require(path.join(root, 'src/model.js'));
const artifact = path.join(root, 'index.html');
function initialGuardRemaining(events, now, explicitHideAt = null) {
  const guards=events.filter(event => ['resize','blur','pagehide'].includes(event.type) || (event.type==='visibilitychange' && event.hidden));
  const boundaries=guards.map(event=>event.time);if(Number.isFinite(explicitHideAt))boundaries.push(explicitHideAt);
  if (!boundaries.length) return 0;
  return Math.max(0, Math.max(...boundaries) + M.REVEAL_GAP_MS + 100 - now);
}
function assertFullscreenDraftMessage(message) {
  assert.match(message,/fix|invalid|discard/i,'fullscreen invalid draft error must explain how to resolve invalid edits');
  assert.match(message,/exit fullscreen/i,'fullscreen draft error must explain how to reach the editor');
}
function assertFullscreenSnapshot(snapshot, expectedElement) {
  assert.ok(snapshot, 'A native fullscreenchange event must be observed after the action');
  assert.equal(snapshot.trusted,true,'fullscreenchange must be a native browser event');
  assert.equal(snapshot.element,expectedElement,'fullscreenchange reported the wrong element');
  assert.equal(snapshot.visibility,'Hidden','fullscreenchange handler must synchronously conceal');
  assert.match(snapshot.canvasLabel,/hidden/i,'fullscreenchange handler must update the hidden description');
  assert.equal(snapshot.coloredPixels,0,'fullscreenchange handler must synchronously clear every canvas pixel to black');
  assert.equal(snapshot.focus,expectedElement?'exit-fullscreen':'fullscreen','fullscreenchange must focus the visible mode control');
}
function assertMotionSnapshot(snapshot, expectedMatches) {
  assert.ok(snapshot,'A native MediaQueryList change event must be observed after changing preference');
  assert.equal(snapshot.trusted,true,'motion preference change must be a native browser event');
  assert.equal(snapshot.matches,expectedMatches,'motion event reported the wrong preference');
  assert.equal(snapshot.visibility,'Hidden','motion change handler must synchronously conceal');
  assert.match(snapshot.canvasLabel,/hidden/i,'motion change handler must update the hidden description');
  assert.equal(snapshot.coloredPixels,0,'motion change handler must synchronously clear every canvas pixel to black');
}
// Independent CSS HSL oracle; never calls the production model color formatter.
function hslRgb({h,s,l}) {
  const light=l/100, amplitude=(s/100)*Math.min(light,1-light);
  const channel=offset=>{const k=(offset+h/30)%12;return Math.round(255*(light-amplitude*Math.max(-1,Math.min(k-3,9-k,1))));};
  return [channel(0),channel(8),channel(4)];
}
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const {scene: fixtureScene, legacy} = require('./fixtures.cjs');
const {runIndependentScenarios}=require('./independent-user-scenarios.cjs');
const {runSequenceScenarios}=require('./browser-sequence.cjs');
const {runLiveScenarios}=require('./browser-live.cjs');
const {runItemScenarios}=require('./browser-items.cjs');
const {runDirectEditorScenarios}=require('./browser-direct-editor.cjs');
const {runIndependentSequenceScenarios}=require('./independent-sequence-user-scenarios.cjs');
const scene = changes => { const {shape,x,y,size,...rest}=changes||{}; const value = fixtureScene(rest); for(const [key,v] of Object.entries({shape,x,y,size})) if(v!==undefined)value.scene.objects[0][key]=v; return value; };
function fixtures() {
  const valid = scene({name:'Synthetic imported scene', shape:'square'});
  return {
    valid,
    invalid: [
      ['empty', ''], ['truncated', '{'], ['null', 'null'], ['array', '[]'],
      ['future-version', JSON.stringify({...valid, version:999})],
      ['unknown-animation', JSON.stringify({...valid, animation:true})],
      ['unknown-url', JSON.stringify({...valid, url:'https://example.invalid'})],
      ['embedded-note', JSON.stringify({...valid, notes:'Synthetic note'})],
      ['duplicate-key', JSON.stringify(valid).replace('"version":3','"version":999,"version":3')],
      ['nested-object-extra', JSON.stringify(scene({objects:[{...scene().scene.objects[0],url:'https://example.invalid'}]}))],
      ['invalid-object-color', JSON.stringify(scene({objects:[{...scene().scene.objects[0],color:{h:360,s:20,l:40}}]}))],
      ['duplicate-object-id', JSON.stringify(scene({objects:[scene().scene.objects[0],scene().scene.objects[0]]}))],
      ['nested-duplicate-key', JSON.stringify(valid).replace('"h":200','"h":200,"\\u0068":200')],
      ['oversize', ' '.repeat(M.MAX_IMPORT_BYTES + 1)],
    ],
  };
}
function checkFixtures() {
  const f = fixtures();
  assert.deepEqual(M.parseScene(JSON.stringify(f.valid)), f.valid);
  for (const [name, value] of f.invalid) assert.throws(() => M.parseScene(value), undefined, name);
  assert.equal(Buffer.byteLength(f.invalid.at(-1)[1]), M.MAX_IMPORT_BYTES + 1);
  assert.deepEqual(M.parseScene(JSON.stringify(scene({name:'<img src=x onerror=alert(1)>'}))), scene({name:'<img src=x onerror=alert(1)>'}));
  assert.deepEqual(M.parseScene(JSON.stringify(legacy())),M.canonicalScene(legacy()));
  return {valid:3, rejected:f.invalid.length};
}

class CDP {
  constructor(socket) {
    this.socket = socket; this.id = 0; this.pending = new Map(); this.handlers = new Set();
    socket.addEventListener('message', event => {
      let message;
      try { message = JSON.parse(String(event.data)); }
      catch (error) { this.failPending(error); return; }
      if (message.id) {
        const item = this.pending.get(message.id);
        if (!item) return;
        this.pending.delete(message.id); clearTimeout(item.timer);
        if (message.error) item.reject(new Error(`${item.method}: ${message.error.message}`));
        else item.resolve(message.result || {});
      } else for (const handler of this.handlers) handler(message);
    });
    socket.addEventListener('close', () => this.failPending(new Error('Chrome DevTools connection closed')));
    socket.addEventListener('error', () => this.failPending(new Error('Chrome DevTools connection failed')));
  }
  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { socket.close(); reject(new Error('DevTools connection timed out')); }, 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, {once:true});
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('DevTools connection failed')); }, {once:true});
    });
    return new CDP(socket);
  }
  failPending(error) {
    for (const item of this.pending.values()) { clearTimeout(item.timer); item.reject(error); }
    this.pending.clear();
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
      this.pending.set(id, {resolve, reject, timer, method});
      try { this.socket.send(JSON.stringify({id, method, params, ...(sessionId ? {sessionId} : {})})); }
      catch (error) { clearTimeout(timer); this.pending.delete(id); reject(error); }
    });
  }
  on(handler) { this.handlers.add(handler); return () => this.handlers.delete(handler); }
  close() { this.socket.close(); }
}
async function until(fn, label, timeout = 7000) {
  const end = Date.now() + timeout;
  do { if (await fn()) return; await sleep(25); } while (Date.now() < end);
  throw new Error(`Timed out waiting for ${label}`);
}
async function startChrome(profile) {
  assert.equal(typeof WebSocket, 'function', 'Node with built-in WebSocket is required (Node >=22)');
  assert.ok(!process.getuid || process.getuid() !== 0, 'Run Chrome as a non-root user with its sandbox enabled');
  const executable = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  fs.accessSync(executable, fs.constants.X_OK);
  const args = ['--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', 'about:blank'];
  let diagnostic = '', launchError;
  const processHandle = spawn(executable, args, {stdio:['ignore','ignore','pipe']});
  const closed = new Promise(resolve => processHandle.once('close',resolve));
  processHandle.stderr.on('data', chunk => { diagnostic = (diagnostic + chunk).slice(-16000); });
  processHandle.on('error', error => { launchError = error; });
  try {
    const endpointFile = path.join(profile, 'DevToolsActivePort');
    await until(() => {
      if (launchError) throw launchError;
      if (processHandle.exitCode !== null) throw new Error(`Chrome exited (${processHandle.exitCode}): ${diagnostic}`);
      return fs.existsSync(endpointFile);
    }, 'sandboxed Chrome startup', 20000);
    const [port, socketPath] = fs.readFileSync(endpointFile,'utf8').trim().split('\n');
    assert.match(port, /^\d+$/); assert.match(socketPath, /^\/devtools\/browser\//);
    return {processHandle, closed, cdp:await CDP.connect(`ws://127.0.0.1:${port}${socketPath}`), executable, args, diagnostic:() => diagnostic};
  } catch (error) {
    try { await stopChild(processHandle,closed,[0,2000,2000]); }
    catch (shutdownError) { error.chromeStillRunning=true; error.message+=`; ${shutdownError.message}`; }
    throw error;
  }
}

class Page {
  constructor(cdp, sessionId, targetId, device, downloads) {
    Object.assign(this, {cdp, sessionId, targetId, device, downloads});
    this.loadCount = 0; this.errors = []; this.remoteRequests = []; this.dialogs = []; this.downloadsStarted = new Map(); this.downloadsFinished = new Map();
    this.unlisten = cdp.on(message => {
      const p = message.params || {};
      if (message.method === 'Browser.downloadWillBegin') this.downloadsStarted.set(p.guid, p);
      if (message.method === 'Browser.downloadProgress') this.downloadsFinished.set(p.guid, p);
      if (message.sessionId !== sessionId) return;
      if (message.method === 'Page.loadEventFired') this.loadCount++;
      if (message.method === 'Runtime.exceptionThrown') this.errors.push(p.exceptionDetails.exception?.description || p.exceptionDetails.text);
      if (message.method === 'Runtime.consoleAPICalled' && p.type === 'error') this.errors.push(p.args.map(a => a.value ?? a.description).join(' '));
      if (message.method === 'Network.requestWillBeSent' && /^(https?|wss?|ftp):/i.test(p.request.url)) this.remoteRequests.push(p.request.url);
      if (message.method === 'Network.webSocketCreated') this.remoteRequests.push(p.url);
      if (message.method === 'Page.javascriptDialogOpening') {
        this.dialogs.push(p.type);
        this.send('Page.handleJavaScriptDialog', {accept:false}).catch(error => this.errors.push(error.message));
      }
    });
  }
  send(method, params) { return this.cdp.send(method, params, this.sessionId); }
  async evaluate(fn, ...args) {
    const expression = `(${fn.toString()})(...${JSON.stringify(args)})`;
    const result = await this.send('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async property(selector, key) {
    return this.evaluate((s, k) => { const e = document.querySelector(s); if (!e) throw new Error(`Missing ${s}`); return e[k]; }, selector, key);
  }
  async fresh() {
    await this.send('Page.bringToFront');
    const previousLoads = this.loadCount;
    const result = await this.send('Page.navigate', {url:pathToFileURL(artifact).href});
    assert.ok(!result.errorText, result.errorText);
    await until(() => this.loadCount > previousLoads, 'page load event for local artifact');
    await until(() => this.evaluate(() => document.readyState === 'complete' && !!window.ImageryModel && !!document.querySelector('#scene-canvas')), 'loaded local artifact');
    // This observer is installed after the app, so its snapshot captures the
    // state left by the app's synchronous fullscreenchange listener. Chrome can
    // mutate fullscreenElement before delivering that queued event and can
    // consume Escape without a DOM keydown. Wait for event delivery, never for
    // the desired Hidden result, then assert concealment without retrying it.
    await this.evaluate(() => {
      window.__testFullscreenTransitions=[];window.__testKeys=[];
      window.__testMotionTransitions=[];
      window.__testMotionQuery=matchMedia('(prefers-reduced-motion: reduce)');
      window.__testMotionQuery.addEventListener('change',event=>{
        const canvas=document.getElementById('scene-canvas'),bytes=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
        let coloredPixels=0;for(let i=0;i<bytes.length;i+=4)if(bytes[i]||bytes[i+1]||bytes[i+2])coloredPixels++;
        window.__testMotionTransitions.push(Object.freeze({time:performance.now(),trusted:event.isTrusted,matches:event.matches,visibility:document.getElementById('visibility-label').textContent,coloredPixels,canvasLabel:canvas.getAttribute('aria-label'),focus:document.activeElement?.id||null}));
      });

      document.addEventListener('fullscreenchange',event=>{
        const canvas=document.querySelector('#scene-canvas'),bytes=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
        let coloredPixels=0;for(let i=0;i<bytes.length;i+=4)if(bytes[i]||bytes[i+1]||bytes[i+2])coloredPixels++;
        window.__testFullscreenTransitions.push({
          time:performance.now(),trusted:event.isTrusted,element:document.fullscreenElement?.id||null,
          visibility:document.querySelector('#visibility-label').textContent,coloredPixels,
          canvasLabel:canvas.getAttribute('aria-label'),focus:document.activeElement?.id||null,
        });
      });
      document.addEventListener('keydown',event=>{window.__testKeys.push({key:event.key,time:performance.now(),trusted:event.isTrusted,defaultPrevented:event.defaultPrevented,element:document.fullscreenElement?.id||null,visibility:document.querySelector('#visibility-label').textContent});if(window.__testKeys.length>20)window.__testKeys.shift();});
    });
    await this.visible();
    assert.equal(await this.evaluate(()=>window.__testRAFRequests||0),0,'startup must not schedule timed animation');
  }
  async fullscreenAfter(action,expectedElement,label) {
    const state=()=>this.evaluate(()=>({time:performance.now(),element:document.fullscreenElement?.id||null,visibility:document.querySelector('#visibility-label').textContent,events:window.__testFullscreenTransitions.length}));
    const beforeAction=await state();
    await action();
    const afterAction=await state();
    await until(()=>this.evaluate(index=>window.__testFullscreenTransitions.length>index,beforeAction.events),`native fullscreenchange delivery: ${label}`);
    const observed=await this.evaluate(index=>window.__testFullscreenTransitions[index],beforeAction.events);
    console.log(`Fullscreen event evidence (${this.device.name}, ${label}): ${JSON.stringify({beforeAction,afterAction,observed})}`);
    assertFullscreenSnapshot(observed,expectedElement);
    assert.equal(await this.evaluate(()=>document.fullscreenElement?.id||null),expectedElement);
    await this.hidden();
  }
  async motionPreference(value) {
    assert.ok(value==='reduce'||value==='no-preference');
    const expected=value==='reduce',state=()=>this.evaluate(()=>({matches:window.__testMotionQuery.matches,events:window.__testMotionTransitions.length}));
    const beforeAction=await state();
    await this.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value}]});
    // Do not read MediaQueryList.matches between invalidation and native event
    // delivery: a live getter can refresh this separate observer's cached result
    // before Chrome reports its change. Observe event records, not live matches.
    const afterAction={events:await this.evaluate(()=>window.__testMotionTransitions.length)};
    if(beforeAction.matches!==expected){
      // CDP acknowledgement and matchMedia.matches may precede native change
      // delivery. Wait for the event, never for a desired application state.
      await until(()=>this.evaluate(index=>window.__testMotionTransitions.length>index,beforeAction.events),'native motion preference change delivery');
      const observed=await this.evaluate(index=>window.__testMotionTransitions[index],beforeAction.events);
      console.log(`Motion event evidence (${this.device.name}): ${JSON.stringify({beforeAction,afterAction,observed})}`);
      assertMotionSnapshot(observed,expected);
    }
    assert.equal((await state()).matches,expected);
  }
  async settleInitialGuard() {
    // Emulation/navigation can deliver a real resize after load. Respect the same
    // guard a person encounters; never retry Show, change the clock, or touch the controller.
    const state=()=>this.evaluate(() => ({events:window.__testLifecycle||[],time:performance.now(),hideAt:window.__testExplicitSetupHideAt??null}));
    const initial=await state();
    if (initialGuardRemaining(initial.events,initial.time,initial.hideAt)>0) {
      console.log(`Initial lifecycle guard observed (${this.device.name}): ${JSON.stringify(initial.events)}`);
      await until(async () => {
        await this.hidden();
        const current=await state();
        return initialGuardRemaining(current.events,current.time,current.hideAt)===0;
      },'observed initial lifecycle guard to expire without automatic reveal',M.REVEAL_GAP_MS+4000);
    }
    await this.hidden();
  }
  async hidden() {
    assert.equal(await this.property('#visibility-label','textContent'), 'Hidden');
    const raster = await this.canvas();
    assert.equal(raster.coloredPixels, 0, 'hidden canvas must actually contain black pixels only');
    assert.match(raster.label, /hidden/i);
  }
  async visible() {
    assert.equal(await this.property('#visibility-label','textContent'), 'Visible',
      `Expected an explicit Show to display the scene: ${JSON.stringify(await this.diagnostics())}`);
    assert.ok((await this.canvas()).coloredPixels > 0, 'visible canvas must actually paint a scene');
  }
  canvas() {
    return this.evaluate(() => {
      const c = document.querySelector('#scene-canvas'), ctx = c.getContext('2d');
      if (!ctx) throw new Error('Real Canvas 2D context unavailable');
      const bytes = ctx.getImageData(0, 0, c.width, c.height).data;
      let coloredPixels = 0;
      for (let i=0; i<bytes.length; i+=4) if (bytes[i] || bytes[i+1] || bytes[i+2]) coloredPixels++;
      return {width:c.width,height:c.height,coloredPixels,label:c.getAttribute('aria-label')};
    });
  }
  async click(selector) {
    const point = await this.evaluate(s => {
      const e = document.querySelector(s); if (!e) throw new Error(`Missing ${s}`);
      if (e.disabled) throw new Error(`Disabled ${s}`);
      e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
      const r = e.getBoundingClientRect(), x = r.x+r.width/2, y = r.y+r.height/2;
      const hit = document.elementFromPoint(x,y);
      if (!hit || !(e === hit || e.contains(hit))) throw new Error(`Pointer target occluded: ${s}`);
      const token = (window.__testClickSequence || 0) + 1; window.__testClickSequence=token;
      e.addEventListener('click', event => { window.__testClickDelivered={token,trusted:event.isTrusted}; },{once:true});
      return {x,y,token};
    }, selector);
    const {token,...coordinates}=point;
    if (this.device.touch) {
      await this.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{...coordinates,radiusX:1,radiusY:1,force:1,id:1}]});
      await this.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
    } else {
      await this.send('Input.dispatchMouseEvent', {type:'mousePressed',...coordinates,button:'left',clickCount:1});
      await this.send('Input.dispatchMouseEvent', {type:'mouseReleased',...coordinates,button:'left',clickCount:1});
    }
    // touchEnd acknowledgement can precede Chrome's synthesized click. Wait for delivery,
    // not for the expected application state, so a genuine failed Show still fails.
    await until(() => this.evaluate(token => window.__testClickDelivered?.token === token,token),`trusted click delivery to ${selector}`);
    assert.equal(await this.evaluate(() => window.__testClickDelivered.trusted),true,'interaction must be browser-trusted');
  }
  async diagnostics() {
    return this.evaluate(() => {
      const width=document.documentElement.clientWidth;
      const overflowing=[...document.body.querySelectorAll('*')].map(e => {
        const r=e.getBoundingClientRect(), style=getComputedStyle(e);
        return {tag:e.tagName,id:e.id,class:e.className,left:r.left,right:r.right,width:r.width,
          display:style.display,position:style.position,minWidth:style.minWidth,maxWidth:style.maxWidth,overflowX:style.overflowX};
      }).filter(e => e.width>0 && (e.right>width+1 || e.left< -1) && e.position!=='fixed').slice(0,20);
      return {status:document.querySelector('#status')?.textContent,visibility:document.querySelector('#visibility-label')?.textContent,
        innerWidth,innerHeight,clientWidth:width,scrollWidth:document.documentElement.scrollWidth,devicePixelRatio,
        visualViewport:window.visualViewport?{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale}:null,
        lifecycle:window.__testLifecycle||[],fullscreenElement:document.fullscreenElement?.id||null,activeElement:document.activeElement?.id||null,fullscreenTransitions:window.__testFullscreenTransitions||[],keys:window.__testKeys||[],overflowing};
    });
  }
  async noOverflow(width) {
    const diagnostics=await this.diagnostics();
    assert.ok(diagnostics.scrollWidth<=diagnostics.innerWidth+1,`horizontal overflow at ${width}: ${JSON.stringify(diagnostics)}`);
  }
  async focus(selector) { await this.evaluate(s => document.querySelector(s).focus(), selector); }
  async key(key, repeat = false) {
    const codes = {Enter:['Enter',13],Escape:['Escape',27],Tab:['Tab',9],' ':['Space',32],ArrowUp:['ArrowUp',38],ArrowDown:['ArrowDown',40],ArrowLeft:['ArrowLeft',37],ArrowRight:['ArrowRight',39],Home:['Home',36],End:['End',35]};
    const [code,virtual] = codes[key];
    const fields = {key,code,windowsVirtualKeyCode:virtual,nativeVirtualKeyCode:virtual};
    await this.send('Input.dispatchKeyEvent', {type:'keyDown',...fields,autoRepeat:repeat,...(key === 'Enter' ? {text:'\r',unmodifiedText:'\r'} : key === ' ' ? {text:' ',unmodifiedText:' '} : {})});
    await this.send('Input.dispatchKeyEvent', {type:'keyUp',...fields});
  }
  async fill(selector, value) {
    // Native editing for text/number controls; select helper below dispatches DOM events.
    await this.focus(selector);
    await this.send('Input.dispatchKeyEvent', {type:'keyDown',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});
    await this.send('Input.dispatchKeyEvent', {type:'keyUp',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});
    await this.send('Input.insertText', {text:String(value)});
    assert.equal(await this.property(selector,'value'), String(value), `native input failed for ${selector}`);
  }
  async select(selector, value) {
    await this.evaluate((s,v) => {
      const e = document.querySelector(s); e.value=v;
      if (e.value !== v) throw new Error(`Missing option ${v}`);
      e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));
    }, selector, String(value));
  }
  async nativeSelect(selector,value) {
    const index=await this.evaluate((s,v)=>[...document.querySelector(s).options].findIndex(o=>o.value===v),selector,String(value));
    assert.ok(index>=0,`Missing native select option ${value}`);await this.focus(selector);await this.key('Home');for(let i=0;i<index;i++)await this.key('ArrowDown');
    assert.equal(await this.property(selector,'value'),String(value));
  }
  async swatch(prefix) {
    return this.evaluate(p=>{
      const e=document.getElementById(p+'-color-swatch'),r=e.getBoundingClientRect(),style=getComputedStyle(e);
      return {rgb:style.backgroundColor,hidden:e.hidden,width:r.width,height:r.height,display:style.display,
        label:e.getAttribute('aria-label'),text:document.getElementById(p+'-color-text').textContent,
        values:{h:Number(document.getElementById(p+'-hue').value),s:Number(document.getElementById(p+'-saturation').value),l:Number(document.getElementById(p+'-lightness').value)}};
    },prefix);
  }
  async assertSwatch(prefix, expected) {
    const sample=await this.swatch(prefix),rgb=(sample.rgb.match(/[\d.]+/g)||[]).slice(0,3).map(Number),want=hslRgb(expected||sample.values);
    assert.equal(sample.hidden,false,`${prefix} color sample hidden`);assert.notEqual(sample.display,'none');
    assert.ok(sample.width>=16&&sample.height>=16&&sample.width<=120&&sample.height<=120,`${prefix} preview should be a small visible color patch: ${JSON.stringify(sample)}`);
    assert.equal(rgb.length,3,`No actual CSS RGB sample: ${sample.rgb}`);rgb.forEach((channel,index)=>assert.ok(Math.abs(channel-want[index])<=1,`${prefix} actual swatch ${sample.rgb} differs from HSL ${JSON.stringify(expected||sample.values)}`));
    assert.ok(sample.label&&sample.text,`${prefix} swatch needs text equivalent`);return sample;
  }
  async rangeInput(selector) {
    const prefix=selector.startsWith('#object-')?'object':'background',other=prefix==='object'?'background':'object';
    const prior=await this.swatch(prefix),unchanged=await this.swatch(other);
    const beforeRaster=await this.evaluate(()=>{const c=document.getElementById('scene-canvas'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let sum=0;for(let i=0;i<a.length;i++)sum=(sum+a[i]*(i%251+1))>>>0;return sum;});
    const point=await this.evaluate(s=>{const e=document.querySelector(s);e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();window.__rangeEvents=[];for(const name of ['input','change'])e.addEventListener(name,event=>window.__rangeEvents.push({type:name,trusted:event.isTrusted}),{once:true});return {x:r.left+r.width*0.7,y:r.top+r.height/2}},selector);
    await this.send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
    await until(()=>this.evaluate(()=>window.__rangeEvents.some(e=>e.type==='input')),'native range input before pointer release');
    assert.equal(await this.evaluate(()=>window.__rangeEvents.find(e=>e.type==='input').trusted),true);
    assert.equal(await this.evaluate(()=>window.__rangeEvents.some(e=>e.type==='change')),false,'range must update before the change/commit event');
    await this.visible();const afterRaster=await this.evaluate(()=>{const c=document.getElementById('scene-canvas'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let sum=0;for(let i=0;i<a.length;i++)sum=(sum+a[i]*(i%251+1))>>>0;return sum;});assert.notEqual(afterRaster,beforeRaster,'actual scene pixels must change during native input before release or Apply');const changed=await this.assertSwatch(prefix);assert.notDeepEqual(changed.values,prior.values,'native range input must change its draft value');assert.equal((await this.swatch(other)).rgb,unchanged.rgb,'the other swatch must remain unchanged');assert.equal(await this.property('#draft-label','textContent'),'Live draft');await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
  }
  async file(filename, value, waitForRead = true, selector = '#scene-import') {
    const filePath = path.join(this.downloads, filename);
    fs.writeFileSync(filePath, typeof value === 'string' ? value : JSON.stringify(value));
    await this.importPath(filePath, waitForRead, selector); return filePath;
  }
  async importPath(filePath, waitForRead = true, selector = '#scene-import') {
    const {root:documentNode} = await this.send('DOM.getDocument');
    const {nodeId} = await this.send('DOM.querySelector', {nodeId:documentNode.nodeId, selector});
    assert.ok(nodeId, 'file input missing');
    await this.send('DOM.setFileInputFiles', {nodeId,files:filePath ? [filePath] : []});
    if (waitForRead) await until(async () => !/^Reading the local/.test(await this.property('#status','textContent')), 'native File.text completion');
  }
  async download(selector, expectedName) {
    const previous = new Set(this.downloadsStarted.keys());
    await this.click(selector);
    let event;
    await until(() => { event = [...this.downloadsStarted.values()].find(e => !previous.has(e.guid)); return !!event; }, `download event for ${selector}`);
    assert.equal(event.suggestedFilename, expectedName);
    await until(() => {
      const state = this.downloadsFinished.get(event.guid)?.state;
      assert.notEqual(state, 'canceled', 'download canceled'); return state === 'completed';
    }, 'completed browser download');
    // allowAndName stores the actual browser-written bytes using the GUID, avoiding overwrite races.
    const filePath = path.join(this.downloads,event.guid);
    await until(() => fs.existsSync(filePath), 'download on disk');
    const bytes = fs.readFileSync(filePath);
    assert.ok(bytes.length > 0); assert.equal(bytes.at(-1), 10, 'JSON export should end in a newline');
    return {filePath, bytes, json:JSON.parse(bytes.toString('utf8')), sha256:digest(bytes)};
  }
  async viewport(width, height = this.device.height) {
    await this.send('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:this.device.scale,mobile:this.device.touch,screenWidth:width,screenHeight:height});
    await sleep(50);
  }
  async workspaceHeader() {
    const metrics=await this.evaluate(()=>[...document.querySelectorAll('.workspace-actions button')].filter(e=>!e.hidden).map(e=>{const r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const t=range.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{id:e.id,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,text:{left:t.left,right:t.right,top:t.top,bottom:t.bottom},hit:hit===e||e.contains(hit),viewport:{width:innerWidth,height:innerHeight}}}));
    assert.equal(metrics.length,3,'all three workspace actions must remain present');
    for(const m of metrics){assert.ok(m.width>=44&&m.height>=44&&m.hit&&m.left>=0&&m.right<=m.viewport.width+1&&m.top>=0&&m.bottom<=m.viewport.height+1,'whole44px workspace target: '+JSON.stringify(m));assert.ok(m.text.left>=m.left&&m.text.right<=m.right&&m.text.top>=m.top&&m.text.bottom<=m.bottom,'whole visible workspace button text: '+JSON.stringify(m));assert.ok(Math.abs(m.top-metrics[0].top)<=1,'workspace actions stay on one row: '+JSON.stringify(metrics));}
    return metrics;
  }
  async visualCapture(name) {
    // Synthetic, explicitly requested review frames only. This is separate from
    // optional raw failure screenshots, which never enter public CI output.
    const metrics=await this.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio}));
    const maxWidth=this.device.touch?390:800,maxHeight=this.device.touch?844:550;
    const scale=Math.min(1,maxWidth/(metrics.width*metrics.dpr),maxHeight/(metrics.height*metrics.dpr));
    const {data}=await this.send('Page.captureScreenshot',{format:'jpeg',quality:42,fromSurface:true,captureBeyondViewport:false,clip:{x:0,y:0,width:metrics.width,height:metrics.height,scale}});
    const bytes=Buffer.from(data,'base64');
    const result={device:this.device.name,name,mime:'image/jpeg',sha256:digest(bytes),bytes:bytes.length,viewport:{width:metrics.width,height:metrics.height,dpr:metrics.dpr},captureScale:scale,base64:data};
    console.log('IMAGERY_VISUAL_CAPTURE '+JSON.stringify(result));return {...result,base64:undefined};
  }
  async screenshot(name, out) {
    if (process.env.BROWSER_SCREENSHOTS !== '1') return;
    const {data} = await this.send('Page.captureScreenshot', {format:'png',captureBeyondViewport:true});
    fs.writeFileSync(path.join(out,`${this.device.name}-${name}.png`), Buffer.from(data,'base64'));
  }
  async close() { this.unlisten(); await this.cdp.send('Target.closeTarget',{targetId:this.targetId}); }
}

async function run() {
  checkFixtures();
  const out = path.resolve(process.env.BROWSER_TEST_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(),'imagery-browser-results-')));
  fs.mkdirSync(out,{recursive:true});
  const profile = fs.mkdtempSync(path.join(os.tmpdir(),'imagery-chrome-profile-'));
  const report = {
    started:new Date().toISOString(), status:'RUNNING', artifactSha256:digest(fs.readFileSync(artifact)),
    platform:process.platform,node:process.version,results:[],
    scope:'Real headless Google Chrome; local file URL; desktop and phone-sized viewport/touch emulation; synthetic data only.',
    limitations:['Viewport/touch emulation does not establish physical-phone or Safari support.',
      'No screen-reader audit, actual OS file-picker interaction, display calibration, medical/sensory clearance, or universal-browser compatibility is established.',
      'Offline/request assertions cover the inspected page, not all background browser or runner traffic.',
      'File selection uses native CDP DOM.setFileInputFiles; the operating-system chooser itself is not exercised.'],
  };
  const write = () => fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
  let browser, profileCleanupSafe=true;
  async function runCase(page, name, fn, {startupLive=false}={}) {
    const start = Date.now();
    try {
      await page.viewport(page.device.width); await page.fresh();
      // Legacy cases explicitly start after a real native Hide, not a hidden
      // startup override. The v7 startup case observes untouched actual startup.
      if(!startupLive){await page.click('#hide-scene');await page.evaluate(()=>{window.__testExplicitSetupHideAt=performance.now()});await page.hidden();}
      await fn();
      const result = {device:page.device.name,name,status:'PASS',durationMs:Date.now()-start}; report.results.push(result);
      console.log(`PASS ${page.device.name}: ${name}`);
    } catch (error) {
      const result = {device:page.device.name,name,status:'FAIL',durationMs:Date.now()-start,error:error.stack}; report.results.push(result);
      console.error(`FAIL ${page.device.name}: ${name}\n${error.stack}`);
      try { result.diagnostics=await page.diagnostics(); console.error(`Failure metrics: ${JSON.stringify(result.diagnostics)}`); } catch { /* Preserve original error if page is gone. */ }
      try { await page.screenshot(name.replace(/[^a-z0-9]+/gi,'-')+'-failure',out); } catch { /* Optional evidence only. */ }
    }
    write();
  }
  try {
    try { browser = await startChrome(profile); }
    catch (error) { report.status='BLOCKED'; report.launchError=error.stack; profileCleanupSafe=!error.chromeStillRunning; process.exitCode=2; return; }
    const {cdp} = browser;
    report.browser = await cdp.send('Browser.getVersion');
    report.chromeExecutable=browser.executable; report.chromeArguments=browser.args.map(a => a.startsWith('--user-data-dir=') ? '--user-data-dir=<temporary-profile>' : a);
    report.sandbox='Default Chrome sandbox retained; no sandbox/security-disabling flags used.';
    for (const device of [{name:'desktop',width:1366,height:900,scale:1,touch:false},{name:'mobile-emulation',width:390,height:844,scale:3,touch:true}]) {
      const downloads = path.join(out,device.name); fs.mkdirSync(downloads,{recursive:true});
      const {targetId} = await cdp.send('Target.createTarget',{url:'about:blank'});
      const {sessionId} = await cdp.send('Target.attachToTarget',{targetId,flatten:true});
      const page = new Page(cdp,sessionId,targetId,device,downloads);
      try {
        await page.send('Page.enable'); await page.send('Runtime.enable'); await page.send('Network.enable');
        await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`
          window.__testLifecycle=[];
          window.__testRAFRequests=0;const realRAF=window.requestAnimationFrame;window.requestAnimationFrame=function(fn){window.__testRAFRequests++;return realRAF.call(this,fn)};
          const record=event=>{window.__testLifecycle.push({type:event.type,time:performance.now(),width:innerWidth,height:innerHeight,hidden:document.hidden});if(window.__testLifecycle.length>20)window.__testLifecycle.shift();};
          for(const type of ['resize','blur','focus','pageshow','pagehide'])window.addEventListener(type,record);
          document.addEventListener('visibilitychange',record);
        `});
        await page.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
        await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
        await page.send('Emulation.setTouchEmulationEnabled',{enabled:device.touch,...(device.touch?{maxTouchPoints:1}:{})});
        await cdp.send('Browser.setDownloadBehavior',{behavior:'allowAndName',downloadPath:downloads,eventsEnabled:true});
        await runCase(page,'startup pixels, offline mode, and layout',async () => {
          assert.match(await page.evaluate(() => document.title),/Imagery Field/);
          assert.equal(await page.evaluate(() => navigator.onLine),false);
          assert.equal(await page.evaluate(() => location.protocol),'file:');
          const canvas = await page.canvas(); assert.ok(canvas.width>0 && canvas.width<=4096); assert.ok(canvas.height>0 && canvas.height<=4096); assert.ok(canvas.width*canvas.height<=8388608); const ratio=await page.evaluate(()=>{const r=document.querySelector('#scene-canvas').getBoundingClientRect();return {w:r.width,h:r.height}}); assert.ok(Math.abs(canvas.width/canvas.height-ratio.w/ratio.h)<0.01,'canvas backing and CSS aspect ratios differ');
          await page.noOverflow(device.width);await page.workspaceHeader();
          await page.visible();assert.equal(await page.evaluate(()=>window.__testRAFRequests),0);await page.visualCapture('v7-startup-live-static');await page.screenshot('startup',out);
          const rgb=await page.evaluate(()=>{const c=document.getElementById('scene-canvas');return Array.from(c.getContext('2d').getImageData(0,0,1,1).data).slice(0,3)});hslRgb({h:4,s:60,l:4}).forEach((v,i)=>assert.ok(Math.abs(rgb[i]-v)<=1));
          await page.fill('#background-saturation-value',100);await page.visible();assert.equal(await page.property('#background-saturation','value'),'100');const saturated=await page.evaluate(()=>{const c=document.getElementById('scene-canvas');return Array.from(c.getContext('2d').getImageData(0,0,1,1).data).slice(0,3)});hslRgb({h:4,s:100,l:4}).forEach((v,i)=>assert.ok(Math.abs(saturated[i]-v)<=1));await page.visualCapture('v7-live-background-saturation-100');
          await page.click('#capture-add');await page.hidden();const sequence=await page.download('#sequence-export','imagery-field-sequence-v2.json');assert.equal(sequence.json.sequence.background.s,100);await page.click('#sequence-load');const restored=await page.download('#export-scene','imagery-field-scene-v3.json');assert.equal(restored.json.scene.background.s,100);
          await page.fresh();await page.visible();assert.equal(await page.property('#background-saturation-value','value'),'60');assert.equal(await page.evaluate(()=>window.__testRAFRequests),0);
        },{startupLive:true});
        await runCase(page,'native Show, Escape, rapid lock, keyboard, and End',async () => {
          await page.settleInitialGuard(); await page.click('#show-scene'); await page.visible(); await page.key('Escape'); await page.hidden();
          // Keep the whole repeated burst within the 3-second lock instead of relying on runner speed.
          const start = await page.evaluate(() => performance.now());
          for (let i=0;i<8;i++) { await page.click('#show-scene'); await page.hidden(); }
          assert.ok((await page.evaluate(() => performance.now()))-start < M.REVEAL_GAP_MS,'runner too slow to validate rapid lock');
          await sleep(M.REVEAL_GAP_MS+100); await page.hidden();
          await page.focus('#show-scene'); await page.key('Enter',true); await page.hidden();
          await page.key('Enter'); await page.visible(); await page.click('#end-viewing'); await page.hidden();
          assert.equal(await page.evaluate(() => document.activeElement.id),'guidance-title');
        });
        await runCase(page,'presets, native edits, undo/redo, and numeric validation',async () => {
          for (let i=0;i<M.presets().length;i++) { await page.select('#preset',i); await page.hidden(); assert.equal(await page.property('#shape','value'),M.presets()[i].scene.objects[0]?.shape||''); }
          await page.fill('#scene-name','Synthetic browser scene'); await page.select('#shape','circle'); await page.fill('#position-x','25');
          await page.click('#apply-changes'); await page.hidden();
          const got = await page.download('#export-scene','imagery-field-scene-v3.json');
          assert.equal(got.json.scene.name,'Synthetic browser scene'); assert.equal(got.json.scene.objects[0].x,25); assert.equal(got.json.scene.objects[0].shape,'circle');
          await page.click('#undo'); await page.hidden(); await page.click('#redo'); await page.hidden(); assert.equal(await page.property('#scene-name','value'),'Synthetic browser scene');
          await page.fill('#position-x','0'); await page.click('#apply-changes'); await page.hidden();
          assert.match(await page.property('#status','textContent'),/inset|position|whole number|invalid/i);
          await page.click('#discard'); assert.equal(await page.property('#position-x','value'),'25');
        });
        await runCase(page,'native disk download/reload/file-import byte roundtrip',async () => {
          await page.fill('#scene-name','Portable roundtrip'); await page.click('#apply-changes');
          const first = await page.download('#export-scene','imagery-field-scene-v3.json');
          await page.fresh(); await page.importPath(first.filePath); await page.hidden();
          assert.equal(await page.property('#scene-name','value'),'Portable roundtrip');
          const second = await page.download('#export-scene','imagery-field-scene-v3.json');
          assert.deepEqual(second.bytes,first.bytes,'actual browser-written JSON bytes differ after reload/import');
          await page.importPath(first.filePath); await page.hidden(); assert.equal(await page.property('#scene-name','value'),'Portable roundtrip');
        });
        await runCase(page,'native malformed, oversized, duplicate, and inert-markup imports',async () => {
          const original = await page.property('#scene-name','value');
          for (const [name,value] of fixtures().invalid) {
            await page.file(`${name}.json`,value); await page.hidden();
            assert.equal(await page.property('#scene-name','value'),original,name); assert.match(await page.property('#status','textContent'),/unchanged/i,name);
          }
          const inert = '<img src=x onerror=alert(1)>';
          await page.file('inert.json',scene({name:inert})); await page.hidden();
          assert.equal(await page.property('#scene-name','value'),inert); assert.equal(await page.evaluate(() => document.querySelectorAll('img').length),0);
          await page.importPath(null); assert.equal(await page.property('#scene-name','value'),inert);
        });
        await runCase(page,'delayed File.text cannot override Hide or newer import',async () => {
          await page.evaluate(() => {
            window.__testReads={}; const original=File.prototype.text;
            File.prototype.text=function() { if(this.name.startsWith('delay-')) return new Promise((resolve,reject) => { window.__testReads[this.name]={resolve,reject}; }); return original.call(this); };
          });
          const original = await page.property('#scene-name','value');
          await page.file('delay-hide.json',scene({name:'stale'}),false);
          await until(() => page.evaluate(() => !!window.__testReads['delay-hide.json']), 'delayed read to start');
          await page.click('#hide-scene');
          await page.evaluate(text => window.__testReads['delay-hide.json'].resolve(text),JSON.stringify(scene({name:'stale'})));
          await sleep(25); await page.hidden(); assert.equal(await page.property('#scene-name','value'),original);
          await page.file('delay-old.json',scene({name:'old'}),false);
          await until(() => page.evaluate(() => !!window.__testReads['delay-old.json']), 'older read to start');
          await page.file('new.json',scene({name:'new'}));
          await page.evaluate(text => window.__testReads['delay-old.json'].resolve(text),JSON.stringify(scene({name:'old'})));
          await sleep(25); await page.hidden(); assert.equal(await page.property('#scene-name','value'),'new');
        });
        await runCase(page,'separate notes preview, consent, download, invalidation, and reload',async () => {
          await page.click('#notes-details > summary'); await page.fill('#notes','Synthetic private note'); await page.select('#note-category','unsure');
          const exported = await page.download('#export-scene','imagery-field-scene-v3.json'); assert.ok(!exported.bytes.toString().includes('Synthetic private note'));
          await page.click('#preview-notes');
          const preview = JSON.parse(await page.property('#notes-preview','textContent'));
          assert.equal(await page.property('#export-notes','disabled'),true); assert.equal(await page.property('#include-note','checked'),false);
          await page.click('#include-note');
          const note = await page.download('#export-notes','imagery-field-note-v1.json'); assert.deepEqual(note.json,preview);
          assert.deepEqual(note.bytes,Buffer.from(JSON.stringify(preview,null,2)+'\n'));
          await page.fill('#notes','Changed synthetic note');
          assert.equal(await page.property('#export-notes','disabled'),true); assert.equal(await page.property('#include-note','checked'),false); assert.equal(await page.property('#notes-export-area','hidden'),true);
          await page.click('#preview-notes'); await page.click('#include-note'); await page.select('#note-category','none');
          assert.equal(await page.property('#export-notes','disabled'),true); assert.equal(await page.property('#include-note','checked'),false);
          await page.fresh(); assert.equal(await page.property('#notes','value'),'');
        });
        await runCase(page,'note validation rejects overlength, null, and unknown category',async () => {
          await page.click('#notes-details > summary');
          // Direct DOM mutations intentionally exercise validation beyond maxlength and listed options.
          for (const text of ['x'.repeat(4001),'null\u0000character']) {
            await page.evaluate(value => { const e=document.querySelector('#notes'); e.value=value; e.dispatchEvent(new Event('input',{bubbles:true})); },text);
            await page.click('#preview-notes'); assert.equal(await page.property('#notes-export-area','hidden'),true); assert.match(await page.property('#status','textContent'),/4,000/);
          }
          await page.evaluate(() => { document.querySelector('#notes').value=''; document.querySelector('#note-category').value='not-listed'; });
          await page.click('#preview-notes'); assert.equal(await page.property('#notes-export-area','hidden'),true); assert.match(await page.property('#status','textContent'),/listed observation/);
        });
        await runCase(page,'responsive widths, actual resize hide, targets, and focus',async () => {
          await page.settleInitialGuard(); await page.click('#show-scene'); await page.visible();
          for (const width of [320,390,768,1366]) {
            await page.viewport(width,844); await page.hidden();
            await page.noOverflow(width);
            for (const id of ['show-scene','hide-scene','end-viewing','apply-changes']) {
              const rect = await page.evaluate(id => { const r=document.getElementById(id).getBoundingClientRect(); return {width:r.width,height:r.height}; },id);
              assert.ok(rect.width>=44 && rect.height>=44,`${id} touch target smaller than 44 CSS px at ${width}`);
            }
          }
          await page.focus('#show-scene'); assert.equal(await page.evaluate(() => document.activeElement.id),'show-scene');
          await page.key('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id),'hide-scene');
          await page.key('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id),'end-viewing');
          await page.key('Enter'); assert.equal(await page.evaluate(() => document.activeElement.id),'guidance-title'); await page.hidden();
        });
        await runCase(page,'repeated editing actions do not replay a reveal',async () => {
          for (let i=0;i<20;i++) {
            await page.select('#preset',i%5); await page.click('#apply-changes');
            if (!await page.property('#undo','disabled')) await page.click('#undo');
            if (!await page.property('#redo','disabled')) await page.click('#redo');
            await page.click('#hide-scene'); await page.click('#show-scene'); await page.hidden();
          }
          await sleep(M.REVEAL_GAP_MS+100); await page.hidden();
        });
        await runCase(page,'v2 native add/select/delete, movement, sliders and exact export',async()=>{
          await page.file('empty-v2.json',scene({objects:[]}));
          await page.nativeSelect('#add-shape','pixel');await page.click('#add-object');await page.hidden();await page.click('#apply-changes');
          const first=await page.download('#export-scene','imagery-field-scene-v3.json');assert.equal(first.json.scene.objects.length,1);assert.equal(first.json.scene.objects[0].shape,'pixel');const firstId=first.json.scene.objects[0].id;
          await page.nativeSelect('#add-shape','circle');await page.click('#add-object');await page.click('#apply-changes');
          const second=await page.download('#export-scene','imagery-field-scene-v3.json');assert.equal(second.json.scene.objects.length,2);const secondId=second.json.scene.objects.find(o=>o.id!==firstId).id;
          await page.nativeSelect('#object-select',firstId);await page.fill('#position-x','35.25');await page.fill('#position-y','65');await page.fill('#size','6');await page.click('#apply-changes');
          for(const slider of ['#object-hue','#object-saturation','#object-lightness']){await sleep(M.REVEAL_GAP_MS+100);await page.click('#show-scene');await page.visible();await page.rangeInput(slider);await page.click('#apply-changes');}
          const changed=await page.download('#export-scene','imagery-field-scene-v3.json');const pixel=changed.json.scene.objects.find(o=>o.id===firstId);assert.equal(pixel.x,35.25);assert.equal(pixel.y,65);assert.equal(pixel.size,6);assert.equal(changed.json.version,3);assert.equal(changed.json.sampler,'styled-objects-3');assert.deepEqual(M.canonicalScene(changed.json),changed.json);
          await page.click('#delete-object');await page.hidden();await page.click('#apply-changes');const removed=await page.download('#export-scene','imagery-field-scene-v3.json');assert.deepEqual(removed.json.scene.objects.map(o=>o.id),[secondId]);await page.click('#undo');const restored=await page.download('#export-scene','imagery-field-scene-v3.json');assert.deepEqual(restored.json,changed.json);
        });
        await runCase(page,'v5 background input updates live and empty field Hide is black',async()=>{
          await page.file('colored-empty.json',scene({objects:[],background:{h:200,s:30,l:20}}));await page.settleInitialGuard();await page.click('#show-scene');await page.visible();
          const raster=await page.canvas();assert.equal(raster.coloredPixels,raster.width*raster.height,'background must fill full canvas');
          for(const slider of ['#background-hue','#background-saturation','#background-lightness']){if(slider!=='#background-hue'){await sleep(M.REVEAL_GAP_MS+100);await page.click('#show-scene');await page.visible();}await page.rangeInput(slider);await page.click('#apply-changes');await page.hidden();}const got=await page.download('#export-scene','imagery-field-scene-v3.json');assert.notEqual(got.json.scene.background.l,20);assert.deepEqual(got.json.scene.objects,[]);
          await sleep(M.REVEAL_GAP_MS+100);await page.click('#show-scene');await page.visible();await page.click('#hide-scene');await page.hidden();
        });
        await runCase(page,'v2 fullwindow square geometry and one-click placement',async()=>{
          await page.file('single-square.json',scene({shape:'square',size:20}));
          const layout=await page.evaluate(()=>{const c=document.querySelector('#scene-canvas'),r=c.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,innerWidth,innerHeight}});
          assert.ok(Math.abs(layout.left)<=1&&Math.abs(layout.top)<=1);assert.ok(Math.abs(layout.width-layout.innerWidth)<=1&&Math.abs(layout.height-layout.innerHeight)<=1,'canvas must cover fullwindow');
          await page.settleInitialGuard();await page.click('#show-scene');await page.visible();
          const bounds=await page.evaluate(()=>{const c=document.querySelector('#scene-canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let minX=c.width,maxX=-1,minY=c.height,maxY=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(d[i]||d[i+1]||d[i+2]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}}return {width:maxX-minX+1,height:maxY-minY+1}});
          assert.ok(Math.abs(bounds.width-bounds.height)<=2,'square contour is stretched');
          await page.click('#place-object');await page.visible();
          const pt=await page.evaluate(()=>{const r=document.querySelector('#scene-canvas').getBoundingClientRect();const points=[[0.65,0.65],[0.8,0.6],[0.6,0.8],[0.5,0.75]];for(const [x,y]of points){const px=r.left+r.width*x,py=r.top+r.height*y;if(document.elementFromPoint(px,py)?.id==='scene-canvas')return {x:px,y:py,px:x*100,py:y*100}}throw Error('No reachable canvas placement point')});
          await page.send('Input.dispatchMouseEvent',{type:'mousePressed',x:pt.x,y:pt.y,button:'left',clickCount:1});await page.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:pt.x,y:pt.y,button:'left',clickCount:1});await page.visible();await page.click('#apply-changes');const placed=await page.download('#export-scene','imagery-field-scene-v3.json');assert.ok(Math.abs(placed.json.scene.objects[0].x-pt.px)<0.2);assert.ok(Math.abs(placed.json.scene.objects[0].y-pt.py)<0.2);
        });
        await runCase(page,'v3 native fullscreen explicit Show, Exit and Escape retain synchronous concealment',async()=>{
          await page.settleInitialGuard();await page.click('#show-scene');await page.visible();
          await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','entry');
          assert.equal(await page.evaluate(()=>['fullscreen-show','exit-fullscreen'].every(id=>document.fullscreenElement.contains(document.getElementById(id)))),true);
          assert.equal(await page.property('#fullscreen-start','hidden'),false);await sleep(M.REVEAL_GAP_MS+100);await page.hidden();await page.click('#fullscreen-show');await page.visible();
          assert.equal(await page.property('#fullscreen-start','hidden'),true);assert.equal(await page.evaluate(()=>document.activeElement.id),'exit-fullscreen');
          await page.fullscreenAfter(()=>page.click('#exit-fullscreen'),null,'explicit Exit');
          await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','second entry');
          await sleep(M.REVEAL_GAP_MS+100);await page.click('#fullscreen-show');await page.visible();
          await page.fullscreenAfter(()=>page.key('Escape'),null,'browser-native Escape');
          await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','third entry');await page.hidden();
          await page.fullscreenAfter(()=>page.click('#exit-fullscreen'),null,'hidden-state Exit');
        });
        await runCase(page,'v3 swatches track draft selection, discard, history, presets and imports',async()=>{
          const sample=scene({background:{h:210,s:40,l:25},objects:[{id:'object-1',shape:'circle',x:35,y:50,size:20,color:{h:30,s:50,l:45}},{id:'object-2',shape:'pixel',x:65,y:50,size:4,color:{h:280,s:60,l:55}}]});
          await page.file('color-state.json',sample);await page.assertSwatch('object',sample.scene.objects[0].color);await page.assertSwatch('background',sample.scene.background);
          await page.focus('#object-hue');await page.key('ArrowUp');await page.assertSwatch('object',{h:31,s:50,l:45});await page.hidden();
          await page.focus('#background-lightness');await page.key('ArrowUp');await page.assertSwatch('background',{h:210,s:40,l:26});
          await page.nativeSelect('#object-select','object-2');await page.assertSwatch('object',sample.scene.objects[1].color);await page.assertSwatch('background',{h:210,s:40,l:26});
          await page.nativeSelect('#object-select','object-1');await page.assertSwatch('object',{h:31,s:50,l:45});await page.click('#discard');await page.assertSwatch('object',sample.scene.objects[0].color);await page.assertSwatch('background',sample.scene.background);
          await page.focus('#object-hue');await page.key('ArrowUp');await page.click('#apply-changes');await page.click('#undo');await page.assertSwatch('object',sample.scene.objects[0].color);await page.click('#redo');await page.assertSwatch('object',{h:31,s:50,l:45});
          await page.nativeSelect('#preset','4');await page.assertSwatch('object',M.presets()[4].scene.objects[0].color);await page.assertSwatch('background',M.presets()[4].scene.background);await page.hidden();
          await page.file('color-state-again.json',sample);await page.assertSwatch('object',sample.scene.objects[0].color);await page.assertSwatch('background',sample.scene.background);
          await page.file('background-only.json',scene({objects:[],background:{h:240,s:50,l:20}}));await page.assertSwatch('background',{h:240,s:50,l:20});assert.equal(await page.property('#object-color-swatch','hidden'),true);assert.match(await page.property('#object-color-text','textContent'),/no object|none|select|background.only/i);await page.hidden();
        });
        await runCase(page,'v3 real CSS swatches preserve zero-saturation and black-lightness semantics',async()=>{
          await page.file('color-semantics.json',scene({background:{h:210,s:40,l:25}}));
          await page.focus('#object-saturation');await page.key('Home');const gray=await page.assertSwatch('object');assert.equal(gray.values.s,0);await page.focus('#object-hue');await page.key('End');assert.equal((await page.assertSwatch('object')).rgb,gray.rgb,'hue must not change gray at zero saturation');
          await page.focus('#background-lightness');await page.key('Home');const black=await page.assertSwatch('background');assert.equal(black.values.l,0);assert.equal(black.rgb,'rgb(0, 0, 0)');await page.focus('#background-hue');await page.key('End');assert.equal((await page.assertSwatch('background')).rgb,black.rgb);await page.hidden();
          assert.equal(await page.property('#draft-label','textContent'),'Changes staged');await sleep(M.REVEAL_GAP_MS+100);await page.hidden();await page.click('#show-scene');await page.visible();
        });
        await runCase(page,'v3 clean fullscreen removes chrome and exposes keyboard Show and focused Exit',async()=>{
          await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','keyboard clean entry');
          const chrome=await page.evaluate(()=>['masthead','stage-body','viewing-bar','skip-controls'].map(id=>{const e=document.getElementById(id);return {id,hidden:e.hidden,display:getComputedStyle(e).display,rects:e.getClientRects().length}}));
          for(const item of chrome){assert.equal(item.hidden,true,item.id);assert.equal(item.display,'none',item.id);assert.equal(item.rects,0,item.id);}
          const tabbables=()=>page.evaluate(()=>[...document.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(e=>!e.disabled&&e.tabIndex>=0&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>e.id));
          assert.deepEqual((await tabbables()).sort(),['exit-fullscreen','fullscreen-show']);
          let reached=false;for(let i=0;i<4;i++){await page.key('Tab');const id=await page.evaluate(()=>document.activeElement.id);assert.ok(['','exit-fullscreen','fullscreen-show'].includes(id),`hidden studio entered keyboard sequence: ${id}`);if(id==='fullscreen-show'){reached=true;break;}}assert.equal(reached,true,'Tab must reach explicit Show from Exit');
          await sleep(M.REVEAL_GAP_MS+100);await page.key('Enter');await page.visible();assert.equal(await page.evaluate(()=>document.activeElement.id),'exit-fullscreen');assert.deepEqual(await tabbables(),['exit-fullscreen']);
          const focus=await page.evaluate(()=>{const e=document.getElementById('exit-fullscreen'),s=getComputedStyle(e);return {visible:e.matches(':focus-visible'),outline:s.outlineStyle,width:parseFloat(s.outlineWidth),opacity:Number(s.opacity)}});assert.equal(focus.visible,true);assert.notEqual(focus.outline,'none');assert.ok(focus.width>=2);assert.equal(focus.opacity,1);
          await page.fullscreenAfter(()=>page.key('Enter'),null,'keyboard Exit');
        });
        await runCase(page,'v3 fullscreen pointer and first-touch Exit stay discoverable without UI timers',async()=>{
          await page.evaluate(()=>{window.__testUiTimers=[];const original=window.setTimeout;window.setTimeout=function(fn,delay,...args){window.__testUiTimers.push(delay);return original.call(this,fn,delay,...args)}});
          await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','idle entry');await sleep(M.REVEAL_GAP_MS+100);await page.click('#fullscreen-show');await page.visible();
          await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:20,y:100});await sleep(350);
          const control=await page.evaluate(()=>{const e=document.getElementById('exit-fullscreen'),r=e.getBoundingClientRect(),s=getComputedStyle(e),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {width:r.width,height:r.height,left:r.left,top:r.top,right:r.right,bottom:r.bottom,opacity:Number(s.opacity),hit:hit===e||e.contains(hit),text:e.textContent,label:e.getAttribute('aria-label'),coarse:matchMedia('(hover:none),(pointer:coarse)').matches,innerWidth,innerHeight}});
          assert.ok(control.width>=44&&control.height>=44&&control.width<=180&&control.height<=64,'Exit must remain a small accessible target');assert.ok(control.left>control.innerWidth/2&&control.top>=0&&control.top<=16&&control.right<=control.innerWidth&&control.bottom<=control.innerHeight&&control.hit,'Exit must be reachable in the upper-right corner');assert.match(control.label,/hide.*exit/i);assert.ok(control.opacity>0,'idle exit cannot disappear');if(control.coarse)assert.equal(control.opacity,1);else assert.ok(control.opacity<1,'pointer-idle Exit should be visually subdued');
          assert.deepEqual(await page.evaluate(()=>window.__testUiTimers),[],'fullscreen must schedule no UI or scene timer');await page.visible();
          await page.fullscreenAfter(()=>page.click('#exit-fullscreen'),null,device.touch?'first touch exits and hides':'first pointer click exits and hides');await sleep(350);await page.hidden();assert.equal(await page.property('#fullscreen-start','hidden'),true);assert.equal(await page.property('#exit-fullscreen','hidden'),true);assert.deepEqual(await page.evaluate(()=>window.__testUiTimers),[]);
        });
        await runCase(page,'v3 short fullscreen keeps guarded Show, errors and rejected Exit reachable',async()=>{
          await page.fill('#scene-name','Synthetic staged draft');await page.fill('#position-x','0');await page.viewport(320,180);await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','short hidden entry');
          for(const id of ['fullscreen-show','exit-fullscreen']){const r=await page.evaluate(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,hit:hit===e||e.contains(hit),innerWidth,innerHeight}},id);assert.ok(r.left>=0&&r.top>=0&&r.right<=r.innerWidth&&r.bottom<=r.innerHeight&&r.width>=44&&r.height>=44&&r.hit,`short fullscreen control unreachable: ${id} ${JSON.stringify(r)}`);}
          await sleep(M.REVEAL_GAP_MS+100);await page.click('#fullscreen-show');await page.hidden();assertFullscreenDraftMessage(await page.property('#fullscreen-status','textContent'));assert.equal(await page.property('#fullscreen-start','hidden'),false);
          await page.evaluate(()=>{window.__testExitFullscreen=document.exitFullscreen;document.exitFullscreen=()=>Promise.reject(Error('Synthetic exit denial'))});await page.click('#exit-fullscreen');await page.hidden();assert.equal(await page.evaluate(()=>document.fullscreenElement?.id),'stage-root');assert.equal(await page.property('#exit-fullscreen','hidden'),false);assert.equal(await page.property('#fullscreen-start','hidden'),false);assert.match(await page.property('#fullscreen-status','textContent'),/fullscreen|exit|escape/i);assert.equal(await page.property('#scene-name','value'),'Synthetic staged draft');
          await page.evaluate(()=>{document.exitFullscreen=window.__testExitFullscreen});await page.fullscreenAfter(()=>page.click('#exit-fullscreen'),null,'recovered native Exit');await page.hidden();
        });
        await runCase(page,'v3 shared synthetic reference visual checkpoints',async()=>{
          report.visualCaptures=report.visualCaptures||[];
          report.visualCaptures.push(await page.visualCapture('A-fresh-hidden'));
          const reference={format:'imagery-static-scene',version:2,sampler:'static-objects-2',scene:{name:'Reference: circle square triangle',background:{h:210,s:10,l:8},objects:[{id:'object-1',shape:'circle',x:30,y:50,size:10,color:{h:210,s:30,l:50}},{id:'object-2',shape:'square',x:50,y:50,size:10,color:{h:130,s:30,l:50}},{id:'object-3',shape:'triangle',x:70,y:50,size:10,color:{h:40,s:35,l:50}}]}};
          await page.file('shared-visual-reference.json',reference);await page.hidden();await page.click('#editor-toggle');await sleep(M.REVEAL_GAP_MS+100);await page.click('#show-scene');await page.visible();
          report.visualCaptures.push(await page.visualCapture('C-reference-shown-editor-closed'));
          await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','visual reference entry');report.visualCaptures.push(await page.visualCapture('D-fullscreen-hidden'));
          await sleep(M.REVEAL_GAP_MS+100);await page.click('#fullscreen-show');await page.visible();await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:20,y:100});
          report.visualCaptures.push(await page.visualCapture('E-fullscreen-reference-shown'));
          await page.fullscreenAfter(()=>page.click('#exit-fullscreen'),null,'visual reference Exit');report.visualCaptures.push(await page.visualCapture('F-after-Exit-hidden'));await page.hidden();
        });
        await runCase(page,'v2 rejected fullscreen promise keeps fullwindow fallback usable',async()=>{
          await page.evaluate(()=>{document.querySelector('#stage-root').requestFullscreen=()=>Promise.reject(new Error('Synthetic fullscreen denial'))});
          await page.settleInitialGuard();await page.click('#show-scene');await page.visible();await page.click('#fullscreen');await page.hidden();assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
          assert.match(await page.property('#status','textContent'),/full.?window|denied|unavailable|fullscreen/i);await sleep(M.REVEAL_GAP_MS+100);await page.click('#show-scene');await page.visible();await page.key('Escape');await page.hidden();
        });
        await runCase(page,'v2 keyboard skip recovery and narrow short viewport focus',async()=>{
          await page.click('#editor-toggle');assert.equal(await page.property('#editor-panel','hidden'),true);await page.focus('#skip-controls');await page.key('Enter');await page.hidden();assert.equal(await page.property('#editor-panel','hidden'),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'controls');
          for(const [width,height]of [[320,568],[844,390]]){await page.viewport(width,height);await page.noOverflow(width);
            for(const selector of ['#scene-name','#object-select','#position-x','#object-hue','#background-lightness','#apply-changes','#export-scene']){
              await page.focus(selector);const metric=await page.evaluate(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),p=document.querySelector('#editor-panel').getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {focused:document.activeElement===e,visible:r.top>=p.top-1&&r.bottom<=p.bottom+1,hit:hit===e||e.contains(hit),height:r.height}},selector);
              assert.ok(metric.focused&&metric.visible&&metric.hit&&metric.height>0,`focused control obscured at ${width}x${height}: ${selector} ${JSON.stringify(metric)}`);
            }
          }
        });
        await runCase(page,'v2 320 by 180 reflow keeps Hide and End directly reachable',async()=>{
          await page.viewport(320,180);await page.hidden();await page.noOverflow(320);
          for(const id of ['hide-scene','end-viewing']){const metric=await page.evaluate(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height,hit:hit===e||e.contains(hit),innerWidth,innerHeight}},id);assert.ok(metric.top>=0&&metric.bottom<=metric.innerHeight&&metric.left>=0&&metric.right<=metric.innerWidth&&metric.hit&&metric.width>=44&&metric.height>=44,`${id} unavailable in 320x180 viewport: ${JSON.stringify(metric)}`);}
          await page.click('#hide-scene');await page.hidden();await page.click('#end-viewing');await page.hidden();
        });
        await runCase(page,'v1 native file input migrates to strict v2 scene export',async()=>{
          const old=legacy({shape:'dots',dotCount:5,size:20});await page.file('legacy-v1.json',old);await page.hidden();const got=await page.download('#export-scene','imagery-field-scene-v3.json');assert.deepEqual(got.json,M.canonicalScene(old));assert.equal(got.json.scene.objects.length,5);
        });
        await runIndependentScenarios({page,runCase:(name,fn)=>runCase(page,name,fn),out,captureLog:true});
        await runLiveScenarios({page,runCase:(name,fn)=>runCase(page,name,fn)});
        await runItemScenarios({page,runCase:(name,fn)=>runCase(page,name,fn)});
        await runDirectEditorScenarios({page,runCase:(name,fn)=>runCase(page,name,fn)});
        await runSequenceScenarios({page,runCase:(name,fn)=>runCase(page,name,fn)});
        await runIndependentSequenceScenarios({page,runCase:(name,fn)=>runCase(page,name,fn),out,captureLog:true});
        report.results.push({device:device.name,name:'page runtime, dialog, and remote-request log',status:page.errors.length||page.remoteRequests.length||page.dialogs.length?'FAIL':'PASS',errors:page.errors,remoteRequests:page.remoteRequests,dialogs:page.dialogs});
        console.log(`${report.results.at(-1).status} ${device.name}: page runtime, dialog, and remote-request log`);
      } finally { await page.close(); }
    }
    report.status = report.results.some(result => result.status === 'FAIL') ? 'FAIL' : 'PASS';
    if (report.status !== 'PASS') process.exitCode=1;
  } catch (error) { report.status='ERROR'; report.error=error.stack; process.exitCode=1; }
  finally {
    try {
      if (browser) await stopChrome(browser);
      assert.ok(profileCleanupSafe,'Profile retained because failed-launch Chrome closure was not confirmed');
      // Browser subprocesses may finish profile writes after the parent exits. These
      // bounded filesystem retries clean resources; no failed test is ever retried.
      await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
      report.cleanup={browserClosed:true,profileRemoved:true};
    } catch (error) { report.cleanup={error:error.message}; if (report.status==='PASS' || report.status==='RUNNING') report.status='ERROR'; process.exitCode=1; }
    report.finished=new Date().toISOString(); write(); console.log(JSON.stringify(report,null,2));
    console.log(`Browser report: ${path.join(out,'results.json')}`);
  }
}
if (require.main === module) {
  if (process.argv.includes('--check-fixtures')) console.log(JSON.stringify({status:'PASS',fixtures:checkFixtures(),browserExecuted:false}));
  else run().catch(error => { console.error(error); process.exitCode=1; });
}
module.exports = {CDP,Page,sceneFixture:scene,fixtures,checkFixtures,settlesWithin,stopChrome,stopChild,initialGuardRemaining,assertFullscreenSnapshot,assertFullscreenDraftMessage,assertMotionSnapshot,hslRgb};
