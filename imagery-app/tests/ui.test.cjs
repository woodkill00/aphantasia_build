'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHarness}=require('./dom-harness.cjs');
const M=require('../src/model.js');
const fixture=changes=>{const s=M.presets()[0];Object.assign(s.scene,changes);return s};
const clearDraws=h=>{h.paint.length=0};
const hasSceneDraw=h=>h.paint.some(p=>['arc','stroke','fill','lineTo'].includes(p.method));

test('UI DOUBLE: delivered scripts initialize hidden, with no timers/network/storage APIs needed',()=>{
 const h=createHarness();assert.equal(h.visible(),false);assert.equal(hasSceneDraw(h),false);assert.equal(h.timers.length,0);assert.equal(h.get('undo').disabled,true);assert.equal(h.get('redo').disabled,true);assert.match(h.get('scene-canvas').attrs['aria-label'],/hidden/i);assert.match(h.get('scene-description').textContent,/3 sparse dots/);
});
test('UI DOUBLE: Show paints bounded dots; Hide immediately clears; no delayed reveal',async()=>{
 const h=createHarness();await h.fire('show-scene','click');assert.equal(h.visible(),true);assert.equal(h.paint.filter(p=>p.method==='arc').length,3);clearDraws(h);await h.fire('hide-scene','click');assert.equal(h.visible(),false);assert.equal(hasSceneDraw(h),false);await h.fire('show-scene','click');assert.equal(h.visible(),false);h.advance();assert.equal(h.visible(),false);await h.fire('show-scene','click');assert.equal(h.visible(),true);assert.equal(h.timers.length,0);
});
test('UI DOUBLE: edits hide immediately, require Apply, invalid values preserve accepted scene',async()=>{
 const h=createHarness();await h.fire('show-scene','click');await h.input('scene-name','Synthetic scene');assert.equal(h.visible(),false);await h.fire('show-scene','click');assert.match(h.status(),/Apply or discard/);await h.submit();assert.equal(h.visible(),false);assert.equal((await h.exportScene()).scene.name,'Synthetic scene');await h.input('position-x','0');await h.submit();assert.match(h.status(),/25.*75/);assert.equal(await h.exportScene(),null);await h.fire('discard','click');assert.equal(h.get('position-x').value,'50');assert.equal((await h.exportScene()).scene.name,'Synthetic scene');
});
test('UI DOUBLE: all presets stage, apply, paint correct shape; disabled dot controls for contours',async()=>{
 for(let i=0;i<M.presets().length;i++){const h=createHarness();await h.select('preset',String(i));assert.equal(h.visible(),false);assert.equal(h.get('shape').value,M.presets()[i].scene.shape);assert.equal(await h.exportScene(),null);await h.submit();h.advance();clearDraws(h);await h.fire('show-scene','click');assert.equal(h.visible(),true);assert.equal(h.get('dot-count').disabled,M.presets()[i].scene.shape!=='dots');assert.ok(hasSceneDraw(h));assert.deepEqual(await h.exportScene(),M.presets()[i]);}
});
test('UI DOUBLE: numeric, palette, size, count, radius changes accepted only via validation',async()=>{
 const h=createHarness();for(const [id,val]of [['position-x',75],['position-y',25],['size',28],['dot-count',5],['dot-radius',2],['palette','sand']])await h.input(id,val);await h.submit();const got=await h.exportScene();assert.deepEqual(got.scene,{name:'A small constellation',shape:'dots',x:75,y:25,size:28,dotCount:5,dotRadius:2,palette:'sand'});
});
test('UI DOUBLE: undo/redo preserve exact applied scenes and clear staged fields',async()=>{
 const h=createHarness();await h.input('scene-name','A');await h.submit();await h.input('scene-name','B');await h.submit();await h.input('scene-name','unapplied');await h.fire('undo','click');assert.equal(h.get('scene-name').value,'A');assert.equal(h.visible(),false);await h.fire('redo','click');assert.equal(h.get('scene-name').value,'B');assert.equal((await h.exportScene()).scene.name,'B');await h.fire('redo','click');assert.match(h.status(),/Nothing to redo/);
});
test('UI DOUBLE: blank and invalid preset choices are inert',async()=>{
 const h=createHarness();for(const v of ['','-1','500','oops','0.2']){await h.select('preset',v);assert.equal(h.get('scene-name').value,'A small constellation');assert.equal(h.visible(),false);}
});
test('UI DOUBLE: Escape immediate; button keyboard repeats prevented; normal field repetition untouched',async()=>{
 const h=createHarness();await h.fire('show-scene','click');const esc=await h.globalEvent('document','keydown',{key:'Escape'});assert.ok(esc.defaultPrevented);assert.equal(h.visible(),false);
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
 const h=createHarness(options),c=h.get('scene-canvas');assert.ok(c.width>=1&&c.width<=720);assert.equal(c.width,c.height);assert.equal(hasSceneDraw(h),false);
});
for(const options of [{noCanvas:true},{canvasThrows:true}])test(`UI DOUBLE: unavailable Canvas preserves data controls ${JSON.stringify(options)}`,async()=>{
 const h=createHarness(options);assert.match(h.status(),/Canvas is unavailable/);await h.fire('show-scene','click');assert.equal(h.visible(),false);await h.input('scene-name','No Canvas');await h.submit();assert.equal((await h.exportScene()).scene.name,'No Canvas');
});
test('UI DOUBLE: imports accepted hidden, canonical download round trip, same file reselect works',async()=>{
 const h=createHarness();const s=fixture({name:'Imported',shape:'square'});await h.import(JSON.stringify(s));assert.equal(h.visible(),false);assert.equal(h.get('scene-name').value,'Imported');assert.equal(h.get('scene-import').value,'');assert.deepEqual(await h.exportScene(),s);await h.import(JSON.stringify(s));assert.deepEqual(await h.exportScene(),s);
});
test('UI DOUBLE: malformed/empty/oversized/unknown/executable imports do not replace valid current',async()=>{
 const h=createHarness();const raw=JSON.stringify(fixture({name:'Accepted'}));await h.import(raw);
 for(const value of ['', '{','null','[]',JSON.stringify({...fixture({}),version:999}),JSON.stringify({...fixture({}),url:'https://example.invalid'}),JSON.stringify({...fixture({}),notes:'synthetic'}),JSON.stringify(fixture({})).replace('"version":1','"version":0,"version":1')]){await h.import(value);assert.equal(h.get('scene-name').value,'Accepted');assert.equal(h.visible(),false);assert.match(h.status(),/unchanged/);}
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
 const h=createHarness();const s=await h.exportScene();assert.equal(s.format,M.FORMAT);assert.match(h.status(),/Download requested/);assert.equal(h.downloads[0].filename,'imagery-field-scene-v1.json');assert.equal(h.urls.size,1);assert.equal(h.timers.length,1);assert.equal(h.timers[0].ms,60000);clearDraws(h);h.runTimers();assert.equal(h.urls.size,0);assert.equal(h.paint.length,0);assert.equal(h.visible(),false);
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
 const h=createHarness();await h.fire('show-scene','click');for(let i=0;i<300;i++){await h.select('preset',String(i%5));await h.submit();await h.fire('undo','click');await h.fire('redo','click');await h.fire('hide-scene','click');await h.fire('show-scene','click');assert.equal(h.visible(),false);}assert.equal(h.timers.length,0);h.advance(100000);assert.equal(h.visible(),false);await h.fire('show-scene','click');assert.equal(h.visible(),true);
});
