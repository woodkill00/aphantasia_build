'use strict';
// Additive Feature 014 trusted-input, real-raster and actual-aperture evidence.
// Synthetic fixtures only. Preparing these checks is not native acceptance.
// No synthetic DOM activations, input retries, clock bypasses, production test
// hooks, sandbox changes, new packages, or modifications to inherited cases.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {setTimeout:sleep} = require('node:timers/promises');
const M = require('../src/model.js');
const {scene,styledObject,copy} = require('./fixtures.cjs');
const {sequence} = require('./sequence-fixtures.cjs');
const {bounds} = require('./browser-multi-selection.cjs');
const {beginInputTrace,assertRapidReleaseEvidence} = require('./browser-direct-editor.cjs');
const EPS=1e-9, HANDLER_MAX_MS=50;
const sha=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const numeric=(a,b)=>Number(a.split('-').at(-1))-Number(b.split('-').at(-1));

function groupFixture(count=4,ratio=null) {
  const value=scene({name:'Synthetic flat session groups',background:{h:210,s:20,l:8},objects:Array.from({length:count},(_,i)=>styledObject({
    id:'object-'+(i+1),shape:'pixel',size:6,x:count===2?35+i*30:Math.round((18+i*60/(count-1))*100)/100,y:45,
    color:{h:(80+i*50)%359,s:40,l:50}}))});
  return ratio?M.upgradeScene(value,{mode:'fixed',ratio}):value;
}
function rigidFixture(ratio='1:1') {
  const value=groupFixture(4,ratio);
  value.scene.objects=value.scene.objects.map((o,i)=>({...o,x:[22,34,55,76][i],y:[28,42,57,72][i],size:ratio?(i===3?8:10):6,
    ...(ratio?{shape:['triangle','circle','rounded-rectangle','dot'][i],geometry:{height:i===3?8:10,rotation:[17,37,63,0][i],fill:i!==0,...(i===2?{cornerRadius:.2}:{})}}:{}),
    outline:{enabled:true,width:.3,color:{h:10,s:30,l:40}},shadow:{enabled:true,offsetX:1,offsetY:1,blur:1,color:{h:0,s:0,l:0}}}));
  return M.canonicalScene(value);
}
function gapFixture(axis='x') {
  const value=groupFixture(4,'1:1');
  value.scene.objects=value.scene.objects.map((o,i)=>({...o,shape:'square',size:[10,6,6,10][i],x:50,y:50,
    geometry:{height:[10,6,6,10][i],rotation:0,fill:true},[axis]:[15.00000000001,44,58,85.00000000001][i]}));
  return M.canonicalScene(value);
}
function unionBounds(value,groups,viewport) {
  const all=bounds(value,viewport),seen=new Set(),units=[];
  for(const item of value.scene.objects){
    if(seen.has(item.id))continue;
    const group=groups.find(g=>g.memberIds.includes(item.id)),ids=group?group.memberIds:[item.id];ids.forEach(id=>seen.add(id));
    const member=all.filter(b=>ids.includes(b.id)),left=Math.min(...member.map(b=>b.left)),right=Math.max(...member.map(b=>b.right)),
      top=Math.min(...member.map(b=>b.top)),bottom=Math.max(...member.map(b=>b.bottom));
    units.push({id:group?.id||item.id,memberIds:ids.slice(),left,right,top,bottom,horizontal:(left+right)/2,vertical:(top+bottom)/2});
  }
  return units;
}
function onlyCoordinates(before,after,axes) {
  const expected=copy(before);assert.deepEqual(after.scene.objects.map(o=>o.id),before.scene.objects.map(o=>o.id));
  for(let i=0;i<expected.scene.objects.length;i++)for(const axis of axes)expected.scene.objects[i][axis]=after.scene.objects[i][axis];
  assert.deepEqual(after,expected,'untargeted numeric payloads and ordinary item records remain exact');
}
function rigidOffsets(before,after,groups,axes=['x','y']) {
  for(const group of groups)for(const axis of axes){
    const a=group.memberIds.map(id=>Math.round(before.scene.objects.find(o=>o.id===id)[axis]*100)),
      b=group.memberIds.map(id=>Math.round(after.scene.objects.find(o=>o.id===id)[axis]*100));
    assert.deepEqual(b.map(n=>n-b[0]),a.map(n=>n-a[0]),group.id+' keeps every member lattice offset on '+axis);
  }
}
function stats(values) {
  const sorted=values.slice().sort((a,b)=>a-b);assert.ok(sorted.length&&sorted.every(n=>Number.isFinite(n)&&n>=0));
  return {count:sorted.length,median:sorted[Math.floor(sorted.length/2)],p95:sorted[Math.ceil(sorted.length*.95)-1],max:sorted.at(-1)};
}
// Passive test instrumentation installed before production modules initialize.
// It delegates to the real frozen controller/tracker and retains their genuine
// state, not a replacement model or a production-only state-reading endpoint.
function installObservation() {
  const intercept=(name,adapt)=>Object.defineProperty(window,name,{configurable:true,set(value){
    Object.defineProperty(window,name,{value:adapt(value),writable:true,configurable:true,enumerable:true});
  }});
  window.__groupStageCalls=[];window.__groupProvenanceCalls=[];
  intercept('ImageryModel',model=>Object.freeze({...model,createController(...args){
    const real=model.createController(...args);window.__groupController=real;
    return Object.freeze({...real,...Object.fromEntries(['stage','stageLive'].map(name=>[name,function(...values){
      window.__groupStageCalls.push(name);return real[name](...values);
    }]))});
  }}));
  intercept('ImageryGroups',model=>Object.freeze({...model,selectionUnits(...args){
    const result=model.selectionUnits(...args);
    // UI calls this public pure API with its committed session state. Internal
    // planner calls are lexical, not intercepted. Keep actual groups separate
    // from the independently read labels and never edit either input or output.
    window.__groupSession=JSON.parse(JSON.stringify({document:args[0],selection:args[1],groups:args[2]}));return result;
  }}));
  intercept('ImageryProvenance',model=>Object.freeze({...model,createTracker(...args){
    const real=model.createTracker(...args);window.__groupTracker=real;
    return Object.freeze({...real,...Object.fromEntries(['start','stop'].map(name=>[name,function(...values){
      window.__groupProvenanceCalls.push({name,canonical:name==='start'?values[0].canonical:null});return real[name](...values);
    }]))});
  }}));
}

