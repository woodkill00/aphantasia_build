'use strict';
// Synthetic event/DOM/controller doubles. These are not native layout or sensory tests.
const test=require('node:test'),assert=require('node:assert/strict'),{createHarness}=require('./dom-harness.cjs');
const copy=x=>JSON.parse(JSON.stringify(x)),bytes=x=>JSON.stringify(x);
function harness(options={}){
 let controller,stageFailure=null,stageCalls=0;
 const h=createHarness({width:1000,height:1000,...options,beforeApp:s=>{
  const model=s.ImageryModel;
  s.ImageryModel={...model,createController(...args){controller=model.createController(...args);return {...controller,stageLive(value){stageCalls++;if(stageFailure?.('stageLive',value,stageCalls))return {ok:false,error:'Synthetic stage rejection',state:controller.getState()};return controller.stageLive(value);},stage(value){stageCalls++;if(stageFailure?.('stage',value,stageCalls))return {ok:false,error:'Synthetic stage rejection',state:controller.getState()};return controller.stage(value);}};}};
 }});
 const c=h.get('scene-canvas'),captures=new Set();c.setPointerCapture=id=>captures.add(id);c.hasPointerCapture=id=>captures.has(id);c.releasePointerCapture=id=>captures.delete(id);
 return Object.assign(h,{draft:()=>copy(controller.getState().draft),accepted:()=>copy(controller.getState().current),failStage:fn=>stageFailure=fn,getStageCalls:()=>stageCalls});
}
function ids(h){return h.get('selection-list').children.filter(row=>row.children[0].checked).map(row=>row.children[0].id.slice('selection-'.length));}
function primary(h){return h.get('move-anchor').value;}
async function toggle(h,id){h.get('selection-'+id).checked=!h.get('selection-'+id).checked;await h.fire('selection-'+id,'change');}
async function anchor(h,id){h.get('move-anchor').value=id;await h.fire('move-anchor','change');}
async function only(h,id){await h.select('object-select',id);}
async function delta(h,x,y=0){await h.input('delta-x',x);await h.input('delta-y',y);await h.fire('move-selection','click');}
async function load(h,value){await h.import(bytes(value));h.advance(3100);await h.fire('show-scene','click');}
async function point(h,type,x,y,props={}){return h.fire('scene-canvas',type,{pointerId:1,isPrimary:true,button:0,clientX:x,clientY:y,...props});}
function synthetic(h,n=3){const M=require('../src/model.js'),d=copy(M.upgradeScene(M.presets()[1],{mode:'fixed',ratio:'1:1'}));d.scene.name='Synthetic selection fixture';d.scene.objects=Array.from({length:n},(_,i)=>({...copy(M.defaultAuthoredObject('object-'+(i+1),'square')),x:20+i*25,y:30+i*10,size:10,geometry:{height:10,rotation:0,fill:true}}));return d;}

