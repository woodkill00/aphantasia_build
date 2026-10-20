'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('../src/model.js'),Geometry=require('../src/geometry-model.js'),E=require('../src/editor-model.js'),S=require('../src/selection-model.js'),G=require('../src/group-model.js');
const copy=value=>JSON.parse(JSON.stringify(value)),bytes=JSON.stringify,Q=value=>Math.round(value*100),viewport={width:800,height:500};
function scene(count=4,authored=true,shape='dot',ratio='1:1'){
  const result=authored?M.upgradeScene(M.presets()[0],{mode:'fixed',ratio}):M.presets()[0];
  result.scene.objects=Array.from({length:count},(_,index)=>{
    const item=authored?M.defaultAuthoredObject('object-'+(index+1),shape):M.defaultObject('object-'+(index+1),shape);
    item.x=20+index%4*20;item.y=20+Math.floor(index/4)*20;return item;
  });return M.canonicalScene(result);
}
const group=(id,...members)=>({id:'group-'+id,memberIds:members.map(n=>'object-'+n)});
function selection(document,ids=document.scene.objects.map(item=>item.id),primaryId=ids[ids.length-1]||null){return {ids,primaryId};}
function state(document,groups=[],selected=selection(document)){return {groups,selection:selected};}
function plan(document,groups,command,options={},selected=selection(document)){return G.plan(document,state(document,groups,selected),command,{viewport,...options});}
function commit(document,current,history,command,options={},generation=1){const result=G.plan(document,current,command,{viewport,history,...options}),entry=G.makeTransaction(document,current,result,generation);return {...result,entry,history:G.recordHistory(history,entry)};}
function unchanged(document,groups,result){assert.equal(result.changed,false);assert.equal(result.changedScene,false);assert.equal(result.changedGroups,false);assert.equal(bytes(result.document),bytes(document));assert.deepEqual(result.groups,G.canonicalGroups(document,groups));}
function unitBounds(document,groups,selected=selection(document),vp=viewport){return G.arrangementUnitBounds(document,G.selectionUnits(document,selected,groups),vp);}
function sameOffsets(before,after,members,axes=['x','y']){const original=members.map(id=>before.scene.objects.find(item=>item.id===id)),next=members.map(id=>after.scene.objects.find(item=>item.id===id));for(let index=1;index<members.length;index++)for(const axis of axes)assert.equal(Q(next[index][axis])-Q(next[0][axis]),Q(original[index][axis])-Q(original[0][axis]));}
function edgeFixture(opposite=true){const document=scene(2),first=document.scene.objects[0];first.size=1;first.geometry.height=1;first.outline.enabled=true;first.outline.width=1.3;first.x=2.80000000001;if(opposite)document.scene.objects[1].x=98;return M.canonicalScene(document);}
function distributionFixture(axis='x'){
  const document=scene(4,true,'square');document.scene.objects.forEach(item=>{item.size=10;item.geometry.height=10;item.geometry.fill=true;item[axis==='x'?'y':'x']=50;});
  document.scene.objects.forEach((item,index)=>item[axis]=[15,38,48,85][index]);
  return {document,groups:[group(1,2,3)]};
}

