'use strict';
// Observer/DOM doubles only. These tests do not establish native or visual acceptance.
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {installObservation,installPlacementObservation,reportPlacementObservation,groupFixture}=require('./browser-session-groups.cjs');
const {createHarness}=require('./dom-harness.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
function labels(h){
  const result=new Map();
  for(const row of h.get('selection-list').children){
    const match=row.children[1].textContent.match(/\bGroup ([1-9][0-9]*)\b/);
    if(match){const id='group-'+match[1];if(!result.has(id))result.set(id,[]);result.get(id).push(row.children[0].id.slice(10));}
  }
  const numeric=(a,b)=>Number(a.split('-')[1])-Number(b.split('-')[1]);
  return Array.from(result,([id,memberIds])=>({id,memberIds:memberIds.sort(numeric)})).sort((a,b)=>numeric(a.id,b.id));
}
function observed(h){return copy(h.sandbox.__groupSession.groups);}
function expect(h,groups){assert.deepEqual(observed(h),groups);assert.deepEqual(observed(h),labels(h));}
function harness(){
  let rejectSelection=false,rejectStage=false,historyCalls=0,unitCalls=0,historyThrows=0;
  const h=createHarness({beforeApp(s){
    const modules=Object.fromEntries(['ImageryModel','ImageryGroups','ImageryProvenance'].map(name=>[name,s[name]]));
    const realModel=modules.ImageryModel,realGroups=modules.ImageryGroups;
    modules.ImageryModel={...realModel,createController(...args){
      const real=realModel.createController(...args);
      return {...real,...Object.fromEntries(['stage','stageLive'].map(name=>[name,function(...values){
        return rejectStage?{ok:false,error:'Synthetic stage rejection',state:real.getState()}:real[name](...values);
      }]))};
    }};
    modules.ImageryGroups={...realGroups,canonicalSelection(...args){
      if(rejectSelection){rejectSelection=false;throw Error('Synthetic final selection rejection');}
      return realGroups.canonicalSelection(...args);
    },planHistory(...args){
      historyCalls++;try{return realGroups.planHistory(...args);}catch(error){historyThrows++;throw error;}
    },selectionUnits(...args){unitCalls++;return realGroups.selectionUnits(...args);}};
    vm.runInContext('('+installObservation.toString()+')();',s);
    for(const [name,model]of Object.entries(modules))s[name]=model;
  }});
  return Object.assign(h,{rejectSelectionOnce(){rejectSelection=true;},rejectStage(value){rejectStage=value;},
    counts:()=>({historyCalls,unitCalls,historyThrows}),draft:()=>copy(h.sandbox.__groupController.getState().draft)});
}
async function select(h,ids){
  await h.fire('clear-selection','click');
  for(const id of ids){const input=h.get('selection-'+id);input.checked=true;await h.fire(input,'change');}
}
async function group(h,ids=['object-1','object-2']){await select(h,ids);await h.fire('group-selected','click');return observed(h);}

test('observer delegates once, returns the genuine plan and snapshots empty current input, not grouped history output',()=>{
  const s={};s.window=s;vm.createContext(s);vm.runInContext('('+installObservation.toString()+')();',s);
  const document=groupFixture(2),selection={ids:['object-1','object-2'],primaryId:'object-2'},current={groups:[],selection};
  const result={groups:[{id:'group-9',memberIds:selection.ids}],selection,document},calls=[];
  s.ImageryGroups={planHistory(...args){calls.push(args);return result;}};
  const args=[document,current,{undo:[],redo:[]},'redo',1,{}];
  assert.equal(s.ImageryGroups.planHistory(...args),result);assert.equal(calls.length,1);
  args.forEach((value,index)=>assert.equal(calls[0][index],value));
  assert.deepEqual(copy(s.__groupSession),{document,selection,groups:[]});
  current.groups.push(result.groups[0]);assert.deepEqual(copy(s.__groupSession.groups),[],'snapshot is not an aliased session array');
});

test('observer retains genuine history exceptions and never promotes a nonempty speculative input or output',()=>{
  const s={};s.window=s;vm.createContext(s);vm.runInContext('('+installObservation.toString()+')();',s);
  const document=groupFixture(2),selection={ids:['object-1','object-2'],primaryId:'object-1'},groups=[{id:'group-1',memberIds:selection.ids}];
  const failure=Error('Synthetic locked history'),result={groups:[]};let reject=false,calls=0;
  s.ImageryGroups={selectionUnits(){return ['genuine unit result'];},planHistory(){calls++;if(reject)throw failure;return result;}};
  assert.deepEqual(s.ImageryGroups.selectionUnits(document,selection,groups),['genuine unit result']);
  const committed=s.__groupSession;
  assert.equal(s.ImageryGroups.planHistory(document,{selection,groups}),result);assert.equal(s.__groupSession,committed);
  reject=true;assert.throws(()=>s.ImageryGroups.planHistory(document,{selection,groups:[]}),error=>error===failure);
  assert.deepEqual(copy(s.__groupSession.groups),[]);assert.equal(calls,2);
});

test('actual app startup observes empty groups without restoring eliminated unit validation',()=>{
  const h=harness();expect(h,[]);assert.equal(h.counts().unitCalls,0);assert.ok(h.counts().historyCalls>=2);
});

test('actual Group/Ungroup and metadata Undo/Redo observe every empty and nonempty committed endpoint',async()=>{
  const h=harness(),before=h.draft(),saved=await group(h);expect(h,saved);assert.equal(saved.length,1);
  await h.fire('ungroup-selected','click');expect(h,[]);
  await h.fire('undo-move','click');expect(h,saved);
  await h.fire('redo-move','click');expect(h,[]);assert.deepEqual(h.draft(),before);
});

test('all-delete, history restoration, identical import and Discard replace stale metadata observations',async()=>{
  const h=harness(),value=groupFixture(4);await h.import(JSON.stringify(value));const saved=await group(h);
  await h.fire('select-all','click');await h.fire('delete-object','click');expect(h,[]);assert.deepEqual(h.draft().scene.objects,[]);
  await h.fire('undo-move','click');expect(h,saved);assert.deepEqual(h.draft(),value);
  await h.import(JSON.stringify(value));expect(h,[]);
  await group(h);await h.fire('discard','click');expect(h,[]);assert.deepEqual(h.draft(),value);
});

for(const grouped of [false,true])test('raw-invalid history-check skip retains '+(grouped?'nonempty':'empty')+' committed metadata',async()=>{
  const h=harness(),saved=grouped?await group(h):[],name=h.draft().scene.name,before=h.counts().historyCalls;
  await h.input('scene-name','');assert.equal(h.counts().historyCalls,before);expect(h,saved);
  await h.fire('ungroup-selected','click');assert.equal(h.counts().historyCalls,before);expect(h,saved);
  await h.input('scene-name',name);expect(h,saved);assert.ok(h.counts().historyCalls>before);
});

test('rejected final preparation or controller staging never publishes speculative metadata to the observer',async()=>{
  const h=harness();await select(h,['object-1','object-2']);h.rejectSelectionOnce();await h.fire('group-selected','click');expect(h,[]);
  const saved=await group(h),before=h.draft();h.rejectSelectionOnce();await h.fire('ungroup-selected','click');expect(h,saved);
  h.rejectStage(true);await h.fire('duplicate-object','click');expect(h,saved);assert.deepEqual(h.draft(),before);
  h.rejectStage(false);await h.fire('ungroup-selected','click');expect(h,[]);
});

test('a locked copied-group history rejection retains current nonempty groups, not the removed-copy endpoint',async()=>{
  const h=harness();await h.import(JSON.stringify(groupFixture(2)));await group(h);await h.fire('duplicate-object','click');
  await h.fire('select-all','click');await h.fire('ungroup-selected','click');expect(h,[]);
  await h.select('object-select','object-3');await h.fire('lock-selected','click');
  await h.fire('undo-move','click');const copied=observed(h);assert.equal(copied.length,2);expect(h,copied);
  const before=h.counts().historyThrows,draft=h.draft();await h.fire('undo-move','click');
  assert.ok(h.counts().historyThrows>before);expect(h,copied);assert.deepEqual(h.draft(),draft);
  await h.fire('ungroup-selected','click');expect(h,[]);
});

test('empty-group history observation survives a real locked-item rejection without adding unit validation',async()=>{
  const h=harness();await h.import(JSON.stringify(groupFixture(2)));await h.select('object-select','object-1');
  await h.fire('duplicate-object','click');await h.fire('lock-selected','click');expect(h,[]);
  const before=h.counts().historyThrows,draft=h.draft();await h.fire('undo-move','click');
  assert.ok(h.counts().historyThrows>before);expect(h,[]);assert.deepEqual(h.draft(),draft);
  assert.equal(h.counts().unitCalls,0);
});

test('placement planner diagnostic is bounded, input-only and preserves one genuine call, return or throw',()=>{
  const s={performance:{now:()=>12}};s.window=s;vm.createContext(s);vm.runInContext('('+installObservation.toString()+')();',s);
  const document=groupFixture(2),current={groups:[],selection:{ids:['object-1'],primaryId:'object-1'}},command={type:'place',x:70,y:60},result={different:'planned output'},failure=Error('Synthetic planner rejection'),calls=[];let reject=false;
  s.ImageryGroups={plan(...args){calls.push(args);if(reject)throw failure;return result;}};
  const args=[document,current,command,{}];
  assert.equal(s.ImageryGroups.plan(...args),result);assert.equal(s.__groupPlacementDiagnostic,undefined);
  s.__groupPlacementDiagnostic={commands:[],droppedCommands:0};
  for(let i=0;i<17;i++)assert.equal(s.ImageryGroups.plan(...args),result);
  reject=true;assert.throws(()=>s.ImageryGroups.plan(...args),error=>error===failure);
  assert.equal(calls.length,19);for(const call of calls)args.forEach((value,index)=>assert.equal(call[index],value));
  const trace=copy(s.__groupPlacementDiagnostic);assert.equal(trace.commands.length,16);assert.equal(trace.droppedCommands,2);
  assert.deepEqual(trace.commands[0],{time:12,command,beforeIds:['object-1','object-2']});
  command.x=20;assert.equal(s.__groupPlacementDiagnostic.commands[0].command.x,70);
});

test('placement event diagnostic retains capture/bubble causal state, caps output and removes every passive listener',()=>{
  let editorHidden=false,placing='false',hit='delete-object',objectIds=['object-1','object-2'],snapshotThrows=false;const listeners=[];
  const rect={left:0,top:0,width:390,height:844},nodes=Object.fromEntries(['editor-panel','place-object','delete-object','stage-root','scene-canvas'].map(id=>[id,{id,className:'stage-root',getBoundingClientRect:()=>{if(snapshotThrows)throw Error('Synthetic final snapshot failure');return rect;},getAttribute:()=>placing}]));
  Object.defineProperty(nodes['editor-panel'],'hidden',{get:()=>editorHidden});
  const s={performance:{now:()=>10},document:{
    getElementById:id=>nodes[id],elementFromPoint:()=>({id:hit}),
    addEventListener(type,listener,options){assert.equal(options.passive,true);listeners.push({type,listener,capture:options.capture});},
    removeEventListener(type,listener,capture){const i=listeners.findIndex(row=>row.type===type&&row.listener===listener&&row.capture===capture);assert.ok(i>=0);listeners.splice(i,1);}
  },__groupController:{getState:()=>({draft:{scene:{objects:objectIds.map(id=>({id}))}}})},__groupPointer:Array.from({length:100},(_,index)=>({index}))};
  s.window=s;vm.createContext(s);vm.runInContext('('+installPlacementObservation.toString()+')();',s);assert.equal(listeners.length,14);
  const event={type:'pointerup',timeStamp:20,isTrusted:true,target:{id:'scene-canvas'},clientX:273,clientY:506.4,pointerId:3,defaultPrevented:false};
  listeners.find(row=>row.type==='pointerup'&&row.capture).listener(event);
  editorHidden=true;placing='true';hit='scene-canvas';objectIds=[];
  listeners.find(row=>row.type==='pointerup'&&!row.capture).listener(event);
  s.__groupPlacementPoint({x:273,y:506.4});
  for(let i=0;i<70;i++)listeners.find(row=>row.type==='pointerup'&&row.capture).listener(event);
  const trace=copy(s.__groupPlacementStop());assert.equal(listeners.length,0);assert.equal(s.__groupPlacementDiagnostic,null);
  assert.equal(s.__groupPlacementPoint,undefined);assert.equal(s.__groupPlacementStop,undefined);
  assert.equal(trace.events.length,64);assert.equal(trace.droppedEvents,8);assert.equal(trace.retainedPointerEvents.length,80);
  assert.equal(trace.events[0].phase,'capture');assert.equal(trace.events[0].target,'scene-canvas');assert.equal(trace.events[0].hit,'delete-object');
  assert.deepEqual(trace.events[0].objectIds,['object-1','object-2']);assert.equal(trace.events[0].editorHidden,false);
  assert.equal(trace.events[1].phase,'bubble');assert.equal(trace.events[1].hit,'scene-canvas');assert.deepEqual(trace.events[1].objectIds,[]);
  assert.deepEqual(trace.snapshots.map(row=>row.phase),['before-activation','before-tap','after-attempt']);
  assert.equal(event.defaultPrevented,false,'passive diagnostic never suppresses input');
  vm.runInContext('('+installPlacementObservation.toString()+')();',s);snapshotThrows=true;
  assert.throws(()=>s.__groupPlacementStop(),/Synthetic final snapshot failure/);assert.equal(listeners.length,0);
  assert.equal(s.__groupPlacementDiagnostic,null);assert.equal(s.__groupPlacementPoint,undefined);assert.equal(s.__groupPlacementStop,undefined);
});

test('diagnostic collection or emission failure cannot replace a genuine placement failure or silently pass',async()=>{
  const placement=Error('Genuine placement assertion'),diagnostic=Error('Synthetic diagnostic failure');
  for(const collectionFails of [false,true])for(const reportFails of [false,true]){
    const reports=[],page={device:{name:'synthetic'},evaluate:async()=>{if(collectionFails)throw diagnostic;return {events:[]};}};
    const log=()=>{throw diagnostic;},report=message=>{reports.push(message);if(reportFails)throw Error('Synthetic error-report failure');};
    await assert.rejects(()=>reportPlacementObservation(page,placement,log,report),error=>error===placement);
    assert.equal(reports.length,1);assert.match(reports[0],/DIAGNOSTIC_FAILURE/);assert.match(reports[0],/"preservedPlacementFailure":true/);
    await assert.rejects(()=>reportPlacementObservation(page,null,log,report),error=>error===diagnostic);
  }
});