async function runSessionGroupScenarios({page,runCase}) {
  const {identifier}=await page.send('Page.addScriptToEvaluateOnNewDocument',{source:'('+installObservation.toString()+')();'});
  const row=id=>'label[for="selection-'+id+'"]',checkbox=id=>'#selection-'+id;
  async function load(value=groupFixture()) {assert.deepEqual(M.canonicalScene(value),value);await page.file('synthetic-session-groups.json',value);await page.hidden();}
  async function live() {await sleep(M.REVEAL_GAP_MS+100);await page.click('#show-scene');await page.visible();}
  const draft=()=>page.evaluate(()=>window.__groupController.getState().draft);
  const controller=()=>page.evaluate(()=>{const s=window.__groupController.getState();return {current:s.current,draft:s.draft,dirty:s.dirty,undoCount:s.undoCount,redoCount:s.redoCount,revision:s.revision};});
  async function state() {
    return page.evaluate(()=>{const rows=Array.from(document.querySelectorAll('#selection-list input[type="checkbox"]'));
      const list=rows.map(e=>({id:e.id.slice('selection-'.length),checked:e.checked,indeterminate:e.indeterminate,label:document.querySelector('label[for="'+e.id+'"]').textContent}));
      return {rows:list,ids:list.filter(r=>r.checked).map(r=>r.id),primary:document.getElementById('move-anchor').value,
        only:document.getElementById('object-select').value,summary:document.getElementById('selection-summary').textContent,
        options:Array.from(document.getElementById('object-select').options,o=>({value:o.value,text:o.textContent})),
        anchors:Array.from(document.getElementById('move-anchor').options,o=>({value:o.value,text:o.textContent}))};});
  }
  async function groups() {
    const s=await state(),map=new Map();
    for(const item of s.rows){const match=item.label.match(/\bGroup\s+([1-9][0-9]*)\b/);if(!match)continue;
      const id='group-'+match[1];if(!map.has(id))map.set(id,[]);map.get(id).push(item.id);}
    const labeled=Array.from(map,([id,memberIds])=>({id,memberIds:memberIds.sort(numeric)})).sort((a,b)=>numeric(a.id,b.id));
    const actual=await page.evaluate(()=>window.__groupSession.groups);assert.deepEqual(actual,labeled,'committed metadata and complete row labels agree, including stable numeric order');return actual;
  }
  async function expect(ids,primary) {
    const s=await state();assert.deepEqual(s.ids,ids);assert.equal(s.only,ids.length===1?ids[0]:'');
    assert.ok(s.rows.every(r=>!r.indeterminate),'group rows never use partial/indeterminate state');
    if(ids.length>1)assert.equal(s.primary,primary);if(primary)assert.ok(s.summary.includes(primary),s.summary);
    return s;
  }
  async function activate(selector) {await page.focus(selector);await page.key('Enter');}
  async function chooseItem(id) {
    const before=await state(),index=before.options.findIndex(o=>o.value===id);assert.ok(index>=0);
    await page.evaluate(()=>{window.__groupChoiceEvents=[];if(!window.__groupChoiceObserver){window.__groupChoiceObserver=true;
      document.addEventListener('change',e=>{if(e.target.id==='object-select')window.__groupChoiceEvents.push({trusted:e.isTrusted,value:e.target.value});});}});
    // A grouped item deliberately returns the collapsed selector to ''. Open
    // the native menu first, navigate without intermediate commits, then commit
    // once. The inherited collapsed-select helper is intentionally unchanged.
    await page.focus('#object-select');await page.key(' ');await page.key('Home');for(let i=0;i<index;i++)await page.key('ArrowDown');await page.key('Enter');
    const changes=await page.evaluate(()=>window.__groupChoiceEvents);assert.equal(changes.length,1,'one trusted native menu commit, not incremental collapsed changes');assert.equal(changes[0].trusted,true);
    const member=(await groups()).find(g=>g.memberIds.includes(id)),ids=before.rows.filter(r=>member?member.memberIds.includes(r.id):r.id===id).map(r=>r.id);
    await expect(ids,id);
  }
  async function select(ids,primary=ids.at(-1),keyboard=false) {
    if(keyboard)await activate('#clear-selection');else await page.click('#clear-selection');
    for(const id of ids)if(!(await state()).ids.includes(id)){if(keyboard){await page.focus(checkbox(id));await page.key(' ');}else await page.click(row(id));}
    if(ids.length>1)await page.nativeSelect('#move-anchor',primary);
    await expect(ids,primary);
  }
  async function group(ids,primary=ids.at(-1),keyboard=false) {
    await select(ids,primary,keyboard);if(keyboard){await page.focus('#group-selected');await page.key('Enter');}else await page.click('#group-selected');
    await expect(ids,primary);return groups();
  }
  async function history(undo,redo) {assert.equal(await page.property('#undo-move','disabled'),!undo);assert.equal(await page.property('#redo-move','disabled'),!redo);}
  async function applyRead(version=3) {await page.click('#apply-changes');await page.hidden();return (await page.download('#export-scene','imagery-field-scene-v'+version+'.json')).json;}
  function noMetadata(value) {
    const visit=v=>{if(!v||typeof v!=='object')return;for(const [key,item]of Object.entries(v)){
      assert.ok(!['groups','groupId','memberIds','selection','primaryId','lockedIds','targetGroupIds'].includes(key),'session field leaked: '+key);visit(item);
    }};visit(value);
  }
  async function content(ratio=null) {
    return page.evaluate(ratio=>{const r=document.getElementById('scene-canvas').getBoundingClientRect();let width=r.width,height=r.height;
      if(ratio){const [a,b]=ratio.split(':').map(Number),scale=Math.min(width/a,height/b);width=a*scale;height=b*scale;}
      return {left:r.left+(r.width-width)/2,top:r.top+(r.height-height)/2,width,height,canvasWidth:r.width,canvasHeight:r.height};},ratio);
  }
  const point=(r,x,y)=>({x:r.left+r.width*x/100,y:r.top+r.height*y/100});
  async function pointer(type,p,shift=false) {
    if(page.device.touch)await page.send('Input.dispatchTouchEvent',{type:{down:'touchStart',move:'touchMove',up:'touchEnd',cancel:'touchCancel'}[type],touchPoints:['up','cancel'].includes(type)?[]:[{...p,radiusX:1,radiusY:1,force:1,id:1}],modifiers:shift?8:0});
    else await page.send('Input.dispatchMouseEvent',{type:{down:'mousePressed',move:'mouseMoved',up:'mouseReleased'}[type],...p,button:'left',buttons:type==='up'?0:1,clickCount:1,modifiers:shift?8:0});
  }
  async function tap(p,shift=false) {await pointer('down',p,shift);await pointer('up',p,shift);}
  async function rasterHash() {return page.evaluate(async()=>{const c=document.getElementById('scene-canvas'),bytes=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');});}
  async function capture(id,name) {await page.focus('#'+id);await page.evaluate(id=>document.getElementById(id).scrollIntoView({block:'center',behavior:'instant'}),id);await page.visualCapture(name);}
  async function whole(selector,focusSelector=selector,{interactive=true,inspector=true,focusRequired=true}={}) {
    if(focusRequired)await page.focus(focusSelector);
    const m=await page.evaluate(({selector,focusSelector,inspector})=>{const e=document.querySelector(selector),f=document.querySelector(focusSelector);e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
      if(inspector&&!e.closest('#editor-panel'))throw Error('Inspector target is outside the inspector: '+selector);
      const r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);
      const box=r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height});
      const aperture={left:0,right:innerWidth,top:0,bottom:innerHeight},clips=[];
      // The real scroll owner changes in short layouts. Intersect every
      // clipping ancestor's client aperture, never an oversized overflow-visible
      // content box. The same ancestor and hit checks also protect pinned Hide.
      for(let parent=e.parentElement;parent;parent=parent.parentElement){
        const style=getComputedStyle(parent),paintContainment=/(^|\s)(paint|strict|content)(\s|$)/.test(style.contain);
        const clipsX=paintContainment||/^(auto|scroll|hidden|clip|overlay)$/.test(style.overflowX);
        const clipsY=paintContainment||/^(auto|scroll|hidden|clip|overlay)$/.test(style.overflowY);
        if(!clipsX&&!clipsY)continue;
        const b=parent.getBoundingClientRect(),client={left:b.left+parent.clientLeft,right:b.left+parent.clientLeft+parent.clientWidth,
          top:b.top+parent.clientTop,bottom:b.top+parent.clientTop+parent.clientHeight};
        if(clipsX){aperture.left=Math.max(aperture.left,client.left);aperture.right=Math.min(aperture.right,client.right);}
        if(clipsY){aperture.top=Math.max(aperture.top,client.top);aperture.bottom=Math.min(aperture.bottom,client.bottom);}
        clips.push({id:parent.id,tag:parent.tagName,overflowX:style.overflowX,overflowY:style.overflowY,contain:style.contain,
          clipsX,clipsY,client,scrollTop:parent.scrollTop,scrollLeft:parent.scrollLeft});
      }
      return {selector,label:e.textContent,focused:document.activeElement===f,outline:getComputedStyle(e).outlineStyle,box:box(r),text:Array.from(range.getClientRects(),box),
        aperture,clips,
        hit:[[r.left+3,r.top+3],[r.right-3,r.top+3],[r.left+3,r.bottom-3],[r.right-3,r.bottom-3],[r.left+r.width/2,r.top+r.height/2]].every(([x,y])=>{const h=document.elementFromPoint(x,y);return h===e||e.contains(h);})};
    },{selector,focusSelector,inspector});
    const b=m.box,a=m.aperture;assert.ok((!focusRequired||m.focused)&&m.hit&&b.left>=a.left&&b.right<=a.right&&b.top>=a.top&&b.bottom<=a.bottom,JSON.stringify(m));
    if(interactive)assert.ok(b.width>=44&&b.height>=44,JSON.stringify(m));
    for(const t of m.text)assert.ok(t.left>=b.left-1&&t.right<=b.right+1&&t.top>=b.top-1&&t.bottom<=b.bottom+1,JSON.stringify(m));return m;
  }
  try {
    await runCase('v13 keyboard Group and Ungroup preserve exact scene, raster, dirty state and real controller staging',async()=>{
      const value=groupFixture();value.scene.objects[0].x+=.00000000001;await load(value);const originalDownload=await page.download('#export-scene','imagery-field-scene-v3.json');await live();
      const before=await controller(),pixels=await rasterHash(),stages=await page.evaluate(()=>window.__groupStageCalls.length),raf=await page.evaluate(()=>window.__testRAFRequests);
      await group(['object-1','object-3'],'object-1',true);const saved=[{id:'group-1',memberIds:['object-1','object-3']}];assert.deepEqual(await groups(),saved);
      assert.equal(await page.evaluate(()=>document.activeElement.id),'group-selected');assert.deepEqual(await controller(),before);
      assert.equal(await rasterHash(),pixels);assert.equal(await page.property('#draft-label','textContent'),'Applied');await history(true,false);
      assert.match(await page.property('label[for="object-select"]','textContent'),/Select item or group/);
      assert.match(await page.property('#group-session-warning','textContent'),/only.*session|session.*only/i);
      assert.match((await state()).summary,/2 items selected.*1 arrangement unit.*1 group/i);
      await page.focus('#ungroup-selected');await page.key('Enter');assert.deepEqual(await groups(),[]);await expect(['object-1','object-3'],'object-1');
      assert.equal(await page.evaluate(()=>document.activeElement.id),'ungroup-selected');assert.deepEqual(await controller(),before);assert.equal(await rasterHash(),pixels);
      assert.equal(await page.evaluate(()=>window.__groupStageCalls.length),stages,'metadata-only operations never restage identical scene bytes');
      assert.equal(await page.evaluate(()=>window.__testRAFRequests),raf);await page.click('#undo-move');await page.hidden();assert.deepEqual(await groups(),saved);
      await history(true,true);const endpoint=await draft();
      assert.equal(await page.property('#group-selected','disabled'),false);await page.click('#group-selected');await history(true,true);assert.deepEqual(await draft(),endpoint);assert.deepEqual(await groups(),saved);
      await page.click('#redo-move');assert.deepEqual(await groups(),[]);await page.click('#undo-move');
      const download=await page.download('#export-scene','imagery-field-scene-v3.json');assert.deepEqual(download.json,value);assert.deepEqual(download.bytes,originalDownload.bytes,'metadata-only Group/Ungroup/history preserve exact downloaded bytes');noMetadata(download.json);
      await capture('group-selected','v13-metadata-only-keyboard-group');
      // A complete keyboard-only workflow is separate from the pixel/metadata
      // identity assertions above. File import is setup; every following editor
      // activation uses trusted key events, never a pointer or synthetic click.
      const keyed=groupFixture();keyed.scene.objects.forEach((o,i)=>{o.x=[18,38,50,78][i];o.y=[30,40,55,65][i];});await load(keyed);
      await group(['object-1','object-2'],'object-2',true);const keyedGroups=await groups();
      for(const id of ['object-1','object-2']){await activate('#clear-selection');await page.focus(checkbox(id));await page.key(' ');await expect(['object-1','object-2'],id);}
      await page.nativeSelect('#move-anchor','object-1');
      for(const id of ['object-3','object-4']){await page.focus(checkbox(id));await page.key(' ');}await page.nativeSelect('#move-anchor','object-2');
      await page.fill('#delta-x','1');await page.fill('#delta-y','0');await activate('#move-selection');const translated=await draft();assert.notDeepEqual(translated,keyed);
      await activate('#selection-align-top');const aligned=await draft();assert.notDeepEqual(aligned,translated);rigidOffsets(translated,aligned,keyedGroups);
      await activate('#distribute-x');const spaced=await draft();assert.notDeepEqual(spaced,aligned);rigidOffsets(aligned,spaced,keyedGroups);
      await activate('#duplicate-object');const copiedGroups=await groups(),copies=await draft();assert.equal(copiedGroups.length,2);await expect(['object-5','object-6','object-7','object-8'],'object-6');
      const wanted=copy(spaced);wanted.scene.objects.push(...spaced.scene.objects.map((o,i)=>({...copy(o),id:'object-'+(i+5)})));assert.deepEqual(copies,wanted);
      await activate('#undo-move');assert.deepEqual(await draft(),spaced);assert.deepEqual(await groups(),keyedGroups);
      await activate('#redo-move');assert.deepEqual(await draft(),copies);assert.deepEqual(await groups(),copiedGroups);
      await activate('#ungroup-selected');assert.deepEqual(await groups(),keyedGroups);await expect(['object-5','object-6','object-7','object-8'],'object-6');

    });

    await runCase('v13 every trusted item-selection route closes groups and preserves the actual chosen anchor',async()=>{
      const value=groupFixture();value.scene.objects[1].x=value.scene.objects[2].x=55;
      await load(value);await group(['object-1','object-3'],'object-1',true);const saved=await groups();
      await page.click('#select-all');await page.nativeSelect('#move-anchor','object-3');await chooseItem('object-3');
      await expect(['object-1','object-3'],'object-3');
      await page.focus(checkbox('object-1'));await page.key(' ');await expect([],null);assert.equal(await page.evaluate(()=>document.activeElement.id),'selection-object-1');
      await page.focus(checkbox('object-3'));await page.key(' ');await expect(['object-1','object-3'],'object-3');
      await page.click(row('object-4'));await expect(['object-1','object-3','object-4'],'object-4');
      await page.click('.timeline-track:nth-child(1)');await expect(['object-1','object-3'],'object-1');
      assert.deepEqual(await page.evaluate(()=>Array.from(document.querySelectorAll('.timeline-track'),e=>e.getAttribute('aria-pressed'))),['true','false','true','false']);
      await live();const r=await content();await page.click('#select-all');await tap(point(r,18,45));await expect(['object-1','object-2','object-3','object-4'],'object-1');
      await page.click('#clear-selection');await tap(point(r,55,45));await expect(['object-1','object-3'],'object-3');
      await page.click('#cycle-overlap');await expect(['object-2'],'object-2');await page.click('#cycle-overlap');await expect(['object-1','object-3'],'object-3');
      await tap(point(r,18,45),true);await expect([],null);await tap(point(r,18,45),true);await expect(['object-1','object-3'],'object-1');
      await page.nativeSelect('#move-anchor','object-3');await expect(['object-1','object-3'],'object-3');assert.deepEqual(await draft(),value);assert.deepEqual(await groups(),saved);
      for(const id of ['shape','size','position-x','position-y','object-hue-value','item-hold','item-after-previous','lock-selected'])assert.equal(await page.property('#'+id,'disabled'),true,id);
      const labels=await state();for(const id of ['object-1','object-3']){assert.match(labels.options.find(o=>o.value===id).text,/Group 1.*2/);assert.match(labels.anchors.find(o=>o.value===id).text,/Group 1/);}
      await capture('move-anchor','v13-group-closed-selection-routes');
    });

    await runCase('v13 mixed group locks and copied-group history preserve all-or-nothing identity',async()=>{
      const value=groupFixture(2);await load(value);await page.click('#lock-selected');await group(['object-1','object-2'],'object-2');const original=await groups();
      for(const id of ['move-selection','nudge-right','align-both','delete-object','layer-front','lock-selected'])assert.equal(await page.property('#'+id,'disabled'),true,id);
      await page.click('#ungroup-selected');await page.click('#undo-move');assert.deepEqual(await groups(),original);
      await page.click('#duplicate-object');const copied=await groups();assert.equal(copied.length,2);assert.deepEqual(copied[1].memberIds,['object-3','object-4']);await expect(['object-3','object-4'],'object-4');
      const duplicated=copy(value);duplicated.scene.objects.push({...copy(value.scene.objects[0]),id:'object-3'},{...copy(value.scene.objects[1]),id:'object-4'});assert.deepEqual(await draft(),duplicated);
      await page.click('#ungroup-selected');await chooseItem('object-3');assert.equal(await page.property('#lock-selected','ariaPressed'),'false');await page.click('#lock-selected');
      await page.click('#undo-move');assert.deepEqual(await groups(),copied);await expect(['object-3','object-4'],'object-4');
      assert.equal(await page.property('#undo-move','disabled'),true,'duplicate Undo cannot remove a newly locked grouped copy');assert.deepEqual(await draft(),duplicated);
      await page.click('#unlock-all');await page.click('#undo-move');assert.deepEqual(await groups(),original);assert.deepEqual(await draft(),value);await expect(['object-1','object-2'],'object-2');
      await page.click('#redo-move');assert.deepEqual(await groups(),copied);assert.deepEqual(await draft(),duplicated);
      await capture('selection-summary','v13-locked-copy-metadata-undo');
    });

    await runCase('v13 noncontiguous grouped layers and nearest-survivor deletion have exact reversible history',async()=>{
      const value=groupFixture();await load(value);await group(['object-1','object-3'],'object-1');const first=await groups();await live();await capture('selection-summary','v13-noncontiguous-group-before');
      await page.click('#layer-front');assert.deepEqual((await draft()).scene.objects.map(o=>o.id),['object-2','object-1','object-4','object-3']);assert.deepEqual(await groups(),first);await capture('selection-summary','v13-noncontiguous-group-forward');
      await page.click('#layer-back');assert.deepEqual(await draft(),value);assert.deepEqual(await groups(),first);
      await page.click('#undo-move');await page.click('#redo-move');assert.deepEqual(await draft(),value);
      await group(['object-2','object-4'],'object-4');const both=await groups();await chooseItem('object-1');await page.click('#delete-object');
      await expect(['object-2','object-4'],'object-2');assert.deepEqual(await groups(),[both[1]]);assert.deepEqual((await draft()).scene.objects.map(o=>o.id),['object-2','object-4']);
      await page.click('#undo-move');assert.deepEqual(await groups(),both);assert.deepEqual(await draft(),value);await expect(['object-1','object-3'],'object-1');
      await page.click('#select-all');await page.click('#delete-object');await expect([],null);assert.deepEqual(await groups(),[]);assert.deepEqual((await draft()).scene.objects,[]);
      await page.click('#undo-move');assert.deepEqual(await groups(),both);assert.deepEqual(await draft(),value);await page.click('#redo-move');
      const empty=copy(value);empty.scene.objects=[];assert.deepEqual(await applyRead(),empty);await history(false,false);
      await capture('selection-summary','v13-group-delete-empty-history');
    });

    await runCase('v13 rigid-unit six alignments and centering share authored and legacy rendered bounds',async()=>{
      for(const mode of ['left','right','top','bottom','horizontal','vertical']){
        const value=rigidFixture();await load(value);await group(['object-1','object-2']);await page.click('#select-all');const saved=await groups(),r=await content('1:1'),viewport={width:r.canvasWidth,height:r.canvasHeight};
        const before=unionBounds(value,saved,viewport),axis=['left','right','horizontal'].includes(mode)?'x':'y',
          target=mode==='left'?Math.min(...before.map(b=>b.left)):mode==='right'?Math.max(...before.map(b=>b.right)):mode==='top'?Math.min(...before.map(b=>b.top)):mode==='bottom'?Math.max(...before.map(b=>b.bottom)):
            mode==='horizontal'?(Math.min(...before.map(b=>b.left))+Math.max(...before.map(b=>b.right)))/2:(Math.min(...before.map(b=>b.top))+Math.max(...before.map(b=>b.bottom)))/2;
        await page.click('#selection-align-'+mode);const result=await draft(),after=unionBounds(result,saved,viewport);
        assert.ok(after.every(b=>Math.abs(b[mode]-target)<=.005+EPS));onlyCoordinates(value,result,[axis]);rigidOffsets(value,result,saved);assert.deepEqual(await groups(),saved);
        await page.click('#undo-move');assert.deepEqual(await draft(),value);await page.click('#redo-move');assert.deepEqual(await draft(),result);
      }
      for(const variant of [{ratio:'1:1'},{ratio:'4:3'},{ratio:'3:4'},{ratio:'16:9'},{ratio:'9:16'},{name:'legacy-wide',width:1366,height:900},{name:'legacy-tall',width:720,height:1100}]){
        await page.viewport(variant.width||page.device.width,variant.height||page.device.height);const value=rigidFixture(variant.ratio||null);await load(value);await group(['object-1','object-2']);await page.click('#select-all');
        const saved=await groups(),r=await content(variant.ratio||null),viewport={width:r.canvasWidth,height:r.canvasHeight};
        if(variant.name==='legacy-wide')assert.ok(r.width>r.height);if(variant.name==='legacy-tall')assert.ok(r.height>r.width);
        await live();await capture('selection-summary','v13-rigid-unit-before-'+(variant.ratio?.replace(':','x')||variant.name));
        for(const axis of ['x','y','both']){
          const before=await draft();await page.click('#align-'+axis);const result=await draft(),b=unionBounds(result,saved,viewport);rigidOffsets(before,result,saved);
          for(const a of axis==='both'?['x','y']:[axis]){const midpoint=a==='x'?(Math.min(...b.map(v=>v.left))+Math.max(...b.map(v=>v.right)))/2:(Math.min(...b.map(v=>v.top))+Math.max(...b.map(v=>v.bottom)))/2;assert.ok(Math.abs(midpoint-50)<=.005+EPS);}
          onlyCoordinates(before,result,axis==='both'?['x','y']:[axis]);assert.deepEqual(await groups(),saved);
        }
        await page.visible();await capture('selection-summary','v13-rigid-unit-centered-'+(variant.ratio?.replace(':','x')||variant.name));
        assert.deepEqual(await applyRead(value.version),await draft());
      }
    });

    await runCase('v13 unequal unit gaps and 100 repeated commands retain exact first endpoints and redo',async()=>{
      for(const axis of ['x','y']){
        const value=gapFixture(axis);await load(value);await group(['object-2','object-3'],'object-3',true);const saved=await groups();
        assert.equal(await page.property('#selection-align-left','disabled'),true);assert.equal(await page.property('#distribute-'+axis,'disabled'),true);
        await page.click(row('object-1'));assert.equal(await page.property('#selection-align-left','disabled'),false);assert.equal(await page.property('#distribute-'+axis,'disabled'),true);
        await activate('#select-all');await activate('#distribute-'+axis);const expected=copy(value);expected.scene.objects[1][axis]=43;expected.scene.objects[2][axis]=57;
        assert.deepEqual(await draft(),expected);rigidOffsets(value,expected,saved);
        const r=await content('1:1'),b=unionBounds(expected,saved,{width:r.canvasWidth,height:r.canvasHeight}),lo=axis==='x'?'left':'top',hi=axis==='x'?'right':'bottom';
        assert.ok(Math.abs(b[1][lo]-40)<=EPS);assert.ok(Math.abs(b[1][lo]-b[0][hi]-20)<=EPS);assert.ok(Math.abs(b[2][lo]-b[1][hi]-20)<=EPS);
        if(axis==='x')for(let i=0;i<100;i++)await page.click('#distribute-x');
        assert.deepEqual(await draft(),expected);assert.deepEqual(await groups(),saved);
        await page.click('#nudge-right');await page.click('#undo-move');await history(true,true);await page.click('#distribute-'+axis);await history(true,true);assert.deepEqual(await draft(),expected);
        await page.click('#undo-move');assert.deepEqual(await draft(),value);assert.deepEqual(await groups(),saved);await page.click('#redo-move');assert.deepEqual(await draft(),expected);
        await live();await capture('distribute-'+axis,'v13-rigid-unit-equal-edge-gaps-'+axis);
      }
      for(const command of ['selection-align-top','align-both']){
        const value=rigidFixture();await load(value);await group(['object-1','object-2']);await page.click('#select-all');const saved=await groups();await page.click('#'+command);const first=await draft();assert.notDeepEqual(first,value);
        for(let i=0;i<100;i++)await page.click('#'+command);assert.equal(JSON.stringify(await draft()),JSON.stringify(first));assert.equal(JSON.stringify(await groups()),JSON.stringify(saved));
        await page.click('#nudge-right');await page.click('#undo-move');await history(true,true);await page.click('#'+command);await history(true,true);
        await page.click('#undo-move');assert.deepEqual(await draft(),value);assert.deepEqual(await groups(),saved);await page.click('#redo-move');assert.deepEqual(await draft(),first);
      }
    });

    await runCase('v13 rapid grouped drag keeps the first trusted Undo and preserves snap and grab offsets',async()=>{
      const value=groupFixture(2);await load(value);await group(['object-1','object-2'],'object-2');const saved=await groups();await page.nativeSelect('#snap-step','10');await live();
      const r=await content(),p=point(r,35,45),q=point(r,47,54);assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,p),'scene-canvas');
      await page.evaluate(()=>{window.__groupPointer=[];window.__groupMoveTimes=[];let start;
        document.addEventListener('pointermove',e=>{if(e.target.id==='scene-canvas')start=performance.now();},{capture:true});
        for(const type of ['pointerdown','pointermove','pointerup','click','touchstart'])document.addEventListener(type,e=>{
          if(window.__groupPointer.length<80)window.__groupPointer.push({type,time:e.timeStamp,target:e.target.id,trusted:e.isTrusted,pointerId:e.pointerId,defaultPrevented:e.defaultPrevented});
          if(type==='pointermove'&&e.target.id==='scene-canvas'){const r=document.getElementById('scene-canvas').getBoundingClientRect();window.__groupMoveTimes.push({ms:performance.now()-start,rect:{left:r.left,top:r.top,width:r.width,height:r.height}});}
        },{passive:true});});
      const stop=await beginInputTrace(page);let failure;
      try {
        await pointer('down',p);await pointer('move',point(r,40,48));await pointer('move',point(r,44,51));await pointer('move',q);await pointer('up',q);
        // First and only Undo activation: no post-release sleep, retry, desired
        // state polling, synthetic click, or fling-suppression workaround.
        await page.click('#undo-move');await page.hidden();await history(true,true);await expect(['object-1','object-2'],'object-1');assert.deepEqual(await draft(),value);assert.deepEqual(await groups(),saved);
      } catch(error){failure=error;throw error;}
      finally {
        const trace=await stop(),dom=await page.evaluate(()=>{const events=window.__groupPointer,down=events.find(e=>e.type==='pointerdown'&&e.target==='scene-canvas'),flick=events.filter(e=>e.pointerId===down?.pointerId&&['pointerdown','pointermove','pointerup'].includes(e.type)),move=flick.filter(e=>e.type==='pointermove').at(-1),up=flick.find(e=>e.type==='pointerup');return {events,flick,lastMoveToUpMs:move&&up?up.time-move.time:null,moves:window.__groupMoveTimes};});
        console.log('IMAGERY_SESSION_GROUP_RAPID '+JSON.stringify({device:page.device.name,status:failure?'FAIL':'OBSERVED',dom,trace}));assertRapidReleaseEvidence(dom,trace);
        assert.ok(dom.flick.filter(e=>e.type==='pointermove').length>=3&&dom.flick.every(e=>e.trusted));assert.equal(dom.events.filter(e=>e.type==='click'&&e.target==='undo-move'&&e.trusted).length,1);
        if(page.device.touch)assert.ok(dom.events.some(e=>e.type==='touchstart'&&e.target==='undo-move'&&!e.defaultPrevented));
        for(const move of dom.moves)assert.deepEqual(move.rect,{left:r.left,top:r.top,width:r.width,height:r.height},'group drag cannot reflow the preview');
        const timing=stats(dom.moves.map(e=>e.ms));console.log('IMAGERY_SESSION_GROUP_DRAG_COST '+JSON.stringify({device:page.device.name,scope:'Candidate-only grouped pointer handler plus forced layout; not physical latency or a baseline comparison',timing}));assert.ok(timing.max<HANDLER_MAX_MS);
      }
      await page.click('#redo-move');const moved=copy(value);moved.scene.objects.forEach(o=>{o.x+=15;o.y+=5;});assert.deepEqual(await draft(),moved);rigidOffsets(value,moved,saved);
      await page.nativeSelect('#move-anchor','object-2');await page.click('#place-object');const placement=await content();await tap(point(placement,70,60));await page.hidden();const placed=copy(moved);placed.scene.objects.forEach(o=>{o.x-=10;o.y+=10;});assert.deepEqual(await draft(),placed);assert.deepEqual(await groups(),saved);
      await page.click('#undo-move');assert.deepEqual(await draft(),moved);await live();await capture('selection-summary','v13-rapid-group-drag-rigid-result');assert.deepEqual(await applyRead(),moved);
    });

    await runCase('v13 captured groups retain fresh invalid input and never override Hide, lifecycle or playback',async()=>{
      // Valid metadata interruption is distinct from invalid-input concealment.
      // Exercise Group, Ungroup and exact-group no-op while the real pointer is
      // still captured; a later stale release must never publish the preview.
      for(const action of ['group','ungroup','group-no-op']){
        const value=groupFixture(2);await load(value);
        if(action==='group')await select(['object-1','object-2']);else await group(['object-1','object-2']);
        const originalGroups=await groups();await page.click('#nudge-right');const stable=await draft();await live();await page.click('label[for="show-editor-aids"]');
        const r=await content(),p=point(r,36,45),q=point(r,45,51);await pointer('down',p);await pointer('move',point(r,40,48));await pointer('move',q);
        assert.notDeepEqual(await draft(),stable,'actual owned preview was staged before metadata interruption');
        await activate(action==='ungroup'?'#ungroup-selected':'#group-selected');await page.hidden();assert.deepEqual(await draft(),stable);
        const actual=await groups();if(action==='ungroup')assert.deepEqual(actual,[]);else if(action==='group-no-op')assert.deepEqual(actual,originalGroups);else {assert.equal(actual.length,1);assert.deepEqual(actual[0].memberIds,['object-1','object-2']);}
        assert.equal(await page.property('#show-editor-aids','checked'),false);assert.equal(await page.property('#editor-aids-overlay','hidden'),true);
        assert.equal(await page.evaluate(()=>document.querySelectorAll('#editor-aids-overlay .editor-aid-line').length),0);
        await pointer('up',q);await page.hidden();assert.deepEqual(await draft(),stable);assert.deepEqual(await groups(),actual);await expect(['object-1','object-2'],'object-1');
        await activate('#undo-move');
        if(action==='group-no-op'){assert.deepEqual(await draft(),value);assert.deepEqual(await groups(),originalGroups);}
        else {assert.deepEqual(await draft(),stable);assert.deepEqual(await groups(),originalGroups);await activate('#undo-move');assert.deepEqual(await draft(),value);}
      }
      const value=groupFixture(2);await load(value);await group(['object-1','object-2'],'object-1');const saved=await groups();await page.click('#nudge-right');const stable=await draft();await live();
      const r=await content(),p=point(r,36,45),q=point(r,44,50);await pointer('down',p);await pointer('move',point(r,40,48));await pointer('move',q);
      await page.fill('#scene-name','');await page.fill('#background-hue-value','');await page.focus('#ungroup-selected');await page.key('Enter');await page.focus(checkbox('object-2'));await page.key(' ');
      await page.focus('#hide-scene');await page.key('Enter');await pointer('up',q);await page.hidden();
      assert.equal(await page.property('#scene-name','value'),'');assert.equal(await page.property('#background-hue-value','value'),'');assert.equal(await page.property('#background-hue-value','ariaInvalid'),'true');
      assert.deepEqual(await draft(),stable);assert.deepEqual(await groups(),saved);await expect(['object-1','object-2'],'object-1');
      await page.fill('#scene-name',value.scene.name);await page.fill('#background-hue-value',String(value.scene.background.h));await page.hidden();await history(true,false);
      await page.click('#undo-move');assert.deepEqual(await draft(),value);assert.deepEqual(await groups(),saved);
      await live();await page.viewport(320,280);await page.hidden();assert.deepEqual(await groups(),saved);await page.focus('#hide-scene');await page.key('Enter');
      await page.viewport(page.device.width,page.device.height);await live();await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','grouped draft fullscreen concealment');
      assert.deepEqual(await groups(),saved);await page.fullscreenAfter(()=>page.key('Escape'),null,'grouped draft native Escape');
      await page.motionPreference('no-preference');await sleep(M.REVEAL_GAP_MS+100);await page.click('#item-play');await page.visible();
      assert.equal(await page.property('#group-selected','disabled'),true);assert.equal(await page.property('#ungroup-selected','disabled'),true);
      await page.click('#item-pause');await page.visible();assert.equal(await page.property('#ungroup-selected','disabled'),true);await page.focus('#item-stop');await page.key('Enter');await page.hidden();
      assert.deepEqual(await groups(),saved);assert.deepEqual(await draft(),value);await page.motionPreference('reduce');
      await capture('group-session-warning','v13-hidden-groups-after-lifecycle');
    });

    await runCase('v13 metadata-only groups retain one clean provenance interval and cannot reset aid suppression',async()=>{
      const value=groupFixture();await load(value);await page.click('#journal-container summary');await page.click('#journal-enable');await page.click('#journal-track-display');await live();
      await select(['object-1','object-3'],'object-3');const before=await page.evaluate(()=>window.__groupProvenanceCalls.slice()),pixels=await rasterHash();
      await page.click('#group-selected');await page.click('#ungroup-selected');await page.click('#group-selected');
      assert.deepEqual(await page.evaluate(()=>window.__groupProvenanceCalls),before,'metadata neither ends nor begins a visible provenance interval');assert.equal(await rasterHash(),pixels);
      assert.deepEqual(await draft(),value);assert.equal(await page.property('#draft-label','textContent'),'Applied');await page.click('#hide-scene');
      const deadline=Date.now()+5000;while((await page.evaluate(()=>window.__groupTracker.getState().status))==='pending-digest'&&Date.now()<deadline)await sleep(25);
      const summary=await page.evaluate(()=>window.__groupTracker.getSummary());assert.equal(summary.scene.sha256,sha(value));assert.equal(summary.exposure.status,'available');
      await page.click('#journal-add');await page.click('#journal-include-entry-1');await page.click('#journal-preview');let record=JSON.parse(await page.property('#journal-preview-text','textContent'));
      noMetadata(record);assert.equal(record.entries[0].reflection.scene.sha256,sha(value));await page.click('#journal-approve');const journal=await page.download('#journal-download','imagery-field-journal-v2.json');noMetadata(journal.json);
      await live();await page.click('label[for="show-editor-aids"]');await page.click('label[for="show-editor-aids"]');await page.click('#ungroup-selected');await page.click('#group-selected');await page.click('#undo-move');await page.hidden();
      await page.click('#journal-add');await page.click('#journal-include-entry-1');await page.click('#journal-include-entry-2');await page.click('#journal-preview');record=JSON.parse(await page.property('#journal-preview-text','textContent')).entries[0].reflection;
      assert.deepEqual(record.scene,{status:'unavailable'});assert.deepEqual(record.exposure,{status:'unavailable'});await capture('journal-preview-text','v13-group-provenance-suppression');
    });

    await runCase('v13 Apply, capture and sequence import retain groups while identical replacement and accepted history reset them',async()=>{
      const value=groupFixture();await load(value);await group(['object-1','object-3'],'object-1');const saved=await groups();await page.click('#nudge-right');const moved=await draft();
      assert.deepEqual(await applyRead(),moved);assert.deepEqual(await groups(),saved);await history(false,false);
      const downloaded=await page.download('#export-scene','imagery-field-scene-v3.json');noMetadata(downloaded.json);assert.deepEqual(await groups(),saved);
      await page.click('#capture-add');await page.hidden();await page.click('#workspace-scene');assert.deepEqual(await groups(),saved);
      await page.click('#workspace-sequence');const captured=await page.download('#sequence-export','imagery-field-sequence-v2.json');noMetadata(captured.json);assert.deepEqual(captured.json.sequence.steps[0].objects,moved.scene.objects);
      await page.file('synthetic-group-sequence-only.json',sequence(),true,'#sequence-import');await page.click('#workspace-scene');assert.deepEqual(await groups(),saved);assert.deepEqual(await draft(),moved);
      await page.file('synthetic-rejected-group-field.json',{...copy(moved),groups:saved});await page.hidden();assert.deepEqual(await groups(),saved);assert.deepEqual(await draft(),moved);
      const nested=copy(moved);nested.scene.objects[0].groupId='group-1';await page.file('synthetic-rejected-item-group.json',nested);assert.deepEqual(await groups(),saved);assert.deepEqual(await draft(),moved);
      await page.file('synthetic-identical-group-free-roundtrip.json',moved);await page.hidden();assert.deepEqual(await groups(),[]);assert.deepEqual(await draft(),moved);await history(false,false);
      assert.match(await page.property('#status','textContent'),/group.*clear|clear.*group/i);await expect(['object-1'],'object-1');
      await group(['object-1','object-3']);await page.click('#discard');assert.deepEqual(await groups(),[]);assert.deepEqual(await draft(),moved);
      await group(['object-1','object-3']);await page.click('#undo');assert.deepEqual(await groups(),[]);await page.hidden();await page.click('#redo');assert.deepEqual(await groups(),[]);assert.deepEqual(await draft(),moved);
      await group(['object-1','object-3']);await page.click('#workspace-sequence');await page.click('#sequence-load');await page.click('#workspace-scene');assert.deepEqual(await groups(),[]);await expect(['object-1'],'object-1');
      await load(value);await group(['object-1','object-3']);await page.click('#upgrade-scene');assert.deepEqual(await groups(),[]);assert.equal((await draft()).version,4);
      await group(['object-1','object-3']);await page.click('#new-authored-scene');assert.deepEqual(await groups(),[]);await history(false,false);
      await load(value);await group(['object-1','object-3']);await page.fresh();assert.deepEqual(await groups(),[]);await page.click('#hide-scene');await page.hidden();
      await capture('group-session-warning','v13-session-only-reset-disclosure');
    });

    await runCase('v13 twelve full group labels and controls retain whole focus, corner hits and pinned Hide',async()=>{
      const value=groupFixture(12,'1:1');value.scene.objects=value.scene.objects.map((o,i)=>({...o,id:'object-'+(999988+i),shape:'rounded-rectangle',x:50,y:50,size:8,
        geometry:{height:8,rotation:45,fill:false,cornerRadius:.2},outline:{enabled:true,width:4,color:{h:0,s:0,l:30}},shadow:{enabled:true,offsetX:12,offsetY:12,blur:6,color:{h:0,s:0,l:0}}}));
      await load(value);await page.click('#lock-selected');const ids=value.scene.objects.map(o=>o.id);
      for(let i=0;i<12;i+=2)await group(ids.slice(i,i+2));await page.click('#select-all');assert.equal((await groups()).length,6);
      for(const [width,height]of [[1280,800],[320,760],[640,360],[320,280]]){
        await page.viewport(width,height);await page.hidden();const before=await content('1:1');
        for(let i=0;i<ids.length;i++){
          const m=await whole(row(ids[i]),checkbox(ids[i]));assert.notEqual(m.outline,'none');assert.match(m.label,/Group [1-6]/);assert.ok(m.label.includes(ids[i])&&/rounded-rectangle/.test(m.label));
          console.log('IMAGERY_SESSION_GROUP_FOCUS '+JSON.stringify({device:page.device.name,viewport:{width,height},...m}));if(width===320&&height===280)await page.visualCapture('v13-short-group-row-'+(i+1));
        }
        await whole('#selection-summary','#selection-summary',{interactive:false});if(width===320)await page.visualCapture('v13-item-unit-summary-'+width+'x'+height);
        await whole('#move-anchor');await whole('#ungroup-selected');await whole('#unlock-all');await whole('#group-session-warning','#group-session-warning',{interactive:false,focusRequired:false});
        await whole('#hide-scene','#hide-scene',{inspector:false});assert.deepEqual(await content('1:1'),before,'scrolling grouped inspector never moves canvas');
        assert.equal(await page.evaluate(()=>{const e=document.getElementById('selection-list'),s=getComputedStyle(e);return e.scrollHeight>e.clientHeight+1&&['auto','scroll'].includes(s.overflowY);}),false);
        await page.noOverflow(width);await capture('ungroup-selected','v13-whole-group-controls-'+width+'x'+height);
      }
      await page.click('#ungroup-selected');await select(ids.slice(0,2));
      for(const height of [280,760]){await page.viewport(320,height);await whole('#group-selected');await page.visualCapture('v13-whole-group-create-320x'+height);await whole('#hide-scene','#hide-scene',{inspector:false});}
      await page.click('#group-selected');await chooseItem(ids[0]);await page.focus(checkbox(ids[1]));await page.key(' ');assert.equal(await page.evaluate(()=>document.activeElement.id),'selection-'+ids[1]);
      await page.key(' ');await page.click('#unlock-all');await page.focus('#layer-front');await page.key('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'layer-front');
      await page.send('Emulation.setEmulatedMedia',{features:[{name:'forced-colors',value:'active'},{name:'prefers-reduced-motion',value:'reduce'}]});await whole(row(ids[0]),checkbox(ids[0]));await page.visualCapture('v13-groups-forced-colors');
      await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    });

    await runCase('v13 metadata and rigid-unit handler costs remain bounded without claiming a nonexistent baseline',async()=>{
      const value=groupFixture(12,'1:1');value.scene.objects.forEach((o,i)=>{o.x=30+(i%3)*15;o.y=35+Math.floor(i/3)*8;});await load(value);await page.click('#select-all');
      await page.evaluate(()=>{window.__groupPerf=[];const start=new Map(),ids=new Set(['group-selected','ungroup-selected','nudge-right','align-both','hide-scene']);
        document.addEventListener('click',e=>{if(ids.has(e.target.id))start.set(e.target.id,performance.now());},{capture:true});
        document.addEventListener('click',e=>{if(!ids.has(e.target.id)||!start.has(e.target.id))return;const r=document.getElementById('selection-list').getBoundingClientRect();
          window.__groupPerf.push({id:e.target.id,trusted:e.isTrusted,ms:performance.now()-start.get(e.target.id),rows:document.querySelectorAll('#selection-list input').length,selected:document.querySelectorAll('#selection-list input:checked').length,width:r.width,visibility:document.getElementById('visibility-label').textContent});});});
      const before=await controller(),stageCount=await page.evaluate(()=>window.__groupStageCalls.length);
      for(let i=0;i<6;i++){await page.click('#group-selected');await page.click('#ungroup-selected');}
      assert.deepEqual(await controller(),before);assert.equal(await page.evaluate(()=>window.__groupStageCalls.length),stageCount);
      assert.equal((await state()).rows.length,12);assert.deepEqual(await groups(),[]);
      for(let i=0;i<12;i++)await page.click('#undo-move');await history(false,true);assert.deepEqual(await draft(),value);
      for(let i=0;i<12;i++)await page.click('#redo-move');await history(true,false);assert.deepEqual(await groups(),[]);assert.deepEqual(await draft(),value);
      await page.click('#group-selected');const saved=await groups();assert.equal(saved.length,1);assert.equal(saved[0].memberIds.length,12);
      for(let i=0;i<6;i++)await page.click('#nudge-right');const moved=await draft();rigidOffsets(value,moved,saved);moved.scene.objects.forEach((o,i)=>assert.equal(o.x,value.scene.objects[i].x+6));
      await page.click('#align-both');const centered=await draft();assert.notDeepEqual(centered,moved);for(let i=1;i<6;i++)await page.click('#align-both');assert.equal(JSON.stringify(await draft()),JSON.stringify(centered));await live();await page.click('#hide-scene');await page.hidden();
      const events=await page.evaluate(()=>window.__groupPerf),metadata=events.filter(e=>['group-selected','ungroup-selected'].includes(e.id)),nudge=events.filter(e=>e.id==='nudge-right'),center=events.filter(e=>e.id==='align-both'),hide=events.filter(e=>e.id==='hide-scene');
      assert.equal(metadata.length,13);assert.equal(nudge.length,6);assert.equal(center.length,6);assert.equal(hide.length,1);assert.ok(events.every(e=>e.trusted&&e.rows===12&&e.selected===12));
      const report={device:page.device.name,scope:'Same-runner candidate-only synchronous trusted handler plus forced layout; 12 items, one rigid unit; first Hide after explicit Live',
        sharedBaseline:'Inherited Feature 013 paired singleton nudge/drag/Hide checks remain unchanged. Feature 012 has no Group/Ungroup or rigid-unit equivalent, so these measurements are not baseline regression deltas.',
        limits:'No compositor, physical-device, display-latency or calibrated benchmark claim. The sample includes production validation and inspector layout; the test observer itself adds uncalibrated overhead.',
        criteria:{attributableHandlerMaxExclusiveMs:HANDLER_MAX_MS},metadata:stats(metadata.map(e=>e.ms)),rigidNudge:stats(nudge.map(e=>e.ms)),rigidCenter:{mutating:stats(center.slice(0,1).map(e=>e.ms)),noOp:stats(center.slice(1).map(e=>e.ms))},firstHide:hide[0],events};
      console.log('IMAGERY_SESSION_GROUP_PERFORMANCE '+JSON.stringify(report));assert.ok(events.every(e=>e.ms<HANDLER_MAX_MS),'investigate >50ms attributable work; do not increase timeout or weaken validation');assert.equal(hide[0].visibility,'Hidden');
      assert.equal((await state()).rows.length,12);assert.deepEqual(await groups(),saved);const result=await applyRead(4);noMetadata(result);rigidOffsets(value,result,saved);
    });
  } finally {
    // The observer never persists into inherited sequence cases or other tabs.
    await page.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});
  }
}
module.exports={runSessionGroupScenarios,groupFixture,rigidFixture,gapFixture,unionBounds,rigidOffsets};
