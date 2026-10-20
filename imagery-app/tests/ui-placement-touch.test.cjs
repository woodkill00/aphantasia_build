'use strict';
// Event/DOM doubles only. Native trusted touch tests separately establish that
// preventing the owned touchstart suppresses the browser's compatibility click.
const test=require('node:test'),assert=require('node:assert/strict');
const {createHarness}=require('./dom-harness.cjs'),M=require('../src/model.js');
const copy=value=>JSON.parse(JSON.stringify(value));
function harness(options={}){
 let controller,planFailure=false,stageFailure=false,stages=0;
 const h=createHarness({width:1000,height:1000,...options,beforeApp:s=>{
  const model=s.ImageryModel,groups=s.ImageryGroups;
  s.ImageryModel={...model,createController(...args){controller=model.createController(...args);return {...controller,stageLive(value){stages++;return stageFailure?{ok:false,error:'Synthetic placement stage rejection'}:controller.stageLive(value);},stage(value){stages++;return stageFailure?{ok:false,error:'Synthetic placement stage rejection'}:controller.stage(value);}};}};
  s.ImageryGroups={...groups,plan(...args){if(planFailure&&args[2].type==='place')throw Error('Synthetic placement planning rejection');return groups.plan(...args);}};
 }});
 return Object.assign(h,{draft:()=>copy(controller.getState().draft),accepted:()=>copy(controller.getState().current),stages:()=>stages,rejectPlan:value=>planFailure=value,rejectStage:value=>stageFailure=value});
}
async function setup(kind='singleton',hidden=false,options={}){
 const h=harness(options),scene=copy(M.upgradeScene(M.presets()[1],{mode:'fixed',ratio:'1:1'}));
 scene.scene.objects=[25,45,65].map((x,i)=>({...copy(M.defaultAuthoredObject('object-'+(i+1),'square')),x,y:35+i*10,size:10,geometry:{height:10,rotation:0,fill:true}}));
 await h.import(JSON.stringify(scene));h.advance(3100);await h.fire('show-scene','click');
 if(kind==='group'){h.get('selection-object-2').checked=true;await h.fire('selection-object-2','change');await h.fire('group-selected','click');}
 h.get('snap-step').value='10';await h.fire('snap-step','change');
 if(hidden)await h.fire('hide-scene','click');
 await h.fire('place-object','click');assert.equal(h.get('place-object').getAttribute('aria-pressed'),'true');
 return h;
}
const point={pointerId:12,pointerType:'touch',isPrimary:true,button:0,clientX:703,clientY:603};
const down=(h,extra={})=>h.fire('scene-canvas','pointerdown',{...point,...extra});
const start=(h,extra={})=>h.fire('scene-canvas','touchstart',{cancelable:true,touches:[{identifier:99,clientX:point.clientX,clientY:point.clientY}],...extra});
const up=(h,extra={})=>h.fire('scene-canvas','pointerup',{...point,...extra});
function selected(h){return h.get('selection-list').children.filter(row=>row.children[0].checked).map(row=>row.children[0].id);}

for(const kind of ['singleton','group'])for(const hidden of [false,true])test(kind+' owned placement touch is consumed once, with one atomic '+(hidden?'hidden':'live')+' move and no implicit control activation',async()=>{
 const h=await setup(kind,hidden),before=h.draft(),accepted=h.accepted(),selection=selected(h),stages=h.stages();
 assert.equal((await down(h)).defaultPrevented,false);
 assert.equal((await start(h)).defaultPrevented,true,'the browser compatibility-click source is canceled before inspector expansion');
 assert.equal((await start(h)).defaultPrevented,false,'the same intent cannot consume a later touch');
 assert.deepEqual(h.draft(),before);assert.equal(h.stages(),stages,'touchstart preflight cannot stage');
 assert.equal((await up(h)).defaultPrevented,false);
 await h.fire('scene-canvas','touchend',{changedTouches:[{identifier:99}],touches:[]});
 assert.equal(h.get('editor-panel').hidden,false);assert.equal(h.get('place-object').getAttribute('aria-pressed'),'false');
 assert.deepEqual(h.accepted(),accepted);assert.equal(h.draft().scene.objects.length,3,'no Delete operation');
 assert.deepEqual(selected(h),selection);assert.equal(h.visible(),!hidden);
 const expected=kind==='group'?[[50,50],[70,60],[65,55]]:[[70,60],[45,45],[65,55]];
 assert.deepEqual(h.draft().scene.objects.map(o=>[o.x,o.y]),expected,'no nudge or newly exposed movement control ran');
 await h.fire('undo-move','click');assert.deepEqual(h.draft(),before);assert.equal(h.visible(),false);
 if(kind==='singleton')assert.equal(h.get('undo-move').disabled,true);
 else{await h.fire('undo-move','click');assert.equal(h.get('undo-move').disabled,true,'only the prior Group transaction remains');}
});

