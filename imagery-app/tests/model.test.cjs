'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const m=require('../src/model.js');
const copy=x=>JSON.parse(JSON.stringify(x));
const base=()=>copy(m.presets()[0]);
const scene=(changes={})=>{const s=base();Object.assign(s.scene,changes);return s;};
const controller=()=>{let t=0;const c=m.createController(()=>t);return {c,advance(ms=3000){t+=ms},setTime(x){t=x}}};
const stateScene=c=>c.getState().current;
function rejects(s){assert.equal(m.validateScene(s).ok,false);assert.throws(()=>m.canonicalScene(s));}

test('MODEL: five presets valid, fresh, and format constants frozen',()=>{
 assert.equal(m.presets().length,5); for(const s of m.presets())assert.equal(m.validateScene(s).ok,true);
 assert.ok(Object.isFrozen(m));assert.ok(Object.isFrozen(m.PALETTES));assert.ok(Object.isFrozen(m.SHAPES));
 const p=m.presets();p[0].scene.name='changed';assert.notEqual(m.presets()[0].scene.name,'changed');
});
test('MODEL: canonical copies are stable, independent, and strip no unsupported fields',()=>{
 const p=base(), c=m.canonicalScene(p);assert.deepEqual(c,p);assert.notEqual(c,p);c.scene.name='x';assert.notEqual(p.scene.name,'x');
 assert.deepEqual(m.parseScene(JSON.stringify(p,null,2)),p);
 const n=Object.assign(Object.create(null),p);assert.deepEqual(m.canonicalScene(n),p);
});
for(const field of ['format','version','sampler','scene'])test(`VALIDATE: missing root ${field}`,()=>{const s=base();delete s[field];rejects(s)});
for(const field of ['name','shape','x','y','size','dotCount','dotRadius','palette'])test(`VALIDATE: missing scene ${field}`,()=>{const s=base();delete s.scene[field];rejects(s)});
for(const bad of [null,[],true,42,'scene',new Date()])test(`VALIDATE: rejects root ${String(bad)}`,()=>rejects(bad));
for(const bad of [null,[],true,42,'scene',new Date()])test(`VALIDATE: rejects scene object ${String(bad)}`,()=>{const s=base();s.scene=bad;rejects(s)});
for(const [key,value] of [['format','other'],['version',0],['version',2],['version','1'],['sampler','unknown'],['sampler',1]])test(`VALIDATE: rejects ${key} ${value}`,()=>{const s=base();s[key]=value;rejects(s)});
for(const key of ['animation','url','html','script','__proto__','constructor','prototype','preferences','notes','timeline','density','seed'])test(`VALIDATE: rejects unsupported field ${key} at both levels`,()=>{
 for(const atRoot of [true,false]){const s=base();Object.defineProperty(atRoot?s:s.scene,key,{value:'test',enumerable:true});rejects(s)}
});
test('VALIDATE: symbol fields, accessors and exotic prototypes rejected without getter execution',()=>{
 let invoked=0;const s=base();Object.defineProperty(s.scene,'x',{get(){invoked++;return 50},enumerable:true});rejects(s);assert.equal(invoked,0);
 const q=base();q.scene[Symbol('x')]=1;rejects(q);const r=base();Object.setPrototypeOf(r.scene,{a:1});rejects(r);
});
for(const [field,min,max] of [['x',25,75],['y',25,75],['size',14,28],['dotCount',1,5],['dotRadius',1,2]])test(`VALIDATE: ${field} boundaries, types and finite integers`,()=>{
 for(const v of [min,max])assert.equal(m.validateScene(scene({[field]:v,dotCount:1})).ok,true);
 for(const v of [min-1,max+1,NaN,Infinity,-Infinity,1.5,String(min),null,false,{},[]])rejects(scene({[field]:v}));
});
for(const field of ['shape','palette'])test(`VALIDATE: strict ${field} enums`,()=>{
 for(const v of ['','__proto__','constructor',0,null,{},[],true,'<svg onload=alert(1)>'])rejects(scene({[field]:v}));
});
test('VALIDATE: names length/control boundaries and harmless text',()=>{
 for(const v of ['', ' ', '\t', 'a'.repeat(65), 1, null, {}, [], 'x\u0000', 'x\u007f', '\u202eabc', 'a\u2069'])rejects(scene({name:v}));
 for(const v of ['x','x'.repeat(64),'⚪ synthetic','<img src=x onerror=alert(1)>','https://example.invalid']) assert.equal(m.validateScene(scene({name:v})).ok,true);
});
test('PARSE: malformed and nontext inputs fail',()=>{
 for(const s of ['', '{','null','[]','true','42','"string"','{"scene":}', '/*comment*/{}','{"a":1,}',undefined,null,{},Buffer.from('{}')])assert.throws(()=>m.parseScene(s));
});
test('PARSE: duplicate keys rejected including escaped spelling and nested value',()=>{
 for(const s of [
 JSON.stringify(base()).replace('"version":1','"version":999,"version":1'),
 JSON.stringify(base()).replace('"version":1','"version":1,"\\u0076ersion":1'),
 JSON.stringify(base()).replace('"x":50','"x":25,"x":50'),
 JSON.stringify(base()).replace('"scene":','"scene":null,"scene":')
 ])assert.throws(()=>m.parseScene(s),'duplicate key must not silently overwrite an earlier value');
});
test('PARSE: byte-size boundary enforced, including multibyte input',()=>{
 const raw=JSON.stringify(base());assert.deepEqual(m.parseScene(raw+' '.repeat(m.MAX_IMPORT_BYTES-Buffer.byteLength(raw))),base());
 assert.throws(()=>m.parseScene(raw+' '.repeat(m.MAX_IMPORT_BYTES-Buffer.byteLength(raw)+1)));
 const s=raw+'é'.repeat(Math.floor(m.MAX_IMPORT_BYTES/2));assert.ok(s.length<m.MAX_IMPORT_BYTES);assert.throws(()=>m.parseScene(s),/1 MiB/);
});
test('PARSE: excessive nesting fails with bounded input without destroying valid model',()=>{
 const text='['.repeat(2000)+'0'+']'.repeat(2000);assert.throws(()=>m.parseScene(text));assert.equal(m.validateScene(base()).ok,true);
});
test('PRIVACY: scene canonical export contains only scene data; notebook rejected',()=>{
 const s=base();assert.deepEqual(Object.keys(s),['format','version','sampler','scene']);
 rejects({...s,notes:'synthetic note'});rejects({format:'imagery-observations',version:1,notes:'synthetic'});
});
test('GEOMETRY: deterministic exact fixed points, no mutation or wall-clock/random dependency',()=>{
 const s=scene({size:20,dotCount:5});const before=copy(s);const oldRandom=Math.random,oldNow=Date.now;
 try{Math.random=()=>{throw Error('random consulted')};Date.now=()=>{throw Error('clock consulted')};assert.deepEqual(m.geometry(s),[
  {kind:'dot',id:'dot-1',x:50,y:50,radius:1},{kind:'dot',id:'dot-2',x:40.4,y:43,radius:1},{kind:'dot',id:'dot-3',x:60,y:44,radius:1},{kind:'dot',id:'dot-4',x:45,y:60,radius:1},{kind:'dot',id:'dot-5',x:59,y:60,radius:1}
 ]);assert.deepEqual(m.geometry(s),m.geometry(s));assert.deepEqual(s,before)}finally{Math.random=oldRandom;Date.now=oldNow}
});
test('GEOMETRY: contour fixtures and meaningful descriptions',()=>{
 assert.deepEqual(m.geometry(scene({shape:'circle',size:20})),[{kind:'circle',x:50,y:50,radius:10,lineWidth:1}]);
 assert.deepEqual(m.geometry(scene({shape:'square',size:20}))[0].points,[[40,40],[60,40],[60,60],[40,60]]);
 assert.deepEqual(m.geometry(scene({shape:'triangle',size:20}))[0].points,[[50,40],[60,60],[40,60]]);
 for(const p of m.presets()){assert.match(m.describe(p),new RegExp(p.scene.name));assert.match(m.describe(p),/100 by 100 black field/)}
});
test('GEOMETRY: boundary combinations validate and remain inset; 7200 bounded cases',()=>{
 let count=0;
 for(const shape of m.SHAPES)for(const palette of Object.keys(m.PALETTES))for(const x of [25,75])for(const y of [25,75])for(let size=14;size<=28;size++)for(let dotCount=1;dotCount<=5;dotCount++)for(const dotRadius of [1,2]){
 const s=scene({shape,palette,x,y,size,dotCount,dotRadius});const v=m.validateScene(s);
 if(!v.ok){assert.equal(shape,'dots');assert.equal(dotRadius,2);assert.match(v.error,/separation/);continue;}
 for(const g of m.geometry(s)){if(g.kind==='dot'||g.kind==='circle'){assert.ok(g.x-g.radius>=8&&g.x+g.radius<=92&&g.y-g.radius>=8&&g.y+g.radius<=92)}else for(const p of g.points)assert.ok(p.every(n=>n>=8&&n<=92));}
 assert.deepEqual(m.parseScene(JSON.stringify(s)),s);count++;
 }
 assert.ok(count>=6000,`only ${count} boundary scenes accepted`);
});
test('GEOMETRY: programmatic invalid input never reaches raw geometry',()=>{assert.throws(()=>m.geometry(scene({shape:'stripes'})));assert.throws(()=>m.describe(scene({x:0})));});
test('STATE: startup hidden, immutable snapshots, no-op apply has no history',()=>{
 const {c}=controller();let s=c.getState();assert.equal(s.visible,false);assert.equal(s.dirty,false);assert.equal(s.undoCount,0);s.current.scene.x=0;assert.equal(stateScene(c).scene.x,50);
 assert.equal(c.apply().ok,true);assert.equal(c.getState().revision,0);assert.equal(c.getState().undoCount,0);
});
test('STATE: stage immediately hides without rendering draft, Show is explicit and never queued',()=>{
 const {c,advance}=controller();assert.equal(c.show().ok,true);const p=scene({shape:'square'});assert.equal(c.stage(p).ok,true);assert.equal(c.getState().visible,false);assert.equal(stateScene(c).scene.shape,'dots');assert.equal(c.getState().dirty,true);
 assert.equal(c.apply().ok,true);assert.equal(c.getState().visible,false);assert.equal(c.show().ok,false);advance();assert.equal(c.getState().visible,false);assert.equal(c.show().ok,true);assert.deepEqual(stateScene(c),p);
});
test('STATE: dirty hidden draft blocks Show and discard restores accepted scene',()=>{
 const {c}=controller();c.stage(scene({shape:'triangle'}));assert.equal(c.show().ok,false);c.discard();assert.equal(c.getState().dirty,false);assert.equal(c.show().ok,true);
});
test('STATE: invalid stage/apply preserve accepted scene and valid draft',()=>{
 const {c}=controller();const original=stateScene(c);c.stage(scene({name:'valid draft'}));assert.equal(c.stage(scene({x:0})).ok,false);assert.equal(c.getState().draft.scene.name,'valid draft');assert.equal(c.apply(scene({shape:'animated'})).ok,false);assert.deepEqual(stateScene(c),original);
});
test('STATE: immediate Hide/End preserve current and enforce explicit reveal gap',()=>{
 for(const method of ['hide','end']){const {c,advance}=controller();c.show();const current=stateScene(c);c[method]();assert.equal(c.getState().visible,false);assert.deepEqual(stateScene(c),current);assert.equal(c.show().ok,false);advance(2999);assert.equal(c.show().ok,false);advance(1);assert.equal(c.getState().visible,false);assert.equal(c.show().ok,true);}
});
test('STATE: repeated Hide resets the gate; repeated Show neither queues nor extends it',()=>{
 const {c,advance}=controller();c.show();c.hide();for(let i=0;i<100;i++)assert.equal(c.show().ok,false);advance(2500);c.hide();advance(500);assert.equal(c.show().ok,false);advance(2500);assert.equal(c.show().ok,true);
});
test('STATE: undo/redo exact, apply after undo clears redo, no-op failure honest',()=>{
 const {c}=controller();const p0=stateScene(c),p1=scene({shape:'circle'}),p2=scene({shape:'square'});assert.equal(c.undo().ok,false);assert.equal(c.redo().ok,false);c.apply(p1);c.apply(p2);assert.equal(c.undo().ok,true);assert.deepEqual(stateScene(c),p1);c.undo();assert.deepEqual(stateScene(c),p0);c.redo();assert.deepEqual(stateScene(c),p1);c.redo();assert.deepEqual(stateScene(c),p2);c.undo();c.apply(scene({name:'replacement'}));assert.equal(c.redo().ok,false);
});
test('STATE: history bounded to 40 and redo restoration does not grow beyond cap',()=>{
 const {c}=controller();for(let i=0;i<100;i++)c.apply(scene({name:`scene ${i}`}));assert.equal(c.getState().undoCount,m.HISTORY_LIMIT);for(let i=0;i<m.HISTORY_LIMIT;i++)assert.equal(c.undo().ok,true);assert.equal(c.undo().ok,false);for(let i=0;i<m.HISTORY_LIMIT;i++)assert.equal(c.redo().ok,true);assert.equal(c.getState().undoCount,m.HISTORY_LIMIT);assert.equal(c.redo().ok,false);
});
test('STATE: import accepted atomically hidden; invalid import preserves current',()=>{
 const {c}=controller();c.show();const p=scene({shape:'triangle'});let token=c.beginImport();assert.equal(c.getState().visible,false);assert.equal(c.getState().pendingImport,true);assert.equal(c.finishImport(token,JSON.stringify(p)).ok,true);assert.deepEqual(stateScene(c),p);assert.equal(c.getState().visible,false);token=c.beginImport();assert.equal(c.finishImport(token,'{').ok,false);assert.deepEqual(stateScene(c),p);assert.equal(c.getState().pendingImport,false);
});
for(const method of ['hide','end','show','discard','invalidateImport','stage','apply','undo','redo'])test(`RACE: stale import canceled by newer ${method}`,()=>{
 const {c}=controller();c.apply(scene({name:'A'}));c.apply(scene({name:'B'}));if(method==='redo')c.undo();const token=c.beginImport();
 if(method==='stage'||method==='apply')c[method](scene({name:'new action'}));else c[method]();
 const after=stateScene(c);assert.equal(c.finishImport(token,JSON.stringify(scene({name:'stale import'}))).ok,false);assert.deepEqual(stateScene(c),after);
});
test('RACE: newest import wins and completed token is single-use',()=>{
 const {c}=controller();const a=c.beginImport(),b=c.beginImport();assert.notEqual(a,b);assert.equal(c.finishImport(a,JSON.stringify(scene({name:'old'}))).ok,false);assert.equal(c.getState().pendingImport,true);assert.equal(c.finishImport(b,JSON.stringify(scene({name:'new'}))).ok,true);assert.equal(c.finishImport(b,JSON.stringify(scene({name:'again'}))).ok,false);assert.equal(stateScene(c).scene.name,'new');
});
test('CLOCK: monotonic clamp on backwards clock and nonfinite clock rejected',()=>{
 const {c,setTime}=controller();setTime(100);c.show();c.hide();setTime(-10000);assert.equal(c.show().ok,false);setTime(3100);assert.equal(c.show().ok,true);assert.throws(()=>m.createController(()=>NaN).getState(),/clock/);assert.equal(m.createController().getState().visible,false);
});
test('PROPERTY: seeded 10000 combined commands preserve validator, history, explicit show and hide invariants',()=>{
 const {c,advance}=controller();let seed=0x54a6312e;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};let tokens=[];
 for(let i=0;i<10000;i++){
  const cmd=rand()%12;const before=c.getState();let result;
  if(cmd===0)result=c.show();else if(cmd===1)result=c.hide();else if(cmd===2)result=c.end();else if(cmd===3)result=c.stage(scene({shape:m.SHAPES[rand()%4],x:25+rand()%51,name:`synthetic ${i}`}));else if(cmd===4)result=c.apply();else if(cmd===5)result=c.undo();else if(cmd===6)result=c.redo();else if(cmd===7)result=c.discard();else if(cmd===8)tokens.push(c.beginImport());else if(cmd===9)result=c.finishImport(tokens[rand()%Math.max(tokens.length,1)],JSON.stringify(scene({name:`import ${i}`})));else if(cmd===10)result=c.apply(scene({x:-1}));else advance(rand()%4000);
  const s=c.getState();assert.equal(m.validateScene(s.current).ok,true);assert.equal(m.validateScene(s.draft).ok,true);assert.ok(s.undoCount<=m.HISTORY_LIMIT);assert.ok(s.redoCount<=m.HISTORY_LIMIT);assert.ok(s.revision>=before.revision);if(!before.visible&&s.visible)assert.ok(cmd===0&&result.ok);if([1,2,8].includes(cmd))assert.equal(s.visible,false);if(cmd===10)assert.deepEqual(s.current,before.current);
 }
});

test('PARSE: strings with JSON punctuation, quotes, escapes, surrogate pairs and keys as values remain data',()=>{
 for(const name of ['{ }, : [ ]', 'a "quoted" value', 'back\\slash', 'version scene name', 'é⚪', 'name,name,name']){const s=scene({name});assert.deepEqual(m.parseScene(JSON.stringify(s)),s);}
});

test('PARSE: a malicious huge duplicate key produces a short constant error',()=>{
 const key='x'.repeat(400000);let err;try{m.parseScene(`{"${key}":1,"${key}":2}`)}catch(e){err=e}
 assert.ok(err);assert.match(err.message,/Duplicate/);assert.ok(err.message.length<200);
});
