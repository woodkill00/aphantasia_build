'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHarness}=require('./dom-harness.cjs');
const M=require('../src/model.js');
const {scene,object,legacy}=require('./fixtures.cjs');
const fixture=changes=>{const s=scene();const {shape,x,y,size,...rest}=changes||{};Object.assign(s.scene,rest);for(const [key,value]of Object.entries({shape,x,y,size}))if(value!==undefined)s.scene.objects[0][key]=value;return s};
const clearDraws=h=>{h.paint.length=0};
const hasSceneDraw=h=>h.paint.some(p=>['arc','stroke','fill','lineTo'].includes(p.method));

test('UI DOUBLE: delivered scripts initialize hidden, with no timers/network/storage APIs needed',()=>{
 const h=createHarness();assert.equal(h.visible(),false);assert.equal(hasSceneDraw(h),false);assert.equal(h.timers.length,0);assert.equal(h.get('undo').disabled,true);assert.equal(h.get('redo').disabled,true);assert.match(h.get('scene-canvas').attrs['aria-label'],/hidden/i);assert.match(h.get('scene-description').textContent,/3.*(?:dot|object)/);
});
test('UI DOUBLE: Show paints bounded dots; Hide immediately clears; no delayed reveal',async()=>{
 const h=createHarness();await h.fire('show-scene','click');assert.equal(h.visible(),true);assert.equal(h.paint.filter(p=>p.method==='arc').length,3);clearDraws(h);await h.fire('hide-scene','click');assert.equal(h.visible(),false);assert.equal(hasSceneDraw(h),false);await h.fire('show-scene','click');assert.equal(h.visible(),false);h.advance();assert.equal(h.visible(),false);await h.fire('show-scene','click');assert.equal(h.visible(),true);assert.equal(h.timers.length,0);
});
test('UI DOUBLE: edits hide immediately, require Apply, invalid values preserve accepted scene',async()=>{
 const h=createHarness();await h.fire('show-scene','click');await h.input('scene-name','Synthetic scene');assert.equal(h.visible(),false);await h.fire('show-scene','click');assert.match(h.status(),/Apply or discard/);await h.submit();assert.equal(h.visible(),false);assert.equal((await h.exportScene()).scene.name,'Synthetic scene');await h.input('position-x','0');await h.submit();assert.match(h.status(),/inset|position/);assert.equal(await h.exportScene(),null);await h.fire('discard','click');assert.equal(h.get('position-x').value,'50');assert.equal((await h.exportScene()).scene.name,'Synthetic scene');
});
test('UI DOUBLE V2: presets stage/apply, populate selected object and paint',async()=>{
 for(let i=0;i<M.presets().length;i++){const h=createHarness(),preset=M.presets()[i];await h.select('preset',String(i));assert.equal(h.visible(),false);assert.equal(h.get('shape').value,preset.scene.objects[0]?.shape||'');assert.equal(await h.exportScene(),null);await h.submit();h.advance();clearDraws(h);await h.fire('show-scene','click');assert.equal(h.visible(),true);if(preset.scene.objects.length)assert.ok(hasSceneDraw(h));assert.deepEqual(await h.exportScene(),preset);}
});
test('UI DOUBLE V2: numeric object/color/background controls stage canonical scene',async()=>{
 const h=createHarness();await h.import(JSON.stringify(fixture({})));for(const [id,val]of [['position-x',75],['position-y',25],['size',28],['object-hue',120],['object-saturation',60],['object-lightness',50],['background-hue',220],['background-saturation',40],['background-lightness',20]])await h.input(id,val);await h.submit();const got=await h.exportScene();assert.deepEqual(got,scene({objects:[{id:'object-1',shape:'circle',x:75,y:25,size:28,color:{h:120,s:60,l:50}}],background:{h:220,s:40,l:20}}));
});
test('UI DOUBLE: undo/redo preserve exact applied scenes and clear staged fields',async()=>{
 const h=createHarness();await h.input('scene-name','A');await h.submit();await h.input('scene-name','B');await h.submit();await h.input('scene-name','unapplied');await h.fire('undo','click');assert.equal(h.get('scene-name').value,'A');assert.equal(h.visible(),false);await h.fire('redo','click');assert.equal(h.get('scene-name').value,'B');assert.equal((await h.exportScene()).scene.name,'B');await h.fire('redo','click');assert.match(h.status(),/Nothing to redo/);
});
test('UI DOUBLE: blank and invalid preset choices are inert',async()=>{
 const h=createHarness();for(const v of ['','-1','500','oops','0.2']){await h.select('preset',v);assert.equal(h.get('scene-name').value,'A small constellation');assert.equal(h.visible(),false);}
});
test('UI DOUBLE: Escape immediate; button keyboard repeats prevented; normal field repetition untouched',async()=>{
 const h=createHarness();await h.fire('show-scene','click');const esc=await h.globalEvent('document','keydown',{key:'Escape'});assert.equal(esc.defaultPrevented,false,'Escape must remain available to native fullscreen exit');assert.equal(h.visible(),false);
 for(const key of ['Enter',' ']){const e=await h.globalEvent('document','keydown',{key,repeat:true,target:h.get('show-scene')});assert.ok(e.defaultPrevented)}
 for(const props of [{key:'Enter',repeat:false,target:h.get('show-scene')},{key:'ArrowUp',repeat:true,target:h.get('position-x')},{key:' ',repeat:true,target:h.get('scene-name')},{key:'Enter',repeat:true}])assert.equal((await h.globalEvent('document','keydown',props)).defaultPrevented,false);
});
for(const [scope,type,props]of [['window','blur',{}],['window','pagehide',{}],['window','resize',{}],['window','pageshow',{persisted:true}],['document','freeze',{}]])test(`UI DOUBLE: lifecycle ${type} hides and does not auto-resume`,async()=>{
 const h=createHarness();await h.fire('show-scene','click');await h.globalEvent(scope,type,props);assert.equal(h.visible(),false);h.advance(100000);assert.equal(h.visible(),false);assert.equal(h.timers.length,0);
});
test('UI DOUBLE: hidden/visible tab events and persisted/nonpersisted page events explicit',async()=>{
 const h=createHarness();await h.fire('show-scene','click');await h.globalEvent('window','pageshow',{persisted:false});assert.equal(h.visible(),true);h.document.hidden=false;await h.globalEvent('document','visibilitychange');assert.equal(h.visible(),true);h.document.hidden=true;await h.globalEvent('document','visibilitychange');assert.equal(h.visible(),false);h.document.hidden=false;await h.globalEvent('document','visibilitychange');assert.equal(h.visible(),false);
});
test('UI DOUBLE: End retains data and focuses guidance',async()=>{
 const h=createHarness();await h.input('notes','Synthetic note');await h.fire('show-scene','click');await h.fire('end-viewing','click');assert.equal(h.visible(),false);assert.equal(h.document.activeElement.id,'guidance-title');assert.equal(h.get('notes').value,'Synthetic note');assert.equal((await h.exportScene()).scene.name,'A small constellation');
});
for(const options of [{width:300,dpr:3},{width:100000,dpr:100},{width:0,dpr:0},{width:1,dpr:0.5},{width:350.2,dpr:1.2}])test(`UI DOUBLE: backing buffer bounded ${JSON.stringify(options)}`,()=>{
 const h=createHarness(options),c=h.get('scene-canvas');assert.ok(c.width>=1&&c.width<=4096);assert.ok(c.height>=1&&c.height<=4096);assert.ok(c.width*c.height<=8388608);assert.equal(hasSceneDraw(h),false);
});
for(const options of [{noCanvas:true},{canvasThrows:true}])test(`UI DOUBLE: unavailable Canvas preserves data controls ${JSON.stringify(options)}`,async()=>{
 const h=createHarness(options);assert.match(h.status(),/Canvas is unavailable/);await h.fire('show-scene','click');assert.equal(h.visible(),false);await h.input('scene-name','No Canvas');await h.submit();assert.equal((await h.exportScene()).scene.name,'No Canvas');
});
test('UI DOUBLE: imports accepted hidden, canonical download round trip, same file reselect works',async()=>{
 const h=createHarness();const s=fixture({name:'Imported',shape:'square'});await h.import(JSON.stringify(s));assert.equal(h.visible(),false);assert.equal(h.get('scene-name').value,'Imported');assert.equal(h.get('scene-import').value,'');assert.deepEqual(await h.exportScene(),s);await h.import(JSON.stringify(s));assert.deepEqual(await h.exportScene(),s);
});
test('UI DOUBLE: malformed/empty/oversized/unknown/executable imports do not replace valid current',async()=>{
 const h=createHarness();const raw=JSON.stringify(fixture({name:'Accepted'}));await h.import(raw);
 for(const value of ['', '{','null','[]',JSON.stringify({...fixture({}),version:999}),JSON.stringify({...fixture({}),url:'https://example.invalid'}),JSON.stringify({...fixture({}),notes:'synthetic'}),JSON.stringify(fixture({})).replace('"version":2','"version":0,"version":2')]){await h.import(value);assert.equal(h.get('scene-name').value,'Accepted');assert.equal(h.visible(),false);assert.match(h.status(),/unchanged/);}
 let read=false;h.get('scene-import').files=[{size:M.MAX_IMPORT_BYTES+1,text(){read=true;throw Error('must not read')}}];await h.fire('scene-import','change');assert.equal(read,false);assert.equal(h.get('scene-name').value,'Accepted');
});
test('UI DOUBLE: cancel and failed file reads preserve current; import errors bounded',async()=>{
 const h=createHarness();h.get('scene-import').files=[];await h.fire('scene-import','change');assert.equal(h.visible(),false);h.get('scene-import').files=[{size:10,text:async()=>{throw Error('synthetic read failure')}}];await h.fire('scene-import','change');assert.match(h.status(),/could not be read/);assert.equal(h.get('scene-name').value,'A small constellation');
 const key='x'.repeat(400000);await h.import(`{"${key}":1,"${key}":2}`);assert.ok(h.status().length<=300);assert.match(h.status(),/Duplicate/);
});
for(const action of ['hide','newer-import','edit','undo','show','end','discard','preset','visibilitychange','blur','resize','pagehide','freeze'])test(`UI DOUBLE RACE: delayed import cannot override ${action}`,async()=>{
 const h=createHarness();await h.input('scene-name','A');await h.submit();await h.input('scene-name','B');await h.submit();let resolve;h.get('scene-import').files=[{size:100,text:()=>new Promise(r=>resolve=r)}];const pending=h.fire('scene-import','change');
 if(action==='newer-import')await h.import(JSON.stringify(fixture({name:'newest'})));else if(action==='edit')await h.input('scene-name','new draft');else if(action==='preset')await h.select('preset','4');else if(action==='visibilitychange'){h.document.hidden=true;await h.globalEvent('document','visibilitychange')}else if(['blur','resize','pagehide'].includes(action))await h.globalEvent('window',action);else if(action==='freeze')await h.globalEvent('document',action);else await h.fire({hide:'hide-scene',show:'show-scene',end:'end-viewing',discard:'discard',undo:'undo'}[action],'click');
 const before=h.get('scene-name').value;const beforeVisible=h.visible();resolve(JSON.stringify(fixture({name:'STALE'})));await pending;assert.equal(h.get('scene-name').value,before);assert.equal(h.visible(),beforeVisible);assert.notEqual(h.get('scene-name').value,'STALE');
});
test('UI DOUBLE RACE: stale failed read does not replace newer status or fields',async()=>{
 const h=createHarness();let reject;h.get('scene-import').files=[{size:1,text:()=>new Promise((r,j)=>reject=j)}];const p=h.fire('scene-import','change');await h.import(JSON.stringify(fixture({name:'New'})));const status=h.status();reject(Error('late'));await p;assert.equal(h.status(),status);assert.equal(h.get('scene-name').value,'New');
});
test('UI DOUBLE: exports request Blob download honestly; cleanup is not a redraw/reveal',async()=>{
 const h=createHarness();const s=await h.exportScene();assert.equal(s.format,M.FORMAT);assert.match(h.status(),/Download requested/);assert.equal(h.downloads[0].filename,'imagery-field-scene-v2.json');assert.equal(h.urls.size,1);assert.equal(h.timers.length,1);assert.equal(h.timers[0].ms,60000);clearDraws(h);h.runTimers();assert.equal(h.urls.size,0);assert.equal(h.paint.length,0);assert.equal(h.visible(),false);
});
for(const options of [{objectURLThrows:true},{downloadThrows:true},{noBlob:true}])test(`UI DOUBLE: failed export does not claim saved or destroy current ${JSON.stringify(options)}`,async()=>{
 const h=createHarness(options);await h.exportScene();assert.match(h.status(),/could not be started/);assert.equal(h.get('scene-name').value,'A small constellation');assert.equal(h.urls.size,0);assert.equal(h.visible(),false);
});
test('UI DOUBLE: pagehide revokes pending export URLs',async()=>{
 const h=createHarness();for(let i=0;i<20;i++)await h.exportScene();assert.equal(h.urls.size,20);await h.globalEvent('window','pagehide');assert.equal(h.urls.size,0);h.runTimers();assert.equal(h.urls.size,0);
});
test('UI DOUBLE: scene export excludes notes; note needs exact preview and affirmative selection',async()=>{
 const h=createHarness();await h.input('notes','Synthetic private observation');await h.select('note-category','none');assert.ok(!JSON.stringify(await h.exportScene()).includes('observation'));await h.fire('export-notes','click');assert.match(h.status(),/Preview/);const count=h.downloads.length;await h.fire('preview-notes','click');assert.equal(h.get('include-note').checked,false);assert.equal(h.get('export-notes').disabled,true);const preview=JSON.parse(h.get('notes-preview').textContent);assert.deepEqual(preview,{format:'imagery-field-note',version:1,category:'none',text:'Synthetic private observation'});await h.fire('export-notes','click');assert.equal(h.downloads.length,count);h.get('include-note').checked=true;await h.fire('include-note','change');assert.equal(h.get('export-notes').disabled,false);await h.fire('export-notes','click');assert.deepEqual(JSON.parse(await h.downloads.at(-1).blob.text()),preview);
});
test('UI DOUBLE: notes/category change invalidates export preview and consent',async()=>{
 for(const type of ['text','category']){const h=createHarness();await h.input('notes','original');await h.fire('preview-notes','click');h.get('include-note').checked=true;await h.fire('include-note','change');if(type==='text')await h.input('notes','changed');else await h.select('note-category','mixed');assert.equal(h.get('include-note').checked,false);assert.equal(h.get('export-notes').disabled,true);assert.equal(h.get('notes-export-area').hidden,true);assert.equal(h.get('notes-preview').textContent,'');await h.fire('export-notes','click');assert.equal(h.downloads.length,0);}
});
test('UI DOUBLE: programmatic note mutation without input event still blocks stale approved export',async()=>{
 const h=createHarness();await h.input('notes','old');await h.fire('preview-notes','click');h.get('include-note').checked=true;await h.fire('include-note','change');h.get('notes').value='new';await h.fire('export-notes','click');assert.match(h.status(),/changed/);assert.equal(h.downloads.length,0);assert.equal(h.get('include-note').checked,false);
});
test('UI DOUBLE: all note categories, empty note and 4000-character boundary are neutral data',async()=>{
 for(const category of ['unsure','none','external-perception','residual-aftereffect','voluntary-imagery','conceptual-knowledge','mixed']){const h=createHarness();await h.select('note-category',category);await h.fire('preview-notes','click');assert.equal(JSON.parse(h.get('notes-preview').textContent).category,category)}
 const h=createHarness();await h.input('notes','x'.repeat(4000));await h.fire('preview-notes','click');assert.equal(JSON.parse(h.get('notes-preview').textContent).text.length,4000);for(const text of ['x'.repeat(4001),'null\u0000char']){await h.input('notes',text);await h.fire('preview-notes','click');assert.equal(h.get('notes-export-area').hidden,true);assert.match(h.status(),/4,000/)}await h.select('note-category','invented');await h.fire('preview-notes','click');assert.match(h.status(),/listed observation/);
});
test('UI DOUBLE: imported markup is carried only as name/value and description text',async()=>{
 const h=createHarness(),name='<img src=x onerror=alert(1)>';await h.import(JSON.stringify(fixture({name})));assert.equal(h.get('scene-name').value,name);assert.match(h.get('scene-description').textContent,/<img/);assert.equal(h.downloads.length,0);
});
test('UI DOUBLE: 300 rapid combined operations never bypass locked reveal or retain a replay queue',async()=>{
 const h=createHarness();await h.fire('show-scene','click');for(let i=0;i<300;i++){await h.select('preset',String(i%M.presets().length));await h.submit();await h.fire('undo','click');await h.fire('redo','click');await h.fire('hide-scene','click');await h.fire('show-scene','click');assert.equal(h.visible(),false);}assert.equal(h.timers.length,0);h.advance(100000);assert.equal(h.visible(),false);await h.fire('show-scene','click');assert.equal(h.visible(),true);
});

