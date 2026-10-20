'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const m=require('../src/model.js');
const {copy,legacy,scene,object}=require('./fixtures.cjs');
const base=scene;
const controller=()=>{let t=0;const c=m.createController(()=>t,base());return {c,advance(ms=3000){t+=ms},setTime(x){t=x}}};
const stateScene=c=>c.getState().current;
function rejects(s){assert.equal(m.validateScene(s).ok,false);assert.throws(()=>m.canonicalScene(s));}
function accepts(s){const got=m.canonicalScene(s);assert.equal(m.validateScene(s).ok,true);assert.deepEqual(m.parseScene(JSON.stringify(got)),got);return got;}

test('MODEL V2: presets valid, fresh, versioned, frozen constants',()=>{
 assert.ok(m.presets().length>=5);for(const s of m.presets()){assert.equal(s.version,2);accepts(s)}
 assert.equal(m.VERSION,2);assert.equal(m.SAMPLER,'static-objects-2');assert.ok(Object.isFrozen(m));assert.ok(Object.isFrozen(m.SHAPES));
 assert.deepEqual([...m.SHAPES].sort(),['circle','dot','pixel','square','triangle']);const p=m.presets();p[0].scene.name='changed';assert.notEqual(m.presets()[0].scene.name,'changed');
});
test('MODEL V2: canonical copies stable, independent and closed',()=>{
 const p=base(),c=m.canonicalScene(p);assert.deepEqual(c,p);assert.notEqual(c,p);c.scene.objects[0].color.h=1;assert.equal(p.scene.objects[0].color.h,200);
 assert.deepEqual(m.parseScene(JSON.stringify(p,null,2)),p);assert.deepEqual(m.canonicalScene(Object.assign(Object.create(null),p)),p);
});
for(const field of ['format','version','sampler','scene'])test(`VALIDATE V2: missing root ${field}`,()=>{const s=base();delete s[field];rejects(s)});
for(const field of ['name','background','objects'])test(`VALIDATE V2: missing scene ${field}`,()=>{const s=base();delete s.scene[field];rejects(s)});
for(const field of ['id','shape','x','y','size','color'])test(`VALIDATE V2: missing object ${field}`,()=>{const s=base();delete s.scene.objects[0][field];rejects(s)});
for(const loc of ['background','color'])for(const field of ['h','s','l'])test(`VALIDATE V2: missing ${loc} ${field}`,()=>{const s=base();delete (loc==='background'?s.scene.background:s.scene.objects[0].color)[field];rejects(s)});
for(const bad of [null,[],true,42,'scene',new Date()])test(`VALIDATE V2: rejects root ${String(bad)}`,()=>rejects(bad));
for(const bad of [null,[],true,42,'scene',new Date()])test(`VALIDATE V2: rejects nested objects ${String(bad)}`,()=>{for(const location of ['scene','background','object','color']){const s=base();if(location==='scene')s.scene=bad;else if(location==='background')s.scene.background=bad;else if(location==='object')s.scene.objects[0]=bad;else s.scene.objects[0].color=bad;rejects(s)}});
for(const [key,value]of [['format','other'],['version',0],['version',3],['version','2'],['sampler','unknown'],['sampler',1],['sampler','sparse-fixed-1']])test(`VALIDATE V2: rejects ${key} ${value}`,()=>{const s=base();s[key]=value;rejects(s)});
for(const key of ['animation','url','html','script','__proto__','constructor','prototype','preferences','notes','timeline','density','seed'])test(`VALIDATE V2: rejects unsupported field ${key} at every object level`,()=>{
 for(const location of ['root','scene','object','background','color']){const s=base(),at={root:s,scene:s.scene,object:s.scene.objects[0],background:s.scene.background,color:s.scene.objects[0].color}[location];Object.defineProperty(at,key,{value:'test',enumerable:true});rejects(s)}
});
test('VALIDATE V2: symbols, accessors, exotic prototypes rejected without execution',()=>{
 let invoked=0;for(const location of ['root','scene','object','background','color']){const s=base(),at={root:s,scene:s.scene,object:s.scene.objects[0],background:s.scene.background,color:s.scene.objects[0].color}[location];const key=Object.keys(at)[0];Object.defineProperty(at,key,{get(){invoked++;throw Error('getter executed')},enumerable:true});rejects(s)}assert.equal(invoked,0);
 for(const mutate of [s=>s.scene.objects[0][Symbol('x')]=1,s=>Object.setPrototypeOf(s.scene.background,{a:1})]){const s=base();mutate(s);rejects(s)}
});
test('VALIDATE V2: object arrays are dense, closed, bounded and ordinary',()=>{
 accepts(scene({objects:[]}));accepts(scene({objects:Array.from({length:12},(_,i)=>({...base().scene.objects[0],id:`object-${i+1}`}))}));
 for(const value of [null,{},'objects',Array.from({length:13},(_,i)=>({...base().scene.objects[0],id:`object-${i+1}`}))])rejects(scene({objects:value}));
 let invoked=0;for(const mutate of [a=>delete a[0],a=>a.extra=true,a=>a[Symbol('x')]=true,a=>Object.defineProperty(a,'0',{get(){invoked++;return base().scene.objects[0]}}),a=>Object.setPrototypeOf(a,{})]){const s=base();mutate(s.scene.objects);rejects(s)}assert.equal(invoked,0);
});
test('VALIDATE V2: unique bounded stable IDs',()=>{
 for(const id of ['object-1','object-999999'])accepts(object({id}));
 for(const id of ['',1,null,'object-0','object-01','object-1000000','dot-1','object-1\n','__proto__','constructor'])rejects(object({id}));
 const s=base();s.scene.objects.push(copy(s.scene.objects[0]));rejects(s);
});
for(const field of ['x','y'])test(`VALIDATE V2: ${field} finite positions and precision`,()=>{
 for(const value of [25,75,50.25])accepts(object({[field]:value}));
 for(const value of [-1,101,50.001,NaN,Infinity,-Infinity,'50',null,false,{},[]])rejects(object({[field]:value}));
});
test('VALIDATE V2: shape size ranges and inset enforced including contour stroke',()=>{
 for(const shape of ['dot','pixel','circle','square','triangle']){
  const max=['dot','pixel'].includes(shape)?8:28;for(const size of [1,max])accepts(object({shape,size}));
  for(const size of [0,max+1,1.5,NaN,Infinity,'1',null,false,{},[]])rejects(object({shape,size}));
  const half=4+(['circle','square','triangle'].includes(shape)?0.5:0);
  for(const [field,edge]of [['x',1+half],['y',99-half]]){accepts(object({shape,size:8,[field]:edge}));rejects(object({shape,size:8,[field]:edge+(field==='x'?-0.01:0.01)}));}
 }
 for(const shape of ['','dots','stripes','animated',null,0,{},[]])rejects(object({shape}));
});
for(const [location,field,min,max]of [['background','h',0,359],['background','s',0,60],['background','l',0,40],['color','h',0,359],['color','s',0,70],['color','l',10,70]])test(`VALIDATE V2: ${location}.${field} boundaries and types`,()=>{
 for(const v of [min,max,min-1,max+1,NaN,Infinity,-Infinity,1.5,String(min),null,false,{},[]]){const s=base();(location==='background'?s.scene.background:s.scene.objects[0].color)[field]=v;if(v===min||v===max)accepts(s);else rejects(s)}
});
test('VALIDATE V2: name boundaries, controls, markup remains inert text',()=>{
 for(const name of ['', ' ', '\t', 'a'.repeat(65),1,null,{},[],'x\u0000','x\u007f','\u202eabc','a\u2069'])rejects(scene({name}));
 for(const name of ['x','x'.repeat(64),'⚪ synthetic','<img src=x onerror=alert(1)>','https://example.invalid'])accepts(scene({name}));
});
for(const field of ['name','shape','x','y','size','dotCount','dotRadius','palette'])test(`MIGRATE V1: missing legacy ${field} remains rejected`,()=>{const s=legacy();delete s.scene[field];rejects(s)});
for(const [field,min,max]of [['x',25,75],['y',25,75],['size',14,28],['dotCount',1,5],['dotRadius',1,2]])test(`MIGRATE V1: original ${field} bounds enforced before migration`,()=>{
 for(const value of [min,max])accepts(legacy({[field]:value,dotCount:field==='dotCount'?value:1}));
 for(const value of [min-1,max+1,NaN,Infinity,-Infinity,1.5,String(min),null,false,{},[]])rejects(legacy({[field]:value}));
});
test('MIGRATE V1: original closed objects and unsupported enums still rejected',()=>{
 for(const atRoot of [true,false])for(const key of ['animation','url','notes','__proto__']){const s=legacy();Object.defineProperty(atRoot?s:s.scene,key,{value:true,enumerable:true});rejects(s)}
 for(const shape of ['dot','pixel','stripes','__proto__',null])rejects(legacy({shape}));for(const palette of ['','__proto__','constructor',0,null])rejects(legacy({palette}));
 accepts(legacy({size:14,dotCount:5,dotRadius:2})); // This boundary was valid in v1.
});
test('MIGRATE V1: dots and contours preserve logical geometry and canonical v2 re-export',()=>{
 const migrated=m.parseScene(JSON.stringify(legacy({size:20,dotCount:5})));assert.equal(migrated.version,2);assert.equal(migrated.sampler,'static-objects-2');assert.deepEqual(migrated.scene.background,{h:0,s:0,l:0});
 assert.deepEqual(migrated.scene.objects.map(o=>({shape:o.shape,x:o.x,y:o.y,size:o.size})),[{shape:'dot',x:50,y:50,size:2},{shape:'dot',x:40.4,y:43,size:2},{shape:'dot',x:60,y:44,size:2},{shape:'dot',x:45,y:60,size:2},{shape:'dot',x:59,y:60,size:2}]);
 for(const shape of ['circle','square','triangle']){const got=m.canonicalScene(legacy({shape,size:20}));assert.equal(got.scene.objects.length,1);assert.equal(got.scene.objects[0].shape,shape);assert.equal(got.scene.objects[0].size,20);assert.deepEqual(m.parseScene(JSON.stringify(got)),got)}
});
test('MIGRATE V1: all 7200 prior boundary combinations remain valid or retain old separation rejection',()=>{
 let count=0;for(const shape of ['dots','circle','square','triangle'])for(const palette of ['slate','sage','sand'])for(const x of [25,75])for(const y of [25,75])for(let size=14;size<=28;size++)for(let dotCount=1;dotCount<=5;dotCount++)for(const dotRadius of [1,2]){
  const s=legacy({shape,palette,x,y,size,dotCount,dotRadius}),v=m.validateScene(s);if(!v.ok){assert.equal(shape,'dots');assert.equal(dotRadius,2);assert.match(v.error,/separation/);continue}assert.deepEqual(m.parseScene(JSON.stringify(s)),v.scene);count++;
 }assert.ok(count>=6000,`only ${count} legacy scenes accepted`);
});
test('PARSE: malformed/nontext/nested inputs fail without disturbing model',()=>{
 for(const text of ['', '{','null','[]','true','42','"string"','{"scene":}', '/*comment*/{}','{"a":1,}',undefined,null,{},Buffer.from('{}'),'['.repeat(2000)+'0'+']'.repeat(2000)])assert.throws(()=>m.parseScene(text));accepts(base());
});
test('PARSE V2: duplicates rejected at every object depth and escaped spelling',()=>{
 const raw=JSON.stringify(base());for(const text of [raw.replace('"version":2','"version":999,"version":2'),raw.replace('"version":2','"version":2,"\\u0076ersion":2'),raw.replace('"x":50','"x":25,"x":50'),raw.replace('"scene":','"scene":null,"scene":'),raw.replace('"h":0','"h":1,"h":0'),raw.replace('"h":200','"h":1,"\\u0068":200')])assert.throws(()=>m.parseScene(text),/Duplicate/);
 const s=base();s.scene.objects.push({...s.scene.objects[0],id:'object-2'});accepts(s);
});
test('PARSE: bytes and bounded duplicate errors',()=>{
 const raw=JSON.stringify(base());assert.deepEqual(m.parseScene(raw+' '.repeat(m.MAX_IMPORT_BYTES-Buffer.byteLength(raw))),base());assert.throws(()=>m.parseScene(raw+' '.repeat(m.MAX_IMPORT_BYTES-Buffer.byteLength(raw)+1)));
 const text=raw+'é'.repeat(Math.floor(m.MAX_IMPORT_BYTES/2));assert.ok(text.length<m.MAX_IMPORT_BYTES);assert.throws(()=>m.parseScene(text),/1 MiB/);
 const key='x'.repeat(400000);let err;try{m.parseScene(`{"${key}":1,"${key}":2}`)}catch(e){err=e}assert.ok(err);assert.match(err.message,/Duplicate/);assert.ok(err.message.length<200);
});
test('PARSE: JSON punctuation/escape/surrogate/key-like strings remain data',()=>{for(const name of ['{ }, : [ ]','a "quoted" value','back\\slash','version scene name','é⚪','name,name,name'])accepts(scene({name}));});
test('PRIVACY: canonical output only scene data; notebooks rejected',()=>{assert.deepEqual(Object.keys(base()),['format','version','sampler','scene']);rejects({...base(),notes:'synthetic note'});rejects({format:'imagery-observations',version:1,notes:'synthetic'});});
test('GEOMETRY V2: deterministic, pure; viewport shape dimensions are isotropic',()=>{
 const s=base(),before=copy(s),oldRandom=Math.random,oldNow=Date.now;try{Math.random=()=>{throw Error('random consulted')};Date.now=()=>{throw Error('clock consulted')};
  for(const [w,h]of [[100,100],[1600,900],[390,844]]){const g=m.geometry(s,w,h)[0];assert.equal(g.x,w/2);assert.equal(g.y,h/2);assert.equal(g.radius,Math.min(w,h)/10);assert.equal(g.lineWidth,Math.min(w,h)/100);assert.equal(g.id,'object-1');assert.equal(g.color,'hsl(200 20% 45%)');assert.deepEqual(m.geometry(s,w,h),m.geometry(s,w,h));}assert.deepEqual(s,before);
 }finally{Math.random=oldRandom;Date.now=oldNow}
});
test('GEOMETRY V2: dot/pixel/square/triangle dimensions and distinct viewport coordinates',()=>{
 const dot=m.geometry(object({shape:'dot',size:8,x:25,y:75}),1000,500)[0];assert.equal(dot.x,250);assert.equal(dot.y,375);assert.equal(dot.radius,20);
 for(const shape of ['pixel','square','triangle']){const g=m.geometry(object({shape,size:8}),1000,500)[0];assert.equal(g.kind,'polygon');const xs=g.points.map(p=>p[0]),ys=g.points.map(p=>p[1]);assert.equal(Math.max(...xs)-Math.min(...xs),40);assert.equal(Math.max(...ys)-Math.min(...ys),40)}
 assert.deepEqual(m.geometry(scene({objects:[]})),[]);for(const p of m.presets())assert.ok(m.describe(p).includes(p.scene.name));
});
test('GEOMETRY V2: invalid source and viewport values never reach drawing',()=>{assert.throws(()=>m.geometry(object({shape:'stripes'})));assert.throws(()=>m.describe(object({x:-1})));for(const [w,h]of [[0,100],[100,0],[-1,100],[Infinity,100],[100,NaN],['100',100]])assert.throws(()=>m.geometry(base(),w,h));});
test('STATE: startup hidden, immutable snapshots, no-op Apply without history',()=>{const {c}=controller();const s=c.getState();assert.equal(s.visible,false);assert.equal(s.dirty,false);assert.equal(s.undoCount,0);s.current.scene.objects[0].x=0;assert.equal(stateScene(c).scene.objects[0].x,50);assert.equal(c.apply().ok,true);assert.equal(c.getState().revision,0);assert.equal(c.getState().undoCount,0);});
test('STATE: staged object and background edits conceal and need explicit Apply/Show',()=>{const {c,advance}=controller();assert.equal(c.show().ok,true);const p=object({shape:'square'});p.scene.background.l=20;assert.equal(c.stage(p).ok,true);assert.equal(c.getState().visible,false);assert.equal(stateScene(c).scene.objects[0].shape,'circle');assert.equal(c.getState().dirty,true);assert.equal(c.show().ok,false);assert.equal(c.apply().ok,true);assert.equal(c.getState().visible,false);assert.equal(c.show().ok,false);advance();assert.equal(c.getState().visible,false);assert.equal(c.show().ok,true);assert.deepEqual(stateScene(c),p);});
test('STATE: dirty draft blocks Show; discard restores current; invalid stage/apply retains prior data',()=>{const {c}=controller(),original=stateScene(c);c.stage(scene({name:'valid draft'}));assert.equal(c.show().ok,false);assert.equal(c.stage(object({x:-1})).ok,false);assert.equal(c.getState().draft.scene.name,'valid draft');assert.equal(c.apply(object({shape:'animated'})).ok,false);assert.deepEqual(stateScene(c),original);c.discard();assert.equal(c.getState().dirty,false);assert.equal(c.show().ok,true);});
for(const method of ['hide','end'])test(`STATE: immediate ${method} enforces fresh explicit reveal gap`,()=>{const {c,advance}=controller();c.show();const original=stateScene(c);c[method]();assert.equal(c.getState().visible,false);assert.deepEqual(stateScene(c),original);assert.equal(c.show().ok,false);advance(2999);assert.equal(c.show().ok,false);advance(1);assert.equal(c.getState().visible,false);assert.equal(c.show().ok,true);});
test('STATE: repeated Hide resets gate, repeated Show does not queue or extend',()=>{const {c,advance}=controller();c.show();c.hide();for(let i=0;i<100;i++)assert.equal(c.show().ok,false);advance(2500);c.hide();advance(500);assert.equal(c.show().ok,false);advance(2500);assert.equal(c.show().ok,true);});
test('STATE: exact history, redo cleared after new apply, cap40 retained',()=>{const {c}=controller(),p0=stateScene(c),p1=object({shape:'square'}),p2=object({shape:'triangle'});assert.equal(c.undo().ok,false);assert.equal(c.redo().ok,false);c.apply(p1);c.apply(p2);c.undo();assert.deepEqual(stateScene(c),p1);c.undo();assert.deepEqual(stateScene(c),p0);c.redo();assert.deepEqual(stateScene(c),p1);c.redo();assert.deepEqual(stateScene(c),p2);c.undo();c.apply(scene({name:'replacement'}));assert.equal(c.redo().ok,false);for(let i=0;i<100;i++)c.apply(scene({name:`scene ${i}`}));assert.equal(c.getState().undoCount,m.HISTORY_LIMIT);for(let i=0;i<m.HISTORY_LIMIT;i++)assert.equal(c.undo().ok,true);assert.equal(c.undo().ok,false);for(let i=0;i<m.HISTORY_LIMIT;i++)assert.equal(c.redo().ok,true);assert.equal(c.getState().undoCount,m.HISTORY_LIMIT);assert.equal(c.redo().ok,false);});
test('STATE: imports migrate atomically hidden and invalid import retains current',()=>{const {c}=controller();c.show();const p=legacy({shape:'triangle'});let token=c.beginImport();assert.equal(c.getState().visible,false);assert.equal(c.getState().pendingImport,true);assert.equal(c.finishImport(token,JSON.stringify(p)).ok,true);assert.deepEqual(stateScene(c),m.canonicalScene(p));assert.equal(c.getState().visible,false);token=c.beginImport();assert.equal(c.finishImport(token,'{').ok,false);assert.deepEqual(stateScene(c),m.canonicalScene(p));assert.equal(c.getState().pendingImport,false);});
for(const method of ['hide','end','show','discard','invalidateImport','stage','apply','undo','redo'])test(`RACE: stale import canceled by newer ${method}`,()=>{const {c}=controller();c.apply(scene({name:'A'}));c.apply(scene({name:'B'}));if(method==='redo')c.undo();const token=c.beginImport();if(method==='stage'||method==='apply')c[method](scene({name:'new action'}));else c[method]();const after=stateScene(c);assert.equal(c.finishImport(token,JSON.stringify(scene({name:'stale import'}))).ok,false);assert.deepEqual(stateScene(c),after);});
test('RACE: newest import wins and token single-use',()=>{const {c}=controller(),a=c.beginImport(),b=c.beginImport();assert.notEqual(a,b);assert.equal(c.finishImport(a,JSON.stringify(scene({name:'old'}))).ok,false);assert.equal(c.getState().pendingImport,true);assert.equal(c.finishImport(b,JSON.stringify(scene({name:'new'}))).ok,true);assert.equal(c.finishImport(b,JSON.stringify(scene({name:'again'}))).ok,false);assert.equal(stateScene(c).scene.name,'new');});
test('CLOCK: monotonic clamp and nonfinite rejection',()=>{const {c,setTime}=controller();setTime(100);c.show();c.hide();setTime(-10000);assert.equal(c.show().ok,false);setTime(3100);assert.equal(c.show().ok,true);assert.throws(()=>m.createController(()=>NaN).getState(),/clock/);assert.equal(m.createController().getState().visible,false);});
test('PROPERTY: seeded 10000 combined commands preserve validation/history/explicit-show invariants',()=>{
 const {c,advance}=controller();let seed=0x54a6312e;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0};const tokens=[];
 for(let i=0;i<10000;i++){const cmd=rand()%12,before=c.getState();let result;if(cmd===0)result=c.show();else if(cmd===1)result=c.hide();else if(cmd===2)result=c.end();else if(cmd===3)result=c.stage(object({shape:m.SHAPES[rand()%5],size:4,x:25+rand()%51}));else if(cmd===4)result=c.apply();else if(cmd===5)result=c.undo();else if(cmd===6)result=c.redo();else if(cmd===7)result=c.discard();else if(cmd===8)tokens.push(c.beginImport());else if(cmd===9)result=c.finishImport(tokens[rand()%Math.max(tokens.length,1)],JSON.stringify(scene({name:`import ${i}`})));else if(cmd===10)result=c.apply(object({x:-1}));else advance(rand()%4000);
  const s=c.getState();assert.equal(m.validateScene(s.current).ok,true);assert.equal(m.validateScene(s.draft).ok,true);assert.ok(s.undoCount<=m.HISTORY_LIMIT);assert.ok(s.redoCount<=m.HISTORY_LIMIT);assert.ok(s.revision>=before.revision);if(!before.visible&&s.visible)assert.ok(cmd===0&&result.ok);if([1,2,8].includes(cmd))assert.equal(s.visible,false);if(cmd===10)assert.deepEqual(s.current,before.current);
 }
});
for(const action of ['invalid-apply','discard','empty-undo','empty-redo'])test(`STATE V2: ${action} conceals and invalidates pending work even without accepted data change`,()=>{
 const {c}=controller();const before=stateScene(c);assert.equal(c.show().ok,true);if(action==='invalid-apply')assert.equal(c.apply(object({x:-1})).ok,false);else c[action.replace('empty-','')]();assert.equal(c.getState().visible,false);assert.deepEqual(stateScene(c),before);assert.equal(c.show().ok,false);
});

