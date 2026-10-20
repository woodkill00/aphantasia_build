'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/model.js'),G=require('../src/geometry-model.js'),E=require('../src/editor-model.js');
const {scene,styledObject,legacy,legacyObjects,copy}=require('./fixtures.cjs');
function authored(shape='rectangle',ratio='1:1'){
  const value=M.upgradeScene(scene(),{mode:'fixed',ratio});
  value.scene.objects=[M.defaultAuthoredObject('object-1',shape)];
  return value;
}
function coordinates(value){const {x,y}=value.scene.objects[0];return {x,y};}
function assertOnlyPositionChanged(before,after,x,y){
  const expected=copy(before);expected.scene.objects[0].x=x;expected.scene.objects[0].y=y;
  assert.deepEqual(after,expected);
  assert.equal(M.validateScene(after).ok,true);
}
test('arrangement defaults preserve exact zero moves and already-centered no-ops without mutating input',()=>{
  for(const value of [scene(),authored()]){
    value.scene.objects[0].x=41.23;value.scene.objects[0].y=62.89;
    const before=copy(value),out=E.translate(value,'object-1',0,0,800,400);
    assert.deepEqual(out,before);assert.notEqual(out,value);assert.notEqual(out.scene.objects[0],value.scene.objects[0]);
    assert.deepEqual(E.place(value,'object-1',41.23,62.89),before);
    const centered=E.align(value,'object-1','both');assert.deepEqual(E.align(centered,'object-1','both'),centered);
    assert.deepEqual(value,before);
  }
  assert.equal(E.HISTORY_LIMIT,40);assert.equal(M.MAX_OBJECTS,12);
});
test('normalized placement rounds to canonical hundredths and changes no other item data',()=>{
  const value=authored('star');value.scene.objects.push(M.defaultAuthoredObject('object-2','circle'));
  const before=copy(value),out=E.place(value,'object-1',41.234,62.896);
  assertOnlyPositionChanged(before,out,41.23,62.9);assert.deepEqual(value,before);
  out.scene.objects[0].geometry.sides=8;out.scene.objects[0].color.h=4;
  assert.deepEqual(value,before);
});
test('snap Off, 1, 5 and 10 quantize only the intended center across legacy and all five authored ratios',()=>{
  for(const ratio of [null,...Object.keys(G.RATIOS)]){
    const value=ratio?authored('rectangle',ratio):scene(),before=copy(value);
    for(const [step,x,y] of [[0,56.24,43.26],[1,56,43],[5,55,45],[10,60,40]]){
      assertOnlyPositionChanged(before,E.place(value,'object-1',56.24,43.26,step),x,y);
      for(const [width,height] of [[1200,500],[320,568],[400,800]]){
        const rect=M.contentRect(value,width,height),out=E.translate(value,'object-1',6.24*rect.width/100,-6.74*rect.height/100,width,height,step);
        assertOnlyPositionChanged(before,out,x,y);
      }
    }
    assert.deepEqual(value,before);
  }
});
test('snapped drag preserves grab offset and samples the immutable starting scene, not the prior snapped result',()=>{
  for(const ratio of [null,...Object.keys(G.RATIOS)]){
    const value=ratio?authored('rectangle',ratio):scene();
    value.scene.objects[0].x=42.25;value.scene.objects[0].y=61.75;
    const rect=M.contentRect(value,900,500),center={x:rect.x+42.25*rect.width/100,y:rect.y+61.75*rect.height/100};
    const grab={x:center.x+13,y:center.y-9},pointer={x:grab.x+8.5*rect.width/100,y:grab.y-7.5*rect.height/100};
    const out=E.translate(value,'object-1',pointer.x-grab.x,pointer.y-grab.y,900,500,5);
    assert.deepEqual(coordinates(out),{x:50,y:55});
    const final=E.translate(value,'object-1',3*rect.width/100,-2*rect.height/100,900,500,5);
    assert.deepEqual(coordinates(final),{x:45,y:60});assert.deepEqual(coordinates(value),{x:42.25,y:61.75});
  }
});
test('snap clamps to nearest feasible grid index rather than an off-grid inset boundary',()=>{
  for(const ratio of [null,...Object.keys(G.RATIOS)])for(const step of [1,5,10]){
    const value=ratio?authored('rectangle',ratio):scene();
    const item=value.scene.objects[0];
    if(ratio){item.geometry.rotation=37;item.geometry.height=17;item.outline.enabled=true;item.outline.width=1.3;item.shadow.enabled=true;item.shadow.offsetX=-2.4;item.shadow.offsetY=1.2;item.shadow.blur=0.7;}
    const extent=M.objectExtent(item),min=Math.ceil((1+extent)*100)/100,max=Math.floor((99-extent)*100)/100;
    const out=E.place(value,'object-1',-1e20,1e20,step),o=out.scene.objects[0];
    assert.equal(o.x,Math.ceil(min/step)*step);assert.equal(o.y,Math.floor(max/step)*step);
    assert.equal(o.x%step,0);assert.equal(o.y%step,0);assert.ok(o.x>=min&&o.y<=max);assert.equal(M.validateScene(out).ok,true);
    const shifted=E.translate(value,'object-1',-1e10,1e10,900,500,step);assert.deepEqual(shifted,out);
  }
});
test('largest valid effect envelope still has a feasible center on every supported grid',()=>{
  const value=authored('rectangle'),o=value.scene.objects[0];
  o.size=28;o.geometry.height=28;o.geometry.rotation=45;o.outline.enabled=true;o.outline.width=4;
  o.shadow.enabled=true;o.shadow.offsetX=6.4;o.shadow.offsetY=-6.4;o.shadow.blur=6;
  assert.equal(M.validateScene(value).ok,true);assert.ok(M.objectExtent(o)>48.69);
  for(const step of [1,5,10])assert.deepEqual(coordinates(E.place(value,'object-1',0,100,step)),{x:50,y:50});
  assert.deepEqual(coordinates(E.place(value,'object-1',0,100)),{x:49.7,y:50.3});
});
test('placement moves a fractional effect boundary inward when validator arithmetic would reject the nominal hundredth',()=>{
  const value=authored('dot'),o=value.scene.objects[0];o.size=1;o.geometry.height=1;o.outline.enabled=true;o.outline.width=1.3;
  assert.equal(M.objectExtent(o),1.8);assert.ok(2.8-1.8<1);
  assert.deepEqual(coordinates(E.place(value,'object-1',-1e8,1e8)),{x:2.81,y:97.2});
  assert.deepEqual(coordinates(E.translate(value,'object-1',-1e8,1e8,800,400)),{x:2.81,y:97.2});
  for(const width of [0.1,0.2,0.3,0.6,0.7,1.2,1.3,1.7,2.4,2.7,3.2,3.3,3.9,4]){
    o.outline.width=width;
    for(const step of [0,1,5,10]){
      const out=E.place(value,'object-1',-1e8,1e8,step),p=out.scene.objects[0],extent=M.objectExtent(p);
      assert.ok(p.x-extent>=1);assert.ok(p.y+extent<=99);assert.equal(M.validateScene(out).ok,true);
      if(step){assert.equal(p.x%step,0);assert.equal(p.y%step,0);}
      else{
        const min=Math.ceil((1+extent)*100),max=Math.floor((99-extent)*100);
        assert.equal(p.x,(min+(min/100-extent<1?1:0))/100);
        assert.equal(p.y,(max-(max/100+extent>99?1:0))/100);
      }
    }
  }
});
test('all authored shape families retain valid placement across ratios, rotations, effects and grids',()=>{
  let checked=0;
  for(const shape of G.SHAPES)for(const ratio of Object.keys(G.RATIOS))for(const rotation of [0,37,45,90,179,359])for(const enabled of [false,true]){
    const value=authored(shape,ratio),o=value.scene.objects[0];o.geometry.rotation=rotation;o.outline.enabled=enabled;o.shadow.enabled=enabled;
    const before=copy(value);
    for(const step of [0,1,5,10])for(const [x,y] of [[-1e20,1e20],[0,100],[24.995,75.005],[50,50]]){
      const result=E.place(value,o.id,x,y,step),p=result.scene.objects[0];
      assert.equal(M.validateScene(result).ok,true);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
      if(step){assert.equal(p.x%step,0);assert.equal(p.y%step,0);}checked++;
    }
    assert.deepEqual(value,before);
  }
  assert.equal(checked,9600);
});
test('letterbox regions remain excluded from hit selection for every authored ratio and orientation',()=>{
  for(const ratio of Object.keys(G.RATIOS))for(const [width,height] of [[1000,300],[300,1000]]){
    const value=authored('rectangle',ratio),r=M.contentRect(value,width,height);
    assert.deepEqual(E.hits(value,width,height,r.x+r.width/2,r.y+r.height/2),['object-1']);
    if(r.x>0)assert.deepEqual(E.hits(value,width,height,r.x/2,height/2),[]);
    if(r.y>0)assert.deepEqual(E.hits(value,width,height,width/2,r.y/2),[]);
  }
});
test('placement and translation reject unsupported snap values without coercion or mutation',()=>{
  const value=scene(),before=copy(value);let coerced=false;
  for(const step of [null,true,false,'0','1','5',2,0.1,-1,NaN,Infinity,[],{},()=>1,{valueOf(){coerced=true;return 5;}}]){
    assert.throws(()=>E.place(value,'object-1',50,50,step),/Snap/);
    assert.throws(()=>E.translate(value,'object-1',0,0,800,400,step),/Snap/);
  }
  assert.equal(coerced,false);assert.deepEqual(value,before);
});
test('placement rejects nonfinite or nonnumeric centers and does not repair invalid scene records',()=>{
  const value=scene(),before=copy(value);
  for(const n of [NaN,Infinity,-Infinity,undefined,null,'50',{},true]){
    assert.throws(()=>E.place(value,'object-1',n,50));assert.throws(()=>E.place(value,'object-1',50,n));
  }
  for(const id of ['missing',null,undefined,1,{}])assert.throws(()=>E.place(value,id,50,50));
  const bad=copy(value);bad.scene.objects[0].x=50.001;assert.throws(()=>E.place(bad,'object-1',50,50));
  assert.deepEqual(value,before);
});
test('translation rejects invalid fields and finite inputs whose normalized result is nonfinite',()=>{
  const value=scene(),before=copy(value);
  for(const n of [NaN,Infinity,-Infinity,null,'1',{},undefined]){
    assert.throws(()=>E.translate(value,'object-1',n,0,800,400));
    assert.throws(()=>E.translate(value,'object-1',0,n,800,400));
    assert.throws(()=>E.translate(value,'object-1',0,0,n,400));
    assert.throws(()=>E.translate(value,'object-1',0,0,800,n));
  }
  for(const n of [0,-1]){assert.throws(()=>E.translate(value,'object-1',0,0,n,400));assert.throws(()=>E.translate(value,'object-1',0,0,800,n));}
  assert.throws(()=>E.translate(value,'object-1',Number.MAX_VALUE,0,Number.MIN_VALUE,400));
  assert.throws(()=>E.translate(authored(), 'object-1',0,1,Number.MIN_VALUE,Number.MIN_VALUE));
  assert.deepEqual(value,before);
});
test('centering changes only explicitly selected axes and is never implicitly snapped',()=>{
  for(const ratio of [null,...Object.keys(G.RATIOS)]){
    const value=ratio?authored('rectangle',ratio):scene();value.scene.objects[0].x=41.23;value.scene.objects[0].y=62.89;
    const before=copy(value);
    for(const [axis,x,y] of [['x',50,62.89],['y',41.23,50],['both',50,50]])assertOnlyPositionChanged(before,E.align(value,'object-1',axis),x,y);
    assert.deepEqual(value,before);
  }
  for(const axis of [undefined,null,'horizontal','vertical','X','',0,[],{}])assert.throws(()=>E.align(scene(),'object-1',axis));
  assert.throws(()=>E.align(scene(),'missing','x'));
});
test('default translation retains exact one-unit and tenth-unit nudge steps independently of snap callers',()=>{
  for(const ratio of [null,...Object.keys(G.RATIOS)]){
    const value=ratio?authored('rectangle',ratio):scene();value.scene.objects[0].x=41.23;value.scene.objects[0].y=62.89;
    const r=M.contentRect(value,900,500);
    assert.deepEqual(coordinates(E.translate(value,'object-1',r.width/100,-r.height/100,900,500)),{x:42.23,y:61.89});
    assert.deepEqual(coordinates(E.translate(value,'object-1',r.width/1000,-r.height/1000,900,500)),{x:41.33,y:62.79});
  }
});
test('legacy translation keeps its established multiplication order at hundredth rounding ties',()=>{
  const value=scene();value.scene.objects[0].x=25;value.scene.objects[0].y=25;
  assert.deepEqual(coordinates(E.translate(value,'object-1',0.831,0.831,12,12)),{x:31.93,y:31.93});
});
test('session locks have a defensive bounded identity list and explicit idempotent release operations',()=>{
  const value=scene(),locks=E.createLocks();
  assert.ok(Object.isFrozen(locks));assert.deepEqual(locks.ids(),[]);assert.equal(locks.has('object-1'),false);
  assert.equal(locks.lock(value,'object-1'),true);assert.equal(locks.lock(copy(value),'object-1'),false);
  assert.equal(locks.has('object-1'),true);const ids=locks.ids();ids.push('object-2');ids[0]='other';
  assert.deepEqual(locks.ids(),['object-1']);assert.equal(locks.unlock('missing'),false);
  assert.equal(locks.unlock('object-1'),true);assert.equal(locks.unlock('object-1'),false);
  assert.equal(locks.clear(),false);locks.lock(value,'object-1');assert.equal(locks.clear(),true);assert.equal(locks.clear(),false);
  assert.deepEqual(locks.ids(),[]);
});
test('lock snapshots reject changes to every stored property, including disabled effects and own timing',()=>{
  const value=authored('star'),locks=E.createLocks();locks.lock(value,'object-1');const before=copy(value);
  const changes=[
    o=>o.id='object-2',o=>{o.shape='polygon';delete o.geometry.innerRatio;},o=>o.x=51,o=>o.y=49,o=>o.size=21,
    o=>o.color.h++,o=>o.color.s++,o=>o.color.l++,o=>o.outline.enabled=true,o=>o.outline.width=1.1,
    o=>o.outline.color.h++,o=>o.outline.color.s++,o=>o.outline.color.l++,
    o=>o.shadow.enabled=true,o=>o.shadow.offsetX=1.1,o=>o.shadow.offsetY=1.1,o=>o.shadow.blur=2.1,
    o=>o.shadow.color.h++,o=>o.shadow.color.s++,o=>o.shadow.color.l++,
    o=>o.timing.startMs=100,o=>o.timing.fadeInMs=100,o=>o.timing.holdMs=3100,o=>o.timing.fadeOutMs=100,
    o=>o.timing.pulse.enabled=true,o=>o.timing.pulse.minOpacity=0.81,
    o=>o.geometry.height=21,o=>o.geometry.rotation=1,o=>o.geometry.fill=true,o=>o.geometry.sides=6,o=>o.geometry.innerRatio=0.6
  ];
  for(const change of changes){const candidate=copy(value);change(candidate.scene.objects[0]);assert.equal(M.validateScene(candidate).ok,true);assert.equal(locks.allows(candidate),false);}
  assert.equal(locks.allows(value),true);assert.deepEqual(value,before);
});
test('lock snapshots are defensive against mutation of original scene and returned accepted candidates',()=>{
  const value=authored('star'),before=copy(value),locks=E.createLocks();locks.lock(value,'object-1');
  value.scene.objects[0].timing.pulse.minOpacity=0.5;value.scene.objects[0].geometry.innerRatio=0.7;
  assert.equal(locks.allows(value),false);assert.equal(locks.allows(before),true);
  const candidate=copy(before);assert.equal(locks.allows(candidate),true);candidate.scene.objects[0].outline.color.h=40;
  assert.equal(locks.allows(candidate),false);assert.equal(locks.allows(before),true);
});
test('lock guard accepts unchanged canonical records and global changes but rejects deletion',()=>{
  const value=authored(),locks=E.createLocks();value.scene.objects.push(M.defaultAuthoredObject('object-2','circle'));locks.lock(value,'object-1');
  const candidate=copy(value);candidate.scene.name='Another name';candidate.scene.background.h=20;candidate.scene.pulsePeriodMs=5000;
  candidate.scene.canvas.ratio='9:16';candidate.scene.objects[1].x=55;candidate.scene.objects.reverse();
  assert.equal(locks.allows(candidate),true);
  // Array order is deliberately outside a stored-record lock; targeted layer controls must guard separately.
  candidate.scene.objects=candidate.scene.objects.filter(o=>o.id!=='object-1');assert.equal(locks.allows(candidate),false);
  assert.deepEqual(locks.ids(),['object-1']);assert.equal(locks.allows(value),true);
});
test('canonical lock comparison is independent of input object key order and supported legacy envelope migration',()=>{
  for(const value of [legacy(),legacyObjects(),scene(),authored()]){
    const canonical=M.canonicalScene(value),locks=E.createLocks();locks.lock(value,'object-1');
    const reordered=copy(canonical);reordered.scene.objects[0]=Object.fromEntries(Object.entries(reordered.scene.objects[0]).reverse());
    reordered.scene.objects[0].color=Object.fromEntries(Object.entries(reordered.scene.objects[0].color).reverse());
    assert.equal(locks.allows(reordered),true);assert.equal(locks.allows(canonical),true);
  }
});
test('locking a changed existing ID or another scene cannot refresh or bypass earlier snapshots',()=>{
  const value=scene({objects:[styledObject(),styledObject({id:'object-2'})]}),locks=E.createLocks();locks.lock(value,'object-1');
  const candidate=copy(value);candidate.scene.objects[0].x=51;
  assert.throws(()=>locks.lock(candidate,'object-1'),/Unlock/);assert.throws(()=>locks.lock(candidate,'object-2'),/Unlock/);
  const different=scene({objects:[styledObject({id:'object-2'})]});
  assert.throws(()=>locks.lock(different,'object-2'),/Unlock/);assert.deepEqual(locks.ids(),['object-1']);
  assert.equal(locks.allows(value),true);assert.equal(locks.allows(candidate),false);assert.equal(locks.lock(value,'object-2'),true);
  assert.equal(locks.unlock('object-1'),true);assert.equal(locks.allows(candidate),true);
});
test('lock guard rejects invalid scenes even without locks and never executes accessors',()=>{
  const locks=E.createLocks();assert.equal(locks.allows(null),false);assert.equal(locks.allows({}),false);
  const invalid=scene();invalid.scene.snap=5;assert.equal(locks.allows(invalid),false);assert.throws(()=>locks.lock(invalid,'object-1'));
  let invoked=false;const value=scene();Object.defineProperty(value.scene.objects[0],'x',{enumerable:true,get(){invoked=true;return 50;}});
  assert.equal(locks.allows(value),false);assert.throws(()=>locks.lock(value,'object-1'),/accessors/);assert.equal(invoked,false);
  for(const id of ['missing',undefined,null,{},1])assert.throws(()=>locks.lock(scene(),id));
  assert.deepEqual(locks.ids(),[]);
});
test('lock identities remain within the existing twelve-item cap across cross-scene attempts',()=>{
  const value=scene({objects:Array.from({length:12},(_,i)=>styledObject({id:'object-'+(i+1)}))}),locks=E.createLocks();
  for(const item of value.scene.objects)assert.equal(locks.lock(value,item.id),true);
  assert.equal(locks.ids().length,12);assert.equal(locks.allows(value),true);
  const oversize=copy(value);oversize.scene.objects.push(styledObject({id:'object-13'}));assert.throws(()=>locks.lock(oversize,'object-13'));
  const replacement=copy(value);replacement.scene.objects[11].id='object-13';assert.throws(()=>locks.lock(replacement,'object-13'),/Unlock/);
  assert.equal(locks.ids().length,12);assert.equal(locks.has('object-13'),false);assert.equal(locks.allows(value),true);
  locks.unlock('object-12');assert.equal(locks.lock(replacement,'object-13'),true);assert.equal(locks.ids().length,12);
});
test('locks and snap never enter scene serialization or alter canonical document provenance input',()=>{
  const value=authored(),before=JSON.stringify(M.canonicalScene(value)),locks=E.createLocks();
  locks.lock(value,'object-1');assert.equal(JSON.stringify(M.canonicalScene(value)),before);locks.clear();
  assert.equal(JSON.stringify(E.place(value,'object-1',50,50,5)),before);
  assert.equal(JSON.stringify(E.align(value,'object-1','both')),before);
  assert.equal(JSON.stringify(M.canonicalScene(value)),before);
  assert.equal(/snap|locked|lockIds/.test(before),false);
});