for(const id of ['object-hue','object-saturation','object-lightness','background-hue','background-saturation','background-lightness'])test(`UI DOUBLE V2: ${id} input conceals before change or Apply`,async()=>{
 const h=createHarness();await h.import(JSON.stringify(fixture({})));h.advance();await h.fire('show-scene','click');assert.equal(h.visible(),true);await h.input(id,id.includes('hue')?125:30);assert.equal(h.visible(),false);assert.equal(await h.exportScene(),null);assert.equal(h.get(id+'-value').textContent.includes(id.includes('hue')?'125':'30'),true);await h.fire('show-scene','click');assert.equal(h.visible(),false);await h.submit();h.advance();assert.equal(h.visible(),false);await h.fire('show-scene','click');assert.equal(h.visible(),true);
});
test('UI DOUBLE V2: object add/select/delete/move round trip with stable identity',async()=>{
 const h=createHarness();await h.import(JSON.stringify(scene({objects:[]})));await h.select('add-shape','pixel');await h.fire('add-object','click');assert.equal(h.visible(),false);assert.equal(await h.exportScene(),null);await h.submit();let got=await h.exportScene();assert.equal(got.scene.objects.length,1);assert.equal(got.scene.objects[0].shape,'pixel');const one=got.scene.objects[0].id;
 await h.select('add-shape','triangle');await h.fire('add-object','click');await h.submit();got=await h.exportScene();assert.equal(got.scene.objects.length,2);const two=got.scene.objects.find(o=>o.id!==one).id;assert.notEqual(one,two);
 await h.select('object-select',one);await h.input('position-x',35.25);await h.input('size',6);await h.submit();got=await h.exportScene();assert.equal(got.scene.objects.find(o=>o.id===one).x,35.25);assert.equal(got.scene.objects.find(o=>o.id===one).size,6);assert.equal(got.scene.objects.find(o=>o.id===two).shape,'triangle');
 await h.fire('delete-object','click');assert.equal(h.visible(),false);assert.equal(await h.exportScene(),null);await h.submit();got=await h.exportScene();assert.deepEqual(got.scene.objects.map(o=>o.id),[two]);await h.fire('undo','click');assert.equal((await h.exportScene()).scene.objects.length,2);await h.fire('redo','click');assert.deepEqual((await h.exportScene()).scene.objects.map(o=>o.id),[two]);
});
test('UI DOUBLE V2: object count limit, empty scene controls and colored background',async()=>{
 const h=createHarness();await h.import(JSON.stringify(scene({objects:[],background:{h:200,s:30,l:20}})));assert.equal(h.get('delete-object').disabled,true);assert.equal(h.get('place-object').disabled,true);h.advance();clearDraws(h);await h.fire('show-scene','click');assert.equal(h.visible(),true);assert.ok(h.paint.some(p=>p.method==='fillRect'&&p.fillStyle!=='#000'&&p.fillStyle!=='#000000'&&p.fillStyle!=='black'));assert.equal(hasSceneDraw(h),false);clearDraws(h);await h.fire('hide-scene','click');assert.equal(h.visible(),false);assert.ok(h.paint.some(p=>p.method==='fillRect'&&['#000','#000000','black'].includes(p.fillStyle)));assert.ok(h.paint.filter(p=>p.method==='fillRect').every(p=>['#000','#000000','black'].includes(p.fillStyle)));
 for(let i=0;i<12;i++){await h.select('add-shape','dot');await h.fire('add-object','click')}assert.equal(h.get('add-object').disabled,true);await h.fire('add-object','click');await h.submit();assert.equal((await h.exportScene()).scene.objects.length,12);
});
test('UI DOUBLE V2: one-click placement stages fractional coordinates and leaves hidden',async()=>{
 const h=createHarness({width:1000,height:500});await h.import(JSON.stringify(fixture({})));h.advance();await h.fire('show-scene','click');await h.fire('place-object','click');assert.equal(h.visible(),false);await h.fire('scene-canvas','pointerup',{clientX:300,clientY:300});assert.equal(h.visible(),false);assert.equal(await h.exportScene(),null);await h.submit();const got=await h.exportScene();assert.equal(got.scene.objects[0].x,30);assert.equal(got.scene.objects[0].y,60);await h.fire('scene-canvas','pointerup',{clientX:500,clientY:250});assert.deepEqual(await h.exportScene(),got);
});
for(const action of ['hide-scene','end-viewing','discard'])test(`UI DOUBLE V2: ${action} cancels placement rather than acting later`,async()=>{
 const h=createHarness({width:1000,height:500});await h.import(JSON.stringify(fixture({})));await h.fire('place-object','click');await h.fire(action,'click');const before=await h.exportScene();await h.fire('scene-canvas','pointerup',{clientX:300,clientY:300});assert.deepEqual(await h.exportScene(),before);assert.equal(h.visible(),false);
});
test('UI DOUBLE V2: v1 file imports as v2 without losing legacy positions',async()=>{
 const h=createHarness(),old=legacy({dotCount:5,size:20});await h.import(JSON.stringify(old));assert.equal(h.visible(),false);assert.deepEqual(await h.exportScene(),M.canonicalScene(old));assert.equal(h.downloads.at(-1).filename,'imagery-field-scene-v2.json');
});
test('UI DOUBLE V2: rectangular backing dimensions preserve displayed aspect and budget',()=>{
 for(const [width,height,dpr]of [[1366,900,1],[390,844,3],[10000,2000,4],[2000,10000,4],[800,400,2]]){const h=createHarness({width,height,dpr}),c=h.get('scene-canvas');assert.ok(c.width<=4096&&c.height<=4096&&c.width*c.height<=8388608);assert.ok(Math.abs(c.width/c.height-width/height)<0.01);assert.equal(h.visible(),false);}
});
test('UI DOUBLE V2: fullscreen request/entry/exit stays hidden and keeps manual Show',async()=>{
 const h=createHarness();await h.fire('show-scene','click');assert.equal(h.visible(),true);await h.fire('fullscreen','click');assert.equal(h.visible(),false);assert.equal(h.document.fullscreenElement,h.get('stage-root'));h.advance();assert.equal(h.visible(),false);await h.fire('show-scene','click');assert.equal(h.visible(),true);await h.fire('exit-fullscreen','click');assert.equal(h.visible(),false);assert.equal(h.document.fullscreenElement,null);h.advance();assert.equal(h.visible(),false);
});
test('UI DOUBLE V2: browser fullscreenchange hides even when Escape event is consumed',async()=>{
 const h=createHarness();await h.fire('fullscreen','click');h.advance();await h.fire('show-scene','click');assert.equal(h.visible(),true);h.document.fullscreenElement=null;await h.globalEvent('document','fullscreenchange');assert.equal(h.visible(),false);h.advance();assert.equal(h.visible(),false);
});
for(const option of ['unsupported','rejected'])test(`UI DOUBLE V2: ${option} fullscreen request preserves hidden usable fallback`,async()=>{
 const h=createHarness(option==='unsupported'?{fullscreenSupported:false}:{requestFullscreen:()=>Promise.reject(Error('Synthetic denied fullscreen'))});await h.fire('show-scene','click');await h.fire('fullscreen','click');assert.equal(h.visible(),false);assert.equal(h.document.fullscreenElement,null);assert.match(h.status(),/full.?window|not available|unavailable|denied|fullscreen/i);h.advance();await h.fire('show-scene','click');assert.equal(h.visible(),true);await h.fire('hide-scene','click');assert.equal(h.visible(),false);
});
for(const outcome of ['resolve','reject'])test(`UI DOUBLE V2: delayed fullscreen ${outcome} never restores visibility or stale import`,async()=>{
 let resolve,reject;const h=createHarness({requestFullscreen:()=>new Promise((r,j)=>{resolve=r;reject=j})});let read;h.get('scene-import').files=[{size:100,text:()=>new Promise(r=>read=r)}];const importing=h.fire('scene-import','change'),entering=h.fire('fullscreen','click');await h.fire('hide-scene','click');const before=h.get('scene-name').value;if(outcome==='resolve')resolve();else reject(Error('Synthetic late denial'));await entering;read(JSON.stringify(fixture({name:'STALE'})));await importing;assert.equal(h.get('scene-name').value,before);assert.equal(h.visible(),false);h.advance();assert.equal(h.visible(),false);
});
for(const action of ['fullscreen','exit-fullscreen','add-object','delete-object','place-object'])test(`UI DOUBLE V2 RACE: ${action} invalidates pending import`,async()=>{
 const h=createHarness();let resolve;h.get('scene-import').files=[{size:100,text:()=>new Promise(r=>resolve=r)}];const pending=h.fire('scene-import','change');await h.fire(action,'click');const before=h.get('scene-name').value;resolve(JSON.stringify(fixture({name:'STALE'})));await pending;assert.equal(h.get('scene-name').value,before);assert.equal(h.visible(),false);
});