test('semantic checklist is bounded, keyed, ordered and has a neutral multi/empty singleton route',async()=>{
 const h=harness(),before=h.draft(),row=h.get('selection-object-1');assert.deepEqual(ids(h),['object-1']);
 await toggle(h,'object-3');assert.deepEqual(ids(h),['object-1','object-3']);assert.equal(primary(h),'object-3');assert.equal(h.get('object-select').value,'');assert.equal(h.get('object-select').options[0].value,'');assert.equal(h.get('selection-object-1'),row);
 await anchor(h,'object-1');assert.equal(primary(h),'object-1');await only(h,'object-1');assert.deepEqual(ids(h),['object-1']);
 await h.fire('clear-selection','click');assert.deepEqual(ids(h),[]);assert.equal(h.get('object-select').value,'');assert.equal(h.get('move-anchor').value,'');
 await h.fire('object-select','change');assert.deepEqual(ids(h),[]);await h.fire('select-all','click');assert.deepEqual(ids(h),before.scene.objects.map(o=>o.id));assert.equal(primary(h),'object-3');assert.deepEqual(h.draft(),before);assert.equal(h.get('undo-move').disabled,true);assert.equal(h.rafPending.size,0);
});
test('all twelve complete stable-ID labels remain keyed and focus survives reorder, deletion chooses summary',async()=>{
 const h=harness(),d=synthetic(h,12);d.scene.objects.forEach((o,i)=>{o.x=15+(i%4)*20;o.y=15+Math.floor(i/4)*25;});await load(h,d);
 const row=h.get('selection-object-1');row.focus();await toggle(h,'object-2');assert.equal(h.document.activeElement,row);await h.fire('layer-front','click');assert.equal(h.document.activeElement,row);assert.equal(h.get('selection-object-1'),row);assert.equal(h.get('selection-list').children.length,12);
 h.get('selection-list').children.forEach((label,i)=>{assert.match(label.children[1].textContent,new RegExp('^'+(i+1)+'\\. square · object-'));});
 await h.fire('delete-object','click');assert.equal(h.document.activeElement,h.get('selection-summary'));assert.equal(h.get('selection-list').children.length,10);
});
test('multi and empty property handlers cannot mutate a hidden primary, while globals remain editable',async()=>{
 const h=harness();await toggle(h,'object-2');const before=h.draft();
 for(const id of ['shape','size','position-x','object-hue','item-start','pulse-enabled','geometry-rotation','lock-selected','item-after-previous'])assert.equal(h.get(id).disabled,true,id);
 for(const [id,value] of [['position-x','70'],['size','7'],['object-hue-value','17'],['item-start','9'],['pulse-enabled','pulse']])await h.input(id,value);
 await h.fire('lock-selected','click');await h.fire('item-after-previous','click');assert.deepEqual(h.draft(),before);assert.equal(h.get('unlock-all').disabled,true);
 await h.input('background-hue','42');assert.equal(h.draft().scene.background.h,42);assert.deepEqual(h.draft().scene.objects,before.scene.objects);await h.fire('clear-selection','click');await h.input('position-x','88');assert.deepEqual(h.draft().scene.objects,before.scene.objects);
});
test('timeline pressed state is membership and a track selects only one existing primary',async()=>{
 const h=harness();await h.fire('select-all','click');assert.equal(h.get('item-end').textContent,'Select one item to inspect its timing.');assert.ok(h.get('item-timeline').children.every(row=>row.getAttribute('aria-pressed')==='true'));const index=h.draft().scene.objects.findIndex(o=>o.id===primary(h));await h.fire(h.get('item-timeline').children[index],'click');assert.equal(ids(h).length,1);assert.equal(h.get('item-timeline').children.filter(row=>row.getAttribute('aria-pressed')==='true').length,1);
});
test('batch exact move changes one axis, preserves accepted residues, and history restores saved selection',async()=>{
 const h=harness(),d=synthetic(h,2);d.scene.objects[0].x=41.23000000001;d.scene.objects[1].x=48.34000000003;d.scene.objects[0].y=30.00000000001;await load(h,d);await h.fire('select-all','click');const before=h.draft(),saved=ids(h),p=primary(h);await delta(h,1);
 assert.deepEqual(h.draft().scene.objects.map(o=>o.x),[42.23,49.34]);assert.deepEqual(h.draft().scene.objects.map(o=>o.y),before.scene.objects.map(o=>o.y));await only(h,'object-2');await h.fire('undo-move','click');assert.deepEqual(h.draft(),before);assert.deepEqual(ids(h),saved);assert.equal(primary(h),p);assert.equal(h.visible(),false);await h.fire('redo-move','click');assert.deepEqual(h.draft().scene.objects.map(o=>o.x),[42.23,49.34]);assert.deepEqual(h.accepted(),before);
});
test('zero and rejected exact delta preserve complete document, selection and redo',async()=>{
 const h=harness();await h.fire('select-all','click');const before=h.draft();await delta(h,1);await h.fire('undo-move','click');const selected=ids(h);await delta(h,0,0);assert.deepEqual(h.draft(),before);assert.equal(h.get('redo-move').disabled,false);await delta(h,100,0);assert.deepEqual(h.draft(),before);assert.deepEqual(ids(h),selected);assert.equal(h.get('redo-move').disabled,false);await delta(h,'NaN',0);assert.equal(h.get('delta-x').value,'NaN');assert.deepEqual(h.draft(),before);assert.equal(h.get('redo-move').disabled,false);
});
for(const input of ['position-x','object-hue-value','background-hue-value','scene-name','pulse-period'])test('invalid '+input+' survives selection, Hide, locks and history; exact correction retains old history',async()=>{
 const h=harness();await h.fire('nudge-right','click');const before=h.draft(),value=h.get(input).value,selection=ids(h);await h.input(input,input==='scene-name'?'':'not-a-number');const raw=h.get(input).value;assert.deepEqual(h.draft(),before);assert.equal(h.visible(),false);assert.equal(h.get('undo-move').disabled,true);
 await toggle(h,'object-2');assert.deepEqual(ids(h),selection);assert.equal(h.get('selection-object-2').checked,false);assert.equal(h.get(input).value,raw);await h.fire('hide-scene','click');await h.fire('undo-move','click');await h.fire('unlock-all','click');assert.equal(h.get(input).value,raw);assert.deepEqual(h.draft(),before);
 await h.input(input,value);assert.equal(h.get('undo-move').disabled,false);await h.fire('undo-move','click');assert.notEqual(bytes(h.draft()),bytes(before));assert.equal(h.visible(),false);
});
test('different valid correction clears old history only after successful canonical staging',async()=>{
 const h=harness();await h.fire('nudge-right','click');const before=h.draft();await h.input('position-x','bad');h.failStage(()=>true);await h.input('position-x','60');assert.deepEqual(h.draft(),before);h.failStage(null);await h.input('position-x',String(before.scene.objects[0].x));assert.equal(h.get('undo-move').disabled,false);await h.input('position-x','60');assert.equal(h.draft().scene.objects[0].x,60);assert.equal(h.get('undo-move').disabled,true);
});
test('atomic mixed locks reject all commands, duplicate remains unlocked and locked copy blocks Undo without consuming it',async()=>{
 const h=harness();await h.fire('lock-selected','click');await toggle(h,'object-2');const before=h.draft(),selected=ids(h);
 for(const id of ['nudge-right','align-x','selection-align-left','delete-object','layer-front','place-object']){await h.fire(id,'click');assert.deepEqual(h.draft(),before,id);assert.deepEqual(ids(h),selected,id);assert.equal(h.get('undo-move').disabled,true,id);}
 await h.fire('duplicate-object','click');assert.equal(ids(h).length,2);const copies=ids(h);assert.equal(h.draft().scene.objects.length,5);await only(h,copies[0]);await h.fire('lock-selected','click');await h.fire('undo-move','click');assert.equal(h.draft().scene.objects.length,5);await h.fire('unlock-all','click');await h.fire('undo-move','click');assert.deepEqual(h.draft(),before);assert.deepEqual(ids(h),selected);assert.equal(h.get('redo-move').disabled,false);
});
test('reorder targets are locked during history even though stored records did not change',async()=>{
 const h=harness();await h.fire('layer-front','click');const after=h.draft();await h.fire('lock-selected','click');await h.fire('undo-move','click');assert.deepEqual(h.draft(),after);await h.fire('unlock-all','click');await h.fire('undo-move','click');assert.equal(h.draft().scene.objects[0].id,'object-1');assert.equal(h.get('undo-move').disabled,true);
});
test('bounded structural transaction sequence uses fresh reserved IDs, exact Undo/Redo and no accepted changes',async()=>{
 const h=harness(),original=h.draft();await toggle(h,'object-3');await h.fire('duplicate-object','click');const copies=ids(h);assert.deepEqual(copies,['object-4','object-5']);const duplicated=h.draft();await h.fire('delete-object','click');assert.deepEqual(h.draft(),original);await h.fire('duplicate-object','click');assert.ok(ids(h).every(id=>!copies.includes(id)));await h.fire('undo-move','click');await h.fire('undo-move','click');assert.deepEqual(h.draft(),duplicated);assert.deepEqual(ids(h),copies);await h.fire('undo-move','click');assert.deepEqual(h.draft(),original);assert.deepEqual(h.accepted(),original);
});
test('data-only commands work with unavailable geometry and stay hidden; geometry commands reject atomically',async()=>{
 const h=harness();await h.fire('select-all','click');await h.fire('hide-scene','click');h.get('scene-canvas').getBoundingClientRect=()=>({left:0,top:0,width:0,height:0});await delta(h,1);assert.equal(h.get('undo-move').disabled,false);const before=h.draft();await h.fire('selection-align-left','click');assert.deepEqual(h.draft(),before);await h.fire('duplicate-object','click');assert.equal(h.draft().scene.objects.length,6);await h.fire('delete-object','click');assert.deepEqual(h.draft(),before);await h.fire('undo-move','click');assert.equal(h.draft().scene.objects.length,6);assert.equal(h.visible(),false);
});
test('three owned pointer updates and final sampled release move the whole set once without self-cancel',async()=>{
 const h=harness();await load(h,synthetic(h));await toggle(h,'object-2');const before=h.draft();await point(h,'pointerdown',200,300);assert.equal(primary(h),'object-1');for(const x of [250,280,310])await point(h,'pointermove',x,340);assert.equal(h.visible(),true);assert.deepEqual(h.draft().scene.objects.map(o=>o.x),[31,56,70]);await point(h,'pointerup',320,350);assert.deepEqual(h.draft().scene.objects.map(o=>o.x),[32,57,70]);await h.fire('undo-move','click');assert.deepEqual(h.draft(),before);assert.equal(h.get('undo-move').disabled,true);assert.deepEqual(ids(h),['object-1','object-2']);
});
test('Shift pointer toggles only, selected plain press changes primary, background does not clear',async()=>{
 const h=harness();await load(h,synthetic(h));const before=h.draft();await point(h,'pointerdown',450,400,{shiftKey:true});await point(h,'pointermove',550,500);await point(h,'pointerup',550,500);assert.deepEqual(ids(h),['object-1','object-2']);assert.equal(primary(h),'object-2');assert.deepEqual(h.draft(),before);await point(h,'pointerdown',200,300);await point(h,'pointerup',200,300);assert.equal(primary(h),'object-1');assert.deepEqual(ids(h),['object-1','object-2']);await point(h,'pointerdown',1,1);assert.deepEqual(ids(h),['object-1','object-2']);assert.equal(h.get('undo-move').disabled,true);
});
test('multi snap follows changed primary and preserves lattice offsets; hidden tap placement remains hidden',async()=>{
 const h=harness();await load(h,synthetic(h));await toggle(h,'object-2');h.get('snap-step').value='10';await h.fire('snap-step','change');await point(h,'pointerdown',450,400);await point(h,'pointerup',473,400);assert.deepEqual(h.draft().scene.objects.map(o=>o.x),[25,50,70]);assert.equal(primary(h),'object-2');await h.fire('hide-scene','click');await h.fire('place-object','click');await point(h,'pointerup',600,500);assert.deepEqual(h.draft().scene.objects.map(o=>o.x),[35,60,70]);assert.equal(h.visible(),false);
});
test('origin-return preserves exact near-hundredth payloads and redo with no gesture transaction',async()=>{
 const h=harness(),d=synthetic(h,2);d.scene.objects[0].x=41.23000000001;d.scene.objects[1].x=68.34000000003;await load(h,d);await h.fire('select-all','click');await delta(h,1);await h.fire('undo-move','click');h.advance(3100);await h.fire('show-scene','click');const before=h.draft(),x=before.scene.objects[0].x*10;await point(h,'pointerdown',x,300);await point(h,'pointermove',x+100,300);await point(h,'pointermove',x,300);await point(h,'pointerup',x,300);assert.deepEqual(h.draft(),before);assert.equal(h.get('undo-move').disabled,true);assert.equal(h.get('redo-move').disabled,false);
});
for(const field of ['position-x','object-hue-value','background-hue-value','scene-name'])test('fresh invalid '+field+' survives provisional rollback and stale pointerup',async()=>{
 const h=harness();await load(h,synthetic(h));await h.fire('nudge-right','click');const before=h.draft();await point(h,'pointerdown',210,300);await point(h,'pointermove',310,300);await h.input(field,field==='scene-name'?'':'bad');assert.equal(h.get(field).value,field==='scene-name'?'':'bad');assert.deepEqual(h.draft(),before);assert.equal(h.visible(),false);await h.fire('hide-scene','click');await point(h,'pointerup',410,300);assert.deepEqual(h.draft(),before);assert.equal(h.get(field).value,field==='scene-name'?'':'bad');
});
for(const phase of ['command-stage','provisional-stage','final-stage','provisional-paint','final-paint'])test('atomic failure boundary '+phase+' retains only complete transactions',async()=>{
 const h=harness();await load(h,synthetic(h));await h.fire('select-all','click');await delta(h,1);const before=h.draft();
 if(phase==='command-stage'){h.failStage(()=>true);await h.fire('duplicate-object','click');assert.deepEqual(h.draft(),before);assert.deepEqual(ids(h),['object-1','object-2','object-3']);}
 else {
  await point(h,'pointerdown',210,300);
  if(phase==='provisional-stage')h.failStage(()=>true);
  if(phase==='provisional-paint')h.ctx.fillRect=()=>{throw Error('Synthetic paint failure');};
  if(phase==='final-paint'){await point(h,'pointermove',260,300);h.ctx.fillRect=()=>{throw Error('Synthetic paint failure');};}
  if(phase==='final-stage'){await point(h,'pointermove',260,300);let rejected=false;h.failStage(method=>method==='stageLive'&&!rejected?(rejected=true):false);}
  if(phase.startsWith('provisional'))await point(h,'pointermove',260,300);else await point(h,'pointerup',310,300);
  if(phase==='final-paint'){assert.deepEqual(h.draft().scene.objects.map(o=>o.x),before.scene.objects.map(o=>o.x+10));assert.match(h.status(),/Draft updated; preview unavailable and hidden/);}
  else assert.deepEqual(h.draft(),before);
 }
 h.failStage(null);await h.fire('undo-move','click');if(phase==='final-paint')assert.deepEqual(h.draft(),before);else assert.deepEqual(h.draft().scene.objects.map(o=>o.x),[20,45,70]);
});
test('post-publication command paint failure keeps document and its matching Undo transaction',async()=>{
 const h=harness();await h.fire('select-all','click');const before=h.draft();h.ctx.fillRect=()=>{throw Error('Synthetic completed-command paint failure');};await h.fire('duplicate-object','click');assert.equal(h.draft().scene.objects.length,6);assert.equal(ids(h).length,3);assert.equal(h.visible(),false);assert.match(h.status(),/Draft updated; preview unavailable and hidden/);await h.fire('undo-move','click');assert.deepEqual(h.draft(),before);assert.equal(h.get('undo-move').disabled,true);
});
test('alignment, centers and unequal edge gaps are atomic and idempotent without hidden history entries',async()=>{
 const h=harness(),d=synthetic(h);d.scene.objects[0].x=20.00000000001;d.scene.objects[1].x=47.23;d.scene.objects[1].size=20;d.scene.objects[1].geometry.height=20;d.scene.objects[2].x=80.00000000001;await load(h,d);await h.fire('select-all','click');await h.fire('distribute-x','click');assert.deepEqual(h.draft().scene.objects.map(o=>o.x),[20.00000000001,50,80.00000000001]);const first=h.draft();for(let i=0;i<25;i++)await h.fire('distribute-x','click');assert.deepEqual(h.draft(),first);await h.fire('undo-move','click');assert.deepEqual(h.draft(),d);assert.equal(h.get('undo-move').disabled,true);
});
test('replacement chooses first singleton even for matching IDs, Apply retains selection, no session metadata exports',async()=>{
 const h=harness();await h.fire('select-all','click');await anchor(h,'object-2');await delta(h,1);await h.submit();assert.deepEqual(ids(h),['object-1','object-2','object-3']);assert.equal(primary(h),'object-2');assert.equal(h.get('undo-move').disabled,true);const value=await h.exportScene();assert.doesNotMatch(bytes(value),/selection|primaryId|generation|history|locks/);await h.select('preset','0');assert.deepEqual(ids(h),['object-1']);assert.equal(primary(h),'object-1');
});
test('user input equal to provisional position is still authored, not erased during cancellation',async()=>{
 const h=harness();await load(h,synthetic(h));await point(h,'pointerdown',200,300);await point(h,'pointermove',300,300);assert.equal(h.get('position-x').value,'30');await h.input('position-x','30');assert.equal(h.get('position-x').value,'30');assert.equal(h.draft().scene.objects[0].x,30);assert.equal(h.get('undo-move').disabled,true,'ordinary authored edit is not an implicit gesture commit');assert.equal(h.visible(),false);await point(h,'pointerup',400,300);assert.equal(h.draft().scene.objects[0].x,30);
});
test('detached checklist and timeline callbacks cannot act on recycled text IDs after replacement or deletion',async()=>{
 const h=harness();const checkbox=h.get('selection-object-2'),track=h.get('item-timeline').children[1];await h.fire('select-all','click');await h.fire('delete-object','click');await h.fire('add-object','click');await h.fire('add-object','click');const before=h.draft(),selected=ids(h);await h.fire(checkbox,'change');await h.fire(track,'click');assert.deepEqual(h.draft(),before);assert.deepEqual(ids(h),selected);await h.select('preset','0');const replacement=ids(h);await h.fire(checkbox,'change');assert.deepEqual(ids(h),replacement);
});
for(const phase of ['provisional-ui','final-ui'])test('partially refreshed '+phase+' does not replay gesture-owned controls during rollback',async()=>{
 const h=harness();await load(h,synthetic(h));await h.fire('nudge-right','click');const before=h.draft(),select=h.get('object-select'),replace=select.replaceChildren;await point(h,'pointerdown',210,300);let once=true;select.replaceChildren=function(...args){if(once){once=false;throw Error('Synthetic partially completed UI refresh');}return replace.apply(this,args);};
 if(phase==='provisional-ui'){await point(h,'pointermove',310,300);assert.deepEqual(h.draft(),before);assert.equal(h.get('position-x').value,'21');assert.equal(h.visible(),false);await point(h,'pointerup',410,300);assert.deepEqual(h.draft(),before);await h.fire('undo-move','click');assert.equal(h.draft().scene.objects[0].x,20);}
 else {await point(h,'pointerup',310,300);assert.equal(h.draft().scene.objects[0].x,31);assert.equal(h.visible(),false);assert.match(h.status(),/Draft updated; preview unavailable and hidden/);await h.fire('undo-move','click');assert.deepEqual(h.draft(),before);}
});
test('singleton snapped lattice-origin gesture restores raw bytes without discarding redo',async()=>{
 const h=harness(),d=synthetic(h,1);d.scene.objects[0].x=50.00000000001;d.scene.objects[0].y=30.00000000001;await load(h,d);await h.fire('nudge-right','click');await h.fire('undo-move','click');h.advance(3100);await h.fire('show-scene','click');h.get('snap-step').value='10';await h.fire('snap-step','change');const before=h.draft();await point(h,'pointerdown',500,300);await point(h,'pointermove',504,300);await point(h,'pointerup',504,300);assert.deepEqual(h.draft(),before);assert.equal(h.get('undo-move').disabled,true);assert.equal(h.get('redo-move').disabled,false);
});
for(const multiple of [false,true])test('post-publication '+(multiple?'selection-summary':'object-select')+' scrolling failure reports committed hidden edit',async()=>{
 const h=harness();await load(h,synthetic(h));if(multiple)await h.fire('select-all','click');const before=h.draft();await point(h,'pointerdown',200,300);await point(h,'pointermove',250,300);h.get(multiple?'selection-summary':'object-select').scrollIntoView=()=>{throw Error('Synthetic focus-scroll failure');};await point(h,'pointerup',300,300);assert.equal(h.draft().scene.objects[0].x,30);assert.equal(h.visible(),false);assert.match(h.status(),/Draft updated; preview unavailable and hidden/);assert.doesNotMatch(h.status(),/canceled/);await h.fire('undo-move','click');assert.deepEqual(h.draft(),before);
});
test('explicit same-preset replacement remains staged until Apply, preserving the export contract',async()=>{
 const h=harness(),before=h.accepted();await h.select('preset','0');assert.deepEqual(h.draft(),before);assert.equal(await h.exportScene(),null);assert.match(h.status(),/Apply|discard/);await h.submit();assert.deepEqual(await h.exportScene(),before);
});
test('accessible movement and structural names describe the batch scope rather than a hidden primary',async()=>{
 const h=harness();await h.fire('select-all','click');assert.match(h.get('nudge-right').getAttribute('aria-label'),/selected items/);assert.match(h.get('align-x').textContent,/selection bounds/);assert.equal(h.get('duplicate-object').textContent,'Duplicate selection');assert.equal(h.get('delete-object').textContent,'Remove selection');await h.fire('place-object','click');assert.match(h.get('scene-canvas').getAttribute('aria-label'),/move anchor.*selected items/);
});
for(const [field,multiple] of [['position-x',false],['object-hue-value',false],['background-hue-value',true]])test('cancellation UI failure preserves freshly authored '+field+' and conceals actual raster',async()=>{
 const h=harness();await load(h,synthetic(h));if(multiple)await h.fire('select-all','click');await h.fire('nudge-right','click');const before=h.draft();await point(h,'pointerdown',210,300);await point(h,'pointermove',310,300);const select=h.get('object-select'),replace=select.replaceChildren;let once=true;select.replaceChildren=function(...args){if(once){once=false;throw Error('Synthetic cancellation UI refresh failure');}return replace.apply(this,args);};await h.input(field,'bad');assert.equal(h.get(field).value,'bad');assert.deepEqual(h.draft(),before);assert.equal(h.visible(),false);assert.equal(h.get('scene-canvas').hidden,true);await point(h,'pointerup',410,300);await h.fire('hide-scene','click');assert.deepEqual(h.draft(),before);assert.equal(h.get(field).value,'bad');assert.equal(h.visible(),false);
});
test('pending ordinary raw fields expose invalid state until a successful correction',async()=>{
 const h=harness();await h.fire('nudge-right','click');const x=h.get('position-x').value;await h.input('position-x','bad');assert.equal(h.get('position-x').getAttribute('aria-invalid'),'true');await h.fire('hide-scene','click');await toggle(h,'object-2');assert.equal(h.get('position-x').getAttribute('aria-invalid'),'true');await h.input('position-x',x);assert.equal(h.get('position-x').getAttribute('aria-invalid'),'false');assert.equal(h.get('undo-move').disabled,false);
});
for(const field of ['scene-name','pulse-period'])test('successful discard/replacement clears restored '+field+' invalid marker; rejected actions preserve it',async()=>{
 const h=harness();await h.input(field,'');assert.equal(h.get(field).getAttribute('aria-invalid'),'true');await h.import('not-json');assert.equal(h.get(field).value,'');assert.equal(h.get(field).getAttribute('aria-invalid'),'true');h.failStage(()=>true);await h.select('preset','2');assert.equal(h.get(field).value,'');assert.equal(h.get(field).getAttribute('aria-invalid'),'true');h.failStage(null);await h.fire('discard','click');assert.notEqual(h.get(field).value,'');assert.equal(h.get(field).getAttribute('aria-invalid'),'false');await h.input(field,'');await h.select('preset','2');assert.notEqual(h.get(field).value,'');assert.equal(h.get(field).getAttribute('aria-invalid'),'false');
});

