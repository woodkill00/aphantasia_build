'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../src/sequence-model.js');
const M=require('../src/model.js');
const {clone,sequence,shortSequence}=require('./sequence-fixtures.cjs');
const reject=value=>{assert.equal(S.validateSequence(value).ok,false);assert.throws(()=>S.canonicalSequence(value));};
const accept=value=>{const canonical=S.canonicalSequence(value);assert.equal(S.validateSequence(value).ok,true);assert.deepEqual(S.parseSequence(JSON.stringify(canonical)),canonical);return canonical;};
const clocked=()=>{let now=0,reads=0;const timeline=S.createTimeline(()=>{reads++;return now});return {timeline,set:value=>{now=value},advance:delta=>{now+=delta},reads:()=>reads};};
function oracle(document,time){let start=0;const steps=document.sequence.steps;for(let i=0;i<steps.length;i++){const step=steps[i],holdEnd=start+step.holdMs;if(time<holdEnd)return {phase:'hold',stepIndex:i,nextStepIndex:null,alpha:0,done:false};if(step.transitionMs&&time<holdEnd+step.transitionMs)return {phase:'transition',stepIndex:i,nextStepIndex:i+1,alpha:(time-holdEnd)/step.transitionMs,done:false};start=holdEnd+step.transitionMs;}return {phase:'finished',stepIndex:null,nextStepIndex:null,alpha:0,done:true};}
function expectFrame(frame,expected){for(const [key,value]of Object.entries(expected)){if(key==='alpha')assert.ok(Math.abs(frame[key]-value)<1e-12,`alpha ${frame[key]} != ${value}`);else assert.equal(frame[key],value,key);}}

