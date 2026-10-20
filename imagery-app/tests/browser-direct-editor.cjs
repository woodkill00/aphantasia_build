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
 const near=(a,b)=>a.forEach((value,i)=>assert.ok(Math.abs(value-b[i])<=3,`actual pixel ${a} expected ${b}`));
 await runCase('v8 trusted drag updates actual pixels before release and one move undo preserves applied scene',async()=>{
  const value=fixture();await start(value);const r=await rect(),p={x:r.left+r.width*.35,y:r.top+r.height*.5},q={x:p.x+r.width*.12,y:p.y-r.height*.05};
  await page.evaluate(()=>{window.__directTrust=[];for(const type of ['pointerdown','pointermove','pointerup'])document.getElementById('scene-canvas').addEventListener(type,e=>window.__directTrust.push({type,trusted:e.isTrusted}));});
  await input('down',p.x,p.y);await input('move',q.x,q.y);await sleep(40);
  assert.ok(Math.abs(Number(await page.property('#position-x','value'))-47)<.1);assert.ok(Math.abs(Number(await page.property('#position-y','value'))-45)<.1);await page.visible();near(await sample(47,45),rgb(value.scene.objects[0].color));near(await sample(35,50),rgb(value.scene.background));
  await input('up',q.x,q.y);await sleep(40);assert.ok((await page.evaluate(()=>window.__directTrust)).every(e=>e.trusted));assert.equal(await page.property('#undo-move','disabled'),false);assert.equal(await page.property('#undo','disabled'),true);
  await page.visualCapture('v8-dragged-live-item');await page.click('#undo-move');await page.hidden();assert.equal(await page.property('#position-x','value'),'35');assert.equal(await page.property('#undo-move','disabled'),true);await page.click('#redo-move');await page.hidden();assert.ok(Math.abs(Number(await page.property('#position-x','value'))-47)<.1);
  await page.click('#discard');const saved=await page.download('#export-scene','imagery-field-scene-v3.json');assert.deepEqual(saved.json,value);
 });
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
  await page.visualCapture('v8-narrow-move-controls');await page.click('#hide-scene');await page.hidden();
 });
}
module.exports={runDirectEditorScenarios};
