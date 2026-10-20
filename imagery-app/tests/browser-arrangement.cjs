'use strict';
// Native controls and actual layout, using synthetic local scenes only.
const assert = require('node:assert/strict');
const M = require('../src/model.js');
const {setTimeout:sleep} = require('node:timers/promises');
const {rgb} = require('./browser-live.cjs');
const {beginInputTrace,assertRapidReleaseEvidence} = require('./browser-direct-editor.cjs');
const {scene, styledObject} = require('./fixtures.cjs');
async function runArrangementScenarios({page, runCase}) {
  const fixture = () => scene({name:'Synthetic arrangement', objects:[styledObject({id:'object-1',shape:'pixel',x:35,y:45,size:6})]});
  const load = async value => {await page.file('arrangement-synthetic.json', value); await page.hidden();};
  const pressed = () => page.property('#lock-selected','ariaPressed');
  async function tap(x,y) {
    if (page.device.touch) {
      await page.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,radiusX:1,radiusY:1,force:1,id:1}]});
      await page.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    } else {
      await page.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
      await page.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
    }
  }
  async function pointer(type,x,y) {
    if(page.device.touch)await page.send('Input.dispatchTouchEvent',{type:{down:'touchStart',move:'touchMove',up:'touchEnd'}[type],touchPoints:type==='up'?[]:[{x,y,radiusX:1,radiusY:1,force:1,id:1}]});
    else await page.send('Input.dispatchMouseEvent',{type:{down:'mousePressed',move:'mouseMoved',up:'mouseReleased'}[type],x,y,button:'left',buttons:type==='up'?0:1,clickCount:1});
  }
  async function content(ratio=null) {
    return page.evaluate(ratio=>{const c=document.getElementById('scene-canvas'),r=c.getBoundingClientRect();let width=r.width,height=r.height;if(ratio){const [w,h]=ratio.split(':').map(Number),scale=Math.min(r.width/w,r.height/h);width=w*scale;height=h*scale;}return {left:r.left+(r.width-width)/2,top:r.top+(r.height-height)/2,width,height};},ratio);
  }
  async function deliberateDrag(r,from,to,during) {
    const p={x:r.left+r.width*from[0]/100,y:r.top+r.height*from[1]/100},q={x:r.left+r.width*to[0]/100,y:r.top+r.height*to[1]/100};
    assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,p),'scene-canvas','native drag starts on unobscured canvas');
    await page.evaluate(()=>{window.__arrangementDragTrust=[];for(const type of ['pointerdown','pointermove','pointerup'])document.addEventListener(type,e=>window.__arrangementDragTrust.push({type,trusted:e.isTrusted}),{capture:true});});
    await pointer('down',p.x,p.y);await pointer('move',q.x,q.y);if(during)await during();
    // Deliberate placement includes a stationary hold before release. This is
    // not a fallback tap and does not replace the original P1 fast-drag gate.
    await sleep(120);await pointer('up',q.x,q.y);
    const events=await page.evaluate(()=>window.__arrangementDragTrust);assert.ok(events.some(e=>e.type==='pointerdown')&&events.some(e=>e.type==='pointerup')&&events.every(e=>e.trusted));
  }
  async function pixelAt(r,x,y) {
    return page.evaluate(({r,x,y})=>{const c=document.getElementById('scene-canvas'),b=c.getBoundingClientRect();return Array.from(c.getContext('2d').getImageData(Math.floor((r.left-b.left+r.width*x/100)*c.width/b.width),Math.floor((r.top-b.top+r.height*y/100)*c.height/b.height),1,1).data).slice(0,3);},{r,x,y});
  }
  const near=(actual,expected)=>actual.forEach((value,index)=>assert.ok(Math.abs(value-expected[index])<=3,JSON.stringify({actual,expected})));
  await runCase('v10 session lock protects own controls and accepted history but not export or duplication', async () => {
    const value=fixture(); await load(value);
    const acceptedUndoBefore=await page.property('#undo','disabled');
    assert.equal(await page.property('#snap-step','value'),'0');
    await page.click('#lock-selected'); assert.equal(await pressed(),'true');
    for (const id of ['position-x','position-y','shape','object-hue','object-hue-value','object-hue-decrease','object-hue-increase','item-hold','delete-object','place-object','nudge-right','align-both','undo','redo']) {
      assert.equal(await page.property('#'+id,'disabled'),true,id+' must respect the session lock');
    }
    assert.equal(await page.property('#unlock-all','disabled'),false);
    assert.equal(await page.property('#duplicate-object','disabled'),false);
    const saved=await page.download('#export-scene','imagery-field-scene-v3.json'); assert.deepEqual(saved.json,value);
    await page.focus('#lock-selected'); await page.evaluate(()=>document.getElementById('lock-selected').scrollIntoView({block:'center',behavior:'instant'}));
    await page.visualCapture('v10-locked-item-controls');
    await page.click('#duplicate-object'); assert.equal(await pressed(),'false');
    assert.equal(await page.property('#unlock-all','disabled'),false,'source remains locked after duplication');
    await page.click('#apply-changes');
    const copied=await page.download('#export-scene','imagery-field-scene-v3.json');
    assert.equal(copied.json.scene.objects.length,2);
    assert.deepEqual(copied.json.scene.objects.find(o=>o.id==='object-1'),value.scene.objects[0]);
    assert.notEqual(copied.json.scene.objects[1].id,'object-1');
    await page.click('#unlock-all'); assert.equal(await page.property('#unlock-all','disabled'),true);
    assert.equal(await page.property('#undo','disabled'),acceptedUndoBefore);
    await page.click('#hide-scene'); await page.hidden();
  });
  await runCase('v10 rejected import preserves locks and valid scene replacement clears them visibly', async () => {
    const value=fixture(); await load(value); await page.click('#lock-selected');
    await page.file('arrangement-invalid.json','{}'); await page.hidden();
    assert.equal(await pressed(),'true'); assert.equal(await page.property('#unlock-all','disabled'),false);
    const retained=await page.download('#export-scene','imagery-field-scene-v3.json'); assert.deepEqual(retained.json,value);
    const replacement=fixture(); replacement.scene.name='Synthetic replacement'; replacement.scene.objects[0].x=40;
    await page.file('arrangement-replacement.json',replacement); await page.hidden();
    assert.equal(await pressed(),'false'); assert.equal(await page.property('#unlock-all','disabled'),true);
    assert.match(await page.property('#status','textContent'),/lock.*clear|clear.*lock/i);
    await page.focus('#lock-selected'); await page.evaluate(()=>document.getElementById('lock-selected').scrollIntoView({block:'center',behavior:'instant'}));
    await page.visualCapture('v10-successful-replacement-lock-notice');
    const saved=await page.download('#export-scene','imagery-field-scene-v3.json'); assert.deepEqual(saved.json,replacement);
  });
  await runCase('v10 snapping leaves typed and nudge coordinates exact and centering has one draft undo', async () => {
    await load(fixture()); await page.nativeSelect('#snap-step','10');
    await page.fill('#position-x','37.25'); assert.equal(await page.property('#position-x','value'),'37.25');
    await page.click('#nudge-right'); assert.equal(await page.property('#position-x','value'),'38.25');
    await page.click('#align-both'); await page.hidden();
    assert.equal(await page.property('#position-x','value'),'50'); assert.equal(await page.property('#position-y','value'),'50');
    await page.click('#undo-move'); await page.hidden();
    assert.equal(await page.property('#position-x','value'),'38.25'); assert.equal(await page.property('#position-y','value'),'45');
    await page.click('#redo-move'); await page.hidden();
    assert.equal(await page.property('#position-x','value'),'50'); assert.equal(await page.property('#position-y','value'),'50');
    await page.visualCapture('v10-exact-nudge-and-centered-draft');
    await page.click('#apply-changes'); const saved=await page.download('#export-scene','imagery-field-scene-v3.json');
    assert.equal(saved.json.scene.objects[0].x,50); assert.equal(saved.json.scene.objects[0].y,50);
    assert.equal(JSON.stringify(saved.json).includes('snap'),false); assert.equal(JSON.stringify(saved.json).includes('lock'),false);
  });
  await runCase('v10 native authored tap placement snaps within content and stays hidden until explicit reveal', async () => {
    const value=M.upgradeScene(fixture(),{mode:'fixed',ratio:'1:1'}); await load(value);
    await page.nativeSelect('#snap-step','10'); await page.click('#place-object');
    const point=await page.evaluate(()=>{const c=document.getElementById('scene-canvas'),r=c.getBoundingClientRect(),size=Math.min(r.width,r.height);window.__arrangementTrusted=null;c.addEventListener('pointerdown',e=>{window.__arrangementTrusted=e.isTrusted;},{once:true});return {x:r.left+(r.width-size)/2+size*.46,y:r.top+(r.height-size)/2+size*.54};});
    await tap(point.x,point.y); assert.equal(await page.evaluate(()=>window.__arrangementTrusted),true);
    await page.hidden(); assert.equal(await page.property('#position-x','value'),'50'); assert.equal(await page.property('#position-y','value'),'50');
    assert.equal(await page.property('#snap-step','value'),'10'); await page.visualCapture('v10-snapped-authored-placement');
    await page.click('#apply-changes'); const saved=await page.download('#export-scene','imagery-field-scene-v4.json');
    value.scene.objects[0].x=50;value.scene.objects[0].y=50;assert.deepEqual(saved.json,value);
  });
  await runCase('v10 invalid global input with a locked item conceals and correction cannot resume', async () => {
    await load(fixture());await page.click('#lock-selected');await sleep(3100);await page.click('#show-scene');await page.visible();
    await page.fill('#scene-name','');await page.hidden();assert.equal(await pressed(),'true');
    await page.fill('#scene-name','Synthetic corrected name');await page.hidden();
    await page.click('#unlock-all');await page.hidden();assert.equal(await page.property('#unlock-all','disabled'),true);
    await page.visualCapture('v10-locked-invalid-input-remains-hidden');
  });
  await runCase('v10 trusted locked canvas selection refuses movement and explicit unlock restores drag', async () => {
    const value=fixture();await load(value);await page.click('#lock-selected');await sleep(3100);await page.click('#show-scene');await page.visible();await page.click('#editor-toggle');
    await deliberateDrag(await content(),[35,45],[45,45]);await page.visible();
    assert.equal(await pressed(),'true');assert.equal(await page.property('#position-x','value'),'35');assert.equal(await page.property('#position-y','value'),'45');
    assert.equal(await page.property('#editor-panel','hidden'),false);assert.equal(await page.property('#undo-move','disabled'),true);
    await page.click('#lock-selected');await page.click('#editor-toggle');
    await deliberateDrag(await content(),[35,45],[45,45]);await page.visible();
    assert.equal(await pressed(),'false');assert.equal(await page.property('#position-x','value'),'45');assert.equal(await page.property('#position-y','value'),'45');
    assert.equal(await page.property('#undo-move','disabled'),false);await page.visualCapture('v10-locked-selection-then-unlocked-drag');
    await page.click('#hide-scene');await page.hidden();
  });
  await runCase('v10 rapid locked-item flick preserves the first trusted Unlock tap', async () => {
    await load(fixture());await page.click('#lock-selected');await sleep(3100);await page.click('#show-scene');await page.visible();await page.click('#editor-toggle');const r=await content(),p={x:r.left+r.width*.35,y:r.top+r.height*.45},q={x:r.left+r.width*.45,y:p.y};
    assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,p),'scene-canvas');
    await page.evaluate(()=>{window.__lockedFlick=[];for(const type of ['pointerdown','pointermove','pointerup','touchstart','click'])document.addEventListener(type,e=>{if(window.__lockedFlick.length<80)window.__lockedFlick.push({type,time:e.timeStamp,trusted:e.isTrusted,target:e.target.id,pointerId:e.pointerId,pointerType:e.pointerType,defaultPrevented:e.defaultPrevented});},{passive:true});});
    const stop=await beginInputTrace(page);let failure=null;
    try {
      await pointer('down',p.x,p.y);await pointer('move',q.x,q.y);await pointer('up',q.x,q.y);
      assert.equal(await pressed(),'true');assert.equal(await page.property('#position-x','value'),'35');assert.equal(await page.property('#position-y','value'),'45');assert.equal(await page.property('#undo-move','disabled'),true);
      await page.click('#lock-selected');assert.equal(await pressed(),'false');assert.equal(await page.property('#position-x','value'),'35');assert.equal(await page.property('#position-y','value'),'45');await page.visible();
      await page.visualCapture('v10-rapid-locked-flick-first-unlock');
    } catch(error) {failure=error;throw error;}
    finally {
      let trace=null,diagnosticError=null;try{trace=await stop();}catch(error){diagnosticError=error;}
      let dom=null;try{dom=await page.evaluate(()=>{const events=window.__lockedFlick,down=events.find(e=>e.type==='pointerdown'&&e.target==='scene-canvas'),flick=events.filter(e=>e.pointerId===down?.pointerId&&['pointerdown','pointermove','pointerup'].includes(e.type)),move=flick.filter(e=>e.type==='pointermove').at(-1),up=flick.find(e=>e.type==='pointerup');return {events,flick,lastMoveToUpMs:move&&up?up.time-move.time:null};});if(!diagnosticError){assertRapidReleaseEvidence(dom,trace);assert.ok(dom.flick.length>=3&&dom.flick.every(e=>e.trusted),'locked flick uses native trusted pointer events');if(page.device.touch){assert.ok(dom.events.some(e=>e.type==='touchstart'&&e.target==='scene-canvas'&&e.defaultPrevented),'only the validated locked canvas start is consumed');assert.ok(dom.events.some(e=>e.type==='touchstart'&&e.target==='lock-selected'&&!e.defaultPrevented),'Unlock touch remains uncanceled');}}}catch(error){diagnosticError=diagnosticError||error;}
      console.log('IMAGERY_LOCKED_FLICK_DIAGNOSTIC '+JSON.stringify({device:page.device.name,status:failure||diagnosticError?'FAIL':'PASS',dom,trace,error:diagnosticError?.message||null}));
      if(diagnosticError)throw Error((failure?failure.message+'; ':'')+diagnosticError.message);
    }
    await page.click('#hide-scene');await page.hidden();
  });
  for(const ratio of ['16:9','9:16'])await runCase('v10 snapped authored drag has actual content pixels at ratio '+ratio, async () => {
    const value=M.upgradeScene(fixture(),{mode:'fixed',ratio});await load(value);await page.nativeSelect('#snap-step','10');await sleep(3100);await page.click('#show-scene');await page.visible();await page.click('#editor-toggle');const r=await content(ratio);
    await deliberateDrag(r,[35,45],[47,53],async()=>{assert.equal(await page.property('#position-x','value'),'50');assert.equal(await page.property('#position-y','value'),'50');await page.visible();near(await pixelAt(r,50,50),rgb(value.scene.objects[0].color));near(await pixelAt(r,35,45),rgb(value.scene.background));});
    await page.visible();assert.equal(await page.property('#position-x','value'),'50');assert.equal(await page.property('#position-y','value'),'50');await page.visualCapture('v10-snapped-drag-'+ratio.replace(':','x'));
    await page.click('#apply-changes');const saved=await page.download('#export-scene','imagery-field-scene-v4.json');value.scene.objects[0].x=50;value.scene.objects[0].y=50;assert.deepEqual(saved.json,value);
  });
  await runCase('v10 session lock and arrangement controls have complete reachable labels at narrow widths', async () => {
    await page.viewport(320,568);await load(fixture());await page.click('#lock-selected');
    async function whole(id) {
      const enabled=!await page.property('#'+id,'disabled');if(enabled)await page.focus('#'+id);
      const m=await page.evaluate(id=>{const e=document.getElementById(id);e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect(),s=document.getElementById('editor-scroll'),a=s.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const label=id==='snap-step'?document.querySelector('label[for="snap-step"]'):null,lb=label?.getBoundingClientRect(),lr=document.createRange();if(label)lr.selectNodeContents(label);return {id,focused:document.activeElement===e,label:lb?{left:lb.left,right:lb.right,top:lb.top,bottom:lb.bottom,text:Array.from(lr.getClientRects(),t=>({left:t.left,right:t.right,top:t.top,bottom:t.bottom})),hit:[[lb.left+2,lb.top+2],[lb.right-2,lb.top+2],[lb.left+2,lb.bottom-2],[lb.right-2,lb.bottom-2]].every(([x,y])=>{const h=document.elementFromPoint(x,y);return h===label||label.contains(h);})}:null,box:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},aperture:{left:Math.max(0,a.left+s.clientLeft),right:Math.min(innerWidth,a.left+s.clientLeft+s.clientWidth),top:Math.max(0,a.top+s.clientTop),bottom:Math.min(innerHeight,a.top+s.clientTop+s.clientHeight)},text:e.tagName==='BUTTON'?Array.from(range.getClientRects(),b=>({left:b.left,right:b.right,top:b.top,bottom:b.bottom})):[],hit:[[r.left+4,r.top+4],[r.right-4,r.top+4],[r.left+4,r.bottom-4],[r.right-4,r.bottom-4],[r.left+r.width/2,r.top+r.height/2]].every(([x,y])=>{const h=document.elementFromPoint(x,y);return h===e||e.contains(h);})};},id);
      if(enabled)assert.equal(m.focused,true,'enabled control retains actual focus: '+id);
      const {box:b,aperture:a}=m;if(m.label){const l=m.label;assert.ok(l.hit&&l.left>=a.left&&l.right<=a.right&&l.top>=a.top&&l.bottom<=a.bottom,'Whole snap label inside inspector aperture: '+JSON.stringify(m));for(const t of l.text)assert.ok(t.left>=l.left&&t.right<=l.right&&t.top>=l.top&&t.bottom<=l.bottom,'Whole snap label text: '+JSON.stringify(m));}
      assert.ok(m.hit&&b.width>=44&&b.height>=44&&b.left>=a.left&&b.right<=a.right&&b.top>=a.top&&b.bottom<=a.bottom,JSON.stringify(m));
      for(const t of m.text)assert.ok(t.left>=b.left&&t.right<=b.right&&t.top>=b.top&&t.bottom<=b.bottom,JSON.stringify(m));
    }
    for(const id of ['lock-selected','unlock-all','snap-step','align-x','align-y','align-both'])await whole(id);
    await whole('unlock-all');await page.noOverflow(320);await page.visualCapture('v10-narrow-focused-unlock-all');
    await page.click('#unlock-all');await page.viewport(320,760);await whole('align-both');await page.noOverflow(320);await page.visualCapture('v10-narrow-320x760-focused-centering');
    await page.click('#hide-scene');await page.hidden();
  });
}
module.exports={runArrangementScenarios};