test('group metadata validates 0–6 disjoint records with 2–12 current members and stable numeric order',()=>{
  const document=scene(12),groups=[group(10,12,10),group(2,4,2),group(999999,9,1)];
  assert.deepEqual(G.canonicalGroups(document,groups),[group(2,2,4),group(10,10,12),group(999999,1,9)]);
  assert.deepEqual(G.canonicalGroups(document,[]),[]);
  assert.equal(G.canonicalGroups(document,Array.from({length:6},(_,i)=>group(i+1,i*2+1,i*2+2))).length,6);
  assert.equal(G.canonicalGroups(document,[group(1,...Array.from({length:12},(_,i)=>i+1))])[0].memberIds.length,12);
  const output=G.canonicalGroups(document,groups);output[0].memberIds.push('object-3');assert.equal(groups[1].memberIds.length,2);
  const reordered=copy(document);reordered.scene.objects.reverse();assert.deepEqual(G.canonicalGroups(reordered,groups),G.canonicalGroups(document,groups));
  const nullRecord=Object.assign(Object.create(null),group(1,1,2));assert.deepEqual(G.canonicalGroups(document,[nullRecord]),[group(1,1,2)]);
});
test('closed group records reject missing/unknown keys, names, nesting, overlap, foreign IDs and malformed namespaces',()=>{
  const document=scene(12),before=bytes(document);
  for(const bad of [
    [group(1)], [group(1,1)], [group(1,1,1)], [group(1,1,13)], [group(1,1,2),group(2,2,3)], [group(1,1,2),group(1,3,4)],
    [{id:'group-1',memberIds:['group-2','object-1']}], [{id:'object-1',memberIds:['object-1','object-2']}],
    ...['group-0','group-01','group-1000000','group--1','group-1.0','group-1\n','<script>',null,1].map(id=>[{id,memberIds:['object-1','object-2']}]),
    [{id:'group-1'}], [{memberIds:['object-1','object-2']}], [{...group(1,1,2),name:'Named'}], [{...group(1,1,2),groups:[]}],
    [Object.assign(Object.create({}),group(1,1,2))], [{...group(1,1,2),[Symbol('unknown')]:1}], Array.from({length:7},(_,i)=>group(i+1,1,2))
  ])assert.throws(()=>G.canonicalGroups(document,bad));
  assert.equal(bytes(document),before);
});
test('group arrays and member arrays reject accessors, sparse arrays, custom prototypes and side properties before reads',()=>{
  const document=scene();let calls=0;
  const hostileRecord={memberIds:['object-1','object-2']};Object.defineProperty(hostileRecord,'id',{enumerable:true,get(){calls++;return 'group-1';}});
  assert.throws(()=>G.canonicalGroups(document,[hostileRecord]));
  for(const prototype of [null,{},Object.create(Array.prototype)]){const list=[group(1,1,2)];Object.setPrototypeOf(list,prototype);assert.throws(()=>G.canonicalGroups(document,list));}
  for(const key of ['extra',Symbol('extra')]){const list=[group(1,1,2)];list[key]=1;assert.throws(()=>G.canonicalGroups(document,list));const members=['object-1','object-2'];members[key]=1;assert.throws(()=>G.canonicalGroups(document,[{id:'group-1',memberIds:members}]));}
  assert.throws(()=>G.canonicalGroups(document,new Array(1)));assert.throws(()=>G.canonicalGroups(document,[{id:'group-1',memberIds:new Array(2)}]));
  for(const atGroup of [true,false]){const list=atGroup?[group(1,1,2)]:['object-1','object-2'];Object.defineProperty(list,'0',{get(){calls++;return atGroup?group(1,1,2):'object-1';}});assert.throws(()=>G.canonicalGroups(document,atGroup?list:[{id:'group-1',memberIds:list}]));}
  assert.equal(calls,0);
});
test('pure selection and every planner input reject partial groups rather than expanding',()=>{
  const document=scene(),groups=[group(1,1,3)],partial=selection(document,['object-1']);
  assert.throws(()=>G.canonicalSelection(document,partial,groups),/every member/);
  assert.throws(()=>G.reduceSelection(document,partial,groups,{type:'all'}),/every member/);
  for(const command of [{type:'group'},{type:'ungroup'},{type:'move',dx:0,dy:0},{type:'delete'},{type:'duplicate'},{type:'reorder',direction:'forward'}])assert.throws(()=>plan(document,groups,command,{},partial),/every member/);
  assert.deepEqual(G.canonicalSelection(document,selection(document,[]),groups),{ids:[],primaryId:null});
  for(const bad of [selection(document,['object-3','object-1']),selection(document,['object-1','object-3'],'group-1'),{...selection(document),groups:[]}])assert.throws(()=>G.canonicalSelection(document,bad,groups));
});
test('explicit only, checkbox, pointer, all and primary reducers expand complete units with actual chosen primary',()=>{
  const document=scene(5),groups=[group(10,1,3),group(2,2,5)],empty=selection(document,[]);let selected=empty;
  selected=G.reduceSelection(document,selected,groups,{type:'only',id:'object-3'});assert.deepEqual(selected,{ids:['object-1','object-3'],primaryId:'object-3'});
  selected=G.reduceSelection(document,selected,groups,{type:'toggle',id:'object-2'});assert.deepEqual(selected,{ids:['object-1','object-2','object-3','object-5'],primaryId:'object-2'});
  selected=G.reduceSelection(document,selected,groups,{type:'pointer',id:'object-3'});assert.equal(selected.primaryId,'object-3');assert.equal(selected.ids.length,4);
  selected=G.reduceSelection(document,selected,groups,{type:'toggle',id:'object-1'});assert.deepEqual(selected,{ids:['object-2','object-5'],primaryId:'object-5'});
  selected=G.reduceSelection(document,selected,groups,{type:'toggle',id:'object-4'});assert.equal(selected.primaryId,'object-4');
  selected=G.reduceSelection(document,selected,groups,{type:'toggle',id:'object-2'});assert.deepEqual(selected,{ids:['object-4'],primaryId:'object-4'});
  selected=G.reduceSelection(document,selected,groups,{type:'pointer',id:'object-1'});assert.deepEqual(selected,{ids:['object-1','object-3'],primaryId:'object-1'});
  selected=G.reduceSelection(document,selected,groups,{type:'all'});assert.equal(selected.ids.length,5);assert.equal(selected.primaryId,'object-1');
  selected=G.reduceSelection(document,selected,groups,{type:'primary',id:'object-5'});assert.equal(selected.ids.length,5);assert.equal(selected.primaryId,'object-5');
  selected=G.reduceSelection(document,selected,groups,{type:'only',id:'object-5'});assert.deepEqual(selected,{ids:['object-2','object-5'],primaryId:'object-5'});
  selected=G.reduceSelection(document,selected,groups,{type:'clear'});assert.deepEqual(selected,empty);
  assert.equal(G.reduceSelection(document,selected,groups,{type:'all'}).primaryId,'object-5');
  for(const action of [{type:'only',id:'group-1'},{type:'primary',id:'object-1'},{type:'clear',id:'object-1'},{type:'all',extra:1},{type:'toggle'},{type:'check',id:'object-1'}])assert.throws(()=>G.reduceSelection(document,selected,groups,action));
});
test('Group/Ungroup are exact metadata-only operations preserving residues, records, order, primary and locks',()=>{
  const document=scene();document.scene.objects[0].x=20.00000000001;document.scene.objects[1].y=20.00000000002;
  const selected=selection(document,['object-1','object-3'],'object-3'),locks=E.createLocks();locks.lock(document,'object-1');const before=bytes(document);
  const grouped=plan(document,[],{type:'group'},{locks,viewport:null},selected);
  assert.equal(bytes(grouped.document),before);assert.equal(grouped.changedScene,false);assert.equal(grouped.changedGroups,true);assert.equal(grouped.changed,true);assert.deepEqual(grouped.selection,selected);assert.deepEqual(grouped.groups,[group(1,1,3)]);assert.deepEqual(locks.ids(),['object-1']);
  unchanged(document,grouped.groups,plan(document,grouped.groups,{type:'group'},{locks},selected));
  const ungrouped=plan(document,grouped.groups,{type:'ungroup'},{locks},selected);assert.equal(bytes(ungrouped.document),before);assert.deepEqual(ungrouped.groups,[]);assert.deepEqual(ungrouped.selection,selected);assert.deepEqual(locks.ids(),['object-1']);
  unchanged(document,[],plan(document,[],{type:'ungroup'},{locks},selection(document,[])));
});
test('Group refuses merging and singleton creation; Ungroup dissolves several selected groups plus plain items together',()=>{
  const document=scene(6),groups=[group(1,1,3),group(2,2,5)];
  for(const selected of [selection(document),selection(document,['object-1','object-3','object-4']),selection(document,['object-1','object-2','object-3','object-5'])])assert.throws(()=>plan(document,groups,{type:'group'},{},selected),/Ungroup selected groups/);
  assert.throws(()=>plan(document,groups,{type:'group'},{},selection(document,['object-4'])),/at least two/);
  assert.throws(()=>plan(document,groups,{type:'group'},{},selection(document,[])));
  const selected=selection(document,['object-1','object-2','object-3','object-4','object-5'],'object-4'),out=plan(document,groups,{type:'ungroup'},{},selected);
  assert.deepEqual(out.groups,[]);assert.deepEqual(out.selection,selected);assert.deepEqual(out.targetGroupIds,['group-1','group-2']);assert.equal(out.changedScene,false);
  unchanged(document,groups,plan(document,groups,{type:'ungroup'},{},selection(document,['object-4'])));
});
test('Group/Ungroup validate closed commands/options and complete current lock snapshots even for no-ops',()=>{
  const document=scene(),groups=[group(1,1,2)],selected=selection(document,['object-1','object-2']);
  for(const command of [{type:'group',name:'x'},{type:'ungroup',id:'group-1'},{type:'group',dx:0},{type:'nested'}])assert.throws(()=>plan(document,groups,command,{},selected));
  assert.throws(()=>plan(document,groups,{type:'group'},{extra:1},selected));
  const locks=E.createLocks();locks.lock(document,'object-1');const altered=copy(document);altered.scene.objects[0].x++;
  for(const command of [{type:'group'},{type:'ungroup'}])assert.throws(()=>plan(altered,groups,command,{locks},selected),/Unlock/);
  let called=0;const hostile={ids(){return [];}};Object.defineProperty(hostile,'allows',{get(){called++;return ()=>true;}});assert.throws(()=>plan(document,groups,{type:'group'},{locks:hostile},selected));assert.equal(called,0);
  const forged={groups,selection:selected};Object.defineProperty(forged,'groups',{get(){called++;return groups;}});assert.throws(()=>G.plan(document,forged,{type:'group'}));assert.equal(called,0);
});
test('units follow earliest scene layers, not group suffixes or primary; metadata order stays independent',()=>{
  const document=scene(6),groups=[group(2,2,5),group(10,1,4)],selected=selection(document);
  const units=G.selectionUnits(document,selected,groups);assert.deepEqual(units,[{id:'group-10',groupId:'group-10',memberIds:['object-1','object-4'],index:0},{id:'group-2',groupId:'group-2',memberIds:['object-2','object-5'],index:1},{id:'object-3',groupId:null,memberIds:['object-3'],index:2},{id:'object-6',groupId:null,memberIds:['object-6'],index:5}]);
  assert.deepEqual(G.selectionUnits(document,{...selected,primaryId:'object-1'},groups),units);
  const bounds=G.arrangementUnitBounds(document,units,viewport),items=S.arrangementBounds(document,viewport);assert.deepEqual(bounds[0].x,[items[0].x[0],items[3].x[1]]);
  for(const malformed of [[{...units[0],index:1}],[{...units[0],memberIds:['object-1']}],units.slice().reverse(),[{...units[2],groupId:'group-1'}],[units[0],units[0]]])assert.throws(()=>G.arrangementUnitBounds(document,malformed,viewport));
});
test('one group cannot align/distribute its members; two units align and three units distribute',()=>{
  const document=scene(),oneGroup=[group(1,1,2,3)],three=selection(document,['object-1','object-2','object-3']);
  for(const command of [{type:'align',mode:'left'},{type:'distribute',axis:'x'}])assert.throws(()=>plan(document,oneGroup,command,{},three),/arrangement units/);
  assert.doesNotThrow(()=>plan(document,oneGroup,{type:'align',mode:'left'}));assert.throws(()=>plan(document,oneGroup,{type:'distribute',axis:'x'}),/three arrangement units/);
  assert.doesNotThrow(()=>plan(document,[group(1,1,2)],{type:'distribute',axis:'x'}));
});
test('single grouped unit centers as a rigid union while ungrouped singleton retains existing helper bytes',()=>{
  const document=scene(3,true,'triangle');document.scene.objects[0].geometry.rotation=17;document.scene.objects[1].geometry.rotation=37;
  const groups=[group(1,1,2)],selected=selection(document,['object-1','object-2'],'object-1');
  for(const axis of ['x','y','both']){const out=plan(document,groups,{type:'center',axis},{},selected);assert.deepEqual(out.document,S.plan(document,selected,{type:'center',axis},{viewport}).document);sameOffsets(document,out.document,selected.ids);assert.notEqual(out.document.scene.objects[0].x,out.document.scene.objects[1].x);}
  const single=selection(document,['object-3']);for(const axis of ['x','y','both'])assert.deepEqual(plan(document,groups,{type:'center',axis},{viewport:null},single).document,E.align(document,'object-3',axis));
  assert.throws(()=>plan(document,groups,{type:'center',axis:'x'},{viewport:null},selected));
});
test('group movement preserves exact Feature013 common lattice behavior including raw zero and orthogonal residues',()=>{
  const document=scene(4);document.scene.objects[0].x=41.23000000001;document.scene.objects[1].x=48.34000000003;document.scene.objects.forEach(item=>item.y=30.00000000001);
  const groups=[group(1,1,2)],selected=selection(document,['object-1','object-2']);
  for(const command of [{type:'move',dx:1,dy:0},{type:'nudge',dx:-0.1,dy:0.1},{type:'translate',dx:17,dy:0},{type:'place',x:50,y:30,snapStep:5}]){
    const out=plan(document,groups,command,{},selected);assert.deepEqual(out.document,S.plan(document,selected,command,{viewport}).document);sameOffsets(document,out.document,selected.ids);
  }
  for(const command of [{type:'move',dx:0,dy:0},{type:'move',dx:0.00000000001,dy:0},{type:'translate',dx:0.0001,dy:0}])unchanged(document,groups,plan(document,groups,command,{},selected));
});
test('grouped near-inset/opposite-edge zero remains feasible even when every ordinary nonzero delta is invalid',()=>{
  for(const axis of ['x','y']){
    const document=edgeFixture();if(axis==='y')document.scene.objects.forEach(item=>{[item.x,item.y]=[item.y,item.x];});const groups=[group(1,1,2)],selected=selection(document,undefined,'object-1');
    for(const amount of [-1e6,-0.01,0,0.01,1e6])unchanged(document,groups,plan(document,groups,{type:'translate',dx:axis==='x'?amount:0,dy:axis==='y'?amount:0},{viewport:{width:100,height:100}},selected));
    for(const amount of [-0.01,0.01])assert.throws(()=>plan(document,groups,{type:'move',dx:axis==='x'?amount:0,dy:axis==='y'?amount:0},{},selected));
    for(const snapStep of [1,5,10])assert.throws(()=>plan(document,groups,{type:'translate',dx:0,dy:0,snapStep},{},selected),/No common snapped position/);
    unchanged(document,groups,plan(document,groups,{type:'translate',dx:0,dy:0,snapStep:1},{},selection(document,undefined,'object-2')));
  }
});
test('all ungrouped existing operations retain the exact Feature013 singleton and multi planner outputs',()=>{
  for(const authored of [false,true])for(const count of [1,3]){
    const document=scene(count,authored);document.scene.objects[0].x=25;document.scene.objects[0].y=40.23000000001;const selected=selection(document);
    const commands=[{type:'move',dx:0,dy:0},{type:'nudge',dx:1,dy:0},{type:'translate',dx:0.831,dy:0.831},{type:'place',x:25.005,y:50},{type:'center',axis:'both'},{type:'delete'},{type:'reorder',direction:'backward'}];
    if(count===3)commands.push({type:'align',mode:'left'},{type:'distribute',axis:'x'});
    for(const command of commands){const options={viewport:{width:12,height:12}},out=G.plan(document,state(document),command,options),old=S.plan(document,selected,command,options);assert.deepEqual(out.document,old.document);assert.deepEqual(out.selection,old.selection);assert.equal(out.changed,old.changed);}
  }
});
test('geometry-free group/ungroup/data commands ignore unusable viewport while grouped geometry fails closed',()=>{
  const document=scene(4),groups=[group(1,1,2)];
  for(const badViewport of [undefined,null,{width:0,height:0},{width:Infinity,height:1},{bad:true}]){
    for(const command of [{type:'ungroup'},{type:'move',dx:1,dy:0},{type:'duplicate'},{type:'delete'},{type:'reorder',direction:'forward'}])assert.doesNotThrow(()=>plan(document,groups,command,{viewport:badViewport}));
    assert.doesNotThrow(()=>plan(document,[],{type:'group'},{viewport:badViewport}));
    for(const command of [{type:'align',mode:'left'},{type:'center',axis:'both'},{type:'distribute',axis:'x'},{type:'translate',dx:0,dy:0}])assert.throws(()=>plan(document,groups,command,{viewport:badViewport}));
  }
  for(const authored of [false,true])for(const badViewport of [{width:Number.MAX_VALUE,height:Number.MAX_VALUE},{width:Number.MIN_VALUE,height:Number.MIN_VALUE},{width:1,height:Number.MIN_VALUE}])for(const command of [{type:'align',mode:'left'},{type:'center',axis:'x'},{type:'distribute',axis:'x'},{type:'translate',dx:0,dy:0}])assert.throws(()=>plan(scene(4,authored),groups,command,{viewport:badViewport}));
});
test('unit bounds use shared geometry kinds, combined body/stroke/outline and empty space, excluding shadows',()=>{
  for(const authored of [false,true])for(const shape of ['dot','circle','pixel','triangle']){
    const document=scene(2,authored,shape),groups=[group(1,1,2)],base=unitBounds(document,groups)[0];document.scene.objects.forEach(item=>{item.outline.enabled=true;item.outline.width=1.3;});const outlined=unitBounds(document,groups)[0];
    assert.ok(outlined.x[0]<base.x[0]);assert.ok(outlined.x[1]>base.x[1]);
    document.scene.objects.forEach(item=>{item.shadow.enabled=true;item.shadow.offsetX=1;item.shadow.offsetY=-1;item.shadow.blur=1;});assert.deepEqual(unitBounds(document,groups)[0],outlined);
  }
  const document=scene(2),groups=[group(1,1,2)];document.scene.objects[0].x=10;document.scene.objects[1].x=90;assert.deepEqual(unitBounds(document,groups,selection(document),{width:100,height:100})[0].x,[9,91]);
});
test('six grouped alignments preserve member lattice offsets and become exact no-ops through 100 repetitions',()=>{
  for(const mode of G.ALIGNMENTS){
    const document=scene(4,true,'triangle'),groups=[group(1,1,2)];document.scene.objects.forEach((item,index)=>{item.x=[30,40,60,70][index];item.y=[30,40,60,70][index];item.geometry.rotation=[17,37,71,11][index];});
    const command={type:'align',mode},first=plan(document,groups,command),stable=bytes(first.document);sameOffsets(document,first.document,groups[0].memberIds);assert.deepEqual(first.groups,groups);
    const axis=['left','right','horizontal'].includes(mode)?'x':'y',pick=interval=>['horizontal','vertical'].includes(mode)?(interval[0]+interval[1])/2:interval[['left','top'].includes(mode)?0:1],edges=unitBounds(first.document,groups).map(bound=>pick(bound[axis]));assert.ok(Math.max(...edges)-Math.min(...edges)<=0.01+G.EPS);
    for(let repeat=0;repeat<100;repeat++)unchanged(first.document,groups,plan(first.document,groups,command));assert.equal(bytes(first.document),stable);
  }
});
test('grouped center X/Y/both is exact-byte idempotent for 100 repeats and leaves satisfied raw axes intact',()=>{
  const document=scene(4),groups=[group(1,1,2)];document.scene.objects[0].x=20.00000000001;document.scene.objects[3].x=80.00000000001;
  for(const axis of ['x','y','both']){const first=plan(document,groups,{type:'center',axis});sameOffsets(document,first.document,selection(document).ids);if(axis!=='y'){assert.equal(first.document.scene.objects[0].x,20.00000000001);assert.equal(first.document.scene.objects[3].x,80.00000000001);}for(let repeat=0;repeat<100;repeat++)unchanged(first.document,groups,plan(first.document,groups,{type:'center',axis}));}
});
test('concrete 10/20/10 unit widths distribute leading edges 10/40/80, preserving distinct internal centers',()=>{
  for(const axis of ['x','y']){
    const {document,groups}=distributionFixture(axis),result=plan(document,groups,{type:'distribute',axis});
    assert.deepEqual(unitBounds(result.document,groups).map(bound=>bound[axis][0]),[10,40,80]);assert.deepEqual(result.document.scene.objects.map(item=>item[axis]),[15,45,55,85]);sameOffsets(document,result.document,groups[0].memberIds);
    for(let repeat=0;repeat<100;repeat++)unchanged(result.document,groups,plan(result.document,groups,{type:'distribute',axis}));
  }
});
test('near-tolerance unit alignment/gaps preserve payloads and raw stationary axes instead of normalizing',()=>{
  const document=scene(4),groups=[group(1,1,2)];document.scene.objects.forEach((item,index)=>{item.x=[40.00000000001,42.00000000001,40.01,40.00000000002][index];item.y=30.00000000001+index*5;});
  unchanged(document,groups,plan(document,groups,{type:'align',mode:'left'}));
  for(const axis of ['x','y']){const fixture=distributionFixture(axis);fixture.document.scene.objects.forEach((item,index)=>item[axis]=[15.00000000001,45.00000000001,55.00000000001,85.00000000001][index]);unchanged(fixture.document,fixture.groups,plan(fixture.document,fixture.groups,{type:'distribute',axis}));}
});
test('grouped arrangements cover all authored shapes/ratios and legacy wide/tall viewports without drift',()=>{
  let accepted=0,rejected=0;
  for(const authored of [false,true])for(const shape of authored?Geometry.SHAPES:M.SHAPES)for(const ratio of authored?Object.keys(Geometry.RATIOS):['1:1'])for(const vp of [{width:1200,height:700},{width:320,height:760}]){
    const document=scene(4,authored,shape,ratio),groups=[group(1,1,2)];document.scene.objects.forEach((item,index)=>{item.x=[30,35,55,70][index];item.y=[30,35,55,70][index];item.outline.enabled=true;item.outline.width=0.7;if(item.geometry)item.geometry.rotation=[17,37,71,11][index];});
    M.canonicalScene(document);
    for(const command of [...G.ALIGNMENTS.map(mode=>({type:'align',mode})),...['x','y','both'].map(axis=>({type:'center',axis})),...['x','y'].map(axis=>({type:'distribute',axis}))]){
      const snapshot=bytes(document);let result;try{result=plan(document,groups,command,{viewport:vp});}catch(error){assert.match(error.message,/precision|fit|inset/);assert.equal(bytes(document),snapshot);rejected++;continue;}
      assert.equal(M.validateScene(result.document).ok,true);sameOffsets(document,result.document,groups[0].memberIds);unchanged(result.document,groups,plan(result.document,groups,command,{viewport:vp}));accepted++;
    }
  }
  assert.ok(accepted>900);assert.ok(rejected>=0);
});
test('internal-empty-space overlapping boxes reject impossible distribution atomically',()=>{
  const document=scene(6),groups=[group(1,1,2),group(2,3,4),group(3,5,6)];document.scene.objects.forEach((item,index)=>{item.x=[10,80,20,85,30,90][index];item.y=20+Math.floor(index/2)*20;});const before=bytes(document),metadata=bytes(groups);
  assert.throws(()=>plan(document,groups,{type:'distribute',axis:'x'}),/internal empty space/);assert.equal(bytes(document),before);assert.equal(bytes(groups),metadata);
});
test('shadow-conservative canonical inset failure rejects all grouped center/alignment writes',()=>{
  const document=scene(3,true,'triangle'),groups=[group(1,1,2)];document.scene.objects.forEach((item,index)=>{item.geometry.rotation=17;item.x=[45,75,70][index];item.y=[45,65,70][index];});
  document.scene.objects[0].shadow.enabled=true;document.scene.objects[0].shadow.offsetX=-12;document.scene.objects[0].shadow.offsetY=0;document.scene.objects[0].shadow.blur=4;M.canonicalScene(document);const before=bytes(document);
  assert.throws(()=>plan(document,groups,{type:'center',axis:'both'}));assert.equal(bytes(document),before);
});
test('any selected lock rejects scene-changing operations including stationary endpoints; metadata and duplicate remain allowed',()=>{
  const {document,groups}=distributionFixture(),locks=E.createLocks();locks.lock(document,'object-1');const before=bytes(document);
  for(const command of [{type:'move',dx:0,dy:0},{type:'center',axis:'x'},{type:'align',mode:'left'},{type:'distribute',axis:'x'},{type:'delete'},{type:'reorder',direction:'forward'}])assert.throws(()=>plan(document,groups,command,{locks}),/Unlock/);
  assert.doesNotThrow(()=>plan(document,groups,{type:'ungroup'},{locks}));assert.doesNotThrow(()=>plan(document,groups,{type:'duplicate'},{locks}));assert.equal(bytes(document),before);assert.deepEqual(locks.ids(),['object-1']);
});
test('duplicate remaps groups/primary in source-unit order, copies exact numeric payloads and leaves plain copies ungrouped',()=>{
  const document=scene(6),groups=[group(2,2,4),group(10,1,3)];document.scene.objects[0].x=20.00000000001;const selected=selection(document,undefined,'object-3'),locks=E.createLocks();locks.lock(document,'object-3');
  const result=plan(document,groups,{type:'duplicate'},{locks},selected);assert.equal(result.document.scene.objects.length,12);assert.deepEqual(result.document.scene.objects.slice(0,6),document.scene.objects);
  for(let index=0;index<6;index++)assert.deepEqual({...result.document.scene.objects[index+6],id:document.scene.objects[index].id},document.scene.objects[index]);
  assert.deepEqual(result.groups,[group(1,7,9),group(2,2,4),group(3,8,10),group(10,1,3)]);assert.equal(result.selection.primaryId,'object-9');assert.deepEqual(result.selection.ids,['object-7','object-8','object-9','object-10','object-11','object-12']);assert.deepEqual(locks.ids(),['object-3']);
  assert.deepEqual(G.selectionUnits(result.document,result.selection,result.groups).map(unit=>unit.groupId),['group-1','group-3',null,null]);
});
test('duplicate cap failures reject whole state; three groups may duplicate to all six groups at twelve items',()=>{
  const document=scene(6),groups=[group(1,1,2),group(2,3,4),group(3,5,6)],full=plan(document,groups,{type:'duplicate'});assert.equal(full.groups.length,6);assert.equal(full.document.scene.objects.length,12);
  const before=bytes(full.document),metadata=bytes(full.groups);assert.throws(()=>plan(full.document,full.groups,{type:'duplicate'}),/12-item/);assert.equal(bytes(full.document),before);assert.equal(bytes(full.groups),metadata);
  assert.throws(()=>plan(scene(7),[],{type:'duplicate'}),/12-item/);
});
test('delete removes full selected groups and expands nearest surviving-layer fallback with actual survivor primary',()=>{
  const document=scene(6),groups=[group(1,1,3),group(2,2,5)],selected=selection(document,['object-1','object-3'],'object-3'),result=plan(document,groups,{type:'delete'},{},selected);
  assert.deepEqual(result.document.scene.objects.map(item=>item.id),['object-2','object-4','object-5','object-6']);assert.deepEqual(result.groups,[group(2,2,5)]);assert.deepEqual(result.selection,{ids:['object-2','object-5'],primaryId:'object-2'});
  const locks=E.createLocks();locks.lock(document,'object-3');assert.throws(()=>plan(document,groups,{type:'delete'},{locks},selected));
  const empty=plan(document,groups,{type:'delete'});assert.deepEqual(empty.groups,[]);assert.deepEqual(empty.selection,{ids:[],primaryId:null});assert.equal(empty.document.scene.objects.length,0);assert.equal(M.validateScene(empty.document).ok,true);
});
test('noncontiguous group reorder crosses adjacent items without gathering or reversing subsequences',()=>{
  const document=scene(),groups=[group(1,1,3)],selected=selection(document,['object-1','object-3'],'object-3'),forward=plan(document,groups,{type:'reorder',direction:'forward'},{},selected);
  assert.deepEqual(forward.document.scene.objects.map(item=>item.id),['object-2','object-1','object-4','object-3']);assert.equal(bytes(forward.groups),bytes(groups));assert.deepEqual(forward.selection,selected);
  const backward=plan(forward.document,forward.groups,{type:'reorder',direction:'backward'},{},forward.selection);assert.deepEqual(backward.document,document);assert.equal(bytes(backward.groups),bytes(groups));
  const locks=E.createLocks();locks.lock(document,'object-2');assert.doesNotThrow(()=>plan(document,groups,{type:'reorder',direction:'forward'},{locks},selected));locks.lock(document,'object-3');assert.throws(()=>plan(document,groups,{type:'reorder',direction:'forward'},{locks},selected));
});

