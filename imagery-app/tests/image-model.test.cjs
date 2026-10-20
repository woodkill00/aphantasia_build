'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),I=require('../src/image-model.js');
const black={h:0,s:0,l:0},base={background:black,seed:509,maxObjects:6};
const copy=x=>JSON.parse(JSON.stringify(x));
function pixels(width=48,height=48,fn=()=>[0,0,0,255]) {
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)data.set(fn(x,y),(y*width+x)*4);
  return {width,height,data};
}
function fixture(count,width=48,height=48) {
  const positions=count===1?[[50,50]]:count===3?[[24,50],[50,50],[76,50]]:count===6?[[22,30],[50,30],[78,30],[22,70],[50,70],[78,70]]:Array.from({length:12},(_,i)=>[20+i%4*20,25+Math.floor(i/4)*25]);
  const shapes=positions.map(([x,y],i)=>({shape:i%3,x,y,size:count===1?24:count===3?16:12,color:[[128,128,128],[157,92,72],[76,126,148]][i%3]}));
  return pixels(width,height,(x,y)=>{
    let p=[0,0,0,255];
    for(const s of shapes){const u=Math.min(width,height)/100,dx=(x+.5-s.x*width/100)/(s.size*u/2),dy=(y+.5-s.y*height/100)/(s.size*u/2);if(Math.abs(dx)<=1&&Math.abs(dy)<=1&&(s.shape===0||(s.shape===1&&dx*dx+dy*dy<=1)||(s.shape===2&&Math.abs(dx)<=(dy+1)/2)))p=[...s.color,255];}
    return p;
  });
}
function assertPlain(value) {if(value&&typeof value==='object'){assert.ok(Array.isArray(value)||Object.getPrototypeOf(value)===Object.prototype);for(const v of Object.values(value))assertPlain(v);}else assert.ok(['string','boolean','number'].includes(typeof value));}

