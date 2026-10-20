'use strict';
// Native CDP input and actual raster checks. Synthetic fixtures only.
const assert=require('node:assert/strict');
const {setTimeout:sleep}=require('node:timers/promises');
const {scene,styledObject}=require('./fixtures.cjs');
const {rgb}=require('./browser-live.cjs');
async function runDirectEditorScenarios({page,runCase}){
 const fixture=()=>scene({name:'Synthetic direct editing',background:{h:210,s:20,l:8},objects:[styledObject({id:'object-1',shape:'pixel',x:35,y:50,size:6,color:{h:120,s:40,l:50}})]});
 const start=async value=>{await page.file('direct-editor.json',value);await sleep(3100);await page.click('#show-scene');await page.visible();};
 const rect=()=>page.evaluate(()=>{const r=document.getElementById('scene-canvas').getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};});
 async function input(type,x,y){
  if(page.device.touch){const names={down:'touchStart',move:'touchMove',up:'touchEnd'};await page.send('Input.dispatchTouchEvent',{type:names[type],touchPoints:type==='up'?[]:[{x,y,radiusX:1,radiusY:1,force:1,id:1}]});}
  else{const names={down:'mousePressed',move:'mouseMoved',up:'mouseReleased'};await page.send('Input.dispatchMouseEvent',{type:names[type],x,y,button:'left',buttons:type==='up'?0:1,clickCount:1});}
 }
 async function sample(x,y){return page.evaluate(([x,y])=>{const c=document.getElementById('scene-canvas');return Array.from(c.getContext('2d').getImageData(Math.floor(c.width*x/100),Math.floor(c.height*y/100),1,1).data).slice(0,3)},[x,y]);}
 async function beginDirectTrace(){
  await page.evaluate(()=>{
   const button=document.getElementById('undo-move'),canvas=document.getElementById('scene-canvas');
   window.__directTapTrace=[];
   const snapshot=r=>({x:r.x,y:r.y,w:r.width,h:r.height});
   for(const type of ['touchstart','touchmove','touchend','touchcancel','pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture','mousedown','mouseup','click'])for(const capture of [true,false])document.addEventListener(type,event=>{
    if(window.__directTapTrace.length>=160)return;
    window.__directTapTrace.push({type,capture,time:event.timeStamp,target:event.target.id,trusted:event.isTrusted,defaultPrevented:event.defaultPrevented,cancelable:event.cancelable,pointerId:event.pointerId,pointerType:event.pointerType,x:event.clientX,y:event.clientY,touches:event.changedTouches?Array.from(event.changedTouches,t=>({id:t.identifier,x:t.clientX,y:t.clientY})):null,path:event.composedPath().slice(0,8).map(e=>e.id||e.nodeName||'window'),button:snapshot(button.getBoundingClientRect()),canvas:snapshot(canvas.getBoundingClientRect()),buttonConnected:button.isConnected,sameButton:button===document.getElementById('undo-move'),disabled:button.disabled,scroll:document.getElementById('editor-scroll').scrollTop});
   },{capture,passive:true});
  });
 }
 async function settledDirectClick(selector,dwellMs=0){
  await page.evaluate(async selector=>{const e=document.querySelector(selector);e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));},selector);
  try{
   if(!dwellMs||!page.device.touch)await page.click(selector);
   else {
    // One separately identified trusted tap. Dwell is the only input change;
    // never retry a missing click or synthesize a DOM activation.
    const point=await page.evaluate(selector=>{
     const e=document.querySelector(selector);if(!e||e.disabled)throw Error('Missing or disabled '+selector);
     const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);
     if(hit!==e&&!e.contains(hit))throw Error('Occluded '+selector);
     window.__directDwellClick=null;e.addEventListener('click',event=>{window.__directDwellClick={trusted:event.isTrusted};},{once:true});return {x,y};
    },selector);
    await page.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,radiusX:1,radiusY:1,force:1,id:1}]});
    await sleep(dwellMs);
    await page.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const deadline=Date.now()+7000;let delivered;
    do {delivered=await page.evaluate(()=>window.__directDwellClick);if(delivered)break;await sleep(30);}while(Date.now()<deadline);
    assert.ok(delivered,'Timed out waiting for trusted dwell click delivery to '+selector);assert.equal(delivered.trusted,true,'interaction must be browser-trusted');
   }
  }catch(error){throw Error(error.message+'; direct-tap diagnostics '+JSON.stringify(await page.evaluate(()=>window.__directTapTrace)));}
 }
 const near=(a,b)=>a.forEach((value,i)=>assert.ok(Math.abs(value-b[i])<=3,`actual pixel ${a} expected ${b}`));
 async function dragUndoScenario({captureName,dwellMs=0,postDragGapMs=0}){
  const value=fixture();await start(value);const acceptedUndoBefore=await page.property('#undo','disabled');await beginDirectTrace();const r=await rect(),p={x:r.left+r.width*.35,y:r.top+r.height*.5},q={x:p.x+r.width*.12,y:p.y-r.height*.05};
  await page.evaluate(()=>{window.__directTrust=[];for(const type of ['pointerdown','pointermove','pointerup'])document.getElementById('scene-canvas').addEventListener(type,e=>window.__directTrust.push({type,trusted:e.isTrusted}));});
  await input('down',p.x,p.y);await input('move',q.x,q.y);await sleep(40);
  assert.ok(Math.abs(Number(await page.property('#position-x','value'))-47)<.1);assert.ok(Math.abs(Number(await page.property('#position-y','value'))-45)<.1);await page.visible();near(await sample(47,45),rgb(value.scene.objects[0].color));near(await sample(35,50),rgb(value.scene.background));
  await input('up',q.x,q.y);await sleep(40);assert.ok((await page.evaluate(()=>window.__directTrust)).every(e=>e.trusted));assert.equal(await page.property('#undo-move','disabled'),false);assert.equal(await page.property('#undo','disabled'),acceptedUndoBefore,'draft move must not change accepted history');
  if(captureName)await page.visualCapture(captureName);if(postDragGapMs)await sleep(postDragGapMs);await settledDirectClick('#undo-move',dwellMs);await page.hidden();assert.equal(await page.property('#position-x','value'),'35');assert.equal(await page.property('#undo-move','disabled'),true);await page.click('#redo-move');await page.hidden();assert.ok(Math.abs(Number(await page.property('#position-x','value'))-47)<.1);
  await page.click('#discard');const saved=await page.download('#export-scene','imagery-field-scene-v3.json');assert.deepEqual(saved.json,value);
 }
 await runCase('v8 trusted drag updates actual pixels before release and one move undo preserves applied scene',()=>dragUndoScenario({captureName:'v8-dragged-live-item'}));
 await runCase('v8 diagnostic fresh drag Undo without intervening screenshot',()=>dragUndoScenario({captureName:null}));
 await runCase('v8 diagnostic fresh drag Undo with single 80ms touch dwell',()=>dragUndoScenario({captureName:'v8-diagnostic-dwell-before-undo',dwellMs:80}));
 await runCase('v8 diagnostic fresh drag Undo with single tap after 600ms gap',()=>dragUndoScenario({captureName:'v8-diagnostic-gap-before-undo',postDragGapMs:600}));
 await runCase('v8 native click selects topmost item and explicit overlap cycling selects underlying item',async()=>{
  const value=fixture();value.scene.objects.push(styledObject({id:'object-2',shape:'circle',x:35,y:50,size:12}));await start(value);const r=await rect(),p={x:r.left+r.width*.35,y:r.top+r.height*.5};await input('down',p.x,p.y);await input('up',p.x,p.y);await sleep(40);
  assert.equal(await page.property('#object-select','value'),'object-2');assert.equal(await page.property('#editor-panel','hidden'),false);assert.equal(await page.property('#undo-move','disabled'),true);await page.click('#cycle-overlap');assert.equal(await page.property('#object-select','value'),'object-1');await page.visible();await page.visualCapture('v8-overlap-selection-controls');
 });
 await runCase('v8 Escape cancels captured native move and stale release never reveals',async()=>{
  await start(fixture());const r=await rect(),p={x:r.left+r.width*.35,y:r.top+r.height*.5},q={x:p.x+r.width*.1,y:p.y};await input('down',p.x,p.y);await input('move',q.x,q.y);await page.key('Escape');await page.hidden();await input('up',q.x,q.y);await page.hidden();assert.equal(await page.property('#position-x','value'),'35');assert.equal(await page.property('#undo-move','disabled'),true);
 });
 await runCase('v8 non-drag controls and focused keyboard movement stay reachable at narrow width',async()=>{
  await page.viewport(320,568);await start(fixture());await page.click('#nudge-right');assert.equal(await page.property('#position-x','value'),'36');await page.focus('#scene-canvas');await page.key('ArrowLeft');assert.equal(await page.property('#position-x','value'),'35');await page.visible();await page.noOverflow(320);
  for(const id of ['nudge-left','nudge-up','nudge-down','nudge-right','undo-move','redo-move']){await page.evaluate(id=>document.getElementById(id).scrollIntoView({block:'center'}),id);if(!await page.property('#'+id,'disabled'))await page.focus('#'+id);const result=await page.evaluate(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {width:r.width,height:r.height,top:r.top,bottom:r.bottom,hit:hit===e,viewport:innerHeight};},id);assert.ok(result.width>=44&&result.height>=44&&result.hit&&result.top>=0&&result.bottom<=result.viewport,`${id} unreachable: ${JSON.stringify(result)}`);}
  for(const id of ['cycle-overlap','undo-move','redo-move']){
   // Disabled history/overlap actions still need readable labels; do not claim
   // they can receive focus while disabled.
   if(!await page.property('#'+id,'disabled'))await page.focus('#'+id);
   const result=await page.evaluate(id=>{const e=document.getElementById(id);e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect(),scroll=document.getElementById('editor-scroll'),s=scroll.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);return {id,box:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},text:Array.from(range.getClientRects(),t=>({left:t.left,right:t.right,top:t.top,bottom:t.bottom})),visible:{left:Math.max(0,s.left+scroll.clientLeft),right:Math.min(innerWidth,s.left+scroll.clientLeft+scroll.clientWidth),top:Math.max(0,s.top+scroll.clientTop),bottom:Math.min(innerHeight,s.top+scroll.clientTop+scroll.clientHeight)},hit:[[r.left+4,r.top+4],[r.right-4,r.top+4],[r.left+4,r.bottom-4],[r.right-4,r.bottom-4]].every(([x,y])=>document.elementFromPoint(x,y)===e)};},id);
   assert.ok(result.hit&&result.box.width>=44&&result.box.height>=44&&result.box.left>=result.visible.left&&result.box.right<=result.visible.right&&result.box.top>=result.visible.top&&result.box.bottom<=result.visible.bottom,'Action clips behind inspector chrome: '+JSON.stringify(result));
   for(const text of result.text)assert.ok(text.left>=result.box.left&&text.right<=result.box.right&&text.top>=result.box.top&&text.bottom<=result.box.bottom,'Action label clips: '+JSON.stringify(result));
  }
  await page.visualCapture('v8-narrow-move-controls');await page.click('#hide-scene');await page.hidden();
 });
}
module.exports={runDirectEditorScenarios};