test('whole-state metadata history restores exact groups/selection without scene mutation or lock restoration',()=>{
  const document=scene(),selected=selection(document,['object-1','object-3'],'object-3'),initial=state(document,[],selected),locks=E.createLocks();locks.lock(document,'object-1');
  const grouped=commit(document,initial,G.emptyHistory(),{type:'group'},{locks}),entry=grouped.entry;assert.ok(Object.isFrozen(entry));assert.ok(Object.isFrozen(entry.afterGroups[0].memberIds));assert.equal(bytes(entry.before),bytes(entry.after));
  const current=state(document,grouped.groups,G.reduceSelection(document,grouped.selection,grouped.groups,{type:'only',id:'object-2'})),undone=G.planHistory(document,current,grouped.history,'undo',1,{locks});assert.deepEqual(undone.groups,[]);assert.deepEqual(undone.selection,selected);assert.equal(undone.changedScene,false);assert.equal(undone.changedGroups,true);assert.deepEqual(locks.ids(),['object-1']);
  const redone=G.planHistory(undone.document,state(undone.document,undone.groups,undone.selection),undone.history,'redo',1,{locks});assert.deepEqual(redone.groups,[group(1,1,3)]);assert.deepEqual(redone.selection,selected);assert.equal(bytes(redone.document),bytes(document));
});
test('forty mixed metadata/document transactions share one total cap and metadata branching clears redo',()=>{
  let document=scene(),current=state(document),history=G.emptyHistory();
  for(let index=0;index<60;index++){
    const command=index%3===0?{type:'group'}:index%3===1?{type:'move',dx:index%2?0.1:-0.1,dy:0}:{type:'ungroup'},out=commit(document,current,history,command);document=out.document;current=state(document,out.groups,out.selection);history=out.history;assert.equal(history.undo.length+history.redo.length,Math.min(index+1,40));
  }
  for(let index=0;index<3;index++){const out=G.planHistory(document,current,history,'undo',1);document=out.document;current=state(document,out.groups,out.selection);history=out.history;assert.equal(history.undo.length+history.redo.length,40);}
  const last=history.undo[history.undo.length-1],branch=commit(document,current,history,{type:'group'});assert.equal(branch.changedScene,false);assert.equal(branch.changedGroups,true);assert.equal(branch.history.redo.length,0);assert.equal(branch.history.undo.length,38);assert.equal(last.afterGroups.length,0);
});
test('same-group/no-group no-ops preserve undo/redo and do not allocate reserved IDs',()=>{
  const document=scene(),initial=state(document),grouped=commit(document,initial,G.emptyHistory(),{type:'group'}),moved=commit(document,state(document,grouped.groups,grouped.selection),grouped.history,{type:'move',dx:1,dy:0}),undone=G.planHistory(moved.document,state(moved.document,moved.groups,moved.selection),moved.history,'undo',1);
  const noOp=commit(undone.document,state(undone.document,undone.groups,undone.selection),undone.history,{type:'group'});assert.equal(noOp.entry,null);assert.deepEqual(noOp.history,undone.history);assert.equal(noOp.history.redo.length,1);
  const beforeGroup=G.planHistory(document,state(document,grouped.groups,grouped.selection),grouped.history,'undo',1),ungroupNoop=commit(document,state(document,[],beforeGroup.selection),beforeGroup.history,{type:'ungroup'});assert.equal(ungroupNoop.entry,null);assert.deepEqual(ungroupNoop.history,beforeGroup.history);
});
test('Undo then new Group reserves pre-branch redo identities; clearing history permits reuse without allocator mutation',()=>{
  const document=scene(),initial=state(document),first=commit(document,initial,G.emptyHistory(),{type:'group'}),undone=G.planHistory(document,state(document,first.groups,first.selection),first.history,'undo',1),branch=commit(document,state(document,undone.groups,undone.selection),undone.history,{type:'group'});
  assert.deepEqual(first.groups,[group(1,1,2,3,4)]);assert.deepEqual(branch.groups,[group(2,1,2,3,4)]);assert.equal(branch.history.redo.length,0);
  assert.deepEqual(plan(document,[],{type:'group'},{history:G.emptyHistory()}).groups,[group(1,1,2,3,4)]);
  const retried=plan(document,[],{type:'group'},{history:undone.history});assert.deepEqual(retried.groups,branch.groups);assert.deepEqual(undone.groups,[]);
});
test('duplicate reservations include all document/group endpoints in both stacks before a branch',()=>{
  const document=scene(2),grouped=commit(document,state(document),G.emptyHistory(),{type:'group'}),duplicated=commit(document,state(document,grouped.groups,grouped.selection),grouped.history,{type:'duplicate'}),undone=G.planHistory(duplicated.document,state(duplicated.document,duplicated.groups,duplicated.selection),duplicated.history,'undo',1);
  const branch=commit(undone.document,state(undone.document,undone.groups,undone.selection),undone.history,{type:'duplicate'});assert.deepEqual(branch.selection.ids,['object-5','object-6']);assert.deepEqual(branch.groups,[group(1,1,2),group(3,5,6)]);assert.equal(branch.selection.primaryId,'object-6');
  const restored=G.planHistory(undone.document,state(undone.document,undone.groups,undone.selection),undone.history,'redo',1);assert.deepEqual(restored.document,duplicated.document);assert.deepEqual(restored.groups,duplicated.groups);
});
test('history endpoint compares document plus groups, ignores later valid live selection, and checks generation',()=>{
  const document=scene(),grouped=commit(document,state(document),G.emptyHistory(),{type:'group'}),closed=state(document,grouped.groups,selection(document,[]));
  assert.doesNotThrow(()=>G.planHistory(document,closed,grouped.history,'undo',1));
  for(const wrong of [state(document,[]),state(document,[group(2,1,2,3,4)])])assert.throws(()=>G.planHistory(document,wrong,grouped.history,'undo',1),error=>error.code==='HISTORY_ENDPOINT_MISMATCH');
  assert.throws(()=>G.planHistory(document,closed,grouped.history,'undo',2),error=>error.code==='HISTORY_ENDPOINT_MISMATCH');
  const altered=copy(document);altered.scene.objects[0].x++;assert.throws(()=>G.planHistory(altered,state(altered,grouped.groups),grouped.history,'undo',1),/no longer match/);
});
test('metadata Undo restores grouped copies while retaining a new copy lock; subsequent duplicate Undo rejects atomically',()=>{
  const document=scene(2),grouped=commit(document,state(document),G.emptyHistory(),{type:'group'}),duplicated=commit(document,state(document,grouped.groups,grouped.selection),grouped.history,{type:'duplicate'}),ungrouped=commit(duplicated.document,state(duplicated.document,duplicated.groups,duplicated.selection),duplicated.history,{type:'ungroup'}),locks=E.createLocks();
  locks.lock(ungrouped.document,'object-3');const singleton=state(ungrouped.document,ungrouped.groups,selection(ungrouped.document,['object-3'])),restored=G.planHistory(ungrouped.document,singleton,ungrouped.history,'undo',1,{locks});assert.deepEqual(restored.groups,duplicated.groups);assert.deepEqual(locks.ids(),['object-3']);
  const snapshot=bytes(restored);assert.throws(()=>G.planHistory(restored.document,state(restored.document,restored.groups,restored.selection),restored.history,'undo',1,{locks}),/Unlock/);assert.equal(bytes(restored),snapshot);
  locks.clear();const removed=G.planHistory(restored.document,state(restored.document,restored.groups,restored.selection),restored.history,'undo',1,{locks});assert.deepEqual(removed.document,document);assert.deepEqual(removed.groups,grouped.groups);
});
test('targeted reorder Undo rejects a newly locked selected stationary member, unlike metadata-only history',()=>{
  const document=scene(),groups=[group(1,1,4)],selected=selection(document,['object-1','object-4']),result=commit(document,state(document,groups,selected),G.emptyHistory(),{type:'reorder',direction:'forward'}),locks=E.createLocks();locks.lock(result.document,'object-4');
  assert.throws(()=>G.planHistory(result.document,state(result.document,result.groups,result.selection),result.history,'undo',1,{locks}),/Unlock/);
});
test('history rejects foreign members, saved partial-group selection, hostile arrays, unsupported fields and false change status',()=>{
  const document=scene(),grouped=commit(document,state(document),G.emptyHistory(),{type:'group'}),base=copy(grouped.entry);
  for(const edit of [entry=>entry.afterGroups[0].memberIds.push('object-99'),entry=>entry.afterSelection={ids:['object-1'],primaryId:'object-1'},entry=>entry.targetIds=['object-1'],entry=>entry.targetGroupIds=['group-9'],entry=>entry.kind='move',entry=>entry.extra=1,entry=>entry.afterGroups[0].name='name']){const malformed=copy(base);edit(malformed);assert.throws(()=>G.canonicalHistory({undo:[malformed],redo:[]}));}
  for(const history of [{undo:new Array(1),redo:[]},{undo:[],redo:[],extra:1},{undo:Array(41).fill(base),redo:[]}])assert.throws(()=>G.canonicalHistory(history));
  const result=plan(document,[],{type:'group'});for(const altered of [{...result,changed:false},{...result,changedScene:true},{...result,changedGroups:false},{...result,targetIds:[]},{...result,unknown:1}])assert.throws(()=>G.makeTransaction(document,state(document),altered,1));
  let called=0;const hostile=copy(base);Object.defineProperty(hostile,'afterGroups',{get(){called++;return [];} });assert.throws(()=>G.canonicalHistory({undo:[hostile],redo:[]}));assert.equal(called,0);
});
test('new history entry must match both retained document and metadata endpoints before consuming redo',()=>{
  const document=scene(),one=commit(document,state(document),G.emptyHistory(),{type:'group'}),other=plan(document,[],{type:'move',dx:1,dy:0}),entry=G.makeTransaction(document,state(document),other,1);
  assert.throws(()=>G.recordHistory(one.history,entry),error=>error.code==='HISTORY_ENDPOINT_MISMATCH');
  const wrongGeneration=G.makeTransaction(document,state(document,one.groups,one.selection),plan(document,one.groups,{type:'ungroup'}),2);assert.throws(()=>G.recordHistory(one.history,wrongGeneration),/generation/);
});
test('100 repeated successful arrangements do not change exact endpoints, history or redo',()=>{
  const {document,groups}=distributionFixture(),current=state(document,groups),first=commit(document,current,G.emptyHistory(),{type:'distribute',axis:'x'}),second=commit(first.document,state(first.document,first.groups,first.selection),first.history,{type:'move',dx:0.1,dy:0}),undone=G.planHistory(second.document,state(second.document,second.groups,second.selection),second.history,'undo',1),expected=bytes(undone.history);
  for(let repeat=0;repeat<100;repeat++){const result=commit(undone.document,state(undone.document,undone.groups,undone.selection),undone.history,{type:'distribute',axis:'x'});assert.equal(result.entry,null);assert.equal(bytes(result.history),expected);assert.equal(bytes(result.document),bytes(first.document));assert.deepEqual(result.groups,groups);}
});
test('bounded allocator failure is atomic and cannot block Ungroup or geometry-free data controls',()=>{
  // Fault injection changes only the finite scan budget, not a production API.
  const source=fs.readFileSync(require.resolve('../src/group-model.js'),'utf8').replace('ITEM_SEARCH_LIMIT=985,GROUP_SEARCH_LIMIT=493','ITEM_SEARCH_LIMIT=1,GROUP_SEARCH_LIMIT=1');
  // Load the injected module in this realm, retaining all ordinary-data checks.
  const factory=new Function('require','module',source+'; return module.exports;'),limited=factory(name=>name==='./model.js'?M:S,{exports:{}}),document=scene(4),groups=[group(1,1,2)],current=state(document,groups,selection(document,['object-3','object-4'])),snapshot=bytes(current);
  assert.throws(()=>limited.plan(document,current,{type:'group'}),error=>error.code==='ID_ALLOCATION_FAILED');assert.equal(bytes(current),snapshot);
  assert.throws(()=>limited.plan(document,state(document,groups),{type:'duplicate'}),error=>error.code==='ID_ALLOCATION_FAILED');assert.doesNotThrow(()=>limited.plan(document,state(document,groups),{type:'ungroup'}));assert.doesNotThrow(()=>limited.plan(document,state(document,groups),{type:'delete'}));
  assert.doesNotThrow(()=>G.plan(document,state(document,groups),{type:'ungroup'},{history:{malformed:true}}));assert.throws(()=>G.plan(document,current,{type:'group'},{history:{malformed:true}}));
});
test('scene serialization stays group-free and strict imports reject every proposed group field',()=>{
  const document=scene(),grouped=plan(document,[],{type:'group'});assert.equal(bytes(grouped.document),bytes(document));assert.deepEqual(M.parseScene(bytes(grouped.document)),document);
  for(const key of ['groups','groupId','members','selection'])for(const atRoot of [true,false]){const bad=copy(document);(atRoot?bad:bad.scene)[key]=[];assert.throws(()=>M.parseScene(bytes(bad)));}
  const bad=copy(document);bad.scene.objects[0].groupId='group-1';assert.throws(()=>M.canonicalScene(bad));
});

