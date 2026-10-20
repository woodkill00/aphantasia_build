'use strict';
// Real-Chrome sequence checks. Controlled clock/RAF tests are labeled separately
// from real scheduling. Every fixture is synthetic; no browser safety flags change.
const assert=require('node:assert/strict');
const {setTimeout:sleep}=require('node:timers/promises');
const {sequence,shortSequence,clone}=require('./sequence-fixtures.cjs');
function rgb({h,s,l}){const a=s/100*Math.min(l/100,1-l/100);return [0,8,4].map(n=>{const k=(n+h/30)%12;return Math.round(255*(l/100-a*Math.max(-1,Math.min(k-3,9-k,1))))});}
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
async function runSequenceScenarios({page,runCase}){
 const media=value=>page.motionPreference(value);
 const open=value=>page.file('synthetic-timeline.json',value,true,'#sequence-import');
 async function ready(value=sequence()){await media('no-preference');await open(value);await sleep(3100);await page.hidden();}
 async function controlled(){await page.evaluate(()=>{
   window.__seqTime=performance.now();window.__seqFrames=new Map();window.__seqCancelled=[];window.__seqId=0;window.__seqMaxPending=0;window.__seqComposites=[];
   performance.now=()=>window.__seqTime;
   window.requestAnimationFrame=fn=>{const id=++window.__seqId;window.__seqFrames.set(id,fn);window.__seqMaxPending=Math.max(window.__seqMaxPending,window.__seqFrames.size);return id};
   window.cancelAnimationFrame=id=>{if(window.__seqFrames.has(id))window.__seqCancelled.push(window.__seqFrames.get(id));window.__seqFrames.delete(id)};
   const c=document.getElementById('scene-canvas'),ctx=c.getContext('2d'),draw=ctx.drawImage;
   ctx.drawImage=function(source,...args){window.__seqComposites.push({alpha:this.globalAlpha,operation:this.globalCompositeOperation,mainPixels:c.width*c.height,sourcePixels:source.width*source.height,sourceWidth:source.width,sourceHeight:source.height,mainWidth:c.width,mainHeight:c.height});return draw.call(this,source,...args)};
 });}
 const advance=delta=>page.evaluate(delta=>{window.__seqTime+=delta;const callbacks=[...window.__seqFrames.values()];window.__seqFrames.clear();for(const fn of callbacks)fn(window.__seqTime);return {pending:window.__seqFrames.size,maxPending:window.__seqMaxPending,composites:window.__seqComposites};},delta);
 async function pixels(value,from,to=null,alpha=0){
   const points=await page.evaluate(value=>{const c=document.getElementById('scene-canvas'),ctx=c.getContext('2d'),r=c.getBoundingClientRect(),u=Math.min(r.width,r.height)/100;const sample=(x,y)=>Array.from(ctx.getImageData(Math.floor(x*c.width/r.width),Math.floor(y*c.height/r.height),1,1).data).slice(0,3);return {background:sample(r.width*.1,r.height*.1),objects:value.sequence.steps.map(step=>{const o=step.objects[0];return sample(r.width*o.x/100,r.height*o.y/100-o.size*u/2)}),alpha:ctx.globalAlpha,operation:ctx.globalCompositeOperation};},value);
   const background=rgb(value.sequence.background);background.forEach((v,i)=>assert.ok(Math.abs(points.background[i]-v)<=2,'shared background changed during presentation'));
   value.sequence.steps.forEach((step,index)=>{const a=index===from?rgb(step.objects[0].color):background,b=index===to?rgb(step.objects[0].color):background,want=to===null?a:mix(a,b,alpha);points.objects[index].forEach((v,i)=>assert.ok(Math.abs(v-want[i])<=3,`controlled native pixel differs at step${index}, ${from}->${to} alpha${alpha}: ${JSON.stringify(points)} expected${JSON.stringify(want)}`));});assert.equal(points.alpha,1);assert.equal(points.operation,'source-over');
 }
 await runCase('v4 separate sequence imports, exact disk export and malformed-content rejection',async()=>{
   const original=await page.download('#export-scene','imagery-field-scene-v2.json');await open(sequence());await page.hidden();const exported=await page.download('#sequence-export','imagery-field-sequence-v1.json');assert.deepEqual(exported.json,sequence());
   for(const raw of ['{',JSON.stringify({...sequence(),loop:true}),JSON.stringify(sequence()).replace('"holdMs":3000','"holdMs":1000,"holdMs":3000'),JSON.stringify(sequence({steps:[]})),JSON.stringify({...sequence(),notes:'synthetic'}),' '.repeat(1048577)]){await page.file('invalid-sequence.json',raw,true,'#sequence-import');await page.hidden();assert.match(await page.property('#status','textContent'),/unchanged/i);assert.deepEqual((await page.download('#sequence-export','imagery-field-sequence-v1.json')).json,sequence());}
   await page.click('#workspace-scene');assert.deepEqual((await page.download('#export-scene','imagery-field-scene-v2.json')).json,original.json);
 });
 await runCase('v4 controlled-clock native pixels at all11s boundaries and last-painted Pause',async()=>{
   try{const value=sequence();await ready(value);await controlled();await page.click('#sequence-play');await page.visible();await pixels(value,0);let elapsed=0;
    for(const [time,from,to,alpha]of [[2999,0,null,0],[3000,0,1,0],[3475,0,1,.475]]){const state=await advance(time-elapsed);elapsed=time;assert.equal(state.pending,1);await pixels(value,from,to,alpha)}
    await page.evaluate(()=>{window.__seqTime+=25});await page.click('#sequence-pause');await page.visible();await pixels(value,0,1,.475);assert.equal(await page.evaluate(()=>window.__seqFrames.size),0);await advance(90000);await pixels(value,0,1,.475);await page.click('#sequence-resume');await pixels(value,0,1,.475);
    for(const [time,from,to,alpha]of [[3500,0,1,.5],[3999,0,1,.999],[4000,1,null,0],[6999,1,null,0],[7000,1,2,0],[7500,1,2,.5],[8000,2,null,0],[10999,2,null,0]]){await advance(time-elapsed);elapsed=time;await pixels(value,from,to,alpha);await page.visible();}
    await page.focus('#sequence-pause');await advance(1);await page.hidden();assert.equal(await page.evaluate(()=>document.activeElement.id),'sequence-stop');assert.equal(await page.evaluate(()=>window.__seqFrames.size),0);assert.equal(await page.evaluate(()=>window.__seqMaxPending),1);await advance(99999);await page.hidden();
   }finally{await media('reduce')}
 });
 await runCase('v4 controlled-clock direct cuts and overlapping12plus12 composites',async()=>{
   try{const value=shortSequence();value.sequence.steps.forEach(step=>{step.objects[0].shape='square';step.objects[0].x=50;step.objects[0].y=50;step.objects=Array.from({length:12},(_,i)=>({...clone(step.objects[0]),id:'object-'+(i+1)}))});await ready(value);await controlled();await page.click('#sequence-play');await advance(1250);
    const result=await page.evaluate(()=>{const c=document.getElementById('scene-canvas'),r=c.getBoundingClientRect(),u=Math.min(r.width,r.height)/100,ctx=c.getContext('2d');return {pixel:Array.from(ctx.getImageData(Math.floor(c.width*.5),Math.floor((r.height*.5-5*u)*c.height/r.height),1,1).data).slice(0,3),composite:window.__seqComposites.at(-1)}});
    const expected=mix(rgb(value.sequence.steps[0].objects[0].color),rgb(value.sequence.steps[1].objects[0].color),.5);result.pixel.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<=3));assert.equal(result.composite.alpha,.5);assert.ok(result.composite.mainPixels+result.composite.sourcePixels<=8388608);assert.ok(result.composite.mainWidth<=4096&&result.composite.mainHeight<=4096&&result.composite.sourceWidth<=4096&&result.composite.sourceHeight<=4096);
    await page.click('#sequence-stop');const cut=shortSequence();cut.sequence.steps[0].transitionMs=0;await open(cut);await advance(3100);await page.click('#sequence-play');const count=await page.evaluate(()=>window.__seqComposites.length);await advance(1000);await pixels(cut,1);assert.equal(await page.evaluate(()=>window.__seqComposites.length),count);await advance(1000);await page.hidden();
   }finally{await media('reduce')}
 });
 await runCase('v4 real scheduling Play Pause Resume Stop and one-pass completion',async()=>{
   try{await ready(shortSequence());await page.click('#sequence-play');await page.visible();await sleep(350);await page.click('#sequence-pause');await page.visible();const before=await page.evaluate(()=>document.getElementById('scene-canvas').toDataURL());await sleep(400);assert.equal(await page.evaluate(()=>document.getElementById('scene-canvas').toDataURL()),before,'real paused pixels changed');await page.click('#sequence-resume');await page.visible();await sleep(2600);await page.hidden();assert.match(await page.property('#status','textContent'),/finished|reset/i);await sleep(350);await page.hidden();
   }finally{await media('reduce')}
 });
 await runCase('v4 controlled native stale RAF, mode guard and lifecycle cancellation',async()=>{
   try{await ready();await controlled();await page.click('#sequence-play');await advance(3500);await page.evaluate(()=>{window.__staleSequenceFrame=[...window.__seqFrames.values()][0]});await page.click('#sequence-pause');assert.equal(await page.property('#sequence-show','disabled'),true);await page.focus('#sequence-resume');await page.key('Escape');await page.hidden();assert.equal(await page.evaluate(()=>document.activeElement.id),'sequence-stop');await page.evaluate(()=>window.__staleSequenceFrame(999999));await page.hidden();assert.equal(await page.evaluate(()=>window.__seqFrames.size),0);
    await advance(3100);await page.click('#sequence-show');await page.visible();await page.click('#sequence-play');await page.hidden();await page.click('#sequence-play');await page.hidden();await advance(3100);await page.click('#sequence-play');await page.visible();
    await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','sequence interruption entry');assert.equal(await page.evaluate(()=>window.__seqFrames.size),0);assert.equal(await page.property('#sequence-play','disabled'),true);await advance(3100);await page.click('#fullscreen-show');await page.visible();await page.fullscreenAfter(()=>page.key('Escape'),null,'sequence manual native Escape');await page.hidden();
   }finally{await media('reduce')}
 });
 await runCase('v4 reduced-motion manual route and native media-change concealment',async()=>{
   await media('reduce');await open(sequence());assert.equal(await page.property('#sequence-play','disabled'),true);await sleep(3100);await page.click('#sequence-show');await page.visible();await page.click('#sequence-next');await page.hidden();await media('no-preference');await sleep(3100);await page.click('#sequence-play');await page.visible();await media('reduce');await page.hidden();await sleep(200);await page.hidden();assert.equal(await page.property('#sequence-play','disabled'),true);
 });
 await runCase('v4 fixed editor actions reserve focus space and Stop stays reachable on short layouts',async()=>{
   for(const [width,height]of [[390,844],[844,390],[320,568]]){await page.viewport(width,height);await page.noOverflow(width);await page.click('#workspace-scene');
    for(const selector of ['#scene-name','#object-select','#object-hue','#background-lightness','#apply-changes','#capture-add']){await page.focus(selector);const m=await page.evaluate(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2),scroll=document.getElementById('editor-scroll').getBoundingClientRect(),actions=document.getElementById('editor-actions').getBoundingClientRect();return {focused:document.activeElement===e,hit:hit===e||e.contains(hit),top:r.top,bottom:r.bottom,scrollTop:scroll.top,scrollBottom:scroll.bottom,actionsTop:actions.top,inActions:document.getElementById('editor-actions').contains(e),viewport:innerHeight}},selector);assert.ok(m.focused&&m.hit,`focus occluded${width}x${height} ${selector}: ${JSON.stringify(m)}`);if(!m.inActions)assert.ok(m.top>=m.scrollTop-1&&m.bottom<=m.scrollBottom+1&&m.bottom<=m.actionsTop+1,`scrolling field behind fixed actions: ${selector}`);}
    await page.click('#workspace-sequence');await page.click('#sequence-example');for(const selector of ['#sequence-name','#sequence-hold','#sequence-transition','#sequence-export','#capture-add']){await page.focus(selector);const hit=await page.evaluate(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {focused:document.activeElement===e,hit:h===e||e.contains(h)}},selector);assert.ok(hit.focused&&hit.hit,`sequence focus obscured${width}x${height}: ${selector}`);}
   }
   await page.viewport(320,180);await page.noOverflow(320);for(const id of ['sequence-stop','sequence-show']){const m=await page.evaluate(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,hit:hit===e||e.contains(hit),widthLimit:innerWidth,heightLimit:innerHeight}},id);assert.ok(m.left>=0&&m.top>=0&&m.right<=m.widthLimit&&m.bottom<=m.heightLimit&&m.width>=44&&m.height>=44&&m.hit,`short sequence control unreachable ${id}: ${JSON.stringify(m)}`);}
   await page.focus('#skip-controls');await page.key('Enter');await page.hidden();assert.equal(await page.property('#scene-panel','hidden'),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'controls');
 });
}
module.exports={runSequenceScenarios,rgb,mix};
