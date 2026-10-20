'use strict';
// Real browser only: trusted manual inputs and independent raster color oracles.
const assert=require('node:assert/strict');
const {setTimeout:sleep}=require('node:timers/promises');
const {scene}=require('./fixtures.cjs');
const rgb=({h,s,l})=>{const a=s/100*Math.min(l/100,1-l/100);return [0,8,4].map(n=>{const k=(n+h/30)%12;return Math.round(255*(l/100-a*Math.max(-1,Math.min(k-3,9-k,1))))})};
const fixture=()=>scene({name:'Synthetic live draft',background:{h:210,s:25,l:20},objects:[{id:'object-1',shape:'pixel',x:35,y:50,size:6,color:{h:120,s:40,l:50}}]});
async function runLiveScenarios({page,runCase}){
 async function layout(){const m=await page.evaluate(()=>{const c=document.getElementById('scene-canvas'),p=document.getElementById('editor-panel'),r=c.getBoundingClientRect(),e=p.getBoundingClientRect();const overlap=Math.max(0,Math.min(r.right,e.right)-Math.max(r.left,e.left))*Math.max(0,Math.min(r.bottom,e.bottom)-Math.max(r.top,e.top));return {width:r.width,height:r.height,left:r.left,top:r.top,right:r.right,bottom:r.bottom,overlap,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===c,viewport:{width:innerWidth,height:innerHeight}}});assert.ok(m.width>30&&m.height>30&&m.left>=0&&m.top>=0&&m.right<=m.viewport.width+1&&m.bottom<=m.viewport.height+1&&m.overlap<=1&&m.hit,'live canvas must be visibly separate from editor: '+JSON.stringify(m));return m;}
 async function start(){await sleep(3100);await page.click('#show-scene');await page.visible();await layout();}
 async function pixels(point,expected){const actual=await page.evaluate(p=>{const c=document.getElementById('scene-canvas');return Array.from(c.getContext('2d').getImageData(Math.floor(c.width*p[0]/100),Math.floor(c.height*p[1]/100),1,1).data).slice(0,3)},point);rgb(expected).forEach((v,i)=>assert.ok(Math.abs(actual[i]-v)<=2,`live canvas pixel ${actual} != independent expected ${rgb(expected)}`));}
 async function bump(id){await page.focus('#'+id);await page.evaluate(id=>{window.__liveInput=[];document.getElementById(id).addEventListener('input',e=>window.__liveInput.push(e.isTrusted),{once:true})},id);await page.key('ArrowRight');assert.deepEqual(await page.evaluate(()=>window.__liveInput),[true]);await page.visible();await layout();}
 await runCase('v5 live draft starts without Apply and all six color controls repaint actual pixels',async()=>{
  const value=fixture();await page.file('live-color.json',value);await page.fill('#scene-name','Unapplied live name');await page.hidden();await start();
  for(const [prefix,point,color]of [['object',[35,50],value.scene.objects[0].color],['background',[10,10],value.scene.background]]){
   for(const [name,key]of [['hue','h'],['saturation','s'],['lightness','l']]){await bump(prefix+'-'+name);color[key]++;await pixels(point,color);assert.equal(await page.property('#draft-label','textContent'),'Live draft');}
  }
  await page.fill('#position-x','60');await page.visible();value.scene.objects[0].x=60;await pixels([60,50],value.scene.objects[0].color);await pixels([35,50],value.scene.background);
  await page.visualCapture('v5-live-colors-and-moved-item');
  const before=page.downloadsStarted.size;await page.click('#export-scene');assert.equal(page.downloadsStarted.size,before,'unapplied live draft must not export as accepted');assert.match(await page.property('#status','textContent'),/apply or discard.*before downloading/i);await page.visible();await pixels([60,50],value.scene.objects[0].color);
  await page.click('#apply-changes');value.scene.name='Unapplied live name';const saved=await page.download('#export-scene','imagery-field-scene-v2.json');assert.deepEqual(saved.json,value);
  console.log('LIVE_PIXEL_EVIDENCE '+JSON.stringify({device:page.device.name,channels:6,source:'trusted keyboard input; actual canvas pixel samples',appliedOnlyAfterPreview:true}));
 });
 await runCase('v5 live object edits and selection preserve preview while Discard restores applied bytes',async()=>{
  const original=fixture();await page.file('live-objects.json',original);await start();await page.nativeSelect('#add-shape','square');await page.visible();await page.click('#add-object');await page.visible();assert.equal(await page.property('#object-count','textContent'),'2 / 12');
  await page.nativeSelect('#object-select','object-1');await page.visible();await page.nativeSelect('#shape','dot');await page.visible();await page.focus('#size');await page.key('ArrowUp');await page.visible();
  await page.click('#delete-object');await page.visible();assert.equal(await page.property('#object-count','textContent'),'1 / 12');await page.nativeSelect('#preset','4');await page.visible();
  await page.visualCapture('v5-live-preset-composition');await page.click('#discard');await page.hidden();const saved=await page.download('#export-scene','imagery-field-scene-v2.json');assert.deepEqual(saved.json,original);
 });
 await runCase('v5 live portrait and short landscape keep canvas and focused controls separately reachable',async()=>{
  await page.file('live-responsive.json',fixture());
  for(const [width,height]of [[320,568],[844,390]]){await page.viewport(width,height);await page.hidden();await start();await page.noOverflow(width);await page.focus('#object-hue');const focused=await page.evaluate(()=>{const e=document.getElementById('object-hue'),r=e.getBoundingClientRect(),p=document.getElementById('editor-scroll').getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {focus:document.activeElement===e,hit:hit===e,top:r.top,bottom:r.bottom,height:innerHeight,scrollTop:p.top,scrollBottom:p.bottom,scrollHeight:p.height}});assert.ok(focused.focus&&focused.hit&&focused.top>=0&&focused.bottom<=focused.height&&focused.top>=focused.scrollTop-1&&focused.bottom<=focused.scrollBottom+1&&focused.scrollHeight>=80,'focused live hue must be reachable: '+JSON.stringify(focused));await page.key('ArrowRight');await page.visible();await layout();await page.visualCapture('v5-live-layout-'+width+'x'+height);await page.click('#hide-scene');await page.hidden();}
 });
 await runCase('v5 invalid edit and explicit Hide end live mode without correction or delayed resurrection',async()=>{
  await page.file('live-invalidation.json',fixture());await start();await page.fill('#position-x','0');await page.hidden();await page.fill('#position-x','40');await page.hidden();await page.focus('#object-hue');await page.key('ArrowRight');await page.hidden();await sleep(100);await page.hidden();
  await start();await pixels([40,50],{h:121,s:40,l:50});await page.click('#hide-scene');await page.hidden();await page.focus('#background-hue');await page.key('ArrowRight');await page.hidden();await start();await page.key('Escape');await page.hidden();await page.focus('#object-saturation');await page.key('ArrowRight');await page.hidden();
  await page.click('#discard');await page.hidden();const exported=await page.download('#export-scene','imagery-field-scene-v2.json');assert.deepEqual(exported.json,fixture());
 });
}
module.exports={runLiveScenarios,rgb};