test('metadata transaction validation rejects unrelated membership changes and selection-only forgery',()=>{
  const document=scene(6),selected=selection(document,['object-1','object-2']),grouped=commit(document,state(document,[],selected),G.emptyHistory(),{type:'group'});
  for(const mutate of [
    entry=>{entry.afterGroups=[group(1,3,4)];},
    entry=>{entry.afterGroups.push(group(2,3,4));},
    entry=>{entry.afterSelection=selection(document,['object-3']);},
    entry=>{entry.beforeSelection=selection(document,[]);entry.targetIds=[];},
  ]){const bad=copy(grouped.entry);mutate(bad);assert.throws(()=>G.canonicalHistory({undo:[bad],redo:[]}));}
  const groups=[group(1,1,2),group(2,3,4)],ungrouped=commit(document,state(document,groups,selected),G.emptyHistory(),{type:'ungroup'}),bad=copy(ungrouped.entry);bad.afterGroups=[];assert.throws(()=>G.canonicalHistory({undo:[bad],redo:[]}));
});
test('positive ideal unit gap that rounds into overlap rejects atomically without endpoint repair',()=>{
  for(const axis of ['x','y']){
    const document=scene(4,true,'rectangle'),groups=[group(1,1,4)];
    document.scene.objects.slice(0,3).forEach((item,index)=>{item.size=[8,15,16][index];item.geometry.height=[10,5,13][index];item.geometry.rotation=[45,33,1][index]+(axis==='y'?90:0);item.geometry.fill=true;item[axis]=[30,50,59.78][index];item[axis==='x'?'y':'x']=50;});
    document.scene.objects[3]={...copy(document.scene.objects[0]),id:'object-4'};
    const bounds=unitBounds(document,groups),span=Math.max(...bounds.map(bound=>bound[axis][1]))-Math.min(...bounds.map(bound=>bound[axis][0])),ideal=(span-bounds.reduce((sum,bound)=>sum+bound[axis][1]-bound[axis][0],0))/2;
    assert.ok(ideal>0&&ideal<0.005);const before=bytes(document);assert.throws(()=>plan(document,groups,{type:'distribute',axis}),/current coordinate precision/);assert.equal(bytes(document),before);
  }
});
test('rotated grouped endpoints remain exactly stable after first distribution over 100 repeats',()=>{
  for(const axis of ['x','y']){
    const document=scene(4,true,'rectangle'),groups=[group(1,1,4)];document.scene.objects.slice(0,3).forEach((item,index)=>{item.size=[10,20,10][index];item.geometry.height=[11,16,8][index];item.geometry.rotation=[17,37,71][index]+(axis==='y'?90:0);item.geometry.fill=true;item[axis]=[20,65,70][index];item[axis==='x'?'y':'x']=50.00000000001;});document.scene.objects[3]={...copy(document.scene.objects[0]),id:'object-4'};
    const result=plan(document,groups,{type:'distribute',axis});sameOffsets(document,result.document,groups[0].memberIds);for(let repeat=0;repeat<100;repeat++)unchanged(result.document,groups,plan(result.document,groups,{type:'distribute',axis}));
  }
});
test('forty structural whole-state snapshots bound both item/group reservations and release only evicted IDs',()=>{
  let document=scene(6),groups=[group(1,1,2),group(2,3,4),group(3,5,6)],current=state(document,groups),history=G.emptyHistory();
  for(let index=0;index<40;index++){
    const out=commit(document,current,history,index%2?{type:'delete'}:{type:'duplicate'});document=out.document;groups=out.groups;history=out.history;current=state(document,groups,index%2?selection(document):out.selection);
  }
  assert.equal(history.undo.length,40);assert.equal(document.scene.objects.length,6);assert.equal(groups.length,3);
  const planned=plan(document,groups,{type:'duplicate'},{history});assert.equal(planned.selection.ids[0],'object-127');assert.deepEqual(planned.groups.filter(group=>!groups.some(old=>old.id===group.id)).map(group=>group.id),['group-64','group-65','group-66']);
  const cleared=plan(document,groups,{type:'duplicate'},{history:G.emptyHistory()});assert.equal(cleared.selection.ids[0],'object-7');assert.deepEqual(cleared.groups.slice(3).map(group=>group.id),['group-4','group-5','group-6']);
  // The first duplicate's identities remain in one endpoint until both oldest
  // transactions have been evicted. Exactly then can the smallest text recur.
  let cursor={document,groups,selection:current.selection,history};
  for(let index=0;index<2;index++)cursor=commit(cursor.document,state(cursor.document,cursor.groups,cursor.selection),cursor.history,{type:'move',dx:0.01,dy:0});
  const evicted=plan(cursor.document,cursor.groups,{type:'duplicate'},{history:cursor.history});assert.equal(evicted.selection.ids[0],'object-7');assert.deepEqual(evicted.groups.slice(3).map(group=>group.id),['group-4','group-5','group-6']);
});