test('SEQUENCE MODEL: independent reference is closed, copied, canonical and JSON portable',()=>{
 const value=sequence(),canonical=accept(value);assert.deepEqual(canonical,value);assert.notEqual(canonical,value);assert.notEqual(canonical.sequence.steps,value.sequence.steps);const raw=S.serializeSequence(canonical);assert.equal(typeof raw,'string');assert.deepEqual(S.parseSequence(raw),value);assert.equal(S.FORMAT,'imagery-field-sequence');assert.equal(S.VERSION,2);assert.equal(S.SAMPLER,'ordered-crossfade-2');assert.ok(Object.isFrozen(S));assert.throws(()=>M.parseScene(raw));assert.throws(()=>S.parseSequence(JSON.stringify(require('./fixtures.cjs').scene())));
});
for(const [label,get,fields]of [['root',s=>s,['format','version','sampler','sequence']],['sequence',s=>s.sequence,['name','background','steps']],['step',s=>s.sequence.steps[0],['id','name','holdMs','transitionMs','objects']]])test(`SEQUENCE VALIDATION: ${label} missing or extra fields rejected`,()=>{
 for(const key of fields){const s=sequence();delete get(s)[key];reject(s)}
 for(const key of ['notes','url','callback','loop','easing','expression','__proto__','constructor','prototype']){const s=sequence();Object.defineProperty(get(s),key,{value:'synthetic',enumerable:true});reject(s)}
});
test('SEQUENCE VALIDATION: exact format, version, sampler and ordinary nested records',()=>{
 for(const [key,value]of [['format','other'],['version',3],['version','1'],['sampler','static-objects-2']]){const s=sequence();s[key]=value;reject(s)}
 for(const value of [null,true,1,'sequence',[],new Date()]){reject(value);for(const key of ['sequence','background','step']){const s=sequence();if(key==='sequence')s.sequence=value;else if(key==='background')s.sequence.background=value;else s.sequence.steps[0]=value;reject(s)}}
});
test('SEQUENCE VALIDATION: accessors, symbols and exotic prototypes reject without getter execution',()=>{
 let reads=0;for(const loc of [s=>s,s=>s.sequence,s=>s.sequence.background,s=>s.sequence.steps[0],s=>s.sequence.steps[0].objects[0],s=>s.sequence.steps[0].objects[0].color]){for(const kind of ['getter','symbol','prototype']){const s=sequence(),at=loc(s);if(kind==='getter')Object.defineProperty(at,Object.keys(at)[0],{enumerable:true,get(){reads++;throw Error('must not run')}});if(kind==='symbol')at[Symbol('capability')]=true;if(kind==='prototype')Object.setPrototypeOf(at,{capability:true});reject(s)}}assert.equal(reads,0);
});
test('SEQUENCE VALIDATION: 1 through 32 dense steps; arrays reject holes, extras and getters',()=>{
 const sample=sequence().sequence.steps[0];for(const length of [1,32])accept(sequence({steps:Array.from({length},(_,i)=>({...clone(sample),id:'step-'+i,transitionMs:i===length-1?0:1000}))}));
 for(const length of [0,33])reject(sequence({steps:Array.from({length},(_,i)=>({...clone(sample),id:'step-'+i,transitionMs:0}))}));
 let reads=0;for(const mutate of [a=>delete a[0],a=>a.extra=true,a=>a[Symbol('extra')]=1,a=>Object.setPrototypeOf(a,{}),a=>Object.defineProperty(a,'0',{get(){reads++;return sample}})]){const s=sequence();mutate(s.sequence.steps);reject(s)}assert.equal(reads,0);
});
test('SEQUENCE VALIDATION: each snapshot has 1 through 12 independently validated objects; 12 plus 12 fade allowed',()=>{
 const s=shortSequence();s.sequence.steps.forEach(step=>{step.objects=Array.from({length:12},(_,i)=>({...clone(step.objects[0]),id:'object-'+(i+1)}))});accept(s);assert.equal(S.compileTimeline(s).durationMs,2500);
 for(const count of [0,13]){const bad=sequence();bad.sequence.steps[0].objects=Array.from({length:count},(_,i)=>({...clone(bad.sequence.steps[0].objects[0]),id:'object-'+(i+1)}));reject(bad)}
 for(const mutate of [o=>o.x=-1,o=>o.shape='moving',o=>o.color.l=71,o=>o.color.h=360,o=>o.size=29,o=>o.url='https://example.invalid']){const bad=sequence();mutate(bad.sequence.steps[0].objects[0]);reject(bad)}
 const duplicate=sequence();duplicate.sequence.steps[0].objects.push(clone(duplicate.sequence.steps[0].objects[0]));reject(duplicate);
 const sharedIds=sequence();sharedIds.sequence.steps.forEach(step=>step.objects[0].id='object-1');accept(sharedIds);
});
test('SEQUENCE VALIDATION: step IDs and names are bounded inert strings; step IDs unique',()=>{
 for(const get of [s=>[s.sequence,'name'],s=>[s.sequence.steps[0],'name'],s=>[s.sequence.steps[0],'id']]){
  for(const value of ['', ' ', 'x'.repeat(65),null,1,{},[],'x\u0000','x\u007f','\u202eabc','a\u2069']){const s=sequence(),[at,key]=get(s);at[key]=value;reject(s)}
  for(const value of ['x','x'.repeat(64),'⚪ synthetic','<img src=x onerror=alert(1)>','https://example.invalid']){const s=sequence(),[at,key]=get(s);at[key]=value;accept(s)}
 }
 const s=sequence();s.sequence.steps[1].id=s.sequence.steps[0].id;reject(s);
});
for(const [key,min,max]of [['holdMs',1000,600000],['transitionMs',0,60000]])test(`SEQUENCE VALIDATION: ${key} bounds, 500ms increments and numeric types`,()=>{
 for(const value of [min,max,min+500]){const s=sequence();s.sequence.steps[0][key]=value;accept(s)}
 for(const value of [min-500,max+500,min+1,min+0.5,NaN,Infinity,-Infinity,String(min),null,true,{},[]]){const s=sequence();s.sequence.steps[0][key]=value;reject(s)}
});
test('SEQUENCE VALIDATION: final transition exactly zero and one-hour total is inclusive',()=>{
 const s=sequence();s.sequence.steps.at(-1).transitionMs=500;reject(s);
 const step=sequence().sequence.steps[0],max=sequence({steps:Array.from({length:6},(_,i)=>({...clone(step),id:'step-'+i,holdMs:600000,transitionMs:0}))});accept(max);assert.equal(S.compileTimeline(max).durationMs,3600000);max.sequence.steps[0].transitionMs=500;reject(max);
 const invalid=sequence();invalid.sequence.steps[0].holdMs=Number.MAX_SAFE_INTEGER;reject(invalid);
});
test('SEQUENCE PARSER: decoded duplicate keys reject at all relevant depths and escaped spellings',()=>{
 const raw=JSON.stringify(sequence());for(const text of [raw.replace('"version":2','"version":2,"\\u0076ersion":2'),raw.replace('"sequence":','"sequence":null,"sequence":'),raw.replace('"holdMs":3000','"holdMs":1000,"holdMs":3000'),raw.replace('"transitionMs":1000','"transitionMs":0,"\\u0074ransitionMs":1000'),raw.replace('"h":210','"h":0,"\\u0068":210'),raw.replace('"x":30','"x":20,"x":30')])assert.throws(()=>S.parseSequence(text),/duplicate/i);
});
test('SEQUENCE PARSER: malformed content, excessive depth and 1MiB UTF-8 limit',()=>{
 for(const text of ['', '{','null','[]','true','42','"sequence"','/*comment*/{}','{"a":1,}',undefined,null,{},Buffer.from('{}'),'['.repeat(40)+'0'+']'.repeat(40)])assert.throws(()=>S.parseSequence(text));
 const raw=JSON.stringify(sequence()),limit=1048576;assert.deepEqual(S.parseSequence(raw+' '.repeat(limit-Buffer.byteLength(raw))),sequence());assert.throws(()=>S.parseSequence(raw+' '.repeat(limit-Buffer.byteLength(raw)+1)),/1 MiB|1048576|large/i);assert.throws(()=>S.parseSequence(raw+'é'.repeat(Math.ceil(limit/2))),/1 MiB|1048576|large/i);
 const key='x'.repeat(400000);let error;try{S.parseSequence(`{"${key}":1,"${key}":2}`)}catch(e){error=e}assert.ok(error);assert.ok(error.message.length<=300,'parse error must not echo unbounded imported text');
});
test('SEQUENCE TIMELINE: canonical eleven-second reference has exact half-open boundaries and midpoint alpha',()=>{
 const compiled=S.compileTimeline(sequence());assert.equal(compiled.durationMs,11000);assert.ok(Object.isFrozen(compiled));
 for(const [time,expected]of [[0,['hold',0,null,0,false]],[2999.999,['hold',0,null,0,false]],[3000,['transition',0,1,0,false]],[3500,['transition',0,1,.5,false]],[3999,['transition',0,1,.999,false]],[4000,['hold',1,null,0,false]],[6999.999,['hold',1,null,0,false]],[7000,['transition',1,2,0,false]],[7500,['transition',1,2,.5,false]],[8000,['hold',2,null,0,false]],[10999.999,['hold',2,null,0,false]],[11000,['finished',null,null,0,true]],[99999,['finished',null,null,0,true]]]){
  const [phase,stepIndex,nextStepIndex,alpha,done]=expected,frame=S.frameAt(compiled,time);expectFrame(frame,{phase,stepIndex,nextStepIndex,alpha,done});assert.equal(frame.elapsedMs,Math.min(time,11000));assert.equal(frame.durationMs,11000);
 }
 for(const time of [-1,NaN,Infinity,-Infinity,'0',null,undefined])assert.throws(()=>S.frameAt(compiled,time));
});
test('SEQUENCE TIMELINE: direct cuts enter the next hold at the same instant with no transition or blank',()=>{
 const value=sequence();value.sequence.steps.forEach(step=>step.transitionMs=0);const compiled=S.compileTimeline(value);assert.equal(compiled.durationMs,9000);
 for(const [time,index]of [[0,0],[2999.999,0],[3000,1],[3000.001,1],[5999.999,1],[6000,2],[8999.999,2]])expectFrame(S.frameAt(compiled,time),{phase:'hold',stepIndex:index,nextStepIndex:null,alpha:0,done:false});assert.equal(S.frameAt(compiled,9000).done,true);
});
test('SEQUENCE TIMELINE: independent seeded phase oracle covers many holds, fades, cuts and overlaps',()=>{
 let seed=0x23c0149;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0};
 for(let run=0;run<80;run++){const source=sequence(),base=source.sequence.steps[0],count=1+rand()%32;source.sequence.steps=Array.from({length:count},(_,i)=>({...clone(base),id:'step-'+i,holdMs:1000+500*(rand()%30),transitionMs:i===count-1?0:500*(rand()%15)}));const compiled=S.compileTimeline(source),duration=source.sequence.steps.reduce((sum,s)=>sum+s.holdMs+s.transitionMs,0);assert.equal(compiled.durationMs,duration);for(let j=0;j<100;j++){const time=rand()%(duration+2000);expectFrame(S.frameAt(compiled,time),oracle(source,time));}}
});
test('SEQUENCE TIMELINE: compile and frame evaluation do not consult random/time or mutate input',()=>{
 const value=sequence(),before=clone(value),now=Date.now,random=Math.random;try{Date.now=()=>{throw Error('wall clock consulted')};Math.random=()=>{throw Error('random consulted')};const compiled=S.compileTimeline(value);assert.deepEqual(S.frameAt(compiled,3500),S.frameAt(compiled,3500));assert.deepEqual(value,before);value.sequence.steps[0].objects[0].color.h=0;assert.deepEqual(S.frameAt(compiled,3500),S.frameAt(compiled,3500));}finally{Date.now=now;Math.random=random}
});
test('SEQUENCE STATE: explicit start, single pass completion, reset and no implicit replay',()=>{
 const h=clocked(),c=h.timeline;assert.equal(c.getState().status,'stopped');const first=c.start(sequence()).frame;expectFrame(first,{phase:'hold',stepIndex:0,done:false});assert.equal(c.getState().status,'running');assert.equal(c.markPainted(first),true);h.set(11000);const end=c.tick().frame;assert.equal(end.done,true);assert.equal(c.getState().status,'finished');assert.equal(c.getState().elapsedMs,0);assert.equal(c.getState().paintedElapsedMs,0);const gen=c.getState().generation;h.set(100000);c.tick().frame;assert.equal(c.getState().status,'finished');assert.equal(c.getState().generation,gen);c.stop();assert.equal(c.getState().status,'stopped');assert.equal(c.getState().frame,null);
});
test('SEQUENCE STATE: Pause freezes last actually painted3475ms frame rather than click-time3500ms',()=>{
 const h=clocked(),c=h.timeline;const first=c.start(sequence()).frame;c.markPainted(first);h.set(3475);const frame=c.tick().frame;assert.equal(frame.alpha,.475);assert.equal(c.markPainted(frame),true);h.set(3500);const beforeReads=h.reads();c.pause();assert.equal(h.reads(),beforeReads,'Pause must not sample click clock');assert.equal(c.getState().status,'paused');assert.equal(c.getState().elapsedMs,3475);assert.equal(c.getState().paintedElapsedMs,3475);assert.equal(c.getState().frame.alpha,.475);h.set(100000);const resumed=c.resume().frame;assert.equal(resumed.elapsedMs,3475);assert.equal(c.getState().status,'running');h.advance(525);expectFrame(c.tick().frame,{phase:'hold',stepIndex:1,done:false});assert.equal(c.getState().elapsedMs,4000);
});
test('SEQUENCE STATE: acknowledged exact midpoint persists through pause and explicit resume',()=>{
 const h=clocked(),c=h.timeline;c.markPainted(c.start(sequence()).frame);h.set(3500);const midpoint=c.tick().frame;c.markPainted(midpoint);c.pause();assert.equal(c.getState().frame.alpha,.5);h.set(999999);assert.equal(c.getState().frame.alpha,.5);assert.equal(c.resume().frame.alpha,.5);h.advance(1);assert.equal(c.tick().frame.alpha,.501);
});
test('SEQUENCE STATE: copied, forged, old-generation and regressive painted acknowledgements are inert',()=>{
 const h=clocked(),c=h.timeline,first=c.start(sequence()).frame;assert.equal(c.markPainted({...first}),false);assert.equal(c.markPainted(S.frameAt(S.compileTimeline(sequence()),0)),false);assert.equal(c.markPainted(first),true);h.set(3500);const later=c.tick().frame;assert.equal(c.markPainted(later),true);const before=c.getState();assert.equal(c.markPainted(first),false);assert.deepEqual(c.getState(),before);c.pause();assert.equal(c.markPainted(later),false);c.resume();assert.equal(c.markPainted(later),false);c.stop();assert.equal(c.markPainted(later),false);c.start(sequence()).frame;assert.equal(c.markPainted(first),false);
});
test('SEQUENCE STATE: getState does not advance the clock, backwards samples clamp, nonfinite clock rejects',()=>{
 const h=clocked(),c=h.timeline;c.markPainted(c.start(sequence()).frame);h.set(5000);c.tick().frame;const reads=h.reads();c.getState();c.getState();assert.equal(h.reads(),reads);h.set(100);assert.equal(c.tick().frame.elapsedMs,5000);h.set(6000);assert.equal(c.tick().frame.elapsedMs,6000);h.set(NaN);assert.throws(()=>c.tick().frame,/clock|finite/i);
});
test('SEQUENCE STATE: engine has no rendering or browser authority and never schedules callbacks',()=>{
 const fs=require('node:fs'),source=fs.readFileSync(require.resolve('../src/sequence-model.js'),'utf8');for(const re of [/\bdocument\.(?:getElementById|querySelector|createElement|body|addEventListener)\b/,/\brequestAnimationFrame\s*\(/,/\bsetTimeout\s*\(/,/\bsetInterval\s*\(/,/\bfetch\s*\(/,/\blocalStorage\b/,/\.getContext\s*\(/,/\.show\s*\(/])assert.doesNotMatch(source,re);
});

test('SEQUENCE STATE: forged compiled records and invalid new start cannot replace a running document',()=>{
 const h=clocked(),c=h.timeline,compiled=S.compileTimeline(sequence());assert.throws(()=>S.frameAt({...compiled},0));assert.throws(()=>S.frameAt({durationMs:1,phases:[]},0));c.markPainted(c.start(compiled).frame);h.set(2500);c.tick();const before=c.getState(),bad=sequence();bad.sequence.steps[0].holdMs=0;assert.throws(()=>c.start(bad));assert.deepEqual(c.getState(),before);assert.ok(Object.isFrozen(compiled.document.sequence.steps[0].objects[0].color));
});
