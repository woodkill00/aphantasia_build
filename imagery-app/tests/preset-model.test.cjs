'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const P=require('../src/preset-model.js'),M=require('../src/model.js'),I=require('../src/item-model.js');
const originalIDs=['balanced-contours','symmetric-points','sequential-shapes','mixed-steady-pulse'];
const addedIDs=['spatial-triplet','symmetric-pair','displaced-pair','overlapping-contours','simple-house','simple-tree','simple-boat','still-life'];
test('preset catalog has twelve stable original examples, independent metadata and validator results',()=>{
 const first=P.list(),second=P.list();assert.deepEqual(first.map(x=>x.id),[...originalIDs,...addedIDs]);assert.deepEqual(first,second);assert.notEqual(first,second);
 for(const entry of first){assert.equal(entry.revision,1);assert.equal(entry.license,'MIT');assert.ok(entry.title&&entry.description&&entry.timingKind&&entry.provenance);assert.match(entry.id,/^[a-z][a-z-]+$/);assert.ok(['vertical','not-vertical'].includes(entry.symmetry));assert.equal(typeof entry.overlap,'boolean');assert.deepEqual(entry.validation,{ok:true,format:M.FORMAT,version:M.AUTHORED_VERSION});}
 first[0].title='changed';first[0].validation.ok=false;assert.notEqual(P.list()[0].title,'changed');assert.equal(P.list()[0].validation.ok,true);
});
for(const {id} of P.list())test('preset '+id+' is deterministic, independent, canonical, bounded and editable',()=>{
 const value=P.create(id),again=P.create(id),entry=P.list().find(x=>x.id===id);assert.deepEqual(value,again);assert.notEqual(value.scene.objects,again.scene.objects);assert.equal(value.version,4);assert.deepEqual(value.scene.background,{h:4,s:60,l:4});assert.deepEqual(value.scene.canvas,{mode:'fixed',ratio:'4:3'});assert.ok(value.scene.objects.length>0&&value.scene.objects.length<=12);assert.deepEqual(M.canonicalScene(value),value);assert.deepEqual(M.parseScene(JSON.stringify(value)),value);assert.equal(entry.itemCount,value.scene.objects.length);assert.equal(entry.colorCount,new Set(value.scene.objects.map(o=>JSON.stringify(o.color))).size);
 for(const o of value.scene.objects){const extent=M.objectExtent(o);assert.ok(o.x-extent>=1&&o.x+extent<=99&&o.y-extent>=1&&o.y+extent<=99);assert.equal(o.outline.enabled,false);assert.equal(o.shadow.enabled,false);assert.ok(o.color.s<=60&&o.color.l<=70);assert.ok(o.size<=28&&o.geometry.height<=28);}
 value.scene.objects[0].x+=1;assert.ok(M.validateScene(value).ok);assert.notDeepEqual(value,P.create(id));assert.equal(Object.hasOwn(value.scene,'presetId'),false);assert.doesNotMatch(JSON.stringify(value),/"(?:presetId|revision|provenance|license|validation)"/);
});
test('the four existing revision-one scene payloads remain unchanged',()=>{
 const hashes=['ff04cb296355deab8117bb0130b3b34c6a5c5d4542305039cab4eb5cee3cd0b3','76ce282041a766dcfd9252b4f8cd03b21de0663f86d1aa84aa54d7df83784813','c6eca83eb89fae2c2135e389544347f3194f4e89c86a3d3fd920dfa03c967f04','e23d39ce580593c96e70093727b3d7e583d6da206a6d19fc352c6fa3135ee1b3'];
 for(const [i,id]of originalIDs.entries())assert.equal(crypto.createHash('sha256').update(JSON.stringify(P.create(id))).digest('hex'),hashes[i],id);
});
test('unknown preset identifiers fail closed without coercion or evaluating accessors',()=>{for(const id of [undefined,null,0,'','unknown',{},['balanced-contours'],{toString(){throw Error('Do not call.');}}])assert.throws(()=>P.create(id),/supported preset identifier/);});
test('all steady examples contain no pulse or fades',()=>{for(const {id,timingKind} of P.list()){if(timingKind!=='steady')continue;const value=P.create(id);for(const o of value.scene.objects){assert.equal(o.timing.pulse.enabled,false);assert.equal(o.timing.fadeInMs,0);assert.equal(o.timing.fadeOutMs,0);assert.equal(o.timing.startMs,0);assert.equal(o.timing.holdMs,3000);}}});
test('sequential example has finite staggered steady fades ending at ten seconds',()=>{const value=P.create('sequential-shapes'),timeline=I.compileTimeline(value);assert.equal(timeline.durationMs,10000);assert.deepEqual(value.scene.objects.map(o=>o.timing.startMs),[0,3000,6000]);assert.ok(value.scene.objects.every(o=>!o.timing.pulse.enabled));assert.deepEqual(I.frameAt(timeline,500).items.map(o=>o.alpha),[0.5,0,0]);assert.equal(I.frameAt(timeline,10000).done,true);});
test('mixed example combines steady and shared slow opacity pulse in one finite timeline',()=>{const value=P.create('mixed-steady-pulse'),timeline=I.compileTimeline(value);assert.equal(value.scene.pulsePeriodMs,4000);assert.deepEqual(value.scene.objects.map(o=>o.timing.pulse.enabled),[false,true]);assert.equal(timeline.durationMs,8000);assert.deepEqual(I.frameAt(timeline,2000).items.map(o=>o.alpha),[1,0.8]);assert.equal(I.frameAt(timeline,8000).done,true);});
test('creating or staging even a timed preset never reveals or starts playback',()=>{const player=I.createTimeline(()=>0);for(const {id} of P.list()){const controller=M.createController(()=>0),value=P.create(id);assert.equal(controller.stageLive(value).ok,true);assert.equal(controller.getState().visible,false);assert.equal(player.getState().status,'stopped');assert.equal(controller.previewDraft(value).ok,true);assert.equal(player.getState().status,'stopped');}});
test('catalog covers semantic examples, separate/overlapping regions, and timing without recommendations',()=>{
 const entries=P.list();for(const word of ['triplet','pair','constellation','house','tree','boat','still life'])assert.ok(entries.some(x=>(x.title+' '+x.description).toLowerCase().includes(word)),word);
 assert.deepEqual(new Set(entries.map(x=>x.overlap)),new Set([true,false]));assert.deepEqual(new Set(entries.map(x=>x.symmetry)),new Set(['vertical','not-vertical']));
 assert.doesNotMatch(JSON.stringify(entries),/recommended|treatment|improv(?:e|ement)|efficacy|best|dose|prescri/i);
});
test('vertical symmetry metadata includes geometry and color, not just paired centers',()=>{
 function signature(o,mirror){const shape={...o,x:mirror?100-o.x:o.x};delete shape.id;return JSON.stringify(shape);}
 for(const entry of P.list().filter(x=>x.symmetry==='vertical')){const objects=P.create(entry.id).scene.objects;const originals=objects.map(o=>signature(o,false)).sort(),mirrored=objects.map(o=>signature(o,true)).sort();assert.deepEqual(mirrored,originals,entry.id);}
});
test('separate-region examples have nonintersecting geometry bounding boxes',()=>{
 for(const entry of P.list().filter(x=>!x.overlap)){
  const shapes=M.geometry(P.create(entry.id),400,300).map(o=>({minX:Math.min(...o.points.map(p=>p[0])),maxX:Math.max(...o.points.map(p=>p[0])),minY:Math.min(...o.points.map(p=>p[1])),maxY:Math.max(...o.points.map(p=>p[1]))}));
  for(let i=0;i<shapes.length;i++)for(let j=i+1;j<shapes.length;j++){const a=shapes[i],b=shapes[j];assert.ok(a.maxX<b.minX||b.maxX<a.minX||a.maxY<b.minY||b.maxY<a.minY,entry.id+' '+i+'/'+j);}
 }
});
test('catalog metadata counts distinct item colors without counting shared background',()=>{for(const entry of P.list()){assert.ok(entry.colorCount>=1&&entry.colorCount<=3);assert.ok(entry.colorCount<=entry.itemCount);}assert.equal(P.list().find(x=>x.id==='symmetric-pair').colorCount,1);});
test('preset module has no scheduling, display, storage or network authority',()=>{const source=fs.readFileSync(require.resolve('../src/preset-model.js'),'utf8');assert.doesNotMatch(source,/\b(?:setTimeout|setInterval|requestAnimationFrame|fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|document|window)\b/);});