for(const kind of ['singleton','group'])for(const control of ['delete-object','nudge-right','undo-move'])test(kind+' placement never swallows the first genuine next '+control+' tap',async()=>{
 const h=await setup(kind),before=h.draft();await down(h);assert.equal((await start(h)).defaultPrevented,true);await up(h);
 const placed=h.draft();assert.equal((await h.fire(control,'touchstart',{cancelable:true,touches:[{identifier:100}]})).defaultPrevented,false);
 await h.fire(control,'click');
 if(control==='delete-object')assert.equal(h.draft().scene.objects.length,kind==='group'?1:2);
 else if(control==='undo-move'){assert.deepEqual(h.draft(),before);assert.equal(h.visible(),false);}
 else{const ids=kind==='group'?['object-1','object-2']:['object-1'];assert.deepEqual(h.draft().scene.objects.map(o=>o.x),placed.scene.objects.map(o=>o.x+(ids.includes(o.id)?1:0)));}
});

for(const mode of ['unowned','mouse','pen','nonprimary','unknown-primary','secondary-button','other-down-target','multitouch','uncancelable','other-start-target','secondary-pointer','invalid','locked','empty-selection','outside','letterbox','invalid-rect','changed-rect','mismatched-touch','nonfinite-touch','planner-rejection','fullscreen','background'])test('placement touchstart stays available for '+mode,async()=>{
 const h=await setup(),before=h.draft(),stages=h.stages();let extra={},touch={};
 if(mode==='mouse'||mode==='pen')extra.pointerType=mode;
 if(mode==='nonprimary')extra.isPrimary=false;
 if(mode==='unknown-primary')extra.isPrimary=undefined;
 if(mode==='secondary-button')extra.button=2;
 if(mode==='other-down-target')extra.target=h.get('delete-object');
 if(mode==='outside')extra.clientX=-1;
 if(mode==='letterbox'){h.get('scene-canvas').getBoundingClientRect=()=>({left:0,top:0,width:1000,height:500});extra.clientX=100;extra.clientY=250;}
 if(mode==='invalid-rect')h.get('scene-canvas').getBoundingClientRect=()=>({left:0,top:0,width:NaN,height:1000});
 touch.touches=[{identifier:99,clientX:extra.clientX??point.clientX,clientY:extra.clientY??point.clientY}];
 if(mode==='multitouch')touch.touches=[{identifier:99},{identifier:100}];
 if(mode==='mismatched-touch')touch.touches[0].clientX++;
 if(mode==='nonfinite-touch')touch.touches[0].clientY=NaN;
 if(mode==='uncancelable')touch.cancelable=false;
 if(mode==='other-start-target')touch.target=h.get('delete-object');
 if(mode!=='unowned')await down(h,extra);
 if(mode==='secondary-pointer')await down(h,{pointerId:13,isPrimary:false});
 if(mode==='invalid')h.get('scene-name').value='';
 if(mode==='locked')await h.fire('lock-selected','click');
 if(mode==='empty-selection')await h.fire('clear-selection','click');
 if(mode==='changed-rect')h.get('scene-canvas').getBoundingClientRect=()=>({left:1,top:0,width:999,height:1000});
 if(mode==='planner-rejection')h.rejectPlan(true);
 if(mode==='fullscreen')h.document.fullscreenElement=h.get('stage-root');
 if(mode==='background')h.document.hidden=true;
 const current=h.draft(),currentStages=h.stages();
 assert.equal((await start(h,touch)).defaultPrevented,false);assert.equal((await start(h)).defaultPrevented,false);
 assert.deepEqual(h.draft(),current);assert.equal(h.stages(),currentStages,'rejected guard cannot stage');
 if(!['locked','empty-selection'].includes(mode)){assert.deepEqual(h.draft(),before);assert.equal(h.stages(),stages);}
});