test('local approximation declares independent file, decoded, input, work and item budgets',()=>{
  assert.equal(I.LIMITS.maxObjects,12);assert.equal(I.LIMITS.maxInputPixels,128*128);assert.equal(I.LIMITS.maxStepCandidates,32);
  assert.equal(I.LIMITS.maxModelTypedArrayBytes,128*128*4+48*48*9);
  assert.ok(I.LIMITS.maxDecodedPixels>I.LIMITS.maxInputPixels);assert.ok(Object.isFrozen(I.LIMITS));
});
test('all supported option defaults are independent copies and closed validated values',()=>{
  const a=I.canonicalOptions(),b=I.canonicalOptions();a.crop.x=1;a.background.h=50;assert.equal(b.crop.x,0);assert.equal(b.background.h,4);
  for(const bad of [{maxObjects:0},{maxObjects:13},{maxObjects:4},{seed:-1},{seed:2**32},{seed:1.5},{palette:'cloud'},{canvasRatio:'2:1'},{unknown:true},{background:{h:0,s:101,l:0}},{background:{h:0,s:0,l:41}},{crop:{x:0,y:0,width:0,height:1}},{crop:{x:.9,y:0,width:.2,height:1}},{crop:{x:0,y:0,width:1,height:1,url:'x'}},{crop:{x:0,y:0,width:.333333,height:1}}])assert.throws(()=>I.canonicalOptions(bad));
  const aGet={};Object.defineProperty(aGet,'seed',{get(){throw Error('getter executed');}});assert.throws(()=>I.canonicalOptions(aGet),/accessors/);
  const sym={};sym[Symbol('x')]=1;assert.throws(()=>I.canonicalOptions(sym),/unsupported/);
  assert.throws(()=>I.canonicalOptions(Object.create({})));assert.throws(()=>I.canonicalOptions(null));
});
test('bounded pixel interface rejects wrong dimensions, bytes, storage and untrusted fields',()=>{
  const valid=pixels(1,1);assert.equal(I.validatePixels(valid).width,1);
  for(const p of [{...valid,width:129},{...valid,height:129},{...valid,width:0},{...valid,width:NaN},{...valid,width:1.5},{...valid,data:[0,0,0,255]},{...valid,data:new Float32Array(4)},{...valid,data:new Uint8Array(3)},{...valid,url:'x'},{...valid,filename:'private.png'}])assert.throws(()=>I.validatePixels(p));
  const typed=new Uint8Array(4);typed.extra=3;assert.throws(()=>I.validatePixels({...valid,data:typed}),/unsupported/);
  const overBacking=new Uint8Array(new ArrayBuffer(I.LIMITS.maxInputPixels*4+1),0,4);assert.throws(()=>I.validatePixels({...valid,data:overBacking}),/backing buffer/);
  const lengthGetter=new Uint8Array(4);Object.defineProperty(lengthGetter,'length',{get(){throw Error('getter executed');}});assert.throws(()=>I.validatePixels({...valid,data:lengthGetter}),/unsupported/);
  const input={...valid};Object.defineProperty(input,'data',{get(){throw Error('getter executed');}});assert.throws(()=>I.validatePixels(input),/accessors/);
  if(typeof SharedArrayBuffer==='function')assert.throws(()=>I.validatePixels({...valid,data:new Uint8Array(new SharedArrayBuffer(4))}),/Shared/);
  assert.throws(()=>I.validatePixels({...valid,data:Buffer.alloc(4)}),/ordinary/);
});
test('background-only and transparent sources do not manufacture shapes or expose hidden RGB',()=>{
  for(const [w,h] of [[1,1],[1,128],[128,1],[128,128]]) {
    const a=I.approximate(pixels(w,h,()=>[0,0,0,0]),base),b=I.approximate(pixels(w,h,(x,y)=>[x%256,y%256,255,0]),base);
    assert.equal(a.objects.length,0);assert.equal(a.quality.finalError,0);assert.equal(a.quality.evaluatedCandidates,0);assert.deepEqual(a,b);assert.equal(a.source.transparentPixels,w*h);
  }
  const opaque=I.approximate(pixels(),base);assert.equal(opaque.objects.length,0);assert.equal(opaque.source.transparentPixels,0);
});
test('transparency is composited before fitting with area sampling and no input mutation',()=>{
  const a=pixels(48,48,(x,y)=>x>=18&&x<30&&y>=18&&y<30?[128,128,128,255]:[99,33,255,0]),b=pixels(48,48,(x,y)=>x>=18&&x<30&&y>=18&&y<30?[255,255,255,128]:[0,0,0,0]);
  const before=a.data.slice(),pa=I.approximate(a,base),pb=I.approximate(b,base);
  assert.deepEqual(a.data,before);assert.deepEqual(pa.objects,pb.objects);assert.equal(pa.quality.finalError,0);
});
test('seed and fixed candidate budget are reproducible regardless of cooperative slice sizes',()=>{
  const source=fixture(6),sync=I.approximate(source,base),a=I.createJob(source,base),b=I.createJob(source,base);
  let sa=a.getState(),sb=b.getState();let previous=0;
  while(sa.status==='running'){sa=a.step(1);assert.ok(sa.progress>=previous);previous=sa.progress;}
  while(sb.status==='running')sb=b.step(32);
  assert.deepEqual(sa.result,sync);assert.deepEqual(sb.result,sync);assert.equal(sa.progress,1);assert.equal(sync.algorithm.seed,509);
  assert.ok(sync.quality.evaluatedCandidates<=6*384);assert.deepEqual(I.canonicalPlan(sync),sync);
});
test('algorithm version 1 has a frozen synthetic seed fixture',()=>{
  const digest=require('node:crypto').createHash('sha256').update(JSON.stringify(I.approximate(fixture(1),base))).digest('hex');
  assert.equal(digest,'d1ffe7b8231f5fa8ff6fcfb48b67b23b2ef2659e7d2fda71900f7cc92ae5cbb4');
});
test('a job snapshots input into bounded work pixels and does not retain the mutable source',()=>{
  const source=fixture(3),expected=I.approximate(source,base),job=I.createJob(source,base);source.data.fill(255);
  let state=job.getState();while(state.status==='running')state=job.step();assert.deepEqual(state.result,expected);
  state.result.objects[0].x=99;assert.notEqual(job.getState().result.objects[0].x,99);
});
test('cancellation is terminal, discards partial candidates and cannot be revived by a late step',()=>{
  for(const step of [0,1,32]){const job=I.createJob(fixture(12),{...base,maxObjects:12});if(step)job.step(step);const before=job.getState().evaluatedCandidates;assert.equal(job.cancel().status,'cancelled');assert.equal(job.step(32).evaluatedCandidates,before);assert.equal(job.getState().result,null);assert.equal(job.cancel().status,'cancelled');}
  const complete=I.createJob(pixels(),base);complete.step();assert.equal(complete.getState().status,'complete');complete.cancel();assert.equal(complete.getState().result,null);
});
test('cooperative calls enforce an exact candidate slice cap and monotonic bounded progress',()=>{
  const job=I.createJob(fixture(12),{...base,maxObjects:12});
  for(const bad of [0,-1,33,Infinity,1.1,'4',null])assert.throws(()=>job.step(bad));
  for(let i=0;i<4;i++){const before=job.getState().evaluatedCandidates,next=job.step(7);assert.equal(next.evaluatedCandidates-before,7);assert.equal(next.result,null);assert.ok(next.progress>=0&&next.progress<1);}
});
for(const ratio of Object.keys(I.RATIOS))test('contain-fit and ordinary item bounds hold for canvas '+ratio,()=>{
  const p=I.approximate(fixture(3,96,48),{...base,canvasRatio:ratio,maxObjects:3});
  assert.equal(p.quality.workingWidth/p.quality.workingHeight,I.RATIOS[ratio]);
  for(const o of p.objects){const extent=Math.max(o.size,o.geometry.height)/2;assert.ok(o.x>=1+extent&&o.x<=99-extent&&o.y>=1+extent&&o.y<=99-extent);assert.ok(o.size>=1&&o.size<=28);assert.ok(o.geometry.fill);assert.equal(o.geometry.rotation,0);}
  assert.deepEqual(I.canonicalPlan(p),p);
});
test('portrait and landscape images preserve square regions instead of stretching to the canvas',()=>{
  const landscape=pixels(96,48,(x,y)=>x>=42&&x<54&&y>=18&&y<30?[128,128,128,255]:[0,0,0,255]);
  const portrait=pixels(48,96,(x,y)=>x>=18&&x<30&&y>=42&&y<54?[128,128,128,255]:[0,0,0,255]);
  const a=I.approximate(landscape,base),b=I.approximate(portrait,base);assert.deepEqual(a.objects,b.objects);assert.equal(a.objects.length,1);assert.equal(a.objects[0].size,a.objects[0].geometry.height);
});
test('normalized focus crop changes content intentionally and rejects out-of-bounds crop',()=>{
  const source=pixels(96,48,(x,y)=>x>=12&&x<24&&y>=18&&y<30?[128,128,128,255]:[0,0,0,255]);
  const excluded=I.approximate(source,{...base,crop:{x:.5,y:0,width:.5,height:1}});assert.equal(excluded.objects.length,0);
  const included=I.approximate(source,{...base,crop:{x:0,y:0,width:.5,height:1}});assert.ok(included.objects.length);assert.ok(included.objects[0].x<50);
});
test('bounded colors are evaluated rather than silently clamped after optimization',()=>{
  const source=pixels(48,48,(x,y)=>x>=18&&x<30&&y>=18&&y<30?[255,0,0,255]:[0,0,0,255]);
  const p=I.approximate(source,base);assert.ok(p.quality.constrainedCandidates>0);assert.equal(p.algorithm.colorPolicy,'bounded-hsl');assert.ok(p.quality.finalError>0);assert.ok(p.quality.finalError<p.quality.initialError);
  for(const o of p.objects){assert.ok(o.color.s<=70);assert.ok(o.color.l>=10&&o.color.l<=70);}
  const muted=I.approximate(source,{...base,palette:'muted'});for(const o of muted.objects)assert.ok(['208/11/48','126/8/49','40/13/48'].includes([o.color.h,o.color.s,o.color.l].join('/')));
});
test('candidate plans are closed plain numeric data and never contain source bytes or file metadata',()=>{
  const p=I.approximate(fixture(1),base);assertPlain(p);
  for(const bad of [{...p,filename:'private.png'},{...p,data:'base64'},{...p,source:{...p.source,data:[1]}},{...p,algorithm:{...p.algorithm,complete:false}},{...p,algorithm:{...p.algorithm,id:'remote'}},{...p,quality:{...p.quality,imageryScore:100}},{...p,quality:{...p.quality,finalError:2}},{...p,quality:{...p.quality,relativeReduction:-1}},{...p,canvas:{mode:'viewport',ratio:'1:1'}}])assert.throws(()=>I.canonicalPlan(bad));
  const source=copy(p);Object.defineProperty(source.source,'crop',{get(){throw Error('getter executed');}});assert.throws(()=>I.canonicalPlan(source),/accessors/);
  assert.ok(!JSON.stringify(p).includes('data:'));assert.ok(!JSON.stringify(p).includes('filename'));assert.ok(JSON.stringify(p).length<10000);
});
test('candidate item validation rejects prototype tricks, malformed arrays and unsupported geometry',()=>{
  const p=I.approximate(fixture(1),base);
  for(const patch of [{url:'x'},{size:29},{x:0},{x:NaN},{shape:'svg'},{id:'other'},{geometry:{height:28,rotation:1,fill:true}},{geometry:{height:28,rotation:0,fill:false}},{color:{h:0,s:100,l:50}}]){const bad=copy(p);Object.assign(bad.objects[0],patch);assert.throws(()=>I.canonicalPlan(bad));}
  const hole=copy(p);hole.objects.length++;assert.throws(()=>I.canonicalPlan(hole));
  const extra=copy(p);extra.objects.url='x';assert.throws(()=>I.canonicalPlan(extra));
  const getter=copy(p);Object.defineProperty(getter.objects,'0',{get(){throw Error('getter executed');}});assert.throws(()=>I.canonicalPlan(getter),/accessors/);
});
test('all generated ratios and complexity tiers pass the real closed scene validator and editable round-trip',()=>{
  const M=require('../src/model.js');
  for(const ratio of Object.keys(I.RATIOS))for(const count of [3,6,12]){const plan=I.approximate(fixture(count),{...base,canvasRatio:ratio,maxObjects:count}),scene=I.toScene(plan,M);assert.deepEqual(M.parseScene(JSON.stringify(scene)),scene);assert.equal(scene.scene.canvas.ratio,ratio);for(const o of scene.scene.objects){assert.equal(o.outline.enabled,false);assert.equal(o.shadow.enabled,false);assert.equal(o.timing.pulse.enabled,false);}}
});
test('mapping delegates to the shared v4 validator and includes only ordinary editable scene data',()=>{
  const p=I.approximate(fixture(3),base);let called=0;
  const mock={FORMAT:'imagery-static-scene',DEFAULT_PULSE_PERIOD_MS:4000,defaultAuthoredObject:(id,shape)=>({id,shape,outline:{enabled:false},shadow:{enabled:false},timing:{pulse:{enabled:false}}}),canonicalScene:s=>{called++;assert.equal(s.version,4);assert.equal(s.sampler,'authored-objects-4');return s;}};
  const scene=I.toScene(p,mock);assert.equal(called,1);assert.equal(scene.scene.objects.length,p.objects.length);assert.equal(scene.scene.canvas.ratio,'1:1');assert.equal(scene.scene.objects[0].timing.pulse.enabled,false);
  for(const name of ['source','quality','algorithm','data','filename'])assert.equal(JSON.stringify(scene).includes('"'+name+'"'),false);
  assert.throws(()=>I.toScene(p,{}),/scene-v4/);
});
for(const count of [1,3,6,12])test('synthetic supported '+count+' item fixture improves constant background without a recognition claim',t=>{
  const started=performance.now(),p=I.approximate(fixture(count),{...base,maxObjects:count===1?3:count}),ms=performance.now()-started;
  assert.ok(p.objects.length<=count);assert.ok(p.quality.finalError<p.quality.initialError);assert.ok(p.quality.relativeReduction>.6);assert.ok(p.quality.evaluatedCandidates<=p.algorithm.maxObjects*384);
  t.diagnostic(JSON.stringify({tier:'synthetic-supported',sourceItems:count,outputItems:p.objects.length,initialError:p.quality.initialError,finalError:p.quality.finalError,relativeReduction:p.quality.relativeReduction,evaluatedCandidates:p.quality.evaluatedCandidates,elapsedMs:Math.round(ms*100)/100,note:'Node fixture timing, not browser responsiveness or human correction effort.'}));
});
test('unsupported full-field diagonal silhouette reports residual error instead of false perfection',t=>{
  const source=pixels(48,48,(x,y)=>Math.abs(x-y)<3?[230,180,80,255]:[0,0,0,255]),p=I.approximate(source,{...base,maxObjects:3});
  assert.ok(p.quality.finalError>0);assert.ok(p.objects.length<=3);assert.ok(p.quality.finalError<=p.quality.initialError);
  t.diagnostic(JSON.stringify({tier:'synthetic-unsupported',finalError:p.quality.finalError,relativeReduction:p.quality.relativeReduction,note:'No natural-image or manual-correction-effort gate is established.'}));
});
test('worst bounded source is finite and deterministically terminates within the fixed budget',t=>{
  const source=pixels(128,128,(x,y)=>[(x*37+y*17)%256,(x*11+y*73)%256,(x*97+y*3)%256,(x+y)%3?255:128]);
  const job=I.createJob(source,{...base,maxObjects:12,seed:4294967295});let state=job.getState(),calls=0,maxSliceMs=0;
  while(state.status==='running'){const started=performance.now();state=job.step(32);maxSliceMs=Math.max(maxSliceMs,performance.now()-started);calls++;assert.ok(calls<=12*384/32+1);}
  assert.ok(state.result.quality.finalError<=state.result.quality.initialError);assert.ok(state.result.objects.length<=12);assert.equal(state.status,'complete');
  t.diagnostic(JSON.stringify({tier:'synthetic-noise',inputPixels:128*128,workPixels:48*48,calls,maxObservedSliceMs:Math.round(maxSliceMs*100)/100,typedArrayUpperBound:I.LIMITS.maxModelTypedArrayBytes,note:'Includes source thumbnail plus model typed buffers only; excludes browser decode, canvases and JS object overhead.'}));
});

test('closed options reject non-enumerable values instead of silently replacing requested settings',()=>{const options={};Object.defineProperty(options,'maxObjects',{value:12});assert.throws(()=>I.canonicalOptions(options),/enumerable/);});
