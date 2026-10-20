'use strict';
// Genuine controls and independent DOM/content-rectangle checks. Synthetic data only.
const assert = require('node:assert/strict');
const {setTimeout: sleep} = require('node:timers/promises');
const M = require('../src/model.js');
const {scene, styledObject} = require('./fixtures.cjs');
const {rgb}=require('./browser-live.cjs');
const {beginInputTrace,assertRapidReleaseEvidence}=require('./browser-direct-editor.cjs');
async function runEditorAidsScenarios({page, runCase}) {
  const fixture = () => scene({name:'Synthetic editor aids',background:{h:4,s:60,l:4},objects:[styledObject({shape:'pixel',x:35,y:45,size:6})]});
  const aidLabel = 'label[for="show-editor-aids"]';
  const centerLabel = 'label[for="editor-center-guides"]';
  async function load(value=fixture()) {await page.file('synthetic-editor-aids.json',value);await page.hidden();}
  async function live() {await sleep(M.REVEAL_GAP_MS+100);await page.click('#show-scene');await page.visible();}
  async function rasterHash() {
    return page.evaluate(async()=>{const c=document.getElementById('scene-canvas'),bytes=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');});
  }
  async function absent() {
    const v=await page.evaluate(()=>{const e=document.getElementById('editor-aids-overlay');return {hidden:e.hidden,display:getComputedStyle(e).display,lines:e.querySelectorAll('.editor-aid-line').length,checked:document.getElementById('show-editor-aids').checked};});
    assert.equal(v.hidden,true);assert.equal(v.display,'none');assert.equal(v.lines,0);assert.equal(v.checked,false);
  }
  async function geometry(ratio=null, step=5, centers=false) {
    const v=await page.evaluate(()=>{const c=document.getElementById('scene-canvas').getBoundingClientRect(),o=document.getElementById('editor-aids-overlay'),e=document.getElementById('editor-aids-content'),r=e?.getBoundingClientRect();const box=b=>({left:b.left,top:b.top,width:b.width,height:b.height,right:b.right,bottom:b.bottom});return {canvas:box(c),content:r?box(r):null,hidden:o.hidden,aria:o.getAttribute('aria-hidden'),nodes:o.querySelectorAll('*').length+1,pointer:getComputedStyle(o).pointerEvents,paintedX:o.dataset.paintedX,paintedY:o.dataset.paintedY,tabStops:Array.from(o.querySelectorAll('*')).filter(x=>x.tabIndex>=0).length,lines:Array.from(o.querySelectorAll('.editor-aid-line'),x=>({kind:x.dataset.kind,axis:x.dataset.axis,pointer:getComputedStyle(x).pointerEvents,box:box(x.getBoundingClientRect())}))};});
    assert.equal(v.hidden,false);assert.equal(v.aria,'true');assert.equal(v.pointer,'none');assert.equal(v.tabStops,0);assert.ok(v.nodes<=230);assert.ok(v.content);
    let width=v.canvas.width,height=v.canvas.height;
    if(ratio){const [a,b]=ratio.split(':').map(Number),scale=Math.min(width/a,height/b);width=a*scale;height=b*scale;}
    const expected={left:v.canvas.left+(v.canvas.width-width)/2,top:v.canvas.top+(v.canvas.height-height)/2,width,height};
    for(const key of ['left','top','width','height'])assert.ok(Math.abs(v.content[key]-expected[key])<1,JSON.stringify({key,v,expected}));
    for(const axis of ['x','y']){
      const length=axis==='x'?width:height,interval=step*Math.max(1,Math.ceil(8/(length*step/100))),positions=[];
      for(let n=interval;n<100;n+=interval)positions.push(length*n/100);
      assert.equal(Number(axis==='x'?v.paintedX:v.paintedY),interval);
      const lines=v.lines.filter(x=>x.axis===axis&&x.kind==='grid');assert.equal(lines.length,positions.length);
      lines.forEach((line,i)=>{assert.equal(line.pointer,'none');const at=axis==='x'?line.box.left-v.content.left:line.box.top-v.content.top;assert.ok(Math.abs(at-positions[i])<1,JSON.stringify({axis,i,at,expected:positions[i]}));assert.ok(line.box.left>=v.content.left-1&&line.box.top>=v.content.top-1&&line.box.right<=v.content.right+1&&line.box.bottom<=v.content.bottom+1,'No line in letterbox: '+JSON.stringify(line));});
      const middle=v.lines.filter(x=>x.axis===axis&&x.kind==='center');assert.equal(middle.length,centers?1:0);if(centers){const at=axis==='x'?middle[0].box.left-v.content.left:middle[0].box.top-v.content.top;assert.ok(Math.abs(at-length/2)<1);}
    }
    return v;
  }
  async function wholeControl(id,label=false) {
    const selector=label?'label[for="'+id+'"]':'#'+id;
    await page.focus('#'+id);
    const m=await page.evaluate((selector,id)=>{const e=document.querySelector(selector);e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect(),s=document.getElementById('editor-scroll'),b=s.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);return {focused:document.activeElement.id===id,box:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},aperture:{left:Math.max(0,b.left+s.clientLeft),right:Math.min(innerWidth,b.left+s.clientLeft+s.clientWidth),top:Math.max(0,b.top+s.clientTop),bottom:Math.min(innerHeight,b.top+s.clientTop+s.clientHeight)},text:Array.from(range.getClientRects(),x=>({left:x.left,right:x.right,top:x.top,bottom:x.bottom})),hit:[[r.left+3,r.top+3],[r.right-3,r.top+3],[r.left+3,r.bottom-3],[r.right-3,r.bottom-3],[r.left+r.width/2,r.top+r.height/2]].every(([x,y])=>{const h=document.elementFromPoint(x,y);return h===e||e.contains(h);})};},selector,id);
    const b=m.box,a=m.aperture;assert.ok(m.focused&&m.hit&&b.width>=44&&b.height>=44&&b.left>=a.left&&b.right<=a.right&&b.top>=a.top&&b.bottom<=a.bottom,JSON.stringify(m));for(const t of m.text)assert.ok(t.left>=b.left-1&&t.right<=b.right+1&&t.top>=b.top-1&&t.bottom<=b.bottom+1,JSON.stringify(m));
  }
  await runCase('v11 opt-in aids preserve actual canvas bytes, accepted exports and independent snap',async()=>{
    const value=fixture();await load(value);await absent();assert.equal(await page.property('#editor-grid-step','value'),'5');assert.equal(await page.property('#editor-center-guides','checked'),false);
    await live();const hash=await rasterHash(),undo=await page.property('#undo','disabled'),move=await page.property('#undo-move','disabled');
    await page.evaluate(()=>{window.__aidTrusted=[];document.getElementById('show-editor-aids').addEventListener('change',e=>window.__aidTrusted.push(e.isTrusted));});
    await page.focus('#show-editor-aids');const frame=await page.evaluate(()=>{const r=document.getElementById('scene-canvas').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scrollX,scrollY,focus:document.activeElement.id};});await page.key(' ');await page.visible();await geometry();assert.deepEqual(await page.evaluate(()=>{const r=document.getElementById('scene-canvas').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scrollX,scrollY,focus:document.activeElement.id};}),frame);assert.equal(await rasterHash(),hash);assert.deepEqual(await page.evaluate(()=>window.__aidTrusted),[true]);
    assert.equal(await page.property('#snap-step','value'),'0');assert.equal(await page.property('#undo','disabled'),undo);assert.equal(await page.property('#undo-move','disabled'),move);assert.equal(await page.property('#draft-label','textContent'),'Applied');
    await page.visualCapture('v11-opt-in-grid-live-canvas');await page.click(centerLabel);await geometry(null,5,true);assert.equal(await rasterHash(),hash);await page.visualCapture('v11-grid-and-center-guides');
    await page.click(aidLabel);await absent();await page.visible();assert.equal(await rasterHash(),hash);await page.visualCapture('v11-clean-canvas-aids-off-comparison');
    const saved=await page.download('#export-scene','imagery-field-scene-v3.json');assert.deepEqual(saved.json,value);await absent();
  });
  await runCase('v11 guides follow every authored content rectangle and disclose narrow grid thinning',async()=>{
    for(const ratio of ['1:1','4:3','3:4','16:9','9:16']){
      await load(M.upgradeScene(fixture(),{mode:'fixed',ratio}));await page.nativeSelect('#editor-grid-step','1');await live();const hash=await rasterHash();await page.click(aidLabel);const v=await geometry(ratio,1,false);assert.equal(await rasterHash(),hash);assert.match(await page.property('#editor-aids-status','textContent'),/paint|interval|spacing/i);assert.ok(Number(v.paintedX)>=1&&Number(v.paintedY)>=1);await page.visualCapture('v11-grid-ratio-'+ratio.replace(':','x'));await page.click('#hide-scene');await absent();
    }
  });
  await runCase('v11 hidden preferences, editor closure and explicit resume never rearm aids',async()=>{
    await load();await page.nativeSelect('#editor-grid-step','10');await page.click(centerLabel);await absent();await page.hidden();await live();await absent();await page.click(aidLabel);await geometry(null,10,true);
    await page.click('#editor-toggle');await absent();await page.visible();await page.click('#editor-toggle');await absent();await page.visible();await page.click(aidLabel);await geometry(null,10,true);await page.key('Escape');await absent();await page.hidden();await live();await absent();await page.visualCapture('v11-explicit-resume-aids-remain-off');
  });
  await runCase('v11 fullscreen excludes all editor aids and native Escape cannot restore them',async()=>{
    await load();await live();await page.click(aidLabel);await geometry();await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','aids fullscreen request');await absent();await page.hidden();await sleep(M.REVEAL_GAP_MS+100);await page.click('#fullscreen-show');await page.visible();await absent();
    const tabs=await page.evaluate(()=>Array.from(document.querySelectorAll('#stage-root *')).filter(e=>!e.hidden&&!e.disabled&&e.tabIndex>=0&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[inert],[hidden]')).map(e=>e.id));assert.ok(!tabs.some(x=>x.includes('aid')||x.includes('grid')||x.includes('guide')));await page.visualCapture('v11-fullscreen-without-editor-aids');await page.fullscreenAfter(()=>page.key('Escape'),null,'native Escape exits aid-free fullscreen');await absent();await page.hidden();
  });
  await runCase('v11 invalid edits, import initiation and resize synchronously revoke aid visibility',async()=>{
    await load();await live();await page.click(aidLabel);await page.fill('#position-x','');await page.hidden();await absent();await page.fill('#position-x','35');await absent();await page.hidden();await live();await absent();await page.click(aidLabel);await page.file('invalid-aids-scene.json','{}');await page.hidden();await absent();await live();await page.click(aidLabel);await page.viewport(640,360);await page.hidden();await absent();await page.visualCapture('v11-short-resize-keeps-aids-hidden');
  });
  await runCase('v11 aid-affected views cannot attach stale clean provenance and clean explicit viewing can recover',async()=>{
    await load();await page.click('#journal-container summary');await page.click('#journal-enable');await page.click('#journal-track-display');await live();await sleep(100);await page.click('#hide-scene');
    for(let i=0;i<100&&!/ready to attach/.test(await page.property('#journal-tracking-status','textContent'));i++)await sleep(25);
    assert.match(await page.property('#journal-tracking-status','textContent'),/ready to attach/);await live();await page.click(aidLabel);await page.click(aidLabel);await absent();await page.click('#hide-scene');await sleep(100);
    await page.click('#journal-add');await page.click('#journal-include-entry-1');await page.click('#journal-preview');let record=JSON.parse(await page.property('#journal-preview-text','textContent')).entries[0].reflection;assert.deepEqual(record.scene,{status:'unavailable'});assert.deepEqual(record.exposure,{status:'unavailable'});await page.focus('#journal-preview-text');await page.visualCapture('v11-aid-affected-provenance-unavailable');
    await live();await sleep(100);await page.click('#hide-scene');for(let i=0;i<100&&!/ready to attach/.test(await page.property('#journal-tracking-status','textContent'));i++)await sleep(25);assert.match(await page.property('#journal-tracking-status','textContent'),/ready to attach/);
    await page.click('#journal-add');await page.click('#journal-include-entry-1');await page.click('#journal-include-entry-2');await page.click('#journal-preview');record=JSON.parse(await page.property('#journal-preview-text','textContent')).entries[0].reflection;assert.equal(record.scene.status,'available');assert.equal(record.exposure.status,'available');await page.focus('#journal-preview-text');await page.visualCapture('v11-fresh-clean-view-provenance-recovered');
  });
  await runCase('v11 aid controls retain complete focused labels at narrow and short viewports',async()=>{
    for(const [width,height] of [[320,760],[640,360],[320,280]]){
      await page.viewport(width,height);await load();await live();for(const [id,label] of [['show-editor-aids',true],['editor-grid-step',false],['editor-center-guides',true]])await wholeControl(id,label);await page.noOverflow(width);await page.visualCapture('v11-aid-controls-'+width+'x'+height);
      await page.click('#hide-scene');await absent();
    }
    await page.viewport(320,760);await page.send('Emulation.setEmulatedMedia',{features:[{name:'forced-colors',value:'active'}]});await load();await live();await page.click(aidLabel);await geometry();const forced=await page.evaluate(()=>{const line=document.querySelector('.editor-aid-line'),mark=getComputedStyle(line);return {active:matchMedia('(forced-colors: active)').matches,adjust:mark.forcedColorAdjust,border:mark.borderLeftColor,control:getComputedStyle(document.getElementById('show-editor-aids')).forcedColorAdjust};});assert.equal(forced.active,true);assert.equal(forced.adjust,'none');assert.equal(forced.border,'rgba(160, 160, 160, 0.45)');assert.notEqual(forced.control,'none');await wholeControl('show-editor-aids',true);await page.visualCapture('v11-aid-controls-forced-colors');await page.click('#hide-scene');await absent();await page.send('Emulation.setEmulatedMedia',{features:[]});
  });
  await runCase('v11 aided rapid drag passes through overlay and retains first Undo, snap, nudge and lock controls',async()=>{
    const value=fixture();await load(value);await page.nativeSelect('#snap-step','10');await live();await page.click(aidLabel);await geometry();
    const acceptedUndo=await page.property('#undo','disabled'),r=await page.evaluate(()=>{const c=document.getElementById('scene-canvas'),r=c.getBoundingClientRect();window.__aidMove=null;window.__aidRelease=null;for(const type of ['pointermove','pointerup'])c.addEventListener(type,e=>{if(type==='pointermove')window.__aidMove=e.timeStamp;else window.__aidRelease={lastMoveToUpMs:e.timeStamp-window.__aidMove,trusted:e.isTrusted};});return {left:r.left,top:r.top,width:r.width,height:r.height};});
    const p={x:r.left+r.width*.35,y:r.top+r.height*.45},q={x:r.left+r.width*.47,y:r.top+r.height*.54};assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,p),'scene-canvas');
    async function input(type,p){if(page.device.touch)await page.send('Input.dispatchTouchEvent',{type:{down:'touchStart',move:'touchMove',up:'touchEnd'}[type],touchPoints:type==='up'?[]:[{...p,radiusX:1,radiusY:1,force:1,id:1}]});else await page.send('Input.dispatchMouseEvent',{type:{down:'mousePressed',move:'mouseMoved',up:'mouseReleased'}[type],...p,button:'left',buttons:type==='up'?0:1,clickCount:1});}
    const stop=await beginInputTrace(page);let trace;
    try{await input('down',p);await input('move',q);await input('up',q);await page.visible();assert.equal(await page.property('#position-x','value'),'50');assert.equal(await page.property('#position-y','value'),'50');await geometry();
      const pixels=await page.evaluate(()=>{const c=document.getElementById('scene-canvas'),ctx=c.getContext('2d');return [[50,50],[35,45]].map(([x,y])=>Array.from(ctx.getImageData(Math.floor(c.width*x/100),Math.floor(c.height*y/100),1,1).data).slice(0,3));});for(const [i,color]of [value.scene.objects[0].color,value.scene.background].entries())rgb(color).forEach((v,k)=>assert.ok(Math.abs(pixels[i][k]-v)<=2));
      assert.equal(await page.property('#undo','disabled'),acceptedUndo);await page.click('#undo-move');assert.equal(await page.property('#position-x','value'),'35');assert.equal(await page.property('#position-y','value'),'45');assert.equal(await page.property('#undo-move','disabled'),true);
    }finally{trace=await stop();}
    const dom=await page.evaluate(()=>window.__aidRelease);assert.equal(dom.trusted,true);assertRapidReleaseEvidence(dom,trace);console.log('IMAGERY_EDITOR_AIDS_RAPID '+JSON.stringify({device:page.device.name,dom,trace}));
    await page.click('#redo-move');assert.equal(await page.property('#position-x','value'),'50');await page.hidden();await absent();await live();await page.click(aidLabel);await geometry();await page.focus('#scene-canvas');await page.key('ArrowRight');assert.equal(await page.property('#position-x','value'),'51');await page.click('#lock-selected');assert.equal(await page.property('#lock-selected','ariaPressed'),'true');await page.click('#lock-selected');assert.equal(await page.property('#lock-selected','ariaPressed'),'false');await page.visualCapture('v11-aided-drag-snap-nudge-history');
    await page.click('#discard');await absent();await page.hidden();assert.deepEqual((await page.download('#export-scene','imagery-field-scene-v3.json')).json,value);
  });
  await runCase('v11 bounded editor aids report paired synchronous layout and first Hide timing',async()=>{
    const value=M.upgradeScene(fixture(),{mode:'fixed',ratio:'1:1'});value.scene.objects=Array.from({length:12},(_,i)=>({...styledObject({id:'object-'+(i+1),shape:'ellipse',x:50,y:50,size:28,outline:{enabled:true,width:4,color:{h:0,s:0,l:30}},shadow:{enabled:true,offsetX:12,offsetY:12,blur:6,color:{h:0,s:0,l:0}}}),geometry:{height:28,rotation:45,fill:false}}));assert.equal(M.validateScene(value).ok,true);await load(value);await live();
    await page.evaluate(()=>{window.__aidPerf=[];let start=null;document.addEventListener('change',e=>{if(e.target.id==='editor-center-guides')start=performance.now();},{capture:true});document.addEventListener('change',e=>{if(e.target.id==='editor-center-guides'&&start!==null){const r=document.getElementById('editor-aids-overlay').getBoundingClientRect();window.__aidPerf.push({trusted:e.isTrusted,on:document.getElementById('show-editor-aids').checked,ms:performance.now()-start,nodes:document.getElementById('editor-aids-overlay').querySelectorAll('*').length+1,width:r.width});start=null;}});let hide=null;document.addEventListener('click',e=>{if(e.target.id==='hide-scene')hide=performance.now();},{capture:true});document.addEventListener('click',e=>{if(e.target.id==='hide-scene'&&hide!==null)window.__aidHide={trusted:e.isTrusted,ms:performance.now()-hide,hidden:document.getElementById('editor-aids-overlay').hidden};});});
    for(let i=0;i<12;i++)await page.click(centerLabel);await page.click(aidLabel);for(let i=0;i<12;i++)await page.click(centerLabel);await page.click('#hide-scene');await absent();await page.hidden();
    const data=await page.evaluate(()=>({events:window.__aidPerf,hide:window.__aidHide}));assert.equal(data.events.length,24);assert.ok(data.events.every(x=>x.trusted&&x.nodes<=230&&Number.isFinite(x.ms)&&x.ms>=0));assert.ok(data.hide.trusted&&data.hide.hidden);const stats=on=>{const a=data.events.filter(x=>x.on===on).map(x=>x.ms).sort((a,b)=>a-b);return {count:a.length,median:a[Math.floor(a.length/2)],p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)};};const result={device:page.device.name,scope:'Synthetic synchronous trusted setting-handler plus forced layout, not physical display latency',off:stats(false),on:stats(true),hide:data.hide};console.log('IMAGERY_EDITOR_AIDS_PERFORMANCE '+JSON.stringify(result));assert.ok(result.on.p95-result.off.p95<=10,'Paired guide-on p95 overhead exceeds the predeclared 10ms budget: '+JSON.stringify(result));assert.ok(result.on.max<50&&data.hide.ms<50,'Investigate aid-attributable long task or delayed Hide: '+JSON.stringify(result));
  });
}
module.exports={runEditorAidsScenarios};
