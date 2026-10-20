'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/model.js'),S=require('../src/sequence-model.js');
const {scene,legacyObjects,styledObject,copy}=require('./fixtures.cjs');
const {sequence,legacySequence}=require('./sequence-fixtures.cjs');
const checked=s=>M.canonicalScene(s),reject=s=>assert.equal(M.validateScene(s).ok,false);
const effects=()=>({outline:{enabled:false,width:1,color:{h:0,s:0,l:30}},shadow:{enabled:false,offsetX:1,offsetY:1,blur:2,color:{h:0,s:0,l:0}},timing:{startMs:0,fadeInMs:0,holdMs:3000,fadeOutMs:0,pulse:{enabled:false,minOpacity:0.8}}});

test('MODEL V3: new presets use requested H4 S60 L4 without changing imported background',()=>{
 for(const p of M.presets()){assert.deepEqual(p.scene.background,{h:4,s:60,l:4});assert.equal(p.scene.pulsePeriodMs,4000);for(const o of p.scene.objects)for(const[k,v]of Object.entries(effects()))assert.deepEqual(o[k],v);}
 assert.deepEqual(M.DEFAULT_BACKGROUND,{h:4,s:60,l:4});assert.ok(Object.isFrozen(M.DEFAULT_BACKGROUND));
 for(const background of [{h:0,s:0,l:0},{h:222,s:43,l:19}])assert.deepEqual(checked(legacyObjects({background})).scene.background,background);
});
test('MODEL V3: background saturation supports every integer0–100 and roundtrips without changing defaults',()=>{
 for(let saturation=0;saturation<=100;saturation++){
  const value=scene({background:{h:4,s:saturation,l:4}}),before=copy(value),canonical=checked(value);
  assert.deepEqual(canonical.scene.background,{h:4,s:saturation,l:4});
  assert.deepEqual(M.parseScene(JSON.stringify(canonical)),canonical);
  assert.equal(M.colorCSS(canonical.scene.background),`hsl(4 ${saturation}% 4%)`);
  assert.deepEqual(value,before);
 }
 assert.deepEqual(M.DEFAULT_BACKGROUND,{h:4,s:60,l:4});
 for(const preset of M.presets())assert.deepEqual(preset.scene.background,{h:4,s:60,l:4});
});
test('MODEL V3: saturation extension does not widen item, outline, shadow or other background channels',()=>{
 for(const path of ['color','outline.color','shadow.color']){
  const at=s=>path.split('.').reduce((o,key)=>o[key],s.scene.objects[0]);
  const valid=scene({background:{h:359,s:100,l:40}});at(valid).s=70;checked(valid);
  for(const saturation of [71,100]){const invalid=copy(valid);at(invalid).s=saturation;reject(invalid);}
 }
 for(const[key,value]of [['h',360],['l',41],['s',101],['s',-1],['s',60.5],['s','100'],['s',NaN],['s',Infinity]]){
  const invalid=scene({background:{h:4,s:100,l:4}});invalid.scene.background[key]=value;reject(invalid);
 }
});
test('MODEL V3: legacy scene backgrounds retain original closed60 cap then migrate without clamping',()=>{
 for(const saturation of [0,60]){
  const old=legacyObjects({background:{h:4,s:saturation,l:4}}),migrated=M.parseScene(JSON.stringify(old));
  assert.equal(migrated.version,3);assert.equal(migrated.scene.background.s,saturation);
  migrated.scene.background.s=100;assert.equal(checked(migrated).scene.background.s,100);
 }
 for(const saturation of [61,100,101]){
  const invalid=legacyObjects({background:{h:4,s:saturation,l:4}});reject(invalid);assert.throws(()=>M.parseScene(JSON.stringify(invalid)));
 }
});
test('MODEL V3:100 saturation survives live draft, apply, history and import without hidden revival',()=>{
 let now=0;const c=M.createController(()=>now,scene({background:{h:4,s:60,l:4}}));
 const full=scene({background:{h:4,s:100,l:4}});
 assert.equal(c.previewDraft(full).ok,true);assert.equal(c.getState().draft.scene.background.s,100);
 assert.equal(c.getState().current.scene.background.s,60);
 c.hide();assert.equal(c.stageLive(full).ok,true);assert.equal(c.getState().visible,false);
 assert.equal(c.apply().ok,true);assert.equal(c.getState().current.scene.background.s,100);assert.equal(c.getState().visible,false);
 assert.equal(c.undo().ok,true);assert.equal(c.getState().current.scene.background.s,60);
 assert.equal(c.redo().ok,true);assert.equal(c.getState().current.scene.background.s,100);
 const exported=JSON.stringify(c.getState().current),token=c.beginImport();
 assert.equal(c.finishImport(token,exported).ok,true);assert.deepEqual(c.getState().current,full);assert.equal(c.getState().visible,false);
 const bad=copy(full);bad.scene.background.s=101;assert.equal(c.stageLive(bad).ok,false);assert.deepEqual(c.getState().current,full);
 now=3000;assert.equal(c.previewDraft(c.getState().draft).ok,true);
});
test('MODEL V3: fully saturated background stays fixed through finite mixed item timing',()=>{
 const I=require('../src/item-model.js'),steady=styledObject({id:'object-1'}),pulsing=styledObject({id:'object-2'});
 steady.timing={startMs:0,fadeInMs:0,holdMs:4000,fadeOutMs:0,pulse:{enabled:false,minOpacity:.8}};
 pulsing.timing={startMs:1000,fadeInMs:1000,holdMs:4000,fadeOutMs:1000,pulse:{enabled:true,minOpacity:.5}};
 const value=scene({background:{h:4,s:100,l:4},objects:[steady,pulsing]}),before=copy(value),compiled=I.compileTimeline(value);
 assert.equal(compiled.durationMs,7000);assert.ok(Object.isFrozen(compiled.document.scene.background));
 for(const time of [0,999,1000,1500,2000,3999,4000,6000,6999,7000]){
  const frame=I.frameAt(compiled,time);
  assert.deepEqual(compiled.document.scene.background,{h:4,s:100,l:4});
  if(time<4000)assert.equal(frame.items[0].alpha,1);
  if(time===2000)assert.equal(frame.items[1].alpha,.5);
  if(time===7000)assert.equal(frame.done,true);
 }
 assert.deepEqual(value,before);
});
test('MODEL V3: strict v2 migration adds defaults and preserves base geometry and colors',()=>{
 const old=legacyObjects(),before=copy(old),now=checked(old);assert.deepEqual(old,before);assert.equal(now.version,3);assert.equal(now.sampler,'styled-objects-3');assert.equal(now.scene.pulsePeriodMs,4000);const o=now.scene.objects[0];for(const[k,v]of Object.entries(old.scene.objects[0]))assert.deepEqual(o[k],v);for(const[k,v]of Object.entries(effects()))assert.deepEqual(o[k],v);
 const extra=legacyObjects();extra.scene.objects[0].outline=effects().outline;reject(extra);const noVersion=scene();noVersion.version=2;noVersion.sampler='static-objects-2';reject(noVersion);
});
test('MODEL V3: constructors fresh and validated; changing defaults never mutates another item',()=>{
 const a=M.defaultObject(),b=M.defaultObject('object-2','triangle');assert.equal(a.shape,'dot');assert.equal(b.shape,'triangle');assert.equal(M.objectExtent(a),1);assert.equal(M.objectExtent(b),10.5);a.outline.color.l=0;assert.equal(M.defaultObject().outline.color.l,30);const e=M.defaultEffects();e.timing.pulse.enabled=true;assert.equal(M.defaultEffects().timing.pulse.enabled,false);assert.throws(()=>M.defaultObject('object-0'));assert.throws(()=>M.defaultObject('object-1','unknown'));
});
for(const path of ['outline','shadow','timing','timing.pulse'])test('MODEL V3: closed effect record '+path+' rejects extras, missing keys, symbols, prototypes, accessors',()=>{
 const locate=s=>path.split('.').reduce((v,k)=>v[k],s.scene.objects[0]);let calls=0;
 for(const mutate of [o=>o.extra=1,o=>delete o[Object.keys(o)[0]],o=>o[Symbol('extra')]=1,o=>Object.setPrototypeOf(o,{bad:true}),o=>Object.defineProperty(o,Object.keys(o)[0],{get(){calls++;return 0},enumerable:true})]){const s=scene();mutate(locate(s));reject(s);}assert.equal(calls,0);
});
for(const[part,key,min,max,scale]of [['outline','width',.1,4,10],['shadow','offsetX',-12,12,10],['shadow','offsetY',-12,12,10],['shadow','blur',0,6,10]])test('MODEL V3: finite effect range '+part+'.'+key,()=>{
 for(const v of [min,max]){const s=scene();s.scene.objects[0][part][key]=v;checked(s);}
 for(const v of [min-1/scale,max+1/scale,.123,NaN,Infinity,-Infinity,'1',null,false,{},[]]){const s=scene();s.scene.objects[0][part][key]=v;reject(s);}
});
for(const part of ['outline','shadow'])test('MODEL V3: independent '+part+' color includes black but retains strict color limits',()=>{
 for(const color of [{h:0,s:0,l:0},{h:359,s:70,l:70}]){const s=scene();s.scene.objects[0][part].color=color;assert.deepEqual(checked(s).scene.objects[0][part].color,color);}
 for(const[field,value]of [['h',360],['s',71],['l',71],['l',-1],['h',1.5],['s','30']]){const s=scene();s.scene.objects[0][part].color[field]=value;reject(s);}
 const s=scene();s.scene.objects[0][part].enabled=1;reject(s);
});
for(const key of ['startMs','fadeInMs','holdMs','fadeOutMs'])test('MODEL V3: finite100ms item timing '+key,()=>{
 for(const v of [0,100,600000]){const s=scene();s.scene.objects[0].timing[key]=v;s.scene.objects[0].timing.fadeOutMs=100;checked(s);}
 for(const v of [-100,600100,1,99,100.5,NaN,Infinity,'100',null,true,{},[]]){const s=scene();s.scene.objects[0].timing[key]=v;reject(s);}
});
test('MODEL V3: zero lifetime rejects, zero hold is valid for a genuine fade envelope',()=>{
 const s=scene();s.scene.objects[0].timing.holdMs=0;reject(s);s.scene.objects[0].timing.fadeInMs=100;checked(s);s.scene.objects[0].timing.fadeOutMs=100;checked(s);
});
test('MODEL V3: global pulse period and per-item depth are closed and validated',()=>{
 for(const v of [2000,4000,60000]){const s=scene({pulsePeriodMs:v});checked(s);}
 for(const v of [0,1999,60001,2050,NaN,Infinity,'4000',null])reject(scene({pulsePeriodMs:v}));
 for(const v of [.5,.8,1]){const s=scene();s.scene.objects[0].timing.pulse.minOpacity=v;checked(s);}
 for(const v of [.49,1.01,.801,NaN,Infinity,'.8',null]){const s=scene();s.scene.objects[0].timing.pulse.minOpacity=v;reject(s);}
 const s=scene();s.scene.objects[0].timing.pulse.periodMs=4000;reject(s);
});
test('MODEL V3: geometry scales independent effects to shorter-side units without changing base shape',()=>{
 const s=scene();const o=s.scene.objects[0];o.outline={enabled:true,width:2.5,color:{h:12,s:40,l:30}};o.shadow={enabled:true,offsetX:-3.2,offsetY:1.5,blur:2.1,color:{h:21,s:20,l:0}};
 for(const[w,h]of [[100,100],[1600,900],[390,844]]){const unit=Math.min(w,h)/100,g=M.geometry(s,w,h)[0];assert.deepEqual(g.outline,{enabled:true,width:2.5*unit,color:'hsl(12 40% 30%)'});assert.deepEqual(g.shadow,{enabled:true,offsetX:-3.2*unit,offsetY:1.5*unit,blur:2.1*unit,color:'hsl(21 20% 0%)'});assert.equal(g.radius,10*unit);assert.equal(g.lineWidth,unit);}
 // Existing base inset remains valid; raster effects are clipped by the renderer.
 o.x=11.5;checked(s);o.x=11.49;reject(s);
});
test('MODEL V3: nested effects/timing are private copies through controller and history',()=>{
 let t=0;const c=M.createController(()=>t,scene()),candidate=c.getState().draft;candidate.scene.objects[0].outline.enabled=true;candidate.scene.objects[0].timing.fadeInMs=1000;c.stage(candidate);c.apply();candidate.scene.objects[0].outline.color.h=123;assert.equal(c.getState().current.scene.objects[0].outline.color.h,0);c.undo();assert.equal(c.getState().current.scene.objects[0].outline.enabled,false);c.redo();assert.equal(c.getState().current.scene.objects[0].outline.enabled,true);assert.equal(c.getState().current.scene.objects[0].timing.fadeInMs,1000);
});
test('MODEL V3: effect/timing duplicate JSON keys reject at every new depth',()=>{
 const raw=JSON.stringify(scene());for(const text of [raw.replace('"pulsePeriodMs":4000','"pulsePeriodMs":2000,"pulsePeriodMs":4000'),raw.replace('"width":1','"width":2,"width":1'),raw.replace('"offsetX":1','"offsetX":2,"offsetX":1'),raw.replace('"holdMs":3000','"holdMs":100,"holdMs":3000'),raw.replace('"minOpacity":0.8','"minOpacity":0.5,"minOpacity":0.8')])assert.throws(()=>M.parseScene(text),/Duplicate/);
});
test('SEQUENCE V2: legacy v1 migrates styled snapshots but preserves reference playback duration',()=>{
 const old=legacySequence(),before=copy(old),s=S.canonicalSequence(old);assert.deepEqual(old,before);assert.equal(s.version,2);assert.equal(s.sampler,'ordered-crossfade-2');for(const step of s.sequence.steps){assert.equal(step.pulsePeriodMs,4000);for(const[k,v]of Object.entries(effects()))assert.deepEqual(step.objects[0][k],v);}assert.equal(S.compileTimeline(s).durationMs,11000);
});
test('SEQUENCE V2: styled timing and pulse period preserved without applying during sequence playback',()=>{
 const s=sequence(),o=s.sequence.steps[0].objects[0];s.sequence.steps[0].pulsePeriodMs=5500;o.outline.enabled=true;o.shadow.enabled=true;o.timing.startMs=9900;o.timing.pulse.enabled=true;const c=S.canonicalSequence(s);assert.equal(c.sequence.steps[0].pulsePeriodMs,5500);assert.deepEqual(c.sequence.steps[0].objects[0],o);assert.equal(S.compileTimeline(c).durationMs,11000);assert.equal(S.frameAt(S.compileTimeline(c),1500).phase,'hold');assert.ok(Object.isFrozen(c.sequence.steps[0].objects[0].timing.pulse));assert.deepEqual(S.parseSequence(S.serializeSequence(c)),c);
});
