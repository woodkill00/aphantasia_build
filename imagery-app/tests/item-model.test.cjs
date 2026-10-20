'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const I=require('../src/item-model.js'),M=require('../src/model.js');
const {scene,styledObject,copy}=require('./fixtures.cjs');
const item=(id,timing={})=>{const o=styledObject({id});Object.assign(o.timing,timing);return o;};
const sample=()=>scene({objects:[item('object-1',{startMs:0,fadeInMs:1000,holdMs:2000,fadeOutMs:1000}),item('object-2',{startMs:2000,fadeInMs:500,holdMs:1000,fadeOutMs:500}),item('object-3',{startMs:5000,fadeInMs:0,holdMs:1000,fadeOutMs:0})]});
const clocked=()=>{let now=0,reads=0;const player=I.createTimeline(()=>{reads++;return now;});return {player,set:v=>now=v,add:v=>now+=v,reads:()=>reads};};
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} differs from ${b}`);

test('ITEM TIMELINE: duration is maximum overlapping item end, not sum; gap remains background-only',()=>{
 const t=I.compileTimeline(sample());assert.equal(t.durationMs,6000);assert.deepEqual(t.tracks.map(v=>[v.startMs,v.fadeInEndMs,v.holdEndMs,v.endMs]),[[0,1000,3000,4000],[2000,2500,3500,4000],[5000,5000,6000,6000]]);
 assert.deepEqual(I.frameAt(t,4500).items.map(v=>v.alpha),[0,0,0]);assert.equal(I.frameAt(t,4500).done,false);assert.ok(Object.isFrozen(t));assert.ok(Object.isFrozen(t.document.scene.objects[0].timing));
});
test('ITEM TIMELINE: exact half-open start/fade/hold/end samples and automatic terminal frame',()=>{
 const t=I.compileTimeline(sample());
 for(const[ms,alphas,phases]of [[0,[0,0,0],['fade-in','waiting','waiting']],[500,[.5,0,0],['fade-in','waiting','waiting']],[1000,[1,0,0],['hold','waiting','waiting']],[2000,[1,0,0],['hold','fade-in','waiting']],[2250,[1,.5,0],['hold','fade-in','waiting']],[2500,[1,1,0],['hold','hold','waiting']],[3000,[1,1,0],['fade-out','hold','waiting']],[3500,[.5,1,0],['fade-out','fade-out','waiting']],[3750,[.25,.5,0],['fade-out','fade-out','waiting']],[4000,[0,0,0],['finished','finished','waiting']],[5000,[0,0,1],['finished','finished','hold']],[6000,[0,0,0],['finished','finished','finished']]]){
  const f=I.frameAt(t,ms);assert.deepEqual(f.items.map(v=>v.alpha),alphas);assert.deepEqual(f.items.map(v=>v.phase),phases);assert.equal(f.elapsedMs,ms);assert.equal(f.remainingMs,6000-ms);assert.equal(f.done,ms===6000);
 }
 const end=I.frameAt(t,Number.MAX_VALUE);assert.equal(end.elapsedMs,6000);assert.equal(end.done,true);assert.ok(Object.isFrozen(end.items[0]));
});
test('ITEM TIMELINE: zero-hold fade triangle, direct cut and single100ms lifetime remain defined',()=>{
 const s=scene({objects:[item('object-1',{fadeInMs:100,holdMs:0,fadeOutMs:100})]}),t=I.compileTimeline(s);
 for(const[ms,a]of [[0,0],[50,.5],[100,1],[150,.5],[200,0]])approx(I.frameAt(t,ms).items[0].alpha,a);
 s.scene.objects[0].timing={startMs:0,fadeInMs:0,holdMs:100,fadeOutMs:0,pulse:{enabled:false,minOpacity:.8}};const cut=I.compileTimeline(s);assert.equal(I.frameAt(cut,0).items[0].alpha,1);assert.equal(I.frameAt(cut,99.999).items[0].alpha,1);assert.equal(I.frameAt(cut,100).items[0].alpha,0);
});
test('ITEM TIMELINE: pulse uses one absolute global phase, including independently delayed items',()=>{
 const s=scene({pulsePeriodMs:4000,objects:[item('object-1',{holdMs:6000,pulse:{enabled:true,minOpacity:.5}}),item('object-2',{startMs:1000,holdMs:5000,pulse:{enabled:true,minOpacity:.8}})]}),t=I.compileTimeline(s);
 for(const[ms,a,b]of [[1000,.75,.9],[2000,.5,.8],[3000,.75,.9],[4000,1,1],[5000,.75,.9]]){const f=I.frameAt(t,ms);approx(f.items[0].alpha,a);approx(f.items[1].alpha,b);}
 assert.equal(I.frameAt(t,6000).done,true);
});
test('ITEM TIMELINE: pulse multiplies fade envelope over complete finite lifetime without overriding end',()=>{
 const s=scene({pulsePeriodMs:4000,objects:[item('object-1',{fadeInMs:2000,holdMs:0,fadeOutMs:2000,pulse:{enabled:true,minOpacity:.5}})]}),t=I.compileTimeline(s);
 for(const[ms,a]of [[0,0],[1000,.375],[2000,.5],[3000,.375],[4000,0]])approx(I.frameAt(t,ms).items[0].alpha,a);
});
test('ITEM TIMELINE: no pulse and minOpacity1 remain constant on holds independent of period',()=>{
 const s=scene({pulsePeriodMs:2000,objects:[item('object-1',{holdMs:600000}),item('object-2',{holdMs:600000,pulse:{enabled:true,minOpacity:1}})]}),t=I.compileTimeline(s);
 for(const ms of [0,50,555,1000,2000,599999])assert.deepEqual(I.frameAt(t,ms).items.map(v=>v.alpha),[1,1]);
});
test('ITEM TIMELINE: compiled authority cannot be forged, empty and invalid inputs reject',()=>{
 const t=I.compileTimeline(sample());for(const fake of [{...t},{durationMs:1,tracks:[]},null,undefined])assert.throws(()=>I.frameAt(fake,0));for(const ms of [-1,NaN,Infinity,-Infinity,'0',null,undefined])assert.throws(()=>I.frameAt(t,ms));assert.throws(()=>I.compileTimeline(scene({objects:[]})),/at least one/i);const bad=sample();bad.scene.objects[0].timing.holdMs=1;assert.throws(()=>I.compileTimeline(bad));
});
test('ITEM TIMELINE: compile/frame do not mutate or retain caller input and never consult clocks/random',()=>{
 const s=sample(),before=copy(s),oldNow=Date.now,oldRandom=Math.random;try{Date.now=()=>{throw Error('clock')};Math.random=()=>{throw Error('random')};const t=I.compileTimeline(s);assert.deepEqual(s,before);const a=I.frameAt(t,2250);s.scene.objects[0].timing.holdMs=100;assert.deepEqual(I.frameAt(t,2250),a);}finally{Date.now=oldNow;Math.random=oldRandom}
});
test('ITEM TIMELINE: independent seeded interval oracle covers12 overlapping fade schedules',()=>{
 let seed=12345678;const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
 for(let run=0;run<40;run++){
  const objects=Array.from({length:12},(_,i)=>item('object-'+(i+1),{startMs:100*(rnd()%30),fadeInMs:100*(rnd()%20),holdMs:100+100*(rnd()%20),fadeOutMs:100*(rnd()%20)})),s=scene({objects}),t=I.compileTimeline(s);
  for(let j=0;j<100;j++){
   const ms=rnd()%(t.durationMs+1000),f=I.frameAt(t,ms);for(let k=0;k<objects.length;k++){
    const q=objects[k].timing,local=ms-q.startMs,life=q.fadeInMs+q.holdMs+q.fadeOutMs;let a=0;if(local>=0&&local<life){if(q.fadeInMs&&local<q.fadeInMs)a=local/q.fadeInMs;else if(local<q.fadeInMs+q.holdMs)a=1;else a=(life-local)/q.fadeOutMs;}approx(f.items[k].alpha,a);
   }
  }
 }
});
test('ITEM PLAYER: explicit start, painted-frame pause, resume and terminal reset are single-pass',()=>{
 const h=clocked(),p=h.player;assert.equal(p.getState().status,'stopped');const first=p.start(sample()).frame;assert.equal(p.markPainted(first),true);h.set(2250);const f=p.tick().frame;p.markPainted(f);h.set(2400);const reads=h.reads();p.pause();assert.equal(h.reads(),reads);assert.equal(p.getState().elapsedMs,2250);assert.deepEqual(p.getState().frame.items,f.items);h.set(100000);p.resume();assert.equal(p.getState().frame.elapsedMs,2250);h.add(3750);const done=p.tick();assert.equal(done.status,'finished');assert.equal(done.frame.done,true);assert.equal(done.elapsedMs,0);const g=done.generation;h.add(100000);assert.equal(p.tick().generation,g);p.stop();assert.equal(p.getState().frame,null);
});
test('ITEM PLAYER: forged old-generation and regressive painted acknowledgements reject',()=>{
 const h=clocked(),p=h.player,f=p.start(sample()).frame;assert.equal(p.markPainted({...f}),false);assert.equal(p.markPainted(f),true);h.set(1000);const next=p.tick().frame;assert.equal(p.markPainted(next),true);assert.equal(p.markPainted(f),false);p.pause();assert.equal(p.markPainted(next),false);p.resume();assert.equal(p.markPainted(next),false);p.stop();p.start(sample());assert.equal(p.markPainted(f),false);
});
test('ITEM PLAYER: invalid new start and invalid clock cannot replace a valid running plan',()=>{
 const h=clocked(),p=h.player;p.start(sample());h.set(500);p.tick();const before=p.getState();assert.throws(()=>p.start(scene({objects:[]})));assert.deepEqual(p.getState(),before);h.set(NaN);assert.throws(()=>p.start(sample()),/clock/);assert.deepEqual(p.getState(),before);assert.throws(()=>p.tick(),/clock/);p.stop();assert.equal(p.getState().status,'stopped');
});
test('ITEM PLAYER: backward clocks clamp and very large finite jumps terminate, with no catch-up loops',()=>{
 const h=clocked(),p=h.player;p.start(sample());h.set(1000);p.tick();h.set(-100);assert.equal(p.tick().elapsedMs,1000);h.set(Number.MAX_VALUE);assert.equal(p.tick().status,'finished');
 const huge=I.createTimeline(()=>-Number.MAX_VALUE);huge.start(sample());assert.equal(huge.getState().status,'running');
});
test('ITEM PLAYER: source has no DOM, scheduling, network, storage or scene visibility authority',()=>{
 const text=require('node:fs').readFileSync(require.resolve('../src/item-model.js'),'utf8');for(const pattern of [/requestAnimationFrame\s*\(/,/setTimeout\s*\(/,/setInterval\s*\(/,/fetch\s*\(/,/localStorage/,/\.getContext\s*\(/,/\.show\s*\(/,/document\.(?:getElementById|querySelector|createElement)/])assert.doesNotMatch(text,pattern);
});