test('UI DOUBLE V2: skip link reopens hidden editor, conceals and focuses scene controls',async()=>{
 const h=createHarness();await h.fire('editor-toggle','click');assert.equal(h.get('editor-panel').hidden,true);h.advance();await h.fire('show-scene','click');assert.equal(h.visible(),true);const event=await h.fire('skip-controls','click');assert.equal(event.defaultPrevented,true);assert.equal(h.get('editor-panel').hidden,false);assert.equal(h.document.activeElement.id,'controls');assert.equal(h.visible(),false);h.advance();assert.equal(h.visible(),false);
});
test('UI DOUBLE V2: object selection preserves staged fields without showing or accepting',async()=>{
 const h=createHarness();await h.input('scene-name','Edited name');const id=h.get('object-select').children[1].value;await h.select('object-select',id);assert.equal(h.get('scene-name').value,'Edited name');assert.equal(await h.exportScene(),null);await h.submit();assert.equal((await h.exportScene()).scene.name,'Edited name');assert.equal(h.visible(),false);
});
test('UI DOUBLE V2: guidance shortcut conceals, opens editor and focuses guidance',async()=>{
 const h=createHarness();await h.fire('editor-toggle','click');h.advance();await h.fire('show-scene','click');assert.equal(h.visible(),true);await h.fire('viewing-guidance','click');assert.equal(h.visible(),false);assert.equal(h.get('editor-panel').hidden,false);assert.equal(h.document.activeElement.id,'guidance-title');
});
test('UI DOUBLE V2: fullscreen lifecycle restores focus to visible entry and exit controls',async()=>{
 const h=createHarness();await h.fire('fullscreen','click');assert.equal(h.document.activeElement.id,'exit-fullscreen');assert.equal(h.get('exit-fullscreen').hidden,false);await h.fire('exit-fullscreen','click');assert.equal(h.document.activeElement.id,'fullscreen');assert.equal(h.get('fullscreen').hidden,false);assert.equal(h.visible(),false);
});

