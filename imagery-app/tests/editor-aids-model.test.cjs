'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const M=require('../src/model.js'),G=require('../src/geometry-model.js'),A=require('../src/editor-aids-model.js');
function scene(ratio=null){const value=M.presets()[0];return ratio?M.upgradeScene(value,{mode:'fixed',ratio}):value;}
function frozen(value){if(value&&typeof value==='object'){Object.values(value).forEach(frozen);Object.freeze(value);}return value;}
function close(actual,expected){assert.ok(Math.abs(actual-expected)<=Math.max(Number.MIN_VALUE,Math.abs(expected)*1e-14),`${actual} != ${expected}`);}
function checkLayout(layout,value,viewport,options){
  assert.deepEqual(Object.keys(layout),['contentRect','grid','center','effectiveInterval','count']);
  assert.deepEqual(layout.contentRect,M.contentRect(value,viewport.width,viewport.height));
  let count=0;
  for(const [axis,length] of [['x',layout.contentRect.width],['y',layout.contentRect.height]]){
    const interval=options.gridStep*Math.max(1,Math.ceil(8/(length*(options.gridStep/100))));
    assert.equal(layout.effectiveInterval[axis],interval);
    const positions=layout.grid[axis];
    assert.ok(positions.length<=99);
    assert.equal(positions.length,Math.max(0,Math.ceil(100/interval)-1));
    positions.forEach((position,index)=>{
      assert.ok(Number.isFinite(position)&&position>0&&position<length);
      assert.equal(position,length*((index+1)*interval/100));
      if(index)assert.ok(position>positions[index-1]);
    });
    if(positions.length>1)assert.ok(positions[1]-positions[0]>=8-1e-10);
    assert.deepEqual(layout.center[axis],options.centerGuides?[length/2]:[]);
    count+=positions.length;
  }
  assert.deepEqual(layout.count,{grid:count,center:options.centerGuides?2:0,total:count+(options.centerGuides?2:0)});
  assert.ok(layout.count.grid<=198&&layout.count.center<=2&&layout.count.total<=200);
}
test('editor aids export a frozen pure API and bounded constants',()=>{
  assert.equal(Object.isFrozen(A),true);
  assert.equal(Object.isFrozen(A.GRID_STEPS),true);
  assert.deepEqual(A.GRID_STEPS,[1,5,10]);
  assert.equal(A.MIN_GRID_CSS_PX,8);
  assert.equal(A.MAX_GRID_LINES,198);
  assert.equal(A.MAX_CENTER_LINES,2);
  assert.deepEqual(Object.keys(A),['GRID_STEPS','MIN_GRID_CSS_PX','MAX_GRID_LINES','MAX_CENTER_LINES','guideLayout']);
});
test('default guides use five-unit interior lines, no center guides and no edge lines',()=>{
  const value=scene(),viewport={width:1000,height:800},layout=A.guideLayout(value,viewport);
  checkLayout(layout,value,viewport,{gridStep:5,centerGuides:false});
  layout.grid.x.forEach((position,i)=>close(position,(i+1)*50));
  layout.grid.y.forEach((position,i)=>close(position,(i+1)*40));
  assert.deepEqual(layout.count,{grid:38,center:0,total:38});
  assert.deepEqual(layout,A.guideLayout(value,viewport,{}));
  assert.deepEqual(layout,A.guideLayout(value,viewport,{gridStep:5}));
  assert.deepEqual(layout,A.guideLayout(value,viewport,{centerGuides:false}));
});
test('independent center lines may coincide with grid lines without changing either grid',()=>{
  const value=scene(),viewport={width:800,height:1000},plain=A.guideLayout(value,viewport,{gridStep:1}),marked=A.guideLayout(value,viewport,{gridStep:1,centerGuides:true});
  assert.deepEqual(plain.grid,marked.grid);
  assert.deepEqual(marked.center,{x:[400],y:[500]});
  assert.equal(marked.grid.x.includes(400),true);
  assert.equal(marked.grid.y.includes(500),true);
  assert.deepEqual(marked.count,{grid:198,center:2,total:200});
});
for(const ratio of [null,...Object.keys(G.RATIOS)])for(const [width,height] of [[1280,800],[320,760],[640,360],[320,280],[80,31],[3,5],[10000,10000],[333.3,77.7]]){
  test(`guide layout fits ${ratio||'legacy viewport'} ${width}x${height} at each supported grid step`,()=>{
    const value=scene(ratio),viewport={width,height};
    for(const gridStep of A.GRID_STEPS)for(const centerGuides of [false,true])checkLayout(A.guideLayout(value,viewport,{gridStep,centerGuides}),value,viewport,{gridStep,centerGuides});
  });
}
test('narrow previews disclose exact per-axis integer-stride thinning without shifting the origin',()=>{
  const layout=A.guideLayout(scene(),{width:80,height:31},{gridStep:1,centerGuides:true});
  assert.deepEqual(layout.effectiveInterval,{x:10,y:26});
  assert.deepEqual(layout.grid.x,[8,16,24,32,40,48,56,64,72]);
  assert.deepEqual(layout.grid.y,[31*0.26,31*0.52,31*0.78]);
  assert.deepEqual(layout.center,{x:[40],y:[15.5]});
  const odd=A.guideLayout(scene(),{width:79.99,height:159},{gridStep:5});
  assert.deepEqual(odd.effectiveInterval,{x:15,y:10});
  close(odd.grid.x[0],79.99*0.15);
  close(odd.grid.x.at(-1),79.99*0.9);
});
test('eight CSS-pixel threshold is inclusive and thins each axis separately',()=>{
  for(const gridStep of A.GRID_STEPS){
    const exact=800/gridStep,layout=A.guideLayout(scene(),{width:exact,height:exact-0.001},{gridStep});
    assert.equal(layout.effectiveInterval.x,gridStep);
    assert.equal(layout.effectiveInterval.y,2*gridStep);
  }
});
test('very small representable previews may have no interior grid lines but retain center guides',()=>{
  for(const gridStep of A.GRID_STEPS){
    const layout=A.guideLayout(scene(),{width:7.99,height:1},{gridStep,centerGuides:true});
    assert.deepEqual(layout.grid,{x:[],y:[]});
    assert.deepEqual(layout.center,{x:[3.995],y:[0.5]});
    assert.deepEqual(layout.count,{grid:0,center:2,total:2});
    assert.ok(layout.effectiveInterval.x>=100&&layout.effectiveInterval.y>=100);
  }
});
test('finite extreme dimensions stay bounded without coordinate multiplication overflow',()=>{
  for(const ratio of [null,...Object.keys(G.RATIOS)])for(const size of [1e-300,1e-100,1e100,Number.MAX_VALUE]){
    const value=scene(ratio),viewport={width:size,height:size};
    for(const gridStep of A.GRID_STEPS)checkLayout(A.guideLayout(value,viewport,{gridStep,centerGuides:true}),value,viewport,{gridStep,centerGuides:true});
  }
});
test('unrepresentable subnormal projected spacing and underflowed content rectangles reject deterministically',()=>{
  for(const ratio of [null,...Object.keys(G.RATIOS)])for(const gridStep of A.GRID_STEPS){
    assert.throws(()=>A.guideLayout(scene(ratio),{width:Number.MIN_VALUE,height:Number.MIN_VALUE},{gridStep}),/numeric layout bounds/);
    assert.throws(()=>A.guideLayout(scene(ratio),{width:Number.MAX_VALUE,height:Number.MIN_VALUE},{gridStep}),/numeric layout bounds/);
  }
});
test('authoritative fractional content rectangle is preserved even with harmless floating-point edge rounding',()=>{
  const value=scene('16:9'),viewport={width:46.043,height:12.997},layout=A.guideLayout(value,viewport);
  assert.deepEqual(layout.contentRect,M.contentRect(value,viewport.width,viewport.height));
  assert.ok(layout.contentRect.y<0&&layout.contentRect.y>-1e-12);
  checkLayout(layout,value,viewport,{gridStep:5,centerGuides:false});
});
test('legacy scene versions use the existing strict migration and viewport mapping',()=>{
  const v1={format:M.FORMAT,version:1,sampler:'sparse-fixed-1',scene:{name:'Legacy synthetic',shape:'circle',x:50,y:50,size:20,dotCount:1,dotRadius:1,palette:'slate'}};
  const v3=scene(),v2={format:M.FORMAT,version:2,sampler:'static-objects-2',scene:{name:'Legacy synthetic',background:{h:0,s:0,l:0},objects:v3.scene.objects.map(({id,shape,x,y,size,color})=>({id,shape,x,y,size,color}))}};
  for(const value of [v1,v2,v3]){
    const before=JSON.stringify(value),viewport={width:123,height:456},layout=A.guideLayout(value,viewport);
    assert.deepEqual(layout.contentRect,{x:0,y:0,width:123,height:456});
    assert.deepEqual(layout,A.guideLayout(M.canonicalScene(value),viewport));
    assert.equal(JSON.stringify(value),before);
  }
});
test('all authored families, rotations, effects, colors and finite timing retain their canonical scene identity',()=>{
  for(const shape of G.SHAPES){
    const value=scene('4:3'),item=M.defaultAuthoredObject('object-1',shape);
    item.geometry.rotation=37;
    item.outline.enabled=true;
    item.shadow.enabled=true;
    item.timing.fadeInMs=100;
    item.timing.pulse.enabled=true;
    value.scene.objects=[item];
    const canonical=M.canonicalScene(value),before=JSON.stringify(canonical);
    A.guideLayout(frozen(canonical),frozen({width:800,height:600}),frozen({gridStep:1,centerGuides:true}));
    assert.equal(JSON.stringify(canonical),before);
  }
  const empty=scene();empty.scene.objects=[];
  assert.deepEqual(A.guideLayout(empty,{width:800,height:600}),A.guideLayout(scene(),{width:800,height:600}));
  const full=scene();full.scene.objects=Array.from({length:M.MAX_OBJECTS},(_,i)=>M.defaultObject('object-'+(i+1)));
  assert.deepEqual(A.guideLayout(full,{width:800,height:600}),A.guideLayout(empty,{width:800,height:600}));
});
test('every result record and array is defensive and repeated calls are deterministic',()=>{
  const value=scene('3:4'),viewport={width:987,height:456},options={gridStep:1,centerGuides:true},before=JSON.stringify({value,viewport,options});
  const expected=A.guideLayout(value,viewport,options),changed=A.guideLayout(value,viewport,options);
  changed.contentRect.width=1;changed.grid.x.fill(-1);changed.grid.y.push(1);changed.center.x[0]=0;changed.center.y=[];changed.effectiveInterval.x=900;changed.count.total=999;
  assert.deepEqual(A.guideLayout(value,viewport,options),expected);
  assert.equal(JSON.stringify({value,viewport,options}),before);
  for(let i=0;i<100;i++)assert.deepEqual(A.guideLayout(value,viewport,options),expected);
});
test('viewport requires an exact ordinary width/height record with finite positive numbers and no coercion',()=>{
  const value=scene();
  for(const viewport of [undefined,null,[],{},new Date(),Object.create({width:100,height:100}),{width:100},{width:100,height:100,left:0},{width:100,height:100,[Symbol('extra')]:1}])assert.throws(()=>A.guideLayout(value,viewport));
  let coerced=0;
  for(const bad of [0,-0,-1,NaN,Infinity,-Infinity,'100',null,undefined,true,1n,{valueOf(){coerced++;return 100;}}]){
    assert.throws(()=>A.guideLayout(value,{width:bad,height:100}));
    assert.throws(()=>A.guideLayout(value,{width:100,height:bad}));
  }
  assert.equal(coerced,0);
});
test('options are a closed optional-key record, never inferred visibility or snap state',()=>{
  for(const options of [null,[],new Date(),Object.create({gridStep:5}),{visible:true},{armed:true},{snapStep:1},{gridStep:5,unknown:1},{[Symbol('extra')]:1}])assert.throws(()=>A.guideLayout(scene(),{width:100,height:100},options));
  for(const gridStep of [undefined,null,0,-1,2,3,20,NaN,Infinity,'5',true,5n])assert.throws(()=>A.guideLayout(scene(),{width:100,height:100},{gridStep}));
  for(const centerGuides of [undefined,null,0,1,'true',{},[]])assert.throws(()=>A.guideLayout(scene(),{width:100,height:100},{centerGuides}));
});
test('viewport and option accessors are rejected without executing getters or setters',()=>{
  let invoked=0;
  for(const key of ['width','height']){
    const viewport={width:100,height:100};Object.defineProperty(viewport,key,{get(){invoked++;return 100;},set(){invoked++;},enumerable:true});
    assert.throws(()=>A.guideLayout(scene(),viewport),/accessors/);
  }
  for(const key of ['gridStep','centerGuides']){
    const options={};Object.defineProperty(options,key,{get(){invoked++;return key==='gridStep'?5:false;},enumerable:false});
    assert.throws(()=>A.guideLayout(scene(),{width:100,height:100},options),/accessors/);
  }
  const unknown={};Object.defineProperty(unknown,'snapStep',{get(){invoked++;return 1;}});
  assert.throws(()=>A.guideLayout(scene(),{width:100,height:100},unknown),/unsupported/);
  assert.equal(invoked,0);
});
test('scene root, nested records, geometry and array getters are rejected without execution',()=>{
  let invoked=0;
  const cases=[
    value=>[value,'scene'],
    value=>[value.scene,'canvas'],
    value=>[value.scene.background,'h'],
    value=>[value.scene.objects,'0'],
    value=>[value.scene.objects[0],'x'],
    value=>[value.scene.objects[0].geometry,'height'],
    value=>[value.scene.objects[0].outline,'enabled'],
    value=>[value.scene.objects[0].timing.pulse,'enabled']
  ];
  for(const locate of cases){
    const value=scene('1:1'),[record,key]=locate(value);Object.defineProperty(record,key,{get(){invoked++;throw Error('Getter executed.');},enumerable:true});
    assert.throws(()=>A.guideLayout(value,{width:100,height:100}),/accessors/);
  }
  assert.equal(invoked,0);
});
test('scene validation rejects unknown metadata, malformed geometry and array properties without mutation',()=>{
  const mutations=[
    value=>{value.gridStep=1;},
    value=>{value.scene.editorAids=true;},
    value=>{value.scene.objects[0].locked=true;},
    value=>{value.scene.objects[0].geometry.path='M0 0';},
    value=>{value.scene.objects[0].x=NaN;},
    value=>{value.scene.objects[0].geometry.rotation=360;},
    value=>{delete value.scene.objects[0];},
    value=>{value.scene.objects.extra=1;},
    value=>{value.scene.canvas.ratio='2:1';}
  ];
  for(const mutate of mutations){
    const value=scene('1:1');mutate(value);const before=JSON.stringify(value);
    assert.throws(()=>A.guideLayout(value,{width:800,height:600}));
    assert.equal(JSON.stringify(value),before);
  }
});
test('null-prototype ordinary viewport and option records are accepted without adding defaults to input',()=>{
  const viewport=Object.assign(Object.create(null),{width:800,height:600}),options=Object.assign(Object.create(null),{centerGuides:true});
  assert.deepEqual(A.guideLayout(scene(),viewport,options),A.guideLayout(scene(),{width:800,height:600},{centerGuides:true}));
  assert.deepEqual(Object.keys(options),['centerGuides']);
  assert.equal(Object.getPrototypeOf(viewport),null);
});
test('portable classic-script model loads with only the existing geometry/model modules and no browser facilities',()=>{
  const context=vm.createContext({});
  for(const file of ['geometry-model.js','model.js','editor-aids-model.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),context,{filename:file});
  const actual=JSON.parse(vm.runInContext('JSON.stringify(ImageryEditorAids.guideLayout(ImageryModel.presets()[0],{width:80,height:31},{gridStep:1,centerGuides:true}))',context));
  assert.deepEqual(actual,A.guideLayout(scene(),{width:80,height:31},{gridStep:1,centerGuides:true}));
  assert.equal(vm.runInContext('typeof document+":"+typeof setTimeout+":"+typeof requestAnimationFrame+":"+typeof fetch',context),'undefined:undefined:undefined:undefined');
});
