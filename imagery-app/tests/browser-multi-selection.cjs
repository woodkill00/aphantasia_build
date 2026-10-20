'use strict';
// Additive Feature 013 native controls, real raster and actual-aperture evidence.
// Synthetic scenes only. No synthetic DOM activations, retries, clock bypasses,
// production test hooks or browser-sandbox changes. Prepared checks are not PASS.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {setTimeout:sleep} = require('node:timers/promises');
const M = require('../src/model.js');
const {scene,styledObject,copy} = require('./fixtures.cjs');
const {rgb} = require('./browser-live.cjs');
const {beginInputTrace,assertRapidReleaseEvidence} = require('./browser-direct-editor.cjs');
const EPS = 1e-9;
const BASELINE_SHA256 = 'bfb0470286be0cda2233cfa0ece7c4248f3b224bdf2851821223a7317fdf2735';
const BASELINE_PATH = path.join(__dirname,'fixtures/feature012-baseline.html');
// Predeclared before native execution. These are investigation gates for the
// sampled synchronous handler plus forced-layout work, not display latency.
const COMPARISON_P95_OVERHEAD_MS = 10;
const CANDIDATE_HANDLER_MAX_MS = 50;
const sha = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function selectionFixture(count=3) {
  return scene({name:'Synthetic atomic selection',background:{h:210,s:20,l:8},
    objects:Array.from({length:count},(_,i)=>styledObject({id:'object-'+(i+1),shape:'pixel',
      x:count===2?35+i*30:20+i*60/(count-1),y:45,size:6,
      color:{h:80+i*60,s:40,l:50},timing:{startMs:i*100,fadeInMs:0,holdMs:3000+i*100,fadeOutMs:0,pulse:{enabled:false,minOpacity:0.8}}}))});
}
function triangleFixture() {
  const value=M.upgradeScene(selectionFixture(),{mode:'fixed',ratio:'1:1'});
  value.scene.objects=value.scene.objects.map((o,i)=>({...o,shape:'triangle',size:20,x:[40,55,70][i],y:[30,50,70][i],
    geometry:{height:20,rotation:[17,37,71][i],fill:false},
    outline:{enabled:true,width:0.7,color:{h:10,s:30,l:40}},
    shadow:{enabled:true,offsetX:1,offsetY:1,blur:2,color:{h:0,s:0,l:0}}}));
  return M.canonicalScene(value);
}
// Independent bounds oracle shares only the established renderer geometry, never
// the new selection planner or its bounds/alignment/distribution functions.
function bounds(value,viewport) {
  const r=M.contentRect(value,viewport.width,viewport.height);
  return M.geometry(value,viewport.width,viewport.height).map(g=>{
    const xs=g.kind==='polygon'?g.points.map(p=>p[0]):[g.x-g.radius,g.x+g.radius];
    const ys=g.kind==='polygon'?g.points.map(p=>p[1]):[g.y-g.radius,g.y+g.radius];
    const stroke=(g.kind==='circle'||g.kind==='polygon'&&!g.filled?(g.lineWidth||0)/2:0)+(g.outline.enabled?g.outline.width:0);
    const left=(Math.min(...xs)-stroke-r.x)/r.width*100,right=(Math.max(...xs)+stroke-r.x)/r.width*100;
    const top=(Math.min(...ys)-stroke-r.y)/r.height*100,bottom=(Math.max(...ys)+stroke-r.y)/r.height*100;
    return {id:g.id,left,right,top,bottom,horizontal:(left+right)/2,vertical:(top+bottom)/2};
  });
}
function moved(value,dx,dy) {
  const next=copy(value);
  for(const o of next.scene.objects){if(dx)o.x=(Math.round(o.x*100)+Math.round(dx*100))/100;if(dy)o.y=(Math.round(o.y*100)+Math.round(dy*100))/100;}
  return next;
}
function checkOnlyCoordinates(before,after,axes) {
  assert.deepEqual(after.scene.objects.map(o=>o.id),before.scene.objects.map(o=>o.id),'arrangement preserves draw order');
  const expected=copy(before);
  for(let i=0;i<expected.scene.objects.length;i++)for(const axis of axes)expected.scene.objects[i][axis]=after.scene.objects[i][axis];
  assert.deepEqual(after,expected,'all untargeted properties and exact orthogonal numeric payloads remain unchanged');
}
function stats(values) {
  const a=values.slice().sort((x,y)=>x-y);
  assert.ok(a.length>0&&a.every(x=>Number.isFinite(x)&&x>=0));
  return {count:a.length,median:a[Math.floor(a.length/2)],p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)};
}