// v0.3 checks distinguish the local color preview from the staged full-field canvas.
const swatchHSL=(h,prefix)=>h.get(prefix+'-color-swatch').style.backgroundColor;
const colorString=color=>`hsl(${color.h} ${color.s}% ${color.l}%)`;
const colorFixture=()=>scene({background:{h:210,s:40,l:25},objects:[{id:'object-1',shape:'circle',x:35,y:50,size:20,color:{h:30,s:50,l:45}},{id:'object-2',shape:'pixel',x:65,y:50,size:4,color:{h:280,s:60,l:55}}]});
const assertOnlyBlackPaint=h=>{assert.equal(h.visible(),false);assert.equal(hasSceneDraw(h),false);assert.ok(h.paint.filter(p=>p.method==='fillRect').every(p=>['#000','#000000','black'].includes(p.fillStyle)),'preview must never paint a chosen color into the hidden full-field canvas');};
for(const [prefix,key,value]of [['object','hue',125],['object','saturation',30],['object','lightness',60],['background','hue',75],['background','saturation',20],['background','lightness',35]])test(`UI DOUBLE V3: ${prefix} ${key} updates its actual HSL swatch on input without Apply or field paint`,async()=>{
 const h=createHarness(),initial=colorFixture();await h.import(JSON.stringify(initial));const other=prefix==='object'?'background':'object',beforeOther=swatchHSL(h,other);h.advance();await h.fire('show-scene','click');assert.equal(h.visible(),true);clearDraws(h);await h.input(prefix+'-'+key,value);
 const color={...(prefix==='object'?initial.scene.objects[0].color:initial.scene.background),[{hue:'h',saturation:'s',lightness:'l'}[key]]:value};assert.equal(swatchHSL(h,prefix),colorString(color));assert.equal(swatchHSL(h,other),beforeOther);assert.match(h.get(prefix+'-color-swatch').getAttribute('aria-label'),new RegExp(String(value)));assertOnlyBlackPaint(h);assert.equal(await h.exportScene(),null);await h.fire('show-scene','click');assert.equal(h.visible(),false);await h.submit();h.advance();assert.equal(h.visible(),false);await h.fire('show-scene','click');assert.equal(h.visible(),true);
});
test('UI DOUBLE V3: zero saturation and zero background lightness retain honest HSL text and styles',async()=>{
 const h=createHarness();await h.import(JSON.stringify(colorFixture()));clearDraws(h);await h.input('object-saturation',0);await h.input('object-hue',359);assert.equal(swatchHSL(h,'object'),'hsl(359 0% 45%)');await h.input('background-lightness',0);await h.input('background-hue',359);assert.equal(swatchHSL(h,'background'),'hsl(359 40% 0%)');assertOnlyBlackPaint(h);
});
test('UI DOUBLE V3: swatches follow selection while preserving staged object and background colors',async()=>{
 const h=createHarness(),initial=colorFixture();await h.import(JSON.stringify(initial));await h.input('object-hue',100);await h.input('background-lightness',30);await h.select('object-select','object-2');assert.equal(swatchHSL(h,'object'),colorString(initial.scene.objects[1].color));assert.equal(swatchHSL(h,'background'),'hsl(210 40% 30%)');await h.select('object-select','object-1');assert.equal(swatchHSL(h,'object'),'hsl(100 50% 45%)');assert.equal(await h.exportScene(),null);await h.fire('discard','click');assert.equal(swatchHSL(h,'object'),colorString(initial.scene.objects[0].color));assert.equal(swatchHSL(h,'background'),colorString(initial.scene.background));assert.equal(h.visible(),false);
});
test('UI DOUBLE V3: color previews follow apply, undo, redo, presets and accepted imports',async()=>{
 const h=createHarness(),initial=colorFixture();await h.import(JSON.stringify(initial));await h.input('object-hue',100);await h.input('background-lightness',30);await h.submit();await h.fire('undo','click');assert.equal(swatchHSL(h,'object'),colorString(initial.scene.objects[0].color));assert.equal(swatchHSL(h,'background'),colorString(initial.scene.background));await h.fire('redo','click');assert.equal(swatchHSL(h,'object'),'hsl(100 50% 45%)');assert.equal(swatchHSL(h,'background'),'hsl(210 40% 30%)');await h.select('preset','4');assert.equal(swatchHSL(h,'object'),colorString(M.presets()[4].scene.objects[0].color));assert.equal(swatchHSL(h,'background'),colorString(M.presets()[4].scene.background));await h.import(JSON.stringify(initial));assert.equal(swatchHSL(h,'object'),colorString(initial.scene.objects[0].color));assert.equal(swatchHSL(h,'background'),colorString(initial.scene.background));assert.equal(h.visible(),false);
});
test('UI DOUBLE V3: background-only imports do not retain a misleading selected-object swatch',async()=>{
 const h=createHarness();await h.import(JSON.stringify(colorFixture()));await h.import(JSON.stringify(scene({objects:[],background:{h:240,s:50,l:20}})));assert.equal(h.get('object-hue').disabled,true);assert.match(h.get('object-color-text').textContent,/no object|none|select|background.only/i);assert.ok(h.get('object-color-swatch').hidden||['transparent','','#000','hsl(0 0% 0%)'].includes(swatchHSL(h,'object')),'absent object must not retain an old colored sample');assert.equal(swatchHSL(h,'background'),'hsl(240 50% 20%)');assert.equal(h.visible(),false);
});
test('UI DOUBLE V3: fullscreen hides studio chrome and exposes explicit Show plus persistent Exit',async()=>{
 const h=createHarness();await h.fire('fullscreen','click');for(const id of ['masthead','stage-body','viewing-bar','skip-controls'])assert.equal(h.get(id).hidden,true,id);assert.equal(h.get('fullscreen-start').hidden,false);assert.equal(h.get('exit-fullscreen').hidden,false);assert.equal(h.document.activeElement.id,'exit-fullscreen');assert.equal(h.visible(),false);h.advance();await h.fire('fullscreen-show','click');assert.equal(h.visible(),true);assert.equal(h.get('fullscreen-start').hidden,true);assert.equal(h.document.activeElement.id,'exit-fullscreen');assert.equal(h.get('stage-root').classList.contains('fullscreen-mode'),true);assert.equal(h.get('stage-root').classList.contains('scene-visible'),true);await h.fire('exit-fullscreen','click');assert.equal(h.visible(),false);for(const id of ['masthead','stage-body','viewing-bar','skip-controls'])assert.equal(h.get(id).hidden,false,id);assert.equal(h.get('fullscreen-start').hidden,true);assert.equal(h.get('exit-fullscreen').hidden,true);assert.equal(h.document.activeElement.id,'fullscreen');
});
test('UI DOUBLE V3: fullscreen Show obeys draft and repeat guards, exposes errors, and never queues reveal',async()=>{
 const h=createHarness();await h.input('object-hue',100);await h.fire('fullscreen','click');h.advance();await h.fire('fullscreen-show','click');assert.equal(h.visible(),false);assert.equal(h.get('fullscreen-start').hidden,false);assert.match(h.get('fullscreen-status').textContent,/apply or discard/i);assert.equal(h.get('exit-fullscreen').hidden,false);await h.fire('exit-fullscreen','click');await h.fire('discard','click');await h.fire('fullscreen','click');await h.fire('fullscreen-show','click');assert.equal(h.visible(),false);h.advance();h.runTimers();assert.equal(h.visible(),false);await h.fire('fullscreen-show','click');assert.equal(h.visible(),true);assert.equal(h.timers.length,0,'fullscreen quiet controls must not schedule delayed UI or scene callbacks');
});
for(const [scope,type,props]of [['window','blur',{}],['document','visibilitychange',{}],['document','keydown',{key:'Escape'}],['window','resize',{}],['window','pagehide',{}],['document','freeze',{}]])test(`UI DOUBLE V3: fullscreen ${type} conceals and subsequent UI/timer work cannot reveal`,async()=>{
 const h=createHarness();await h.exportScene();assert.equal(h.timers.length,1);await h.fire('fullscreen','click');h.advance();await h.fire('fullscreen-show','click');assert.equal(h.visible(),true);clearDraws(h);if(type==='visibilitychange')h.document.hidden=true;await h.globalEvent(scope,type,props);assertOnlyBlackPaint(h);assert.equal(h.get('fullscreen-start').hidden,false);await h.fire('exit-fullscreen','click');clearDraws(h);h.advance(100000);h.runTimers();assert.equal(h.visible(),false);assert.equal(h.paint.length,0,'stale download cleanup must not redraw or reactivate fullscreen UI');assert.equal(h.get('fullscreen-start').hidden,true);assert.equal(h.get('stage-root').classList.contains('fullscreen-mode'),false);assert.equal(h.get('exit-fullscreen').hidden,true);
});
for(const outcome of ['resolve','reject'])test(`UI DOUBLE V3: fullscreen Show and exit invalidate delayed import ${outcome}`,async()=>{
 const h=createHarness();await h.fire('fullscreen','click');let resolve,reject;h.get('scene-import').files=[{size:100,text:()=>new Promise((r,j)=>{resolve=r;reject=j})}];const pending=h.fire('scene-import','change');await h.fire('fullscreen-show','click');assert.equal(h.visible(),false);await h.fire('exit-fullscreen','click');if(outcome==='resolve')resolve(JSON.stringify(colorFixture()));else reject(Error('Synthetic delayed read'));await pending;h.advance();h.runTimers();assert.equal(h.visible(),false);assert.equal(h.get('fullscreen-start').hidden,true);assert.equal(h.get('scene-name').value,'A small constellation');
});

test('UI DOUBLE V3: rejected Exit conceals and preserves usable fullscreen Show, status and Exit',async()=>{
 const h=createHarness({exitFullscreen:()=>Promise.reject(Error('Synthetic exit rejection'))});await h.fire('fullscreen','click');h.advance();await h.fire('fullscreen-show','click');assert.equal(h.visible(),true);await h.fire('exit-fullscreen','click');assert.equal(h.visible(),false);assert.equal(h.document.fullscreenElement,h.get('stage-root'));assert.equal(h.get('fullscreen-start').hidden,false);assert.equal(h.get('exit-fullscreen').hidden,false);assert.equal(h.document.activeElement.id,'exit-fullscreen');assert.match(h.get('fullscreen-status').textContent,/fullscreen|exit|escape/i);h.advance();h.runTimers();assert.equal(h.visible(),false);assert.equal(h.get('scene-name').value,'A small constellation');
});