for(const action of ['pointerup','pointercancel','lostpointercapture','touchend','touchcancel','hide','end','escape','resize','blur','pagehide','visibility','selection','snap','cancel-button','replacement'])test('placement touch ownership cannot survive '+action,async()=>{
 const h=await setup();await down(h);
 if(['pointerup','pointercancel','lostpointercapture','touchend','touchcancel'].includes(action))await h.fire('scene-canvas',action,{pointerId:12});
 else if(action==='hide')await h.fire('hide-scene','click');
 else if(action==='end')await h.fire('end-viewing','click');
 else if(action==='escape')await h.globalEvent('document','keydown',{key:'Escape'});
 else if(action==='resize')await h.resize(900,900);
 else if(action==='blur'||action==='pagehide')await h.globalEvent('window',action);
 else if(action==='visibility'){h.document.hidden=true;await h.globalEvent('document','visibilitychange');}
 else if(action==='selection')await h.select('object-select','object-2');
 else if(action==='snap'){h.get('snap-step').value='5';await h.fire('snap-step','change');}
 else if(action==='cancel-button')await h.fire('place-object','click');
 else await h.select('preset','2');
 assert.equal((await start(h)).defaultPrevented,false);assert.equal((await start(h)).defaultPrevented,false);
});

test('placement planning rejection and final-stage failure preserve the draft and existing history',async()=>{
 for(const failure of ['plan','stage']){
  const h=await setup('group'),before=h.draft(),accepted=h.accepted(),selection=selected(h);
  if(failure==='plan')h.rejectPlan(true);
  await down(h);assert.equal((await start(h)).defaultPrevented,failure!=='plan');
  if(failure==='stage')h.rejectStage(true);
  await up(h);assert.deepEqual(h.draft(),before);assert.deepEqual(h.accepted(),accepted);assert.deepEqual(selected(h),selection);
  h.rejectPlan(false);h.rejectStage(false);await h.fire('undo-move','click');assert.equal(h.get('undo-move').disabled,true,'failure added no transaction above Group');assert.deepEqual(h.draft(),before);
 }
});

for(const type of ['mouse','pen'])test(type+' placement retains its existing uncanceled pointer path',async()=>{
 const h=await setup();assert.equal((await down(h,{pointerType:type})).defaultPrevented,false);assert.equal((await start(h)).defaultPrevented,false);
 assert.equal((await up(h,{pointerType:type})).defaultPrevented,false);assert.equal(h.draft().scene.objects[0].x,70);assert.equal(h.visible(),true);
});

for(const kind of ['singleton','group'])test(kind+' no-op placement still suppresses its own compatibility click without adding history',async()=>{
 const h=await setup(kind);h.get('snap-step').value='0';await h.fire('snap-step','change');await h.fire('place-object','click');
 const before=h.draft(),anchor=before.scene.objects[kind==='group'?1:0],p={clientX:anchor.x*10,clientY:anchor.y*10};
 await down(h,p);assert.equal((await start(h,{touches:[{identifier:99,...p}]})).defaultPrevented,true);await up(h,p);
 assert.deepEqual(h.draft(),before);assert.equal(h.get('editor-panel').hidden,false);assert.equal(h.visible(),true);
 if(kind==='group')await h.fire('undo-move','click');
 assert.equal(h.get('undo-move').disabled,true,'no placement transaction was added');assert.deepEqual(h.draft(),before);
});