test('empty-group document delegation matches Feature013 for every whitelisted command and selection cardinality',()=>{
  let accepted=0,rejected=0;
  for(const authored of [false,true])for(const shape of ['dot','triangle'])for(const count of [0,1,2,3,6,12]){
    const document=scene(count,authored,shape),variants=[selection(document,[]),selection(document),selection(document,count?['object-'+count]:[])];
    if(count)document.scene.objects[0].y+=0.00000000001;
    const commands=[{type:'move',dx:0,dy:0},{type:'move',dx:0.01,dy:-0.01},{type:'nudge',dx:100,dy:0},{type:'translate',dx:0,dy:0},{type:'translate',dx:0.831,dy:-0.831},{type:'place',x:25.005,y:50},...['x','y','both'].map(axis=>({type:'center',axis})),...G.ALIGNMENTS.map(mode=>({type:'align',mode})),...['x','y'].map(axis=>({type:'distribute',axis})),{type:'delete'},{type:'reorder',direction:'forward'},{type:'reorder',direction:'backward'}];
    for(const selected of variants)for(const command of commands){
      const options={viewport:{width:12,height:12}},snapshot=bytes(document),session=state(document,[],selected);let expected;
      try{expected=S.plan(document,selected,command,options);}catch(error){assert.throws(()=>G.plan(document,session,command,options),actual=>actual.code===error.code);assert.equal(bytes(document),snapshot);rejected++;continue;}
      const actual=G.plan(document,session,command,options);
      for(const key of ['document','selection','changed','kind','targetIds'])assert.deepEqual(actual[key],expected[key]);
      assert.deepEqual(actual.groups,[]);assert.deepEqual(actual.targetGroupIds,[]);assert.equal(actual.changedScene,expected.changed);assert.equal(actual.changedGroups,false);assert.equal(bytes(document),snapshot);assert.deepEqual(session.groups,[]);accepted++;
    }
  }
  assert.ok(accepted>400);assert.ok(rejected>400);
});
test('empty-group delegation preserves boundary-zero, snap, half-hundredth and finite-derived viewport behavior',()=>{
  for(const document of [edgeFixture(false),edgeFixture(true),scene(2,false),scene(2,true)]){
    for(const selected of [selection(document,undefined,'object-1'),selection(document,['object-1'])])for(const command of [{type:'move',dx:0,dy:0},{type:'nudge',dx:-0.01,dy:0},{type:'translate',dx:0.0001,dy:0},{type:'translate',dx:-1e6,dy:0},{type:'translate',dx:0,dy:0,snapStep:5},{type:'place',x:25.005,y:50}]){
      const options={viewport:{width:100,height:100}};let expected;try{expected=S.plan(document,selected,command,options);}catch(error){assert.throws(()=>G.plan(document,state(document,[],selected),command,options),actual=>actual.code===error.code);continue;}
      assert.deepEqual(G.plan(document,state(document,[],selected),command,options).document,expected.document);
    }
  }
  const document=scene(3),current=state(document),snapshot=bytes(current);
  for(const badViewport of [undefined,null,{width:0,height:1},{width:Number.MAX_VALUE,height:Number.MAX_VALUE},{width:Number.MIN_VALUE,height:Number.MIN_VALUE},{width:1,height:Number.MIN_VALUE}]){
    for(const command of [{type:'translate',dx:0,dy:0},{type:'place',x:60,y:20},{type:'align',mode:'left'},{type:'distribute',axis:'x'},{type:'center',axis:'both'}])assert.throws(()=>G.plan(document,current,command,{viewport:badViewport}));
    assert.doesNotThrow(()=>G.plan(document,current,{type:'move',dx:0,dy:0},{viewport:badViewport}));
  }
  assert.equal(bytes(current),snapshot);
});
test('empty-group delegation rejects hostile session envelopes and arrays before evaluating their values',()=>{
  const document=scene(3),selected=selection(document),command={type:'move',dx:0,dy:0};let calls=0;
  const accessor=(target,key,value)=>{Object.defineProperty(target,key,{enumerable:true,get(){calls++;return value;}});return target;};
  for(const current of [
    {},{groups:[]},{selection:selected},{groups:[],selection:selected,extra:true},{groups:[],selection:selected,[Symbol('unknown')]:1},
    Object.assign(Object.create({}),{groups:[],selection:selected}),accessor({selection:selected},'groups',[]),accessor({groups:[]},'selection',selected),
    {groups:{length:0},selection:selected},{groups:Object.assign([],{extra:1}),selection:selected},{groups:Object.assign([],{[Symbol('extra')]:1}),selection:selected},
    {groups:Object.setPrototypeOf([],null),selection:selected},{groups:Object.setPrototypeOf([],{}),selection:selected},{groups:new Array(1),selection:selected},
    {groups:new Array(7),selection:selected},{groups:accessor(new Array(1),'0',group(1,1,2)),selection:selected}
  ])assert.throws(()=>G.plan(document,current,command));
  assert.equal(calls,0);
  assert.doesNotThrow(()=>G.plan(document,Object.assign(Object.create(null),{groups:[],selection:selected}),command,Object.create(null)));
});
test('empty-group delegation rejects command/options/scene/selection accessors and malformed values even for zero no-ops',()=>{
  const document=scene(3),current=state(document),zero={type:'move',dx:0,dy:0};let calls=0;
  const accessor=(target,key,value)=>{Object.defineProperty(target,key,{enumerable:true,get(){calls++;return value;}});return target;};
  for(const command of [accessor({dx:0,dy:0},'type','move'),accessor({type:'move',dy:0},'dx',0),{...zero,extra:1},{...zero,[Symbol('x')]:1},Object.assign(Object.create({}),zero),{type:'move',dx:NaN,dy:0},{type:'move',dx:0.001,dy:0},{type:'translate',dx:Infinity,dy:0},{type:'place',x:0,y:0,snapStep:2},{type:'delete',id:'object-1'},{type:'unknown'}])assert.throws(()=>G.plan(document,current,command));
  for(const key of ['locks','viewport','history'])assert.throws(()=>G.plan(document,current,zero,accessor({},key,{})));
  for(const options of [{extra:1},{[Symbol('x')]:1},Object.create({})])assert.throws(()=>G.plan(document,current,zero,options));
  for(const selected of [accessor({ids:current.selection.ids},'primaryId','object-3'),accessor({primaryId:'object-3'},'ids',current.selection.ids),{ids:new Array(1),primaryId:'object-1'},{ids:Object.assign(['object-1'],{extra:true}),primaryId:'object-1'},{ids:['object-3','object-1'],primaryId:'object-1'},{ids:['object-1','object-1'],primaryId:'object-1'},{ids:['object-99'],primaryId:'object-99'},{...current.selection,extra:1},Object.assign(Object.create({}),current.selection)])assert.throws(()=>G.plan(document,{groups:[],selection:selected},zero));
  const badScene=copy(document);accessor(badScene.scene.objects[0],'x',20);assert.throws(()=>G.plan(badScene,current,zero));
  const incomplete=copy(document);delete incomplete.scene.background;assert.throws(()=>G.plan(incomplete,current,zero));
  assert.equal(calls,0);
});
test('empty-group delegation retains source and output lock validation and selected-lock rejection before no-op',()=>{
  const document=scene(3),current=state(document),snapshot=bytes(document),locks=E.createLocks();locks.lock(document,'object-1');
  for(const command of [{type:'move',dx:0,dy:0},{type:'nudge',dx:0,dy:0},{type:'translate',dx:0,dy:0},{type:'place',x:60,y:20},{type:'align',mode:'left'},{type:'distribute',axis:'x'},{type:'center',axis:'x'},{type:'delete'},{type:'reorder',direction:'forward'}])assert.throws(()=>G.plan(document,current,command,{locks,viewport}),error=>error.code==='LOCKED');
  const altered=copy(document);altered.scene.objects[0].color.h++;assert.throws(()=>G.plan(altered,current,{type:'move',dx:0,dy:0},{locks}),error=>error.code==='LOCKED');
  const seen=[],targetRejecting={ids(){return [];},allows(candidate){seen.push(bytes(candidate));return bytes(candidate)===snapshot;}};
  assert.throws(()=>G.plan(document,current,{type:'move',dx:1,dy:0},{locks:targetRejecting}),error=>error.code==='LOCKED');assert.deepEqual(seen,[snapshot,bytes(S.plan(document,current.selection,{type:'move',dx:1,dy:0}).document)]);
  seen.length=0;const noOp=G.plan(document,current,{type:'move',dx:0,dy:0},{locks:targetRejecting});assert.equal(noOp.changed,false);assert.deepEqual(seen,[snapshot,snapshot]);assert.equal(bytes(document),snapshot);
  let called=0;const hostile={ids(){return [];}};Object.defineProperty(hostile,'allows',{get(){called++;return ()=>true;}});assert.throws(()=>G.plan(document,current,{type:'move',dx:0,dy:0},{locks:hostile}));assert.equal(called,0);
});
test('empty-group delegation returns defensive metadata, selection and document arrays without caller aliases',()=>{
  const document=scene(3),current=state(document),snapshot=bytes({document,current}),out=G.plan(document,current,{type:'move',dx:0,dy:0});
  out.groups.push(group(1,1,2));out.targetGroupIds.push('group-1');out.targetIds.push('object-99');out.selection.ids.length=0;out.document.scene.objects[0].color.h++;
  assert.equal(bytes({document,current}),snapshot);
});
test('empty current groups with group-bearing history retain no-op redo, branch endpoints and duplicate reservations',()=>{
  const document=scene(2),grouped=commit(document,state(document),G.emptyHistory(),{type:'group'}),copied=commit(document,state(document,grouped.groups,grouped.selection),grouped.history,{type:'duplicate'}),undoCopy=G.planHistory(copied.document,state(copied.document,copied.groups,copied.selection),copied.history,'undo',1),undoGroup=G.planHistory(undoCopy.document,state(undoCopy.document,undoCopy.groups,undoCopy.selection),undoCopy.history,'undo',1),current=state(undoGroup.document,undoGroup.groups,undoGroup.selection);
  assert.deepEqual(current.groups,[]);assert.equal(undoGroup.history.redo.length,2);
  const noOp=commit(undoGroup.document,current,undoGroup.history,{type:'move',dx:0,dy:0});assert.equal(noOp.entry,null);assert.deepEqual(noOp.history,undoGroup.history);
  const branch=commit(undoGroup.document,current,undoGroup.history,{type:'move',dx:1,dy:0});assert.equal(branch.history.redo.length,0);assert.deepEqual(branch.groups,[]);assert.deepEqual(branch.entry.beforeGroups,[]);assert.deepEqual(branch.entry.afterGroups,[]);
  const duplicate=commit(undoGroup.document,current,undoGroup.history,{type:'duplicate'});assert.deepEqual(duplicate.selection.ids,['object-5','object-6']);assert.deepEqual(duplicate.groups,[]);assert.equal(duplicate.history.redo.length,0);
  // An allocated command still checks the group-history schema. Nonallocating
  // commands do not inspect irrelevant nested history, just as before repair.
  let calls=0;const hostileHistory={};Object.defineProperty(hostileHistory,'undo',{get(){calls++;return [];}});Object.defineProperty(hostileHistory,'redo',{value:[]});
  assert.doesNotThrow(()=>G.plan(document,state(document),{type:'move',dx:0,dy:0},{history:hostileHistory}));assert.throws(()=>G.plan(document,state(document),{type:'duplicate'},{history:hostileHistory}));assert.equal(calls,0);
});
test('only the explicit empty-group document whitelist delegates, without forwarding group history',()=>{
  let delegated=0;const tracedSelection={...S,plan(...args){delegated++;assert.equal(Object.hasOwn(args[3],'history'),false);return S.plan(...args);}},source=fs.readFileSync(require.resolve('../src/group-model.js'),'utf8'),factory=new Function('require','module',source+'; return module.exports;'),traced=factory(name=>name==='./model.js'?M:tracedSelection,{exports:{}}),document=scene(3),current=state(document),history=G.emptyHistory();
  for(const command of [{type:'move',dx:0,dy:0},{type:'nudge',dx:0,dy:0},{type:'translate',dx:0,dy:0},{type:'place',x:60,y:20},{type:'center',axis:'x'},{type:'align',mode:'left'},{type:'distribute',axis:'x'},{type:'delete'},{type:'reorder',direction:'forward'}]){
    const prior=delegated;traced.plan(document,current,command,{viewport,history});assert.equal(delegated,prior+1);
  }
  for(const command of [{type:'group'},{type:'ungroup'},{type:'duplicate'}]){const prior=delegated;traced.plan(document,current,command,{history});assert.equal(delegated,prior);}
  const prior=delegated;assert.throws(()=>traced.plan(document,state(document,[group(1,1,2)],selection(document,['object-1'])),{type:'move',dx:0,dy:0}));assert.equal(delegated,prior);
});
test('empty-group delegation keeps exactly the inherited positive canonical-validation count, not an unchecked path',()=>{
  let canonicalCalls=0;
  function load(filename,dependencies,instrument=false){
    let source=fs.readFileSync(require.resolve(filename),'utf8');if(instrument){const marker='function canonicalScene(value) {';assert.ok(source.includes(marker));source=source.replace(marker,marker+' countCanonical();');}
    const module={exports:{}};new Function('require','module','countCanonical',source)(name=>{assert.ok(Object.hasOwn(dependencies,name));return dependencies[name];},module,()=>canonicalCalls++);return module.exports;
  }
  const model=load('../src/model.js',{'./geometry-model.js':Geometry},true),editor=load('../src/editor-model.js',{'./model.js':model}),selectionModel=load('../src/selection-model.js',{'./model.js':model,'./editor-model.js':editor}),groupsModel=load('../src/group-model.js',{'./model.js':model,'./selection-model.js':selectionModel}),document=scene(12),singleton=selection(document,['object-12']),multiple=selection(document),locks=editor.createLocks();
  document.scene.objects.forEach(item=>{item.outline.enabled=true;item.outline.width=1;item.shadow.enabled=true;item.shadow.offsetX=1;item.shadow.offsetY=1;item.shadow.blur=1;});M.canonicalScene(document);locks.lock(document,'object-1');
  function count(action){canonicalCalls=0;const result=action();return {result,calls:canonicalCalls};}
  for(const selected of [singleton,multiple])for(const command of [{type:'move',dx:0,dy:0},{type:'move',dx:0.1,dy:0},{type:'translate',dx:5,dy:0},{type:'center',axis:'x'},{type:'delete'},{type:'reorder',direction:'forward'}]){
    const options={viewport,...(selected===singleton?{locks}:{})},baseline=count(()=>selectionModel.plan(document,selected,command,options)),delegated=count(()=>groupsModel.plan(document,state(document,[],selected),command,options));
    assert.ok(baseline.calls>0);assert.equal(delegated.calls,baseline.calls);assert.deepEqual(delegated.result.document,baseline.result.document);
  }
  const command={type:'translate',dx:5,dy:0},baseline=count(()=>selectionModel.plan(document,multiple,command,{viewport})),grouped=count(()=>groupsModel.plan(document,state(document,[group(1,1,2)],multiple),command,{viewport}));assert.ok(grouped.calls>baseline.calls);sameOffsets(document,grouped.result.document,['object-1','object-2']);
});