async function runMultiSelectionScenarios({page,runCase}) {
  const checkbox=id=>'#selection-'+id;
  const label=id=>'label[for="selection-'+id+'"]';
  async function load(value=selectionFixture()) {
    assert.deepEqual(M.canonicalScene(value),value);
    await page.file('synthetic-atomic-selection.json',value);await page.hidden();
  }
  async function live() {await sleep(M.REVEAL_GAP_MS+100);await page.click('#show-scene');await page.visible();}
  async function selection() {
    return page.evaluate(()=>{const rows=Array.from(document.querySelectorAll('#selection-list input[type="checkbox"]'));
      return {ids:rows.filter(e=>e.checked).map(e=>e.id.slice('selection-'.length)),
        primary:document.getElementById('move-anchor').value,only:document.getElementById('object-select').value,
        summary:document.getElementById('selection-summary').textContent,order:rows.map(e=>e.id.slice('selection-'.length))};});
  }
  async function expectSelection(ids,primary) {
    const s=await selection();assert.deepEqual(s.ids,ids);assert.equal(s.only,ids.length===1?ids[0]:'');
    if(ids.length>1)assert.equal(s.primary,primary);
    assert.match(s.summary,new RegExp('\\b'+ids.length+'\\b'));
    if(primary)assert.ok(s.summary.includes(primary),'primary anchor explicitly named: '+JSON.stringify(s));
    return s;
  }
  async function setSelection(ids,primary=ids.at(-1)) {
    const s=await selection();
    if(ids.length===s.order.length&&ids.every((id,i)=>id===s.order[i]))await page.click('#select-all');
    else {
      await page.click('#clear-selection');
      for(const id of ids)await page.click(label(id));
    }
    if(ids.length>1)await page.nativeSelect('#move-anchor',primary);
    await expectSelection(ids,primary);
  }
  async function coordinates(value,{restore=true}={}) {
    const prior=await selection(),result=copy(value);
    for(const object of result.scene.objects) {
      await page.nativeSelect('#object-select',object.id);
      [object.x,object.y]=await page.evaluate(()=>['position-x','position-y'].map(id=>Number(document.getElementById(id).value)));
    }
    if(restore)await setSelection(prior.ids,prior.ids.length>1?prior.primary:prior.ids[0]);
    return result;
  }
  async function accepted(value) {
    const download=await page.download('#export-scene','imagery-field-scene-v'+value.version+'.json');
    assert.deepEqual(download.json,value);
    for(const word of ['selection','primaryId','generation','history','lockedIds','groups'])assert.equal(Object.hasOwn(download.json.scene,word),false);
    return download;
  }
  async function applyAndRead(version=3) {
    await page.click('#apply-changes');await page.hidden();
    return (await page.download('#export-scene','imagery-field-scene-v'+version+'.json')).json;
  }
  async function history(undo,redo) {
    assert.equal(await page.property('#undo-move','disabled'),!undo);
    assert.equal(await page.property('#redo-move','disabled'),!redo);
  }
  async function delta(x,y) {await page.fill('#delta-x',String(x));await page.fill('#delta-y',String(y));await page.click('#move-selection');}
  async function rasterHash() {
    return page.evaluate(async()=>{const c=document.getElementById('scene-canvas'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',a)),x=>x.toString(16).padStart(2,'0')).join('');});
  }
  async function captureControl(id,name) {
    await page.focus('#'+id);await page.evaluate(id=>document.getElementById(id).scrollIntoView({block:'center',behavior:'instant'}),id);
    await page.visualCapture(name);
  }
  async function content(ratio=null) {
    return page.evaluate(ratio=>{const r=document.getElementById('scene-canvas').getBoundingClientRect();let width=r.width,height=r.height;
      if(ratio){const [a,b]=ratio.split(':').map(Number),scale=Math.min(width/a,height/b);width=a*scale;height=b*scale;}
      return {left:r.left+(r.width-width)/2,top:r.top+(r.height-height)/2,width,height,canvasWidth:r.width,canvasHeight:r.height};},ratio);
  }
  const point=(r,x,y)=>({x:r.left+r.width*x/100,y:r.top+r.height*y/100});
  async function pointer(type,p,{shift=false}={}) {
    if(page.device.touch)await page.send('Input.dispatchTouchEvent',{type:{down:'touchStart',move:'touchMove',up:'touchEnd'}[type],
      touchPoints:type==='up'?[]:[{...p,radiusX:1,radiusY:1,force:1,id:1}],modifiers:shift?8:0});
    else await page.send('Input.dispatchMouseEvent',{type:{down:'mousePressed',move:'mouseMoved',up:'mouseReleased'}[type],
      ...p,button:'left',buttons:type==='up'?0:1,clickCount:1,modifiers:shift?8:0});
  }
  async function tap(p) {await pointer('down',p);await pointer('up',p);}
  async function key(key,shift=false) {
    if(!shift)return page.key(key);
    const code={ArrowRight:39,ArrowLeft:37,ArrowUp:38,ArrowDown:40}[key];
    for(const type of ['keyDown','keyUp'])await page.send('Input.dispatchKeyEvent',{type,key,code:key,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code,modifiers:8});
  }
  async function sample(r,x,y,color) {
    const actual=await page.evaluate(({r,x,y})=>{const c=document.getElementById('scene-canvas'),b=c.getBoundingClientRect();
      return Array.from(c.getContext('2d').getImageData(Math.floor((r.left-b.left+r.width*x/100)*c.width/b.width),
        Math.floor((r.top-b.top+r.height*y/100)*c.height/b.height),1,1).data).slice(0,3);},{r,x,y});
    rgb(color).forEach((v,i)=>assert.ok(Math.abs(actual[i]-v)<=3,JSON.stringify({actual,expected:rgb(color)})));
  }
  async function instrumentCommands() {
    await page.evaluate(()=>{window.__selectionPerf=[];const start=new Map(),ids=new Set(['nudge-right','move-selection','distribute-x','distribute-y','hide-scene']);
      document.addEventListener('click',e=>{if(ids.has(e.target.id))start.set(e.target.id,performance.now());},{capture:true});
      document.addEventListener('click',e=>{if(!ids.has(e.target.id)||!start.has(e.target.id))return;
        const r=document.getElementById('selection-list').getBoundingClientRect();
        window.__selectionPerf.push({id:e.target.id,trusted:e.isTrusted,ms:performance.now()-start.get(e.target.id),width:r.width,
          selected:document.querySelectorAll('#selection-list input:checked').length,rows:document.querySelectorAll('#selection-list input').length,
          visibility:document.getElementById('visibility-label').textContent});});});
  }
  async function wholeTarget(selector,focusSelector=selector,{interactive=true,inspector=true}={}) {
    await page.focus(focusSelector);
    const metrics=await page.evaluate(({selector,focusSelector,inspector})=>{
      const e=document.querySelector(selector),f=document.querySelector(focusSelector);e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
      const r=e.getBoundingClientRect(),s=document.getElementById('editor-scroll'),b=s.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);
      const box=q=>({left:q.left,right:q.right,top:q.top,bottom:q.bottom,width:q.width,height:q.height});
      return {selector,label:e.textContent,focused:document.activeElement===f,box:box(r),outline:getComputedStyle(e).outlineStyle,
        aperture:inspector?{left:Math.max(0,b.left+s.clientLeft),right:Math.min(innerWidth,b.left+s.clientLeft+s.clientWidth),
          top:Math.max(0,b.top+s.clientTop),bottom:Math.min(innerHeight,b.top+s.clientTop+s.clientHeight)}:{left:0,right:innerWidth,top:0,bottom:innerHeight},
        text:Array.from(range.getClientRects(),box),
        hit:[[r.left+3,r.top+3],[r.right-3,r.top+3],[r.left+3,r.bottom-3],[r.right-3,r.bottom-3],[r.left+r.width/2,r.top+r.height/2]]
          .every(([x,y])=>{const h=document.elementFromPoint(x,y);return h===e||e.contains(h);})};
    },{selector,focusSelector,inspector});
    const b=metrics.box,a=metrics.aperture;
    assert.ok(metrics.focused&&metrics.hit&&b.left>=a.left&&b.right<=a.right&&b.top>=a.top&&b.bottom<=a.bottom,JSON.stringify(metrics));
    if(interactive)assert.ok(b.width>=44&&b.height>=44,JSON.stringify(metrics));
    for(const t of metrics.text)assert.ok(t.left>=b.left-1&&t.right<=b.right+1&&t.top>=b.top-1&&t.bottom<=b.bottom+1,JSON.stringify(metrics));
    return metrics;
  }

  await runCase('v12 trusted checklist, primary and singleton routes preserve scene pixels and identity',async()=>{
    const value=selectionFixture();await load(value);await live();
    const hash=await rasterHash(),raf=await page.evaluate(()=>window.__testRAFRequests),acceptedUndo=await page.property('#undo','disabled');
    await page.evaluate(()=>{window.__selectionChanges=[];document.getElementById('selection-list').addEventListener('change',e=>window.__selectionChanges.push({id:e.target.id,trusted:e.isTrusted}));});
    await page.click(label('object-3'));await page.click(label('object-2'));
    await expectSelection(['object-1','object-2','object-3'],'object-2');
    assert.deepEqual(await page.evaluate(()=>Array.from(document.querySelectorAll('.timeline-track'),e=>e.getAttribute('aria-pressed'))),['true','true','true']);
    for(const id of ['shape','size','position-x','position-y','object-hue-value','item-hold','item-after-previous','lock-selected'])
      assert.equal(await page.property('#'+id,'disabled'),true,'no implicit primary style edit: '+id);
    await page.nativeSelect('#move-anchor','object-1');await expectSelection(['object-1','object-2','object-3'],'object-1');
    await page.focus(checkbox('object-1'));await page.key(' ');
    await expectSelection(['object-2','object-3'],'object-3');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'selection-object-1','keyed native checkbox retains focus after membership update');
    await page.key('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'selection-object-2');
    await page.key(' ');await expectSelection(['object-3'],'object-3');
    await page.click('#select-all');await page.nativeSelect('#move-anchor','object-2');
    await page.nativeSelect('#object-select','object-2');await expectSelection(['object-2'],'object-2');
    await page.click('#select-all');await page.click('.timeline-track:nth-child(3)');await expectSelection(['object-3'],'object-3');
    await page.focus('#clear-selection');await page.key('Enter');await expectSelection([],null);
    assert.equal(await page.property('#move-selection','disabled'),true);assert.equal(await page.property('#shape','disabled'),true);
    await page.focus('#select-all');await page.key('Enter');await expectSelection(['object-1','object-2','object-3'],'object-3');
    assert.equal(await rasterHash(),hash);assert.equal(await page.property('#draft-label','textContent'),'Applied');
    assert.equal(await page.property('#undo','disabled'),acceptedUndo);await history(false,false);
    assert.equal(await page.property('#show-editor-aids','checked'),false);assert.equal(await page.evaluate(()=>window.__testRAFRequests),raf);
    assert.ok((await page.evaluate(()=>window.__selectionChanges)).length>=4);
    assert.ok((await page.evaluate(()=>window.__selectionChanges)).every(e=>e.trusted));
    await page.visualCapture('v12-native-multi-selection-primary');await accepted(value);
  });

  await runCase('v12 hidden exact delta, native keyboard, primary placement and no-op preserve one history stream',async()=>{
    const value=selectionFixture(2);value.scene.objects.forEach(o=>{o.x+=.00000000001;o.y+=.00000000001;});
    await load(value);await setSelection(['object-1','object-2'],'object-2');await page.nativeSelect('#snap-step','10');
    await delta(0,0);await history(false,false);assert.deepEqual(await coordinates(value),value,'zero delta preserves accepted near-hundredth payloads');
    await delta(1.25,-2.5);let expected=moved(value,1.25,-2.5);await page.hidden();await history(true,false);
    await live();await page.focus('#scene-canvas');await key('ArrowRight');expected=moved(expected,1,0);await key('ArrowUp',true);expected=moved(expected,0,-.1);
    await page.focus('#delta-x');await page.key('ArrowUp');
    assert.deepEqual(await coordinates(expected),expected,'text-field arrow never moves canvas selection');
    await page.nativeSelect('#object-select','object-1');await page.click('#undo-move');expected=moved(expected,0,.1);
    await expectSelection(['object-1','object-2'],'object-2');await history(true,true);
    await delta(0,0);await history(true,true);await page.click('#redo-move');expected=moved(expected,0,-.1);
    assert.deepEqual(await coordinates(expected),expected);
    await delta(100,0);assert.match(await page.property('#status','textContent'),/fit|bounds|outside|range/i);
    assert.deepEqual(await coordinates(expected),expected);await history(true,false);
    assert.deepEqual(await applyAndRead(),expected);await history(false,false);
    await page.click('#place-object');const r=await content();await tap(point(r,50,50));await page.hidden();
    const placed=moved(expected,50-expected.scene.objects[1].x,50-expected.scene.objects[1].y);
    assert.deepEqual(await coordinates(placed),placed);await page.click('#undo-move');assert.deepEqual(await coordinates(expected),expected);
    await page.click('#redo-move');assert.deepEqual(await applyAndRead(),placed);
    await captureControl('delta-x','v12-hidden-exact-keyboard-and-placement');
  });

  await runCase('v12 rapid three-event batch drag keeps first trusted Undo below 80ms without fling suppression',async()=>{
    const value=selectionFixture(2);await load(value);await setSelection(['object-1','object-2'],'object-2');await page.nativeSelect('#snap-step','10');await live();
    const acceptedUndo=await page.property('#undo','disabled'),r=await content(),p=point(r,35,45),q=point(r,47,54);
    assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,p),'scene-canvas');
    await page.evaluate(()=>{window.__batchPointer=[];window.__batchMoveTimes=[];let start;
      document.addEventListener('pointermove',e=>{if(e.target.id==='scene-canvas')start=performance.now();},{capture:true});
      for(const type of ['pointerdown','pointermove','pointerup','click','touchstart'])document.addEventListener(type,e=>{
        if(window.__batchPointer.length<80)window.__batchPointer.push({type,time:e.timeStamp,target:e.target.id,trusted:e.isTrusted,pointerId:e.pointerId,defaultPrevented:e.defaultPrevented});
        if(type==='pointermove'&&e.target.id==='scene-canvas'){const b=document.getElementById('scene-canvas').getBoundingClientRect();
          window.__batchMoveTimes.push({ms:performance.now()-start,rect:{left:b.left,top:b.top,width:b.width,height:b.height}});}}, {passive:true});});
    const stop=await beginInputTrace(page);let trace,failure;
    try {
      await pointer('down',p);await pointer('move',point(r,40,48));await pointer('move',point(r,44,51));await pointer('move',q);await pointer('up',q);
      // This is the first and only native Undo activation. No dwell, retry,
      // synthetic click, desired-state polling or post-drag sleep is permitted.
      await page.click('#undo-move');await page.hidden();await history(false,true);
      await expectSelection(['object-1','object-2'],'object-1');
      assert.equal(await page.property('#undo','disabled'),acceptedUndo);
    } catch(error){failure=error;throw error;}
    finally {
      trace=await stop();
      const dom=await page.evaluate(()=>{const events=window.__batchPointer,down=events.find(e=>e.type==='pointerdown'&&e.target==='scene-canvas'),
        flick=events.filter(e=>e.pointerId===down?.pointerId&&['pointerdown','pointermove','pointerup'].includes(e.type)),
        move=flick.filter(e=>e.type==='pointermove').at(-1),up=flick.find(e=>e.type==='pointerup');
        return {events,flick,lastMoveToUpMs:move&&up?up.time-move.time:null,moves:window.__batchMoveTimes};});
      console.log('IMAGERY_MULTI_SELECTION_RAPID '+JSON.stringify({device:page.device.name,status:failure?'FAIL':'CHECK',dom,trace}));
      assertRapidReleaseEvidence(dom,trace);assert.ok(dom.flick.filter(e=>e.type==='pointermove').length>=3&&dom.flick.every(e=>e.trusted));
      assert.equal(dom.events.filter(e=>e.type==='click'&&e.target==='undo-move'&&e.trusted).length,1);
      if(page.device.touch)assert.ok(dom.events.some(e=>e.type==='touchstart'&&e.target==='undo-move'&&!e.defaultPrevented));
      for(const move of dom.moves)assert.deepEqual(move.rect,{left:r.left,top:r.top,width:r.width,height:r.height},'capture never reflows canvas');
      const timing=stats(dom.moves.map(e=>e.ms));console.log('IMAGERY_MULTI_SELECTION_DRAG_PERFORMANCE '+JSON.stringify({device:page.device.name,scope:'Trusted pointer handler plus forced layout, not physical display latency',timing}));
      assert.ok(timing.max<50,'investigate arrangement-attributable long synchronous move');
    }
    assert.deepEqual(await coordinates(value),value);
    await page.click('#redo-move');const expected=moved(value,15,5);assert.deepEqual(await coordinates(expected),expected);
    await live();const after=await content();await sample(after,50,50,value.scene.objects[0].color);await sample(after,80,50,value.scene.objects[1].color);await sample(after,35,45,value.scene.background);
    await page.visualCapture('v12-rapid-multi-drag-exact-raster');assert.deepEqual(await applyAndRead(),expected);
  });

  await runCase('v12 six rotated outline alignments and union centering are exact idempotent transactions',async()=>{
    for(const mode of ['left','right','top','bottom','horizontal','vertical']) {
      const value=triangleFixture();await load(value);await page.click('#select-all');const r=await content('1:1'),viewport={width:r.canvasWidth,height:r.canvasHeight};
      const before=bounds(value,viewport),axis=['left','right','horizontal'].includes(mode)?'x':'y';
      const target=mode==='left'?Math.min(...before.map(b=>b.left)):mode==='right'?Math.max(...before.map(b=>b.right)):
        mode==='top'?Math.min(...before.map(b=>b.top)):mode==='bottom'?Math.max(...before.map(b=>b.bottom)):
          mode==='horizontal'?(Math.min(...before.map(b=>b.left))+Math.max(...before.map(b=>b.right)))/2:
            (Math.min(...before.map(b=>b.top))+Math.max(...before.map(b=>b.bottom)))/2;
      await page.click('#selection-align-'+mode);const first=await coordinates(value),after=bounds(first,viewport),edges=after.map(b=>b[mode]);
      checkOnlyCoordinates(value,first,[axis]);assert.ok(edges.every(x=>Math.abs(x-target)<=.005+EPS));
      assert.ok(Math.max(...edges)-Math.min(...edges)<=.01+EPS);
      for(let i=0;i<3;i++)await page.click('#selection-align-'+mode);
      assert.deepEqual(await coordinates(first),first);await page.click('#undo-move');await history(false,true);assert.deepEqual(await coordinates(value),value);
      await page.click('#redo-move');assert.deepEqual(await applyAndRead(4),first);
      if(mode==='left'||mode==='vertical'){await live();await captureControl('selection-summary','v12-rotated-outline-align-'+mode);}
    }
    for(const mode of ['x','y','both']) {
      const value=triangleFixture();await load(value);await page.click('#select-all');await page.click('#align-'+mode);const first=await coordinates(value);
      const r=await content('1:1'),b=bounds(first,{width:r.canvasWidth,height:r.canvasHeight});
      for(const axis of mode==='both'?['x','y']:[mode]){
        const midpoint=axis==='x'?(Math.min(...b.map(v=>v.left))+Math.max(...b.map(v=>v.right)))/2:(Math.min(...b.map(v=>v.top))+Math.max(...b.map(v=>v.bottom)))/2;
        assert.ok(Math.abs(midpoint-50)<=.005+EPS);const a=first.scene.objects.map(o=>Math.round(o[axis]*100)),z=value.scene.objects.map(o=>Math.round(o[axis]*100));
        assert.deepEqual(a.map(v=>v-a[0]),z.map(v=>v-z[0]));
      }
      checkOnlyCoordinates(value,first,mode==='both'?['x','y']:[mode]);
      await page.click('#align-'+mode);assert.deepEqual(await coordinates(first),first);await page.click('#undo-move');await history(false,true);
      assert.deepEqual(await coordinates(value),value);await page.click('#redo-move');assert.deepEqual(await applyAndRead(4),first);
      if(mode==='both'){await live();await captureControl('selection-summary','v12-rotated-outline-union-centered');}
    }
    // The new batch bounds commands are exercised in every authored letterbox
    // and in actual wide/tall legacy canvases, not inferred from older one-item
    // or guide-only ratio tests. Keep these in one bounded scenario group.
    for(const variant of [
      {ratio:'4:3'},{ratio:'3:4'},{ratio:'16:9'},{ratio:'9:16'},
      {name:'legacy-wide',width:1366,height:900},{name:'legacy-tall',width:720,height:1100},
    ]) {
      const name=variant.ratio?'authored-'+variant.ratio.replace(':','x'):variant.name;
      if(variant.width)await page.viewport(variant.width,variant.height);
      else await page.viewport(page.device.width,page.device.height);
      let value=selectionFixture();
      if(variant.ratio)value=M.upgradeScene(value,{mode:'fixed',ratio:variant.ratio});
      value.scene.objects=value.scene.objects.map((o,i)=>({...o,shape:variant.ratio?'square':'pixel',size:(variant.ratio?[10,20,10]:[4,8,4])[i],
        x:[20,47.23,80][i],y:[30,50,70][i],...(variant.ratio?{geometry:{height:[10,20,10][i],rotation:0,fill:true}}:{})}));
      await load(value);await page.click('#select-all');await live();const r=await content(variant.ratio||null),viewport={width:r.canvasWidth,height:r.canvasHeight};
      if(variant.name==='legacy-wide')assert.ok(r.width>r.height,'legacy wide test must exercise an actual wide canvas');
      if(variant.name==='legacy-tall')assert.ok(r.height>r.width,'legacy tall test must exercise an actual tall canvas');
      const original=bounds(value,viewport),top=Math.min(...original.map(b=>b.top));
      await page.click('#selection-align-top');const aligned=await coordinates(value),alignedBounds=bounds(aligned,viewport);
      checkOnlyCoordinates(value,aligned,['y']);assert.ok(alignedBounds.every(b=>Math.abs(b.top-top)<=.005+EPS));
      await page.click('#selection-align-top');assert.deepEqual(await coordinates(aligned),aligned);
      await page.click('#distribute-x');const spaced=await coordinates(aligned),spacedBounds=bounds(spaced,viewport);
      checkOnlyCoordinates(aligned,spaced,['x']);const gaps=spacedBounds.slice(1).map((b,i)=>b.left-spacedBounds[i].right);
      assert.ok(gaps.every(g=>g>=-EPS)&&Math.max(...gaps)-Math.min(...gaps)<=.02+EPS);
      await page.click('#distribute-x');assert.deepEqual(await coordinates(spaced),spaced);
      await page.click('#align-both');const centered=await coordinates(spaced),centeredBounds=bounds(centered,viewport);
      assert.ok(Math.abs((Math.min(...centeredBounds.map(b=>b.left))+Math.max(...centeredBounds.map(b=>b.right)))/2-50)<=.005+EPS);
      assert.ok(Math.abs((Math.min(...centeredBounds.map(b=>b.top))+Math.max(...centeredBounds.map(b=>b.bottom)))/2-50)<=.005+EPS);
      checkOnlyCoordinates(value,centered,['x','y']);await page.click('#align-both');assert.deepEqual(await coordinates(centered),centered);
      await page.visible();const current=await content(variant.ratio||null);assert.deepEqual(current,r,'batch controls preserve the actual preview rectangle');
      for(const o of centered.scene.objects)await sample(current,o.x,o.y,o.color);
      await captureControl('selection-summary','v12-batch-bounds-'+name);
      console.log('IMAGERY_MULTI_SELECTION_GEOMETRY '+JSON.stringify({device:page.device.name,name,viewport,content:r,original:original,aligned:alignedBounds,spaced:spacedBounds,centered:centeredBounds}));
      await page.click('#undo-move');assert.deepEqual(await coordinates(spaced),spaced,'one Undo removes only the real centering transaction, not a repeated no-op');
      await page.click('#redo-move');assert.deepEqual(await applyAndRead(value.version),centered);
    }
  });

  await runCase('v12 unequal edge gaps preserve endpoint residues, axis payloads and repeated no-op redo',async()=>{
    await instrumentCommands();
    for(const axis of ['x','y']) {
      const value=M.upgradeScene(selectionFixture(),{mode:'fixed',ratio:'1:1'});
      value.scene.objects=value.scene.objects.map((o,i)=>({...o,shape:'square',size:[10,20,10][i],x:50,y:50,
        geometry:{height:[10,20,10][i],rotation:0,fill:true},[axis]:[20.00000000001,47.23,80.00000000001][i]}));
      await load(value);await page.click('#select-all');await page.click('#distribute-'+axis);
      const expected=copy(value);expected.scene.objects[1][axis]=50;
      assert.deepEqual(await coordinates(expected),expected);
      for(let i=0;i<5;i++)await page.click('#distribute-'+axis);
      assert.deepEqual(await coordinates(expected),expected);await page.click('#nudge-right');await page.click('#undo-move');await history(true,true);
      await page.click('#distribute-'+axis);await history(true,true);assert.deepEqual(await coordinates(expected),expected);
      const r=await content('1:1'),b=bounds(expected,{width:r.canvasWidth,height:r.canvasHeight}),lo=axis==='x'?'left':'top',hi=axis==='x'?'right':'bottom';
      const gaps=b.slice(1).map((v,i)=>v[lo]-b[i][hi]);assert.ok(gaps.every(g=>g>=-EPS));assert.ok(Math.max(...gaps)-Math.min(...gaps)<=.02+EPS);
      assert.ok(gaps.every(g=>Math.abs(g-15)<.02));assert.deepEqual(await applyAndRead(4),expected);
      await live();await captureControl('distribute-'+axis,'v12-unequal-edge-gaps-'+axis);
    }
    const events=await page.evaluate(()=>window.__selectionPerf.filter(e=>e.id.startsWith('distribute-')));
    assert.equal(events.length,14);assert.ok(events.every(e=>e.trusted));const timing=stats(events.map(e=>e.ms));
    console.log('IMAGERY_MULTI_SELECTION_GAPS_PERFORMANCE '+JSON.stringify({device:page.device.name,scope:'Trusted command handler plus forced layout, not physical display latency',timing}));
    assert.ok(timing.max<50,'investigate arrangement-attributable long equal-gap handler');
  });

  await runCase('v12 noncontiguous reorder, batch duplicate and delete share exact reversible structural history',async()=>{
    const value=selectionFixture(4);await load(value);await setSelection(['object-1','object-3'],'object-1');await page.click('#layer-front');
    assert.deepEqual((await selection()).order,['object-2','object-1','object-4','object-3']);
    await expectSelection(['object-1','object-3'],'object-1');await page.click('#layer-back');assert.deepEqual((await selection()).order,['object-1','object-2','object-3','object-4']);
    await page.click('#undo-move');assert.deepEqual((await selection()).order,['object-2','object-1','object-4','object-3']);await page.click('#redo-move');
    await page.click('#duplicate-object');await expectSelection(['object-5','object-6'],'object-5');
    assert.deepEqual((await selection()).order,['object-1','object-2','object-3','object-4','object-5','object-6']);
    await page.click('#undo-move');await expectSelection(['object-1','object-3'],'object-1');await page.click('#redo-move');await expectSelection(['object-5','object-6'],'object-5');
    await page.click('#delete-object');await expectSelection(['object-4'],'object-4');await page.click('#undo-move');await expectSelection(['object-5','object-6'],'object-5');
    const expected=copy(value);expected.scene.objects.push({...copy(value.scene.objects[0]),id:'object-5'},{...copy(value.scene.objects[2]),id:'object-6'});
    assert.deepEqual(await applyAndRead(),expected);await history(false,false);
    await page.click('#select-all');await page.click('#delete-object');await expectSelection([],null);assert.equal(await page.property('#object-count','textContent'),'0 / 12');
    await page.click('#undo-move');assert.deepEqual((await selection()).order,expected.scene.objects.map(o=>o.id));await page.click('#redo-move');
    const empty=copy(value);empty.scene.objects=[];assert.deepEqual(await applyAndRead(),empty);await captureControl('selection-summary','v12-delete-all-background-only');
  });

  await runCase('v12 mixed locks reject the entire batch and locked-source copies remain independently undoable',async()=>{
    const value=selectionFixture(2);await load(value);await page.click('#lock-selected');await setSelection(['object-1','object-2'],'object-2');
    for(const id of ['move-selection','nudge-right','align-both','delete-object','layer-front'])assert.equal(await page.property('#'+id,'disabled'),true,id);
    assert.match((await page.property('#lock-status','textContent'))+' '+(await page.property('#selection-summary','textContent')),/lock/i);
    assert.equal(await page.property('#lock-selected','disabled'),true);await history(false,false);await accepted(value);
    await live();const hash=await rasterHash(),r=await content(),p=point(r,65,45),q=point(r,70,45);
    await pointer('down',p);await pointer('move',q);await pointer('up',q);await page.visible();
    assert.equal(await rasterHash(),hash);await expectSelection(['object-1','object-2'],'object-2');await history(false,false);
    assert.match(await page.property('#status','textContent'),/lock|unlock|all/i);
    await page.click('#duplicate-object');await expectSelection(['object-3','object-4'],'object-4');
    await page.nativeSelect('#object-select','object-3');assert.equal(await page.property('#lock-selected','ariaPressed'),'false');await page.click('#lock-selected');
    // The concrete target would remove this locked copy. Its disabled native
    // history control must not consume the transaction or silently release it.
    assert.equal(await page.property('#undo-move','disabled'),true);
    assert.deepEqual((await selection()).order,['object-1','object-2','object-3','object-4']);await expectSelection(['object-3'],'object-3');
    assert.equal(await page.property('#lock-selected','ariaPressed'),'true');await page.click('#unlock-all');
    await page.click('#undo-move');await expectSelection(['object-1','object-2'],'object-2');await history(false,true);
    await page.click('#redo-move');await expectSelection(['object-3','object-4'],'object-4');
    const expected=copy(value);expected.scene.objects.push({...copy(value.scene.objects[0]),id:'object-3'},{...copy(value.scene.objects[1]),id:'object-4'});
    assert.deepEqual(await applyAndRead(),expected);await captureControl('selection-summary','v12-unlocked-duplicate-history');
  });

  await runCase('v12 invalid native raw edits retain history and captured rollback cannot overwrite fresh text',async()=>{
    const value=selectionFixture(2);await load(value);await page.click('#select-all');await page.click('#nudge-right');await page.click('#undo-move');await history(false,true);
    await page.fill('#scene-name','');await page.hidden();assert.equal(await page.property('#scene-name','value'),'');
    await page.click(label('object-2'));await expectSelection(['object-1','object-2'],'object-1');
    assert.equal(await page.property('#scene-name','value'),'');assert.equal(await page.property('#redo-move','disabled'),true);
    await page.click('#hide-scene');assert.equal(await page.property('#scene-name','value'),'');
    await page.fill('#scene-name',value.scene.name);await page.hidden();await history(false,true);
    await page.click('#redo-move');let expected=moved(value,1,0);assert.deepEqual(await coordinates(expected),expected);
    await live();const r=await content(),p=point(r,36,45),q=point(r,45,50);await pointer('down',p);await pointer('move',q);
    await page.fill('#scene-name','');await page.fill('#background-hue-value','');await page.hidden();
    await page.focus(checkbox('object-2'));await page.key(' ');await page.focus('#hide-scene');await page.key('Enter');await pointer('up',q);
    assert.equal(await page.property('#scene-name','value'),'');assert.equal(await page.property('#background-hue-value','value'),'');
    assert.equal(await page.property('#background-hue-value','ariaInvalid'),'true');
    assert.match(await page.property('#draft-label','textContent'),/invalid|pending|staged|changes/i);
    await page.fill('#scene-name',value.scene.name);await page.fill('#background-hue-value',String(value.scene.background.h));await page.hidden();
    assert.deepEqual(await coordinates(expected),expected,'fresh invalid global input rolls back all provisional member positions');
    await history(true,false);await page.click('#undo-move');assert.deepEqual(await coordinates(value),value);await history(false,true);
    await page.fill('#scene-name','Synthetic valid different correction');await history(false,false);
    expected=copy(value);expected.scene.name='Synthetic valid different correction';assert.deepEqual(await applyAndRead(),expected);
    // A genuine singleton precision edit is independently covered, not a
    // fabricated edit of a disabled multi-selection property control.
    await page.nativeSelect('#object-select','object-1');await page.click('#nudge-right');await live();
    const one=await content(),start=point(one,36,45),finish=point(one,43,50);await pointer('down',start);await pointer('move',finish);
    await page.fill('#object-hue-value','');await page.focus('#lock-selected');await page.key('Enter');
    await page.focus('#hide-scene');await page.key('Enter');await pointer('up',finish);await page.hidden();
    assert.equal(await page.property('#object-hue-value','value'),'');assert.equal(await page.property('#object-hue-value','ariaInvalid'),'true');
    assert.equal(await page.property('#lock-selected','ariaPressed'),'false');assert.equal(await page.property('#undo-move','disabled'),true);
    await page.fill('#object-hue-value',String(value.scene.objects[0].color.h));await history(true,false);
    assert.equal(await page.property('#position-x','value'),'36');assert.equal(await page.property('#position-y','value'),'45');
    await page.click('#undo-move');assert.deepEqual(await applyAndRead(),expected);
    await captureControl('object-hue-value','v12-raw-input-correction-remains-hidden');
  });

  await runCase('v12 selection preserves clean provenance while reorder and arrangement cannot reset aid suppression',async()=>{
    const value=selectionFixture();await load(value);await page.click('#journal-container summary');await page.click('#journal-enable');await page.click('#journal-track-display');await live();
    await page.click('#select-all');await page.nativeSelect('#move-anchor','object-2');await page.click('#clear-selection');await page.click('#select-all');await page.click('#hide-scene');
    const deadline=Date.now()+5000;while(!/ready to attach/.test(await page.property('#journal-tracking-status','textContent'))&&Date.now()<deadline)await sleep(25);
    assert.match(await page.property('#journal-tracking-status','textContent'),/ready to attach/);
    await page.click('#journal-add');await page.click('#journal-include-entry-1');await page.click('#journal-preview');
    let record=JSON.parse(await page.property('#journal-preview-text','textContent')).entries[0].reflection;
    assert.equal(record.scene.sha256,sha(value));assert.equal(record.exposure.status,'available');
    await live();await page.click('label[for="show-editor-aids"]');await page.click('label[for="show-editor-aids"]');
    await setSelection(['object-1'],'object-1');await page.click('#layer-front');await page.click('#undo-move');await page.click('#redo-move');
    assert.equal(await page.property('#show-editor-aids','checked'),false);await page.hidden();
    await page.click('#journal-add');await page.click('#journal-include-entry-1');await page.click('#journal-include-entry-2');await page.click('#journal-preview');
    record=JSON.parse(await page.property('#journal-preview-text','textContent')).entries[0].reflection;
    assert.deepEqual(record.scene,{status:'unavailable'});assert.deepEqual(record.exposure,{status:'unavailable'});
    const expected=copy(value);[expected.scene.objects[0],expected.scene.objects[1]]=[expected.scene.objects[1],expected.scene.objects[0]];
    const saved=await applyAndRead();assert.deepEqual(saved,expected);assert.notEqual(sha(saved),sha(value));
    assert.deepEqual(saved.scene.objects.slice().sort((a,b)=>a.id.localeCompare(b.id)),value.scene.objects);
    await captureControl('journal-preview-text','v12-arrangement-retains-aid-provenance-suppression');
  });

  await runCase('v12 twelve long labels retain whole focus, hit corners, pinned Hide and bounded command timing',async()=>{
    const value=M.upgradeScene(selectionFixture(),{mode:'fixed',ratio:'1:1'});
    value.scene.objects=Array.from({length:12},(_,i)=>({...styledObject({id:'object-'+(999988+i),shape:'rounded-rectangle',x:50,y:50,size:8,
      outline:{enabled:true,width:4,color:{h:0,s:0,l:30}},shadow:{enabled:true,offsetX:12,offsetY:12,blur:6,color:{h:0,s:0,l:0}}}),
      geometry:{height:8,rotation:45,fill:false,cornerRadius:.2}}));
    await load(value);await page.click('#lock-selected');await page.click('#select-all');
    const ids=value.scene.objects.map(o=>o.id);
    for(const [width,height] of [[1280,800],[320,760],[640,360],[320,280]]) {
      await page.viewport(width,height);await page.hidden();const before=await content('1:1');
      for(let i=0;i<ids.length;i++){
        const m=await wholeTarget(label(ids[i]),checkbox(ids[i]));assert.notEqual(m.outline,'none','checkbox focus must be visible');
        console.log('IMAGERY_MULTI_SELECTION_FOCUS '+JSON.stringify({device:page.device.name,viewport:{width,height},...m}));
        if(width===320&&height===280)await page.visualCapture('v12-short-long-selection-row-'+(i+1));
      }
      await wholeTarget('#selection-summary','#selection-summary',{interactive:false});
      if(width===320)await page.visualCapture('v12-selection-summary-'+width+'x'+height);
      await wholeTarget('#move-anchor');await wholeTarget('#select-all');await wholeTarget('#clear-selection');
      await wholeTarget('#unlock-all');
      await wholeTarget('#hide-scene','#hide-scene',{inspector:false});
      const after=await content('1:1');assert.deepEqual(after,before,'inspector checklist scrolling never moves the canvas');
      assert.equal(await page.evaluate(()=>{const e=document.getElementById('selection-list'),s=getComputedStyle(e);return e.scrollHeight>e.clientHeight+1&&['auto','scroll'].includes(s.overflowY);}),false,'no nested checklist scroller');
      await page.noOverflow(width);await page.visualCapture('v12-whole-selection-controls-'+width+'x'+height);
    }
    await page.viewport(320,760);await page.send('Emulation.setEmulatedMedia',{features:[{name:'forced-colors',value:'active'},{name:'prefers-reduced-motion',value:'reduce'}]});
    await wholeTarget(label(ids[0]),checkbox(ids[0]));await page.visualCapture('v12-selection-forced-colors');
    await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await page.click('#unlock-all');
    for(const height of [280,760]){
      await page.viewport(320,height);
      await wholeTarget('.selection-deltas > div:nth-child(1)','#delta-x');
      await wholeTarget('.selection-deltas > div:nth-child(2)','#delta-y');
      for(const id of ['move-selection','selection-align-horizontal','selection-align-vertical','distribute-x','distribute-y'])await wholeTarget('#'+id);
      await page.visualCapture('v12-whole-arrangement-alternatives-320x'+height);
      await wholeTarget('#hide-scene','#hide-scene',{inspector:false});await page.noOverflow(320);
    }
    await instrumentCommands();
    await page.nativeSelect('#object-select',ids[0]);for(let i=0;i<6;i++)await page.click('#nudge-right');
    for(let i=0;i<6;i++)await page.click('#undo-move');
    await page.click('#select-all');for(let i=0;i<6;i++)await page.click('#nudge-right');
    await page.click('#hide-scene');await page.hidden();
    const events=await page.evaluate(()=>window.__selectionPerf),one=events.filter(e=>e.id==='nudge-right'&&e.selected===1),many=events.filter(e=>e.id==='nudge-right'&&e.selected===12),hide=events.filter(e=>e.id==='hide-scene');
    assert.equal(one.length,6);assert.equal(many.length,6);assert.equal(hide.length,1);assert.ok(events.every(e=>e.trusted&&e.rows===12));
    const report={device:page.device.name,scope:'Same-document singleton/batch trusted handler plus forced layout, not physical display latency',singleton:stats(one.map(e=>e.ms)),batch:stats(many.map(e=>e.ms)),hide:hide[0]};
    console.log('IMAGERY_MULTI_SELECTION_PERFORMANCE '+JSON.stringify(report));
    assert.ok(report.singleton.max<50&&report.batch.max<50&&report.hide.ms<50);assert.equal(report.hide.visibility,'Hidden');
    const finalExpected=copy(value);finalExpected.scene.objects.forEach(o=>o.x+=6);
    assert.deepEqual(await applyAndRead(4),finalExpected);
  });

  await runCase('v12 pinned Feature 012 baseline and candidate compare preserved native nudge, drag and first Hide',async()=>{
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(BASELINE_PATH)).digest('hex'),BASELINE_SHA256);
    const candidatePath=path.resolve(process.env.IMAGERY_APP_ROOT||path.join(__dirname,'..'),'index.html');
    const candidateSha256=crypto.createHash('sha256').update(fs.readFileSync(candidatePath)).digest('hex');
    const value=M.upgradeScene(selectionFixture(),{mode:'fixed',ratio:'1:1'});
    value.scene.objects=Array.from({length:12},(_,i)=>({...styledObject({id:'object-'+(i+1),shape:'rounded-rectangle',x:50,y:50,size:8,
      outline:{enabled:true,width:4,color:{h:0,s:0,l:30}},shadow:{enabled:true,offsetX:12,offsetY:12,blur:6,color:{h:0,s:0,l:0}}}),
      geometry:{height:8,rotation:45,fill:false,cornerRadius:.2}}));
    assert.deepEqual(M.canonicalScene(value),value);
    const records=[];let active=null,comparisonError=null;
    console.log('IMAGERY_MULTI_SELECTION_BASELINE_CRITERIA '+JSON.stringify({device:page.device.name,baselineSha256:BASELINE_SHA256,candidateSha256,pairs:6,
      candidateMinusBaselineP95Ms:COMPARISON_P95_OVERHEAD_MS,candidateHandlerMaxExclusiveMs:CANDIDATE_HANDLER_MAX_MS}));
    try {
      for(let pair=0;pair<6;pair++)for(const lane of pair%2?['candidate','baseline']:['baseline','candidate']){
        active={pair,lane,artifactSha256:lane==='baseline'?BASELINE_SHA256:candidateSha256,phase:'navigate'};
        if(lane==='baseline')await page.fresh(BASELINE_PATH,BASELINE_SHA256);else await page.fresh();
        active.phase='load-and-explicit-reveal';
        await load(value);await page.nativeSelect('#object-select','object-12');await live();
        await page.evaluate(()=>{
          window.__sharedRouteTiming=[];window.__sharedRoutePointers=[];const starts=new Map();
          document.addEventListener('click',e=>{if(['nudge-right','hide-scene'].includes(e.target.id))starts.set(e.target.id,performance.now());},{capture:true});
          document.addEventListener('pointermove',e=>{if(e.target.id==='scene-canvas')starts.set('drag',performance.now());},{capture:true});
          document.addEventListener('click',e=>{
            if(!['nudge-right','hide-scene'].includes(e.target.id))return;
            const r=document.getElementById('scene-canvas').getBoundingClientRect();
            window.__sharedRouteTiming.push({route:e.target.id==='hide-scene'?'hide':'nudge',trusted:e.isTrusted,ms:performance.now()-starts.get(e.target.id),
              rect:{left:r.left,top:r.top,width:r.width,height:r.height},visibility:document.getElementById('visibility-label').textContent});
          });
          for(const type of ['pointerdown','pointermove','pointerup'])document.addEventListener(type,e=>{
            if(e.target.id!=='scene-canvas')return;
            window.__sharedRoutePointers.push({type,time:e.timeStamp,trusted:e.isTrusted,pointerId:e.pointerId});
            if(type==='pointermove'){const r=document.getElementById('scene-canvas').getBoundingClientRect();
              window.__sharedRouteTiming.push({route:'drag',trusted:e.isTrusted,ms:performance.now()-starts.get('drag'),
                rect:{left:r.left,top:r.top,width:r.width,height:r.height},visibility:document.getElementById('visibility-label').textContent});}
          },{passive:true});
        });
        active.phase='nudge';await page.click('#nudge-right');assert.equal(await page.property('#position-x','value'),'51');
        const r=await content('1:1'),p=point(r,51,50),q=point(r,57,50);
        assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,p),'scene-canvas');
        active.phase='rapid-drag';await pointer('down',p);await pointer('move',point(r,53,50));await pointer('move',point(r,55,50));await pointer('move',q);await pointer('up',q);
        active.phase='first-hide';await page.click('#hide-scene');await page.hidden();
        active.phase='assertions';
        assert.equal(await page.property('#position-x','value'),'57');assert.equal(await page.property('#position-y','value'),'50');
        const observation=await page.evaluate(()=>({events:window.__sharedRouteTiming,pointers:window.__sharedRoutePointers}));
        const nudge=observation.events.filter(e=>e.route==='nudge'),drag=observation.events.filter(e=>e.route==='drag'),hide=observation.events.filter(e=>e.route==='hide');
        assert.equal(nudge.length,1);assert.equal(hide.length,1);assert.equal(drag.length,3);
        assert.ok(observation.events.every(e=>e.trusted&&Number.isFinite(e.ms)&&e.ms>=0));
        assert.ok(observation.pointers.every(e=>e.trusted));assert.equal(hide[0].visibility,'Hidden');
        const lastMove=observation.pointers.filter(e=>e.type==='pointermove').at(-1),up=observation.pointers.find(e=>e.type==='pointerup');
        const lastMoveToUpMs=up?.time-lastMove?.time;
        assert.ok(Number.isFinite(lastMoveToUpMs)&&lastMoveToUpMs>=0&&lastMoveToUpMs<80,'shared-route drag must exercise rapid release, not a dwell workaround');
        records.push({pair,lane,artifactSha256:lane==='baseline'?BASELINE_SHA256:candidateSha256,lastMoveToUpMs,
          nudgeMs:nudge[0].ms,dragMaxMs:Math.max(...drag.map(e=>e.ms)),hideMs:hide[0].ms,...observation});
        active=null;
      }
    } catch(error) {
      comparisonError=error;throw error;
    } finally {
      let partial=null;
      if(active){
        try{partial={...active,observation:await page.evaluate(()=>({events:window.__sharedRouteTiming||[],pointers:window.__sharedRoutePointers||[],
          artifactName:location.pathname.split('/').at(-1),x:document.getElementById('position-x')?.value,y:document.getElementById('position-y')?.value,
          visibility:document.getElementById('visibility-label')?.textContent,status:document.getElementById('status')?.textContent}))};}
        catch(error){partial={...active,diagnosticError:error.message};}
      }
      // Always retain completed and partial raw observations before restoring
      // the candidate, including early input/position/trust/Hide failures.
      console.log('IMAGERY_MULTI_SELECTION_BASELINE_RAW '+JSON.stringify({device:page.device.name,status:comparisonError?'FAIL':'OBSERVED',
        error:comparisonError?.message||null,records,partial}));
      // Subsequent groups always return to the candidate. Never substitute the
      // frozen fixture for runtime/package evidence or the rest of the suite.
      try{await page.fresh();await page.click('#hide-scene');await page.hidden();}
      catch(error){if(comparisonError)comparisonError.message+='; candidate restoration also failed: '+error.message;else throw error;}
    }
    const summary={};
    for(const [route,key] of [['nudge','nudgeMs'],['drag','dragMaxMs'],['hide','hideMs']]){
      const baseline=stats(records.filter(r=>r.lane==='baseline').map(r=>r[key])),candidate=stats(records.filter(r=>r.lane==='candidate').map(r=>r[key]));
      summary[route]={baseline,candidate,candidateMinusBaselineP95Ms:candidate.p95-baseline.p95};
    }
    const report={device:page.device.name,baselineSha256:BASELINE_SHA256,candidateSha256,pairs:6,
      scope:'Same Chrome target/device, alternating local artifacts. Identical 12-item maximum-effects fixture; singleton preserved routes only. Drag sample is maximum of its three trusted move-handler plus forced-layout intervals.',
      limitations:'Not compositor/input queue/physical display latency or a calibrated benchmark. New batch alignment/distribution have no Feature 012 equivalent and are measured separately as candidate-only work.',
      criteria:{candidateMinusBaselineP95Ms:COMPARISON_P95_OVERHEAD_MS,candidateHandlerMaxExclusiveMs:CANDIDATE_HANDLER_MAX_MS},summary,records};
    console.log('IMAGERY_MULTI_SELECTION_FROZEN_BASELINE '+JSON.stringify(report));
    for(const result of Object.values(summary)){
      assert.ok(result.candidateMinusBaselineP95Ms<=COMPARISON_P95_OVERHEAD_MS,'investigate paired preserved-route p95 regression: '+JSON.stringify(report));
      assert.ok(result.candidate.max<CANDIDATE_HANDLER_MAX_MS,'investigate candidate-attributable long handler or delayed first Hide: '+JSON.stringify(report));
    }
    assert.ok(records.filter(r=>r.lane==='candidate').every(r=>r.events.every(e=>e.ms<CANDIDATE_HANDLER_MAX_MS)),'each candidate shared-route event remains below the predeclared ceiling');
  });
}

module.exports={runMultiSelectionScenarios,selectionFixture,triangleFixture,bounds};
