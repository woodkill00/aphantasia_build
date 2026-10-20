'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/model.js'),G=require('../src/geometry-model.js'),E=require('../src/editor-model.js'),S=require('../src/selection-model.js');
const copy=value=>JSON.parse(JSON.stringify(value)),bytes=JSON.stringify,Q=value=>Math.round(value*100);
const viewport={width:800,height:500};
function scene(count=3,authored=true,shape='dot',ratio='1:1'){
  const result=authored?M.upgradeScene(M.presets()[0],{mode:'fixed',ratio}):M.presets()[0];
  result.scene.objects=Array.from({length:count},(_,index)=>{
    const item=authored?M.defaultAuthoredObject('object-'+(index+1),shape):M.defaultObject('object-'+(index+1),shape);
    item.x=20+index*20;item.y=30+index*10;
    if(count>4){item.x=20+index%4*20;item.y=20+Math.floor(index/4)*20;}
    return item;
  });
  return M.canonicalScene(result);
}
function selection(document,selected=document.scene.objects.map(item=>item.id),primaryId=selected[selected.length-1]||null){return {ids:selected,primaryId};}
function plan(document,command,options={},selected=selection(document)){return S.plan(document,selected,command,{viewport,...options});}
function committed(document,selected,history,command,options={},generation=1){
  const result=S.plan(document,selected,command,options),entry=S.makeTransaction(document,selected,result,generation);
  return {...result,history:S.recordHistory(history,entry),entry};
}
function unchanged(document,result){assert.equal(result.changed,false);assert.equal(bytes(result.document),bytes(document));}
function onlyAxes(before,after,axes,selected=selection(before).ids){
  const expected=copy(before);
  for(const item of expected.scene.objects)if(selected.includes(item.id))for(const axis of axes)item[axis]=after.scene.objects.find(other=>other.id===item.id)[axis];
  assert.deepEqual(after,expected);
}
function triangleFixture(){
  const document=scene(3,true,'triangle');
  document.scene.objects.forEach((item,index)=>{item.geometry.rotation=[17,37,71][index];item.x=[40,55,70][index];item.y=[30,50,70][index];});
  return document;
}
function edgeFixture(opposite=false){
  const document=scene(2),first=document.scene.objects[0];
  first.size=1;first.geometry.height=1;first.outline.enabled=true;first.outline.width=1.3;first.x=2.80000000001;
  if(opposite)document.scene.objects[1].x=98;
  return M.canonicalScene(document);
}
test('selection canonical validation is closed, draw-ordered, defensive and group-free',()=>{
  const document=scene(),selected=selection(document,['object-1','object-3'],'object-1');
  assert.deepEqual(S.canonicalSelection(document,selected),selected);
  const out=S.canonicalSelection(document,selected);out.ids.push('object-2');assert.equal(selected.ids.length,2);
  for(const bad of [
    {ids:['object-3','object-1'],primaryId:'object-1'},
    {ids:['object-1','object-1'],primaryId:'object-1'},
    {ids:['object-9'],primaryId:'object-9'},
    {ids:['object-1'],primaryId:'object-2'},
    {ids:[],primaryId:'object-1'},
    {ids:['object-1'],primaryId:null},
    {ids:[],primaryId:null,groups:[]},
    Object.assign(Object.create({}),selected),
    {ids:['object-1'],primaryId:'object-1',[Symbol('extra')]:1}
  ])assert.throws(()=>S.canonicalSelection(document,bad));
  assert.deepEqual(S.canonicalSelection(document,{ids:[],primaryId:null}),{ids:[],primaryId:null});
  assert.deepEqual(S.canonicalSelection(document,Object.assign(Object.create(null),selected)),selected);
});
test('selection arrays reject holes, custom prototypes, symbols and accessors without invoking them',()=>{
  const document=scene();let called=0;
  const getter={ids:['object-1']};Object.defineProperty(getter,'primaryId',{enumerable:true,get(){called++;return 'object-1';}});
  assert.throws(()=>S.canonicalSelection(document,getter));
  const badArrays=[new Array(1),Object.assign(['object-1'],{extra:1}),Object.assign(['object-1'],{[Symbol('extra')]:1}),Object.setPrototypeOf(['object-1'],null)];
  const accessed=['object-1'];Object.defineProperty(accessed,'0',{get(){called++;return 'object-1';}});badArrays.push(accessed);
  for(const ids of badArrays)assert.throws(()=>S.canonicalSelection(document,{ids,primaryId:'object-1'}));
  assert.equal(called,0);
});
test('all selection reducer transitions preserve canonical scene payload and deterministic primary rules',()=>{
  const document=scene(),before=bytes(document);let selected={ids:[],primaryId:null};
  selected=S.reduceSelection(document,selected,{type:'toggle',id:'object-2'});assert.deepEqual(selected,{ids:['object-2'],primaryId:'object-2'});
  selected=S.reduceSelection(document,selected,{type:'toggle',id:'object-1'});assert.deepEqual(selected,{ids:['object-1','object-2'],primaryId:'object-1'});
  selected=S.reduceSelection(document,selected,{type:'all'});assert.deepEqual(selected,{ids:['object-1','object-2','object-3'],primaryId:'object-1'});
  selected=S.reduceSelection(document,selected,{type:'toggle',id:'object-2'});assert.equal(selected.primaryId,'object-1');
  selected=S.reduceSelection(document,selected,{type:'primary',id:'object-3'});assert.deepEqual(selected.ids,['object-1','object-3']);
  selected=S.reduceSelection(document,selected,{type:'toggle',id:'object-3'});assert.deepEqual(selected,{ids:['object-1'],primaryId:'object-1'});
  selected=S.reduceSelection(document,selected,{type:'clear'});assert.deepEqual(selected,{ids:[],primaryId:null});
  selected=S.reduceSelection(document,selected,{type:'all'});assert.equal(selected.primaryId,'object-3');
  selected=S.reduceSelection(document,selected,{type:'only',id:'object-3'});assert.deepEqual(selected,{ids:['object-3'],primaryId:'object-3'});
  assert.equal(bytes(document),before);
  for(const action of [{type:'primary',id:'object-1'},{type:'only',id:''},{type:'clear',id:'object-1'},{type:'toggle'},{type:'check',id:'object-1'},{type:'all',group:'x'}])assert.throws(()=>S.reduceSelection(document,selected,action));
});
test('operation schemas and full input validation precede no-op optimization',()=>{
  const document=scene(),before=bytes(document);
  for(const command of [
    {type:'other'},{type:'move',dx:0,dy:0,groups:[]},{type:'move',dx:0},{type:'move',dx:'0',dy:0},
    {type:'move',dx:NaN,dy:0},{type:'move',dx:Infinity,dy:0},{type:'move',dx:100.01,dy:0},{type:'move',dx:0.001,dy:0},
    {type:'move',dx:0,dy:0,snapStep:5},{type:'place',x:0,y:0,snapStep:2},{type:'translate',dx:Infinity,dy:0},
    {type:'center',axis:'z'},{type:'align',mode:'center'},{type:'distribute',axis:'both'},
    {type:'reorder',direction:'front'},{type:'delete',id:'object-1'}
  ])assert.throws(()=>plan(document,command));
  assert.throws(()=>plan(document,{type:'move',dx:0,dy:0},{extra:true}));
  const invalid=copy(document);invalid.scene.objects[0].x=0;
  assert.throws(()=>plan(invalid,{type:'move',dx:0,dy:0}));
  assert.throws(()=>S.plan(document,{ids:[],primaryId:null},{type:'delete'}));
  assert.throws(()=>S.plan(document,selection(document,['object-1']),{type:'align',mode:'left'},{viewport}));
  assert.throws(()=>S.plan(document,selection(document,['object-1','object-2']),{type:'distribute',axis:'x'},{viewport}));
  assert.equal(bytes(document),before);
});
test('exact multi-translation preserves lattice offsets and all unaffected accepted raw payloads',()=>{
  const document=scene();document.scene.objects[0].x=41.23000000001;document.scene.objects[1].x=48.34000000003;
  document.scene.objects.forEach((item,index)=>item.y=30.00000000001+index*10);
  const before=copy(document),selected=selection(document,['object-1','object-2'],'object-1');
  const result=plan(document,{type:'move',dx:1,dy:0},{},selected);
  assert.deepEqual(result.document.scene.objects.slice(0,2).map(item=>item.x),[42.23,49.34]);
  assert.equal(Q(result.document.scene.objects[1].x)-Q(result.document.scene.objects[0].x),711);
  onlyAxes(before,result.document,['x'],selected.ids);assert.deepEqual(document,before);
  for(const command of [{type:'move',dx:0,dy:0},{type:'move',dx:0.00000000001,dy:0},{type:'translate',dx:0.0001,dy:0}]){
    unchanged(document,plan(document,command,{},selected));
  }
  const result2=plan(document,{type:'move',dx:-0.1,dy:0.1},{},selected);
  assert.equal(result2.document.scene.objects[0].x,41.13);assert.equal(result2.document.scene.objects[0].y,30.1);
  assert.throws(()=>plan(document,{type:'move',dx:60,dy:0},{},selected));assert.deepEqual(document,before);
});
test('common pointer clamping never independently compresses spacing at an edge',()=>{
  for(const ratio of Object.keys(G.RATIOS)){
    const document=scene(3,true,'dot',ratio),selected=selection(document),before=copy(document);
    for(const step of [0,1,5,10]){
      const result=plan(document,{type:'translate',dx:1e6,dy:-1e6,snapStep:step},{},selected);
      const originals=document.scene.objects,after=result.document.scene.objects;
      for(let index=1;index<after.length;index++)for(const axis of ['x','y'])assert.equal(Q(after[index][axis])-Q(after[0][axis]),Q(originals[index][axis])-Q(originals[0][axis]));
      if(step){const primary=after.find(item=>item.id===selected.primaryId);assert.equal(primary.x%step,0);assert.equal(primary.y%step,0);}
      assert.equal(M.validateScene(result.document).ok,true);
    }
    assert.deepEqual(document,before);
  }
});
test('primary snap preserves off-grid member offsets and existing positive/negative half-step behavior',()=>{
  const document=scene(2);document.scene.objects[0].x=42.25;document.scene.objects[1].x=61.75;
  const selected=selection(document,undefined,'object-1');
  for(const [target,expected] of [[47.5,50],[42.5,45],[37.5,40],[47.499,45]]){
    const result=plan(document,{type:'place',x:target,y:30,snapStep:5},{},selected);
    assert.equal(result.document.scene.objects[0].x,expected);
    assert.equal(result.document.scene.objects[1].x,expected+19.5);
  }
  document.scene.objects[0].x=42.50000000001;
  const result=plan(document,{type:'translate',dx:0,dy:0,snapStep:5},{viewport:{width:100,height:100}},selected);
  assert.equal(result.document.scene.objects[0].x,45);
  for(const [dx,expected] of [[-0.005,20],[0.005,20.01]]){
    const regular=scene(2),out=plan(regular,{type:'translate',dx,dy:0},{viewport:{width:100,height:100}});
    assert.equal(out.document.scene.objects[0].x,expected);
  }
});
test('zero remains feasible outside the ordinary rounded-origin interval without inset relaxation',()=>{
  const document=edgeFixture(),before=bytes(document),selected=selection(document,undefined,'object-1');
  const rounded=copy(document);rounded.scene.objects[0].x=2.8;
  assert.equal(M.validateScene(document).ok,true);assert.equal(M.validateScene(rounded).ok,false);
  for(const dx of [0,0.00001,-0.01,-100])unchanged(document,plan(document,{type:'translate',dx,dy:0},{viewport:{width:100,height:100}},selected));
  unchanged(document,plan(document,{type:'move',dx:0,dy:0},{},selected));
  assert.throws(()=>plan(document,{type:'move',dx:-0.01,dy:0},{},selected));
  const moved=plan(document,{type:'move',dx:0.01,dy:0},{},selected);assert.equal(moved.document.scene.objects[0].x,2.81);
  assert.equal(bytes(document),before);
  const zeroOnly=edgeFixture(true);
  for(const dx of [-1e6,-0.01,0,0.01,1e6])unchanged(zeroOnly,plan(zeroOnly,{type:'translate',dx,dy:0},{viewport:{width:100,height:100}},selection(zeroOnly,undefined,'object-1')));
  for(const dx of [-0.01,0.01])assert.throws(()=>plan(zeroOnly,{type:'move',dx,dy:0}));
});
test('snap filters zero by primary grid membership instead of silently disabling snap',()=>{
  const document=edgeFixture(true);
  for(const snapStep of [1,5,10])assert.throws(()=>plan(document,{type:'translate',dx:0,dy:0,snapStep},{},selection(document,undefined,'object-1')),/No common snapped position/);
  const selected=selection(document,undefined,'object-2');
  const result=plan(document,{type:'translate',dx:0,dy:0,snapStep:1},{},selected);
  unchanged(document,result);
  assert.equal(result.document.scene.objects[0].x,2.80000000001);
});
test('mirrored Y inward-boundary zero remains exact while unsnapped movement and snap reject infeasible candidates',()=>{
  for(const opposite of [false,true]){
    const document=edgeFixture(opposite);
    document.scene.objects.forEach(item=>{[item.x,item.y]=[item.y,item.x];});
    const selected=selection(document,undefined,'object-1');
    for(const dy of [0,0.00001,-1])unchanged(document,plan(document,{type:'translate',dx:0,dy},{viewport:{width:100,height:100}},selected));
    unchanged(document,plan(document,{type:'move',dx:0,dy:0},{},selected));
    assert.throws(()=>plan(document,{type:'move',dx:0,dy:-0.01},{},selected));
    if(opposite){
      assert.throws(()=>plan(document,{type:'move',dx:0,dy:0.01},{},selected));
      for(const snapStep of [1,5,10])assert.throws(()=>plan(document,{type:'translate',dx:0,dy:0,snapStep},{},selected));
      unchanged(document,plan(document,{type:'translate',dx:0,dy:0,snapStep:1},{},selection(document,undefined,'object-2')));
    }else assert.equal(plan(document,{type:'move',dx:0,dy:0.01},{},selected).document.scene.objects[0].y,2.81);
  }
});
test('return-to-origin planning uses immutable starting payload rather than provisional coordinates',()=>{
  const document=scene(2);document.scene.objects[0].x=41.23000000001;document.scene.objects[1].x=48.34000000003;
  const selected=selection(document),history=S.emptyHistory(),snapshot=bytes(document);
  for(const dx of [8,16,24])assert.equal(plan(document,{type:'translate',dx,dy:0}).changed,true);
  const origin=plan(document,{type:'translate',dx:0,dy:0});
  assert.equal(bytes(origin.document),snapshot);
  assert.equal(S.makeTransaction(document,selected,origin,4),null);
  assert.deepEqual(S.recordHistory(history,null),history);
});
test('single-item nudge/clamping and exact position-center semantics remain compatible with helpers',()=>{
  for(const authored of [false,true])for(const shape of ['dot','triangle']){
    const document=scene(1,authored,shape),selected=selection(document),item=document.scene.objects[0];
    for(const [dx,dy] of [[100,0],[-100,0],[0,100],[0,-100],[0.1,-0.1]]){
      const expected=E.place(document,item.id,item.x+dx,item.y+dy),out=S.plan(document,selected,{type:'nudge',dx,dy});
      assert.deepEqual(out.document,expected);
    }
    for(const axis of ['x','y','both'])assert.deepEqual(S.plan(document,selected,{type:'center',axis}).document,E.align(document,item.id,axis));
    unchanged(document,S.plan(document,selected,{type:'move',dx:0,dy:0}));
  }
  const document=scene(1);document.scene.objects[0].y=40.23000000001;
  const moved=S.plan(document,selection(document),{type:'nudge',dx:1,dy:0});
  assert.equal(moved.document.scene.objects[0].y,40.23);
});
test('singleton residue/inward-edge helper compatibility is distinct from multi-item affected-axis preservation',()=>{
  for(const authored of [false,true]){
    const document=scene(2,authored),item=document.scene.objects[0];item.x=41.23000000001;item.y=48.34000000003;
    for(const command of [{type:'move',dx:1,dy:0},{type:'nudge',dx:1,dy:0},{type:'translate',dx:1,dy:0},{type:'place',x:item.x+1,y:item.y}]){
      const result=plan(document,command,{viewport:{width:100,height:100}},selection(document,['object-1']));
      assert.deepEqual(result.document,E.place(document,item.id,item.x+1,item.y));
      assert.equal(result.document.scene.objects[0].y,48.34);
    }
    const multiple=plan(document,{type:'nudge',dx:1,dy:0});assert.equal(multiple.document.scene.objects[0].y,48.34000000003);
    for(const command of [{type:'move',dx:0,dy:0},{type:'translate',dx:0,dy:0},{type:'place',x:item.x,y:item.y}])unchanged(document,plan(document,command,{viewport:{width:100,height:100}},selection(document,['object-1'])));
    const activeTiny=plan(document,{type:'translate',dx:0.0001,dy:0},{viewport:{width:100,height:100}},selection(document,['object-1']));
    assert.deepEqual(activeTiny.document,E.translate(document,item.id,0.0001,0,100,100));
  }
  const boundary=edgeFixture(),single=selection(boundary,['object-1']),item=boundary.scene.objects[0];item.y=48.34000000003;
  for(const dx of [-1,0.01,1]){
    const result=plan(boundary,{type:'nudge',dx,dy:0},{},single);
    assert.deepEqual(result.document,E.place(boundary,item.id,item.x+dx,item.y));
  }
  unchanged(boundary,plan(boundary,{type:'translate',dx:0,dy:0},{viewport:{width:100,height:100}},single));
  assert.deepEqual(plan(boundary,{type:'translate',dx:0.0001,dy:0},{viewport:{width:100,height:100}},single).document,E.translate(boundary,item.id,0.0001,0,100,100));
  const multiple=plan(boundary,{type:'nudge',dx:0.01,dy:0});assert.equal(multiple.document.scene.objects[0].y,48.34000000003);
});
test('active singleton outward clamp and same-lattice snap preserve exact established helper output',()=>{
  const document=scene(2),item=document.scene.objects[0],single=selection(document,['object-1']);
  item.x=98;item.y=48.34000000003;
  const clamped=plan(document,{type:'nudge',dx:1,dy:0},{},single);
  assert.deepEqual(clamped.document,E.place(document,item.id,99,item.y));
  assert.equal(clamped.document.scene.objects[0].x,98);assert.equal(clamped.document.scene.objects[0].y,48.34);assert.equal(clamped.changed,true);
  item.x=40.00000000001;item.y=50.00000000001;
  for(const command of [{type:'place',x:item.x,y:item.y,snapStep:5},{type:'translate',dx:0,dy:0,snapStep:5}]){
    const result=plan(document,command,{},single);
    assert.deepEqual(result.document,E.place(document,item.id,item.x,item.y,5));
    assert.equal(result.changed,true);
    assert.equal(Q(result.document.scene.objects[0].x),Q(item.x));assert.equal(Q(result.document.scene.objects[0].y),Q(item.y));
  }
  const multi=plan(document,{type:'translate',dx:0,dy:0,snapStep:5},{},selection(document,undefined,'object-1'));
  unchanged(document,multi);
});
test('singleton translate delegates exact helper arithmetic at rounding ties in legacy and authored content rectangles',()=>{
  for(const ratio of [null,...Object.keys(G.RATIOS)]){
    const document=scene(2,ratio!==null,'dot',ratio||'1:1'),item=document.scene.objects[0],single=selection(document,['object-1']);
    item.x=25;item.y=25;
    for(const viewport of [{width:12,height:12},{width:16,height:9},{width:9,height:16},{width:800,height:500}]){
      const rect=M.contentRect(document,viewport.width,viewport.height);
      for(const [dx,dy] of [[0.831,0.831],[rect.width*0.06925,rect.height*0.06925],[-0.831,0.831]])for(const snapStep of [0,1,5,10]){
        const result=plan(document,{type:'translate',dx,dy,snapStep},{viewport},single);
        assert.deepEqual(result.document,E.translate(document,item.id,dx,dy,viewport.width,viewport.height,snapStep));
      }
    }
    if(ratio===null||ratio==='1:1'){
      const result=plan(document,{type:'translate',dx:0.831,dy:0.831},{viewport:{width:12,height:12}},single);
      assert.equal(result.document.scene.objects[0].x,31.93);assert.equal(result.document.scene.objects[0].y,31.93);
    }
  }
});
test('active singleton half-hundredth placement retains helper output instead of misclassifying a rounded delta as zero',()=>{
  for(const authored of [false,true]){
    const document=scene(2,authored),item=document.scene.objects[0],single=selection(document,['object-1']);
    item.x=25;item.y=50;
    assert.ok(25.005-25<0.005);assert.equal(Q(25.005-25),0);
    const command={type:'place',x:25.005,y:50},result=plan(document,command,{},single);
    assert.deepEqual(result.document,E.place(document,item.id,25.005,50));
    assert.equal(result.document.scene.objects[0].x,25.01);assert.equal(result.changed,true);
    // The new common-delta contract is intentionally multi-item-only; it is
    // not a replacement rounding contract for existing singleton helpers.
    unchanged(document,plan(document,command,{},selection(document,undefined,'object-1')));
    const translated=plan(document,{type:'translate',dx:0.005,dy:0},{viewport:{width:100,height:100}},single);
    assert.deepEqual(translated.document,E.translate(document,item.id,0.005,0,100,100));
    assert.equal(translated.document.scene.objects[0].x,25.01);
    unchanged(document,plan(document,{type:'place',x:25,y:50},{},single));
  }
});
test('multi-item exact nudge rejects the entire out-of-bounds step rather than shorten it',()=>{
  const document=scene(2);document.scene.objects[1].x=98;const before=bytes(document);
  assert.throws(()=>S.plan(document,selection(document),{type:'nudge',dx:1,dy:0}),/All selected items/);
  assert.equal(bytes(document),before);
  unchanged(document,plan(document,{type:'translate',dx:100,dy:0}));
});
test('geometry-independent commands ignore absent or unusable viewport; geometry-dependent commands fail closed',()=>{
  const document=scene(),selected=selection(document),one=selection(document,['object-1']);
  for(const viewport of [undefined,null,{width:0,height:0},{width:Infinity,height:1},{bad:true}]){
    for(const command of [{type:'move',dx:1,dy:0},{type:'nudge',dx:0,dy:1},{type:'duplicate'},{type:'delete'},{type:'reorder',direction:'forward'}])assert.doesNotThrow(()=>S.plan(document,selected,command,{viewport}));
    assert.doesNotThrow(()=>S.plan(document,one,{type:'center',axis:'both'},{viewport}));
    for(const command of [{type:'align',mode:'left'},{type:'center',axis:'both'},{type:'distribute',axis:'x'},{type:'translate',dx:0,dy:0},{type:'place',x:50,y:50}])assert.throws(()=>S.plan(document,selected,command,{viewport}));
  }
});
test('positive finite but overflowing or underflowed geometry is rejected without guessed rectangles',()=>{
  for(const authored of [false,true]){
    const document=scene(3,authored);
    for(const viewport of [{width:Number.MAX_VALUE,height:Number.MAX_VALUE},{width:Number.MIN_VALUE,height:Number.MIN_VALUE},{width:1,height:Number.MIN_VALUE}])
      for(const command of [{type:'align',mode:'left'},{type:'center',axis:'x'},{type:'distribute',axis:'x'},{type:'translate',dx:0,dy:0}])assert.throws(()=>S.plan(document,selection(document),command,{viewport}));
    assert.throws(()=>plan(document,{type:'translate',dx:Number.MAX_VALUE,dy:0},{viewport:{width:1,height:1}}));
  }
});
test('arrangement bounds dispatch on geometry kind and include body plus one outline/stroke, not shadows',()=>{
  for(const authored of [false,true])for(const shape of ['dot','circle','pixel','triangle']){
    const document=scene(1,authored,shape),plain=S.arrangementBounds(document,{width:100,height:100})[0],item=document.scene.objects[0];
    item.outline.enabled=true;item.outline.width=1.3;
    const outlined=S.arrangementBounds(document,{width:100,height:100})[0];
    for(const axis of ['x','y']){assert.ok(Math.abs(plain[axis][0]-outlined[axis][0]-1.3)<1e-10);assert.ok(Math.abs(outlined[axis][1]-plain[axis][1]-1.3)<1e-10);}
    item.shadow.enabled=true;item.shadow.offsetX=1;item.shadow.offsetY=-1;item.shadow.blur=1;
    assert.deepEqual(S.arrangementBounds(document,{width:100,height:100})[0],outlined);
  }
  const legacy=scene(1,false,'circle'),bound=S.arrangementBounds(legacy,{width:200,height:100})[0];
  assert.deepEqual(bound.x,[14.75,25.25]);assert.deepEqual(bound.y,[19.5,40.5]);
});
test('authored bounds respect every shape and fixed ratio at different viewport scales and letterboxes',()=>{
  for(const shape of G.SHAPES)for(const ratio of Object.keys(G.RATIOS)){
    const document=scene(3,true,shape,ratio);document.scene.objects.forEach(item=>{item.geometry.rotation=37;item.outline.enabled=true;item.outline.width=0.7;});
    const baseline=S.arrangementBounds(document,{width:1200,height:700});
    for(const viewport of [{width:320,height:760},{width:640,height:360}])for(const [index,bound] of S.arrangementBounds(document,viewport).entries())for(const axis of ['x','y'])for(let edge=0;edge<2;edge++)assert.ok(Math.abs(bound[axis][edge]-baseline[index][axis][edge])<1e-10);
  }
});
test('all six source-grounded rotated-triangle alignments are idempotent through 100 repeats',()=>{
  for(const mode of S.ALIGNMENTS){
    const document=triangleFixture(),selected=selection(document),before=copy(document),command={type:'align',mode};
    const first=plan(document,command);assert.equal(first.changed,true);
    const axis=['left','right','horizontal'].includes(mode)?'x':'y';
    onlyAxes(document,first.document,[axis]);
    if(mode==='left')assert.deepEqual(first.document.scene.objects.map(item=>item.x),[40,41.52,40.22]);
    const stable=bytes(first.document);
    for(let iteration=0;iteration<100;iteration++)unchanged(first.document,plan(first.document,command));
    assert.equal(bytes(first.document),stable);assert.deepEqual(document,before);
    const entry=S.makeTransaction(document,selected,first,1),history=S.recordHistory(S.emptyHistory(),entry);
    const undone=S.planHistory(first.document,selected,history,'undo',1),redone=S.planHistory(undone.document,undone.selection,undone.history,'redo',1);
    assert.equal(bytes(redone.document),stable);
  }
});
test('alignment preserves accepted raw axes and recognizes tolerance before original-target error checks',()=>{
  const document=scene(3);document.scene.objects.forEach((item,index)=>{item.x=[40.00000000001,40.01,40.00000000002][index];item.y=30.00000000001+index*10;});
  unchanged(document,plan(document,{type:'align',mode:'left'}));
  const changed=scene(3);changed.scene.objects.forEach((item,index)=>item.y=30.00000000001+index*10);
  const result=plan(changed,{type:'align',mode:'right'});
  onlyAxes(changed,result.document,['x']);
  const reversePrimary=selection(changed,undefined,'object-1');
  assert.deepEqual(plan(changed,{type:'align',mode:'right'},{},reversePrimary).document,result.document);
});
test('alignment tolerance holds over 900 shared-geometry shape/ratio/viewport/mode fixtures',()=>{
  let checked=0;
  for(const shape of G.SHAPES)for(const ratio of Object.keys(G.RATIOS))for(const viewport of [{width:1200,height:700},{width:320,height:760},{width:640,height:360}])for(const mode of S.ALIGNMENTS){
    const document=scene(3,true,shape,ratio);document.scene.objects.forEach((item,index)=>{item.x=30+index*20;item.y=30+index*20;item.geometry.rotation=[17,37,71][index];item.outline.enabled=true;item.outline.width=0.7;});
    const result=plan(document,{type:'align',mode},{viewport});
    assert.equal(M.validateScene(result.document).ok,true);unchanged(result.document,plan(result.document,{type:'align',mode},{viewport}));checked++;
  }
  assert.equal(checked,900);
});
test('center union preserves offsets, not stacking; both-axis leaves a satisfied axis byte-identical',()=>{
  const document=scene(3);document.scene.objects[0].x=20.00000000001;document.scene.objects[2].x=80.00000000001;
  const original=copy(document),result=plan(document,{type:'center',axis:'both'});
  assert.equal(result.document.scene.objects[0].x,20.00000000001);assert.equal(result.document.scene.objects[2].x,80.00000000001);
  for(let index=1;index<3;index++)assert.equal(Q(result.document.scene.objects[index].y)-Q(result.document.scene.objects[0].y),Q(original.scene.objects[index].y)-Q(original.scene.objects[0].y));
  assert.equal(result.document.scene.objects[0].y,40);assert.equal(result.document.scene.objects[2].y,60);
  for(let iteration=0;iteration<100;iteration++)unchanged(result.document,plan(result.document,{type:'center',axis:'both'}));
  for(const axis of ['x','y','both']){
    const triangles=triangleFixture(),first=plan(triangles,{type:'center',axis});
    for(let repeat=0;repeat<100;repeat++)unchanged(first.document,plan(first.document,{type:'center',axis}));
  }
});
test('one infeasible axis prevents every multi-center write',()=>{
  const document=scene(2,true,'triangle');
  document.scene.objects.forEach(item=>{item.geometry.rotation=17;item.shadow.enabled=true;item.shadow.offsetX=0;item.shadow.offsetY=0;item.shadow.blur=0;});
  // A large conservative shadow envelope allows the source but can reject a
  // bounds-based center that ignores shadows. No individual repair is allowed.
  document.scene.objects[0].shadow.offsetX=-12;document.scene.objects[0].shadow.blur=4;
  document.scene.objects[0].x=45;document.scene.objects[0].y=45;
  document.scene.objects[1].x=75;document.scene.objects[1].y=65;
  assert.equal(M.validateScene(document).ok,true);
  const before=bytes(document);assert.throws(()=>plan(document,{type:'center',axis:'both'}));assert.equal(bytes(document),before);
});
test('equal edge gaps for unequal widths differ from equal-center spacing',()=>{
  const document=scene(3,true,'square');
  document.scene.objects.forEach((item,index)=>{item.size=[10,20,10][index];item.geometry.height=item.size;item.geometry.fill=true;item.x=[15,43,85][index];});
  const result=plan(document,{type:'distribute',axis:'x'});
  assert.deepEqual(result.document.scene.objects.map(item=>item.x),[15,50,85]);
  const bounds=S.arrangementBounds(result.document,viewport);
  assert.ok(Math.abs(bounds[1].x[0]-bounds[0].x[1]-20)<S.EPS);assert.ok(Math.abs(bounds[2].x[0]-bounds[1].x[1]-20)<S.EPS);
  onlyAxes(document,result.document,['x']);
});
test('distribution preserves raw endpoints and orthogonal axes through 100 X/Y repeats',()=>{
  for(const axis of ['x','y']){
    const document=scene(3,true,'square');
    document.scene.objects.forEach((item,index)=>{item.size=[10,20,10][index];item.geometry.height=item.size;item.geometry.fill=true;item[axis]=[20.00000000001,47.23,80.00000000001][index];item[axis==='x'?'y':'x']=30.00000000001+index*10;});
    const result=plan(document,{type:'distribute',axis});
    assert.deepEqual(result.document.scene.objects.map(item=>item[axis]),[20.00000000001,50,80.00000000001]);
    onlyAxes(document,result.document,[axis]);
    for(let repeat=0;repeat<100;repeat++)unchanged(result.document,plan(result.document,{type:'distribute',axis}));
  }
});
test('distribution uses original union span, not last-by-leading item as a fixed endpoint',()=>{
  const document=scene(3,true,'square');
  document.scene.objects.forEach((item,index)=>{item.size=[10,20,10][index];item.geometry.height=item.size;item.geometry.fill=true;item.x=[20,70,72][index];});
  const result=plan(document,{type:'distribute',axis:'x'});
  assert.deepEqual(result.document.scene.objects.map(item=>item.x),[20,47.5,75]);
  unchanged(result.document,plan(result.document,{type:'distribute',axis:'x'}));
  assert.deepEqual(result.document.scene.objects.map(item=>item.id),document.scene.objects.map(item=>item.id));
});
test('distribution tie sorting is deterministic by original draw index without layer changes',()=>{
  const document=scene(4,true,'square');
  document.scene.objects.forEach((item,index)=>{item.size=8;item.geometry.height=8;item.geometry.fill=true;item.x=[20,40,40,80][index];});
  const result=plan(document,{type:'distribute',axis:'x'});
  assert.deepEqual(result.document.scene.objects.map(item=>item.x),[20,40,60,80]);
  assert.deepEqual(result.document.scene.objects.map(item=>item.id),document.scene.objects.map(item=>item.id));
});
test('rotated unequal distribution that rounds an outer endpoint is exact-byte stable through 100 repeats',()=>{
  for(const axis of ['x','y']){
    const document=scene(3,true,'rectangle');
    document.scene.objects.forEach((item,index)=>{
      item.size=[10,20,10][index];item.geometry.height=[11,16,8][index];item.geometry.rotation=[17,37,71][index]+(axis==='y'?90:0);item.geometry.fill=true;
      item[axis]=[20,65,70][index];item[axis==='x'?'y':'x']=50.00000000001;
    });
    const original=S.arrangementBounds(document,viewport),right=Math.max(...original.map(bound=>bound[axis][1]));
    const result=plan(document,{type:'distribute',axis}),final=S.arrangementBounds(result.document,viewport),roundedRight=Math.max(...final.map(bound=>bound[axis][1]));
    assert.ok(Math.abs(right-roundedRight)>1e-5);assert.ok(Math.abs(right-roundedRight)<=0.005+S.EPS);
    onlyAxes(document,result.document,[axis]);
    for(let repeat=0;repeat<100;repeat++)unchanged(result.document,plan(result.document,{type:'distribute',axis}));
  }
});
test('negative ideal gap rejects atomically; comparison EPS does not enlarge the canonical inset',()=>{
  const document=scene(3,true,'square');
  document.scene.objects.forEach((item,index)=>{item.geometry.fill=true;item.x=40+index;});
  const before=bytes(document);assert.throws(()=>plan(document,{type:'distribute',axis:'x'}),/outer span/);assert.equal(bytes(document),before);
  const invalid=edgeFixture();invalid.scene.objects[0].x=2.8;
  assert.throws(()=>plan(invalid,{type:'move',dx:0,dy:0}),/inset/);
  assert.equal(S.EPS,1e-9);
});
test('positive ideal gap that rounds into overlap rejects without endpoint repair',()=>{
  const document=scene(3,true,'rectangle');
  document.scene.objects.forEach((item,index)=>{item.size=[8,15,16][index];item.geometry.height=[10,5,13][index];item.geometry.rotation=[45,33,1][index];item.geometry.fill=true;item.x=[30,50,59.78][index];item.y=50;});
  const bounds=S.arrangementBounds(document,viewport),span=Math.max(...bounds.map(bound=>bound.x[1]))-Math.min(...bounds.map(bound=>bound.x[0])),ideal=(span-bounds.reduce((sum,bound)=>sum+bound.x[1]-bound.x[0],0))/2;
  assert.ok(ideal>0&&ideal<0.005);
  const before=bytes(document);assert.throws(()=>plan(document,{type:'distribute',axis:'x'}),/current coordinate precision/);assert.equal(bytes(document),before);
});
test('distribution no-op comparison tolerates only fixed floating residue and preserves exact payload',()=>{
  const document=scene(3,true,'square');
  document.scene.objects.forEach((item,index)=>{item.size=10;item.geometry.height=10;item.geometry.fill=true;item.x=[30.00000000001,40,50.00000000001][index];});
  unchanged(document,plan(document,{type:'distribute',axis:'x'}));
  document.scene.objects[1].x=40.01;
  const repaired=plan(document,{type:'distribute',axis:'x'});
  assert.equal(repaired.changed,true);assert.equal(repaired.document.scene.objects[1].x,40);
  unchanged(repaired.document,plan(repaired.document,{type:'distribute',axis:'x'}));
});
test('all selected locks reject before no-op optimization, including stationary endpoints',()=>{
  const document=scene(),selected=selection(document),locks=E.createLocks();locks.lock(document,'object-3');
  const commands=[{type:'move',dx:0,dy:0},{type:'nudge',dx:0,dy:0},{type:'place',x:60,y:50},{type:'translate',dx:0,dy:0},{type:'center',axis:'x'},{type:'align',mode:'left'},{type:'distribute',axis:'x'},{type:'delete'},{type:'reorder',direction:'forward'}];
  for(const command of commands)assert.throws(()=>plan(document,command,{locks},selected),error=>error.code==='LOCKED');
  assert.deepEqual(locks.ids(),['object-3']);
  assert.deepEqual(S.reduceSelection(document,selected,{type:'only',id:'object-3'}),{ids:['object-3'],primaryId:'object-3'});
});
test('unselected locked records survive cross-layer moves but lock snapshot corruption rejects full input',()=>{
  const document=scene(),locks=E.createLocks();locks.lock(document,'object-2');
  const selected=selection(document,['object-1']);
  const result=plan(document,{type:'reorder',direction:'forward'},{locks},selected);
  assert.deepEqual(result.document.scene.objects.map(item=>item.id),['object-2','object-1','object-3']);assert.equal(locks.allows(result.document),true);
  const changed=copy(document);changed.scene.objects[1].color.h++;
  assert.throws(()=>plan(changed,{type:'duplicate'},{locks},selected),error=>error.code==='LOCKED');
  let invoked=0;const hostile={ids(){return [];}};
  Object.defineProperty(hostile,'allows',{get(){invoked++;return ()=>true;}});
  assert.throws(()=>plan(document,{type:'move',dx:0,dy:0},{locks:hostile}));assert.equal(invoked,0);
});
test('duplicate appends an exact source-order block and maps primary; locked sources remain locked, copies unlocked',()=>{
  const document=triangleFixture();document.scene.objects[0].x=40.00000000001;
  const selected=selection(document,['object-1','object-3'],'object-1'),locks=E.createLocks();locks.lock(document,'object-1');
  const result=plan(document,{type:'duplicate'},{locks},selected);
  assert.deepEqual(result.selection,{ids:['object-4','object-5'],primaryId:'object-4'});
  assert.deepEqual(result.document.scene.objects.slice(0,3),document.scene.objects);
  for(const [copyIndex,sourceIndex] of [[3,0],[4,2]]){
    const expected=copy(document.scene.objects[sourceIndex]);expected.id=result.document.scene.objects[copyIndex].id;
    assert.deepEqual(result.document.scene.objects[copyIndex],expected);
  }
  assert.deepEqual(locks.ids(),['object-1']);assert.equal(locks.has('object-4'),false);
  result.document.scene.objects[3].color.h=2;assert.notEqual(document.scene.objects[0].color.h,2);
});
test('duplicate cap preflight consumes no identity and rejects the entire batch',()=>{
  const document=scene(11),selected=selection(document,['object-1','object-2']),before=bytes(document);
  assert.throws(()=>plan(document,{type:'duplicate'},{},selected),/12-item/);
  assert.equal(bytes(document),before);
  const result=plan(document,{type:'duplicate'},{},selection(document,['object-2']));
  assert.equal(result.document.scene.objects.at(-1).id,'object-12');
  assert.equal(result.document.scene.objects.length,12);
});
test('delete atomically selects nearest survivor at first removed index and supports empty static scene',()=>{
  const document=scene(5),selected=selection(document,['object-2','object-4']);
  const result=plan(document,{type:'delete'},{},selected);
  assert.deepEqual(result.document.scene.objects.map(item=>item.id),['object-1','object-3','object-5']);
  assert.deepEqual(result.selection,{ids:['object-3'],primaryId:'object-3'});
  const end=plan(document,{type:'delete'},{},selection(document,['object-4','object-5']));assert.deepEqual(end.selection,{ids:['object-3'],primaryId:'object-3'});
  const empty=plan(document,{type:'delete'});assert.deepEqual(empty.selection,{ids:[],primaryId:null});assert.equal(empty.document.scene.objects.length,0);assert.equal(M.validateScene(empty.document).ok,true);
});
test('one-step reorder preserves stable selected and unselected order for runs and noncontiguous selections',()=>{
  const document=scene(6);
  for(const [selectedIds,direction,expected] of [
    [[1,3],'forward',[2,1,4,3,5,6]],[[2,3],'forward',[1,4,2,3,5,6]],
    [[2,4],'backward',[2,1,4,3,5,6]],[[3,4],'backward',[1,3,4,2,5,6]],
    [[1,2,5,6],'forward',[3,1,2,4,5,6]],[[1,2,5,6],'backward',[1,2,3,5,6,4]]
  ]){
    const selected=selection(document,selectedIds.map(id=>'object-'+id)),result=plan(document,{type:'reorder',direction},{},selected);
    assert.deepEqual(result.document.scene.objects.map(item=>item.id),expected.map(id=>'object-'+id));
    for(const item of result.document.scene.objects)assert.deepEqual(item,document.scene.objects.find(original=>original.id===item.id));
    assert.deepEqual(result.selection.ids,result.document.scene.objects.filter(item=>selected.ids.includes(item.id)).map(item=>item.id));
    assert.equal(result.selection.primaryId,selected.primaryId);
  }
  unchanged(document,plan(document,{type:'reorder',direction:'forward'}));
  unchanged(document,plan(document,{type:'reorder',direction:'backward'},{},selection(document,['object-1'])));
});
test('history stores exact immutable before/after documents and restores selection independent of current selection',()=>{
  const document=scene();document.scene.objects[0].x=41.23000000001;document.scene.objects[1].x=48.34000000003;
  const selected=selection(document,['object-1','object-2'],'object-1'),state=committed(document,selected,S.emptyHistory(),{type:'move',dx:1,dy:0});
  assert.equal(state.history.undo.length,1);assert.equal(state.history.redo.length,0);
  assert.ok(Object.isFrozen(state.entry));assert.ok(Object.isFrozen(state.entry.before.scene.objects[0].timing.pulse));assert.ok(Object.isFrozen(state.entry.targetIds));
  assert.throws(()=>{state.entry.before.scene.objects[0].x=70;},TypeError);
  state.document.scene.objects[2].color.h=2;assert.notEqual(state.entry.after.scene.objects[2].color.h,2);
  const after=copy(state.entry.after),other=selection(after,['object-3']),undone=S.planHistory(after,other,state.history,'undo',1);
  assert.equal(bytes(undone.document),bytes(document));assert.deepEqual(undone.selection,selected);
  const redone=S.planHistory(undone.document,selection(document,['object-3']),undone.history,'redo',1);
  assert.equal(bytes(redone.document),bytes(after));assert.deepEqual(redone.selection,selected);
});
test('no-op commands retain redo while successful new changes clear it',()=>{
  const document=triangleFixture(),selected=selection(document),aligned=committed(document,selected,S.emptyHistory(),{type:'align',mode:'left'},{viewport});
  const moved=committed(aligned.document,aligned.selection,aligned.history,{type:'move',dx:1,dy:0});
  const undone=S.planHistory(moved.document,moved.selection,moved.history,'undo',1);
  const command={type:'align',mode:'left'},noOp=plan(undone.document,command);
  const entry=S.makeTransaction(undone.document,undone.selection,noOp,1),retained=S.recordHistory(undone.history,entry);
  assert.equal(entry,null);assert.deepEqual(retained,undone.history);assert.equal(retained.redo.length,1);
  const next=committed(undone.document,undone.selection,retained,{type:'move',dx:-1,dy:0});
  assert.equal(next.history.redo.length,0);assert.equal(next.history.undo.length,2);
});
test('history mismatch is distinct from lock rejection and never mutates endpoints, stacks or selection',()=>{
  const document=scene(),selected=selection(document),state=committed(document,selected,S.emptyHistory(),{type:'move',dx:1,dy:0});
  const stacks=bytes(state.history),locks=E.createLocks();locks.lock(state.document,'object-1');
  assert.throws(()=>S.planHistory(state.document,state.selection,state.history,'undo',1,{locks}),error=>error.code==='LOCKED');
  assert.equal(bytes(state.history),stacks);locks.clear();
  const undone=S.planHistory(state.document,state.selection,state.history,'undo',1,{locks});assert.equal(undone.history.redo.length,1);
  const changed=copy(state.document);changed.scene.background.h++;
  assert.throws(()=>S.planHistory(changed,state.selection,state.history,'undo',1),error=>error.code==='HISTORY_ENDPOINT_MISMATCH');
  assert.throws(()=>S.planHistory(state.document,state.selection,state.history,'undo',2),error=>error.code==='HISTORY_ENDPOINT_MISMATCH');
  assert.equal(bytes(state.history),stacks);
});
test('history targeted reorder remains blocked by a new lock even when full item records match',()=>{
  const document=scene(),selected=selection(document,['object-1']),state=committed(document,selected,S.emptyHistory(),{type:'reorder',direction:'forward'}),locks=E.createLocks();
  locks.lock(state.document,'object-1');assert.equal(locks.allows(document),true);
  assert.throws(()=>S.planHistory(state.document,state.selection,state.history,'undo',1,{locks}),error=>error.code==='LOCKED');
  locks.clear();const undone=S.planHistory(state.document,state.selection,state.history,'undo',1,{locks});
  locks.lock(undone.document,'object-1');assert.throws(()=>S.planHistory(undone.document,undone.selection,undone.history,'redo',1,{locks}),error=>error.code==='LOCKED');
  locks.clear();assert.equal(S.planHistory(undone.document,undone.selection,undone.history,'redo',1,{locks}).changed,true);
});
test('newly locked copies block undoing duplicate; unlock permits the same retained transaction',()=>{
  const document=scene(2),selected=selection(document),state=committed(document,selected,S.emptyHistory(),{type:'duplicate'}),locks=E.createLocks();
  locks.lock(state.document,state.selection.primaryId);
  assert.throws(()=>S.planHistory(state.document,state.selection,state.history,'undo',1,{locks}),error=>error.code==='LOCKED');
  assert.equal(state.history.undo.length,1);locks.clear();
  const undone=S.planHistory(state.document,state.selection,state.history,'undo',1,{locks}),redone=S.planHistory(undone.document,undone.selection,undone.history,'redo',1,{locks});
  assert.equal(bytes(undone.document),bytes(document));assert.equal(bytes(redone.document),bytes(state.document));assert.deepEqual(redone.selection,state.selection);
});
test('bounded history counts 40 total across undo and redo, evicts oldest undo only, never grows with selection cycles',()=>{
  let document=scene(2),selected=selection(document),history=S.emptyHistory();const endpoints=[bytes(document)];
  for(let index=0;index<45;index++){
    const result=committed(document,selected,history,{type:'move',dx:index%2?-0.01:0.02,dy:0});document=result.document;selected=result.selection;history=result.history;endpoints.push(bytes(document));
    assert.ok(history.undo.length+history.redo.length<=40);
  }
  assert.equal(history.undo.length,40);assert.equal(bytes(history.undo[0].before),endpoints[5]);
  for(let index=0;index<20;index++){
    selected=S.reduceSelection(document,selected,{type:'only',id:'object-1'});
    const result=S.planHistory(document,selected,history,'undo',1);document=result.document;selected=result.selection;history=result.history;
  }
  assert.equal(history.undo.length,20);assert.equal(history.redo.length,20);
  for(let index=0;index<20;index++){const result=S.planHistory(document,selected,history,'redo',1);document=result.document;selected=result.selection;history=result.history;}
  assert.equal(history.undo.length,40);assert.equal(history.redo.length,0);assert.equal(bytes(document),endpoints.at(-1));
});
test('ID reservations include retained undo and redo snapshots and can recycle only after history clear',()=>{
  const document=scene(2),selected=selection(document,['object-1']);
  const duplicated=committed(document,selected,S.emptyHistory(),{type:'duplicate'});
  const undone=S.planHistory(duplicated.document,duplicated.selection,duplicated.history,'undo',1);
  const fresh=committed(undone.document,selected,undone.history,{type:'duplicate'},{history:undone.history});
  assert.equal(fresh.selection.primaryId,'object-4');
  const deleted=committed(duplicated.document,duplicated.selection,duplicated.history,{type:'delete'});
  const reserved=plan(deleted.document,{type:'duplicate'},{history:deleted.history},selected);assert.equal(reserved.selection.primaryId,'object-4');
  const recycled=plan(deleted.document,{type:'duplicate'},{history:S.emptyHistory()},selected);assert.equal(recycled.selection.primaryId,'object-3');
});
test('forty structural snapshots keep duplicate identity allocation bounded and history defensive',()=>{
  let document=scene(6),selected=selection(document),history=S.emptyHistory();
  for(let index=0;index<40;index++){
    const command={type:index%2?'delete':'duplicate'},result=committed(document,selected,history,command,{history});
    document=result.document;history=result.history;
    selected=index%2?selection(document):result.selection;
  }
  assert.equal(document.scene.objects.length,6);assert.equal(history.undo.length,40);
  const result=plan(document,{type:'duplicate'},{history},selected);
  assert.deepEqual(result.selection.ids,['object-127','object-128','object-129','object-130','object-131','object-132']);
  const reserved=new Set(history.undo.flatMap(entry=>[entry.before,entry.after].flatMap(endpoint=>endpoint.scene.objects.map(item=>item.id))));
  for(const id of result.selection.ids)assert.equal(reserved.has(id),false);
  assert.ok(reserved.size<=12+40*24);
});
test('history validates closed records, arrays, generations and precise original target IDs',()=>{
  const document=scene(),selected=selection(document),result=plan(document,{type:'move',dx:1,dy:0});
  for(const generation of [-1,NaN,Infinity,1.2,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>S.makeTransaction(document,selected,result,generation));
  const entry=S.makeTransaction(document,selected,result,1);
  for(const history of [{undo:[],redo:[],groups:[]},{undo:new Array(1),redo:[]},{undo:Array(41).fill(entry),redo:[]},{undo:Array(21).fill(entry),redo:Array(20).fill(entry)}])assert.throws(()=>S.recordHistory(history,null));
  for(const bad of [{...result,changed:false},{...result,groups:[]},{...result,targetIds:['object-1']}])assert.throws(()=>S.makeTransaction(document,selected,bad,1));
  const noOp=plan(document,{type:'move',dx:0,dy:0});
  for(const targetIds of [[],['object-1'],['object-999']])assert.throws(()=>S.makeTransaction(document,selected,{...noOp,targetIds},1));
  const untrusted=copy(entry);untrusted.targetIds=['object-1'];assert.throws(()=>S.recordHistory(S.emptyHistory(),untrusted));
  const poisoned=copy(entry);poisoned.beforeSelection.groups=[];assert.throws(()=>S.recordHistory(S.emptyHistory(),poisoned));
  assert.throws(()=>S.planHistory(document,selected,S.emptyHistory(),'back',1));
  assert.throws(()=>S.recordHistory({undo:[entry],redo:[]},entry),error=>error.code==='HISTORY_ENDPOINT_MISMATCH');
});
test('empty history returns a defensive no-op and restored snapshots do not require a viewport',()=>{
  const document=scene(),selected=selection(document),empty=S.emptyHistory();
  for(const direction of ['undo','redo']){
    const result=S.planHistory(document,selected,empty,direction,1);unchanged(document,result);assert.deepEqual(result.selection,selected);
    result.document.scene.objects[0].x=70;assert.notEqual(document.scene.objects[0].x,70);
  }
  const deleted=committed(document,selected,empty,{type:'delete'});
  const restored=S.planHistory(deleted.document,deleted.selection,deleted.history,'undo',1);assert.deepEqual(restored.document,document);
});
