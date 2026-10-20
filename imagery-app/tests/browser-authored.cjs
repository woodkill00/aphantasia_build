'use strict';
// Actual Chrome pixels, native controls, and synthetic data only.
const assert=require('node:assert/strict'),{setTimeout:sleep}=require('node:timers/promises');
const M=require('../src/model.js'),P=require('../src/preset-model.js'),{rgb}=require('./browser-live.cjs');
async function runAuthoredScenarios({page,runCase}){
 const start=async value=>{await page.file('authored-synthetic.json',value);await sleep(3100);await page.click('#show-scene');await page.visible();};
 await runCase('v9 authored canvas letterboxing and filled geometry effects are actual raster output',async()=>{
  const value=M.upgradeScene(M.presets()[1],{mode:'fixed',ratio:'1:1'}),o=M.defaultAuthoredObject('object-1','rectangle');o.size=12;o.geometry={height:8,rotation:0,fill:true};o.color={h:120,s:40,l:50};o.outline={enabled:true,width:1,color:{h:30,s:40,l:50}};o.shadow={enabled:true,offsetX:9,offsetY:0,blur:0,color:{h:210,s:30,l:30}};value.scene.objects=[o];await start(value);
  const data=await page.evaluate(()=>{const c=document.getElementById('scene-canvas'),r=c.getBoundingClientRect(),s=Math.min(r.width,r.height),x=(r.width-s)/2,y=(r.height-s)/2,u=s/100,ctx=c.getContext('2d');const pixel=(px,py)=>Array.from(ctx.getImageData(Math.floor(px*c.width/r.width),Math.floor(py*c.height/r.height),1,1).data).slice(0,3);return{body:pixel(x+s*.5,y+s*.5),outline:pixel(x+s*.5+6.5*u,y+s*.5),shadow:pixel(x+s*.5+9*u,y+s*.5),background:pixel(x+s*.1,y+s*.1),margin:r.width>s+2?pixel(1,r.height/2):r.height>s+2?pixel(r.width/2,1):null};});
  const near=(a,b)=>a.forEach((n,i)=>assert.ok(Math.abs(n-b[i])<=3,JSON.stringify({a,b})));near(data.body,rgb(o.color));near(data.outline,rgb(o.outline.color));near(data.shadow,rgb(o.shadow.color));near(data.background,rgb(value.scene.background));if(data.margin)assert.deepEqual(data.margin,[0,0,0]);await page.visualCapture('v9-authored-letterbox-filled-effects');
  await page.click('#apply-changes');const saved=await page.download('#export-scene','imagery-field-scene-v4.json');assert.deepEqual(saved.json,value);
 });
 await runCase('v9 authored shape controls, rotation and layer alternatives fit narrow reflow',async()=>{
  await page.viewport(320,568);await start(P.create('balanced-contours'));await page.nativeSelect('#shape','star');await page.fill('#geometry-sides','7');await page.fill('#geometry-rotation','45');await page.nativeSelect('#geometry-fill','filled');await page.noOverflow(320);
  for(const id of ['geometry-height','geometry-rotation','geometry-fill','geometry-sides','geometry-inner','layer-back','layer-front']){await page.focus('#'+id);const b=await page.evaluate(id=>{const e=document.getElementById(id);e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{w:r.width,h:r.height,left:r.left,right:r.right,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===e};},id);assert.ok(b.w>=44&&b.h>=44&&b.left>=0&&b.right<=320&&b.hit,JSON.stringify({id,b}));}
  // Inspect text ranges as well as button boxes: an in-bounds button can still
  // paint clipped labels when flex children shrink below their text width.
  for(const id of ['cycle-overlap','undo-move','redo-move','place-object','duplicate-object','layer-back','layer-front','delete-object']){
   // Disabled history/overlap actions still need readable labels; do not claim
   // they can receive focus while disabled.
   if(!await page.property('#'+id,'disabled'))await page.focus('#'+id);
   const result=await page.evaluate(id=>{const e=document.getElementById(id);e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect(),scroll=document.getElementById('editor-scroll'),s=scroll.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);return {id,box:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},text:Array.from(range.getClientRects(),t=>({left:t.left,right:t.right,top:t.top,bottom:t.bottom})),visible:{left:Math.max(0,s.left+scroll.clientLeft),right:Math.min(innerWidth,s.left+scroll.clientLeft+scroll.clientWidth),top:Math.max(0,s.top+scroll.clientTop),bottom:Math.min(innerHeight,s.top+scroll.clientTop+scroll.clientHeight)},hit:[[r.left+4,r.top+4],[r.right-4,r.top+4],[r.left+4,r.bottom-4],[r.right-4,r.bottom-4]].every(([x,y])=>document.elementFromPoint(x,y)===e)};},id);
   assert.ok(result.hit&&result.box.width>=44&&result.box.height>=44&&result.box.left>=result.visible.left&&result.box.right<=result.visible.right&&result.box.top>=result.visible.top&&result.box.bottom<=result.visible.bottom,'Action clips behind inspector chrome: '+JSON.stringify(result));
   for(const text of result.text)assert.ok(text.left>=result.box.left&&text.right<=result.box.right&&text.top>=result.box.top&&text.bottom<=result.box.bottom,'Action label clips: '+JSON.stringify(result));
  }
  await page.focus('#geometry-height');
  const focused=await page.evaluate(()=>{const e=document.getElementById('geometry-height'),label=document.querySelector('label[for="geometry-height"]');e.parentElement.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect(),l=label.getBoundingClientRect(),scroll=document.getElementById('editor-scroll'),s=scroll.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(label);const t=range.getBoundingClientRect(),rect=q=>({left:q.left,right:q.right,top:q.top,bottom:q.bottom}),corners=(node,q)=>[[q.left+4,q.top+4],[q.right-4,q.top+4],[q.left+4,q.bottom-4],[q.right-4,q.bottom-4]].every(([x,y])=>document.elementFromPoint(x,y)===node);return {focused:document.activeElement===e,control:rect(r),label:rect(l),text:rect(t),visible:{left:Math.max(0,s.left+scroll.clientLeft),right:Math.min(innerWidth,s.left+scroll.clientLeft+scroll.clientWidth),top:Math.max(0,s.top+scroll.clientTop),bottom:Math.min(innerHeight,s.top+scroll.clientTop+scroll.clientHeight)},controlHit:corners(e,r),labelHit:corners(label,l)};});
  assert.ok(focused.focused&&focused.controlHit&&focused.labelHit,JSON.stringify(focused));
  for(const box of [focused.control,focused.label])assert.ok(box.left>=focused.visible.left&&box.right<=focused.visible.right&&box.top>=focused.visible.top&&box.bottom<=focused.visible.bottom,'Focused geometry row clips behind inspector chrome: '+JSON.stringify(focused));
  assert.ok(focused.text.left>=focused.label.left&&focused.text.right<=focused.label.right&&focused.text.top>=focused.label.top&&focused.text.bottom<=focused.label.bottom,JSON.stringify(focused));
  await page.visualCapture('v9-narrow-authored-geometry-controls');
  // A taller narrow viewport captures the complete wrapped layer group; all
  // individual controls above were already checked at the original320×568.
  await page.viewport(320,760);await page.focus('#layer-front');
  const group=await page.evaluate(()=>{const e=document.getElementById('layer-front').parentElement;e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect(),scroll=document.getElementById('editor-scroll'),s=scroll.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,visible:{left:Math.max(0,s.left+scroll.clientLeft),right:Math.min(innerWidth,s.left+scroll.clientLeft+scroll.clientWidth),top:Math.max(0,s.top+scroll.clientTop),bottom:Math.min(innerHeight,s.top+scroll.clientTop+scroll.clientHeight)},buttons:Array.from(e.querySelectorAll('button'),b=>{const q=b.getBoundingClientRect();return {id:b.id,hit:document.elementFromPoint(q.left+q.width/2,q.top+q.height/2)===b};})};});
  assert.ok(group.top>=group.visible.top&&group.bottom<=group.visible.bottom&&group.left>=group.visible.left&&group.right<=group.visible.right&&group.buttons.every(b=>b.hit),JSON.stringify(group));
  await page.visualCapture('v9-narrow-wrapped-layer-controls');
await page.click('#hide-scene');await page.hidden();await page.nativeSelect('#canvas-ratio','16:9');await page.hidden();await page.click('#apply-changes');const saved=await page.download('#export-scene','imagery-field-scene-v4.json');assert.equal(saved.json.scene.canvas.ratio,'16:9');assert.equal(saved.json.scene.objects[0].geometry.sides,7);
 });
 await runCase('v9 authored snapshot capture preserves format and does not autoplay',async()=>{
  await start(P.create('mixed-steady-pulse'));await page.click('#apply-changes');await page.click('#capture-add');await page.hidden();assert.match(await page.property('#status','textContent'),/captured/);const saved=await page.download('#sequence-export','imagery-field-sequence-v3.json');assert.equal(saved.json.version,3);assert.deepEqual(saved.json.sequence.steps[0].canvas,saved.json.sequence.canvas);await page.visualCapture('v9-authored-sequence-capture');
 });
}
module.exports={runAuthoredScenarios};