// v0.5 explicit live draft preview remains distinct from accepted data/history.
test('LIVE STATE: stageLive validates and updates draft but never reveals a hidden gate',()=>{
 const {c}=controller(),before=c.getState(),draft=scene({name:'Live draft',background:{h:120,s:25,l:15}});
 assert.equal(c.stageLive(draft).ok,true);const after=c.getState();assert.equal(after.visible,false);assert.deepEqual(after.current,before.current);assert.deepEqual(after.draft,draft);assert.equal(after.undoCount,0);assert.equal(after.revision,0);assert.ok(after.epoch>before.epoch);
 draft.scene.name='mutated caller';assert.equal(c.getState().draft.scene.name,'Live draft');
});
test('LIVE STATE: explicit preview paints draft authority without committing or adding history',()=>{
 const {c}=controller(),before=c.getState(),draft=scene({name:'Explicit preview'});
 assert.equal(c.previewDraft(draft).ok,true);assert.equal(c.getState().visible,true);assert.deepEqual(c.getState().current,before.current);assert.deepEqual(c.getState().draft,draft);assert.equal(c.getState().dirty,true);assert.equal(c.getState().undoCount,0);assert.equal(c.getState().revision,0);
 const later=scene({name:'Input edit',background:{h:80,s:30,l:20}});assert.equal(c.stageLive(later).ok,true);assert.equal(c.getState().visible,true);assert.deepEqual(c.getState().draft,later);assert.deepEqual(c.getState().current,before.current);
});
test('LIVE STATE: invalid live edit conceals, retains prior valid data, and cannot resume implicitly',()=>{
 const {c,advance}=controller(),draft=scene({name:'Valid draft'});c.previewDraft(draft);
 assert.equal(c.stageLive(object({x:-1})).ok,false);assert.equal(c.getState().visible,false);assert.deepEqual(c.getState().draft,draft);assert.equal(c.stageLive(scene({name:'Corrected'})).ok,true);assert.equal(c.getState().visible,false);assert.equal(c.previewDraft(scene({name:'Corrected'})).ok,false);advance();assert.equal(c.getState().visible,false);assert.equal(c.previewDraft(scene({name:'Corrected'})).ok,true);
});
for(const method of ['hide','end'])test(`LIVE STATE: ${method} plus edits obeys explicit repeat guard with no reveal queue`,()=>{
 const {c,advance}=controller();c.previewDraft(scene({name:'A'}));c[method]();for(let i=0;i<20;i++){c.stageLive(scene({name:'B'+i}));assert.equal(c.getState().visible,false);assert.equal(c.previewDraft(scene({name:'B'+i})).ok,false);}advance();assert.equal(c.getState().visible,false);assert.equal(c.previewDraft(scene({name:'B'})).ok,true);
});
for(const method of ['stageLive','previewDraft'])test(`LIVE RACE: ${method} invalidates an earlier pending import`,()=>{
 const {c}=controller(),original=c.getState().current,token=c.beginImport();c[method](scene({name:'Fresh draft'}));assert.equal(c.finishImport(token,JSON.stringify(scene({name:'Stale imported'}))).ok,false);assert.deepEqual(c.getState().current,original);assert.equal(c.getState().draft.scene.name,'Fresh draft');
});
test('LIVE STATE: preview does not bypass validation or turn an invalid request into visible state',()=>{
 const {c}=controller(),before=c.getState();for(const value of [null,object({x:-1}),{...scene(),animation:true}]){assert.equal(c.previewDraft(value).ok,false);assert.equal(c.getState().visible,false);assert.deepEqual(c.getState().current,before.current);assert.deepEqual(c.getState().draft,before.draft);}
});
test('LIVE STATE: many input samples make only one applied history step',()=>{
 const {c}=controller(),original=c.getState().current;c.previewDraft(original);for(let i=0;i<100;i++)c.stageLive(scene({name:'Draft '+i}));assert.equal(c.getState().undoCount,0);assert.equal(c.getState().revision,0);c.apply();assert.equal(c.getState().undoCount,1);assert.equal(c.getState().current.scene.name,'Draft 99');c.undo();assert.deepEqual(c.getState().current,original);c.redo();assert.equal(c.getState().current.scene.name,'Draft 99');
});
test('LIVE PROPERTY: 2000 deterministic mixed live operations preserve validation and explicit-reveal authority',()=>{
 const {c,advance}=controller();let seed=0x51a5;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed};
 for(let i=0;i<2000;i++){const op=next()%9,before=c.getState(),value=scene({name:'Synthetic '+i,background:{h:next()%360,s:next()%101,l:next()%31}});let r;if(op===0)r=c.previewDraft(value);else if(op===1)r=c.stageLive(value);else if(op===2)r=c.hide();else if(op===3)r=c.end();else if(op===4)r=c.stageLive(object({x:-1}));else if(op===5)r=c.apply();else if(op===6)r=c.discard();else if(op===7)r=c.undo();else advance(next()%4000);const after=c.getState();assert.equal(m.validateScene(after.current).ok,true);assert.equal(m.validateScene(after.draft).ok,true);if(!before.visible&&after.visible){assert.equal(op,0);assert.equal(r.ok,true);}if(op===1){assert.deepEqual(after.current,before.current);assert.equal(after.undoCount,before.undoCount);assert.equal(after.revision,before.revision);}assert.ok(after.undoCount<=m.HISTORY_LIMIT);}
});