test('native regression: Discard retains an existing singleton and its color inspector before the next edit',async()=>{
 const {referenceScene}=require('./independent-user-scenarios.cjs'),h=harness();await h.import(bytes(referenceScene));await only(h,'object-2');await h.input('object-hue',260);await h.fire('discard','click');
 assert.deepEqual(ids(h),['object-2']);assert.equal(h.get('object-color-text').textContent,'HSL 130° / 30% / 50%');assert.equal(h.get('object-hue').value,'130');assert.equal(h.visible(),false);
 await h.input('object-hue',260);await h.submit();const expected=copy(referenceScene);expected.scene.objects[1].color.h=260;assert.deepEqual(await h.exportScene(),expected,'the following singleton edit must still address the square');
});
for(const kind of ['multi','empty','draft-only-singleton'])test('Discard uses first accepted singleton for '+kind+' and invalidates old callbacks/history',async()=>{
 const h=harness(),before=h.accepted();await h.fire('nudge-right','click');const old=h.get('selection-object-2');if(kind==='multi')await h.fire('select-all','click');else if(kind==='empty')await h.fire('clear-selection','click');else await h.fire('add-object','click');
 await h.fire('discard','click');assert.deepEqual(h.draft(),before);assert.deepEqual(ids(h),['object-1']);assert.equal(h.get('undo-move').disabled,true);assert.equal(h.get('redo-move').disabled,true);await h.fire(old,'change');assert.deepEqual(ids(h),['object-1']);assert.equal(h.visible(),false);
});
test('Discard of an empty accepted scene clears a new singleton without exposing stale controls',async()=>{
 const h=harness(),empty=h.accepted();empty.scene.objects=[];await h.import(bytes(empty));await h.fire('add-object','click');await h.fire('discard','click');assert.deepEqual(h.draft(),empty);assert.deepEqual(ids(h),[]);assert.equal(h.get('shape').disabled,true);assert.equal(h.visible(),false);
});
test('native regression: same-canonical name input keeps explicit staged intent and combined capture labels',async()=>{
 const {referenceScene}=require('./independent-sequence-user-scenarios.cjs'),h=harness(),before=referenceScene(0);await h.import(bytes(before));await h.input('scene-name',before.scene.name);
 assert.deepEqual(h.draft(),before);assert.equal(h.get('draft-label').textContent,'Changes staged');assert.equal(h.get('capture-add').textContent,'Apply scene and add step');assert.equal(await h.exportScene(),null);assert.equal(h.visible(),false);
 await h.fire('capture-add','click');assert.equal(h.get('draft-label').textContent,'Applied');assert.equal(h.get('capture-add').textContent,'Add scene as step');assert.deepEqual(h.accepted(),before);await h.fire('sequence-export','click');const value=JSON.parse(await h.downloads.at(-1).blob.text());assert.equal(value.sequence.steps[0].name,before.scene.name);assert.deepEqual(value.sequence.steps[0].objects,before.scene.objects);assert.equal(h.visible(),false);
});
test('same-canonical ordinary input and invalid correction retain arrangement redo but remain explicitly staged',async()=>{
 const h=harness(),before=h.accepted();await h.fire('nudge-right','click');await h.fire('undo-move','click');await h.input('scene-name',before.scene.name);assert.deepEqual(h.draft(),before);assert.equal(h.get('redo-move').disabled,false);assert.equal(h.get('draft-label').textContent,'Changes staged');
 await h.input('scene-name','');await h.input('scene-name',before.scene.name);assert.equal(h.get('redo-move').disabled,false);assert.equal(h.get('capture-add').textContent,'Apply scene and add step');await h.fire('redo-move','click');assert.notDeepEqual(h.draft(),before);assert.equal(h.visible(),false);
});
test('rejected same-canonical ordinary staging does not invent dirty intent',async()=>{
 const h=harness(),before=h.accepted();await h.fire('hide-scene','click');h.failStage(()=>true);await h.input('scene-name',before.scene.name);assert.deepEqual(h.draft(),before);assert.equal(h.get('draft-label').textContent,'Applied');assert.equal(h.get('capture-add').textContent,'Add scene as step');assert.equal(h.visible(),false);
});
test('short hidden inspector retains the full-inspector scroll CSS after resize concealment (not native layout evidence)',async()=>{
 const h=harness();await h.resize(640,360);assert.equal(h.visible(),false);assert.doesNotMatch(h.get('stage-root').className,/live-editor/);assert.equal(h.get('hide-scene').hidden,false);assert.equal(h.rafPending.size,0);
 const fs=require('node:fs'),path=require('node:path'),css=fs.readFileSync(path.join(__dirname,'../src/style.css'),'utf8'),short=css.split('/* In short windows')[1].split('/* At extreme zoom')[0];
 assert.match(short,/@media\(max-height:500px\)/);assert.match(short,/\n  \.editor-panel\{display:block;overflow:auto;/);assert.match(short,/\n  \.editor-scroll\{overflow:visible;/);assert.match(short,/\n  \.editor-actions\{position:relative\}/);assert.doesNotMatch(short,/\.live-editor \.editor-(?:panel|scroll|actions)/);
});
test('native move-anchor options stay stable across primary, movement and reorder refreshes',async()=>{
 const h=harness();await load(h,synthetic(h));await toggle(h,'object-2');const select=h.get('move-anchor'),options=Array.from(select.options);await anchor(h,'object-1');assert.deepEqual(Array.from(select.options),options);assert.equal(select.value,'object-1');assert.match(h.get('selection-summary').textContent,/Move anchor: square · object-1/);
 await anchor(h,'object-2');await h.fire('nudge-right','click');await h.fire('layer-front','click');assert.equal(select.options[0],options[0]);assert.equal(select.options[1],options[1]);assert.equal(select.value,'object-2');
});
test('move-anchor option membership and displayed labels refresh only when their option set changes',async()=>{
 const h=harness();await load(h,synthetic(h));await toggle(h,'object-2');const select=h.get('move-anchor'),prior=select.options[0];await toggle(h,'object-3');assert.equal(select.options.length,3);assert.notEqual(select.options[0],prior);assert.equal(select.value,'object-3');
 await only(h,'object-1');const singleton=select.options[0];assert.equal(singleton.textContent,'square · object-1');await h.input('shape','circle');assert.notEqual(select.options[0],singleton);assert.equal(select.options[0].textContent,'circle · object-1');assert.equal(select.value,'object-1');assert.match(h.get('selection-summary').textContent,/Move anchor: circle · object-1/);
});
for(const multiple of [false,true])for(const provisionalOrigin of [false,true])test('same-name dirty intent survives '+(multiple?'multi':'singleton')+' return-to-origin with '+(provisionalOrigin?'provisional and final':'final-only')+' origin and retained redo',async()=>{
 const h=harness();await load(h,synthetic(h,multiple?2:1));if(multiple)await h.fire('select-all','click');await h.fire('nudge-right','click');const moved=h.draft();await h.fire('undo-move','click');const before=h.draft();h.advance(3100);await h.fire('show-scene','click');await h.input('scene-name',before.scene.name);assert.equal(h.get('capture-add').textContent,'Apply scene and add step');
 await point(h,'pointerdown',200,300);await point(h,'pointermove',300,300);if(provisionalOrigin){await point(h,'pointermove',200,300);assert.deepEqual(h.draft(),before);assert.equal(h.get('draft-label').textContent,'Live draft');assert.equal(h.get('capture-add').textContent,'Apply scene and add step');}
 await point(h,'pointerup',200,300);assert.deepEqual(h.draft(),before);assert.equal(h.get('draft-label').textContent,'Live draft');assert.equal(h.get('capture-add').textContent,'Apply scene and add step');assert.equal(h.get('undo-move').disabled,true);assert.equal(h.get('redo-move').disabled,false);assert.equal(await h.exportScene(),null);assert.match(h.status(),/Apply or discard/);
 await h.fire('redo-move','click');assert.deepEqual(h.draft(),moved);assert.equal(h.get('redo-move').disabled,true);assert.equal(h.get('undo-move').disabled,false);assert.equal(h.visible(),false);
});
