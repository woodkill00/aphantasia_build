'use strict';
// DOM doubles with real Node SHA-256; not native display-time or device evidence.
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {setTimeout:sleep}=require('node:timers/promises');
const {createHarness}=require('./dom-harness.cjs');
async function check(h,id,value=true){h.get(id).checked=value;await h.fire(id,'change');}
async function optin(h){await check(h,'journal-enable');await check(h,'journal-track-display');assert.equal(h.visible(),false);}
async function ready(h){for(let i=0;i<100;i++){if(/ready to attach/.test(h.get('journal-tracking-status').textContent))return;await sleep(1);}throw Error(h.get('journal-tracking-status').textContent);}
async function reflection(h){await h.fire('journal-add','click');await check(h,'journal-include-entry-1');await h.fire('journal-preview','click');return JSON.parse(h.get('journal-preview-text').textContent).entries[0].reflection;}
test('integrated opt-in hashes exact displayed scene and records only actual visible interval',async()=>{
 const h=createHarness({crypto:crypto.webcrypto});const expected=await h.exportScene();await optin(h);h.advance(3100);await h.fire('show-scene','click');assert.equal(h.visible(),true);h.advance(1234);await h.fire('hide-scene','click');await ready(h);
 const r=await reflection(h);assert.equal(r.scene.sha256,crypto.createHash('sha256').update(JSON.stringify(expected)).digest('hex'));assert.equal(r.scene.version,3);assert.equal(r.exposure.visibleMs,1234);assert.equal(r.exposure.mode,'static');assert.equal(r.exposure.endedReason,'user-stop');assert.equal(r.exposure.plannedMs,null);
});
test('integrated default reflections never call digest and leave provenance unavailable',async()=>{
 let calls=0;const h=createHarness({crypto:{subtle:{digest(){calls++;throw Error('Unexpected digest');}}}});await check(h,'journal-enable');h.advance(3100);await h.fire('show-scene','click');h.advance(1000);await h.fire('hide-scene','click');const r=await reflection(h);assert.equal(calls,0);assert.equal(r.scene.status,'unavailable');assert.equal(r.exposure.status,'unavailable');
});
for(const kind of ['pagehide','freeze','resize'])test('integrated lifecycle '+kind+' reports actual interruption category',async()=>{
 const h=createHarness({crypto:crypto.webcrypto});await optin(h);h.advance(3100);await h.fire('show-scene','click');h.advance(250);if(kind==='resize')await h.resize();else await h.globalEvent(kind==='pagehide'?'window':'document',kind);await ready(h);const r=await reflection(h);assert.equal(r.exposure.endedReason,kind==='resize'?'resize':'hidden-tab');assert.equal(r.exposure.visibleMs,250);assert.equal(r.exposure.interrupted,true);
});
test('integrated disabled tracking discards pending digest without attaching it later',async()=>{
 let resolve;const h=createHarness({crypto:{subtle:{digest(){return new Promise(done=>resolve=done);}}}});await optin(h);h.advance(3100);await h.fire('show-scene','click');await h.fire('hide-scene','click');await check(h,'journal-track-display',false);resolve(new Uint8Array(32).buffer);await sleep(1);const r=await reflection(h);assert.equal(r.scene.status,'unavailable');assert.match(h.get('journal-tracking-status').textContent,/off/);
});
test('integrated gallery defaults text-only and Hide invalidates optional thumbnails',async()=>{
 const h=createHarness();assert.equal(h.get('gallery-toggle-thumbnails').textContent,'Show static thumbnails');await h.fire('gallery-toggle-thumbnails','click');assert.equal(h.visible(),false);const thumbs=h.createdCanvases.filter(c=>c.className==='gallery-thumbnail');assert.equal(thumbs.length,12);assert.ok(thumbs.every(c=>c.width===64&&c.height===48));await h.fire('hide-scene','click');assert.ok(thumbs.every(c=>c.hidden&&c.width===1&&c.height===1));h.advance(3100);await h.fire('show-scene','click');assert.ok(thumbs.every(c=>c.hidden));
});
test('integrated sequence fingerprint covers whole canonical document and paused visible time exceeds planned duration',async()=>{
 const h=createHarness({crypto:crypto.webcrypto}),Q=require('./sequence-fixtures.cjs'),S=require('../src/sequence-model.js');await optin(h);const value=S.canonicalSequence(Q.sequence()),text=JSON.stringify(value);h.get('sequence-import').files=[{name:'synthetic.sequence.json',size:Buffer.byteLength(text),text:async()=>text}];await h.fire('sequence-import','change');h.advance(3100);await h.fire('sequence-play','click');assert.equal(h.visible(),true);h.runFrame(100);await h.fire('sequence-pause','click');h.advance(50000);await h.fire('sequence-stop','click');await ready(h);const r=await reflection(h);
 assert.equal(r.scene.format,S.FORMAT);assert.equal(r.scene.sha256,crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'));assert.equal(r.exposure.mode,'sequence');assert.equal(r.exposure.visibleMs,50100);assert.ok(r.exposure.visibleMs>r.exposure.plannedMs);assert.equal(r.exposure.endedReason,'user-stop');
});
test('integrated successful live edit supersedes prior scene reference and starts a fresh interval',async()=>{
 const h=createHarness({crypto:crypto.webcrypto});const expected=await h.exportScene();expected.scene.name='Synthetic changed document';await optin(h);h.advance(3100);await h.fire('show-scene','click');h.advance(200);await h.input('scene-name','Synthetic changed document');h.advance(300);await h.fire('hide-scene','click');await ready(h);const r=await reflection(h);assert.equal(r.exposure.visibleMs,300);assert.equal(r.scene.status,'available');assert.equal(r.scene.sha256,crypto.createHash('sha256').update(JSON.stringify(expected)).digest('hex'));
});
test('integrated Clear removes ready provenance even before any reflection is added',async()=>{
 const h=createHarness({crypto:crypto.webcrypto});await optin(h);h.advance(3100);await h.fire('show-scene','click');h.advance(100);await h.fire('hide-scene','click');await ready(h);assert.equal(h.get('journal-clear').disabled,false);await h.fire('journal-clear','click');assert.match(h.get('journal-tracking-status').textContent,/idle/);const r=await reflection(h);assert.equal(r.scene.status,'unavailable');
});
for(const kind of ['end','reduced-motion'])test('integrated '+kind+' exports honest stop reason',async()=>{
 const h=createHarness({crypto:crypto.webcrypto});await optin(h);h.advance(3100);await h.fire('show-scene','click');h.advance(123);if(kind==='end')await h.fire('end-viewing','click');else await h.setReducedMotion(true);await ready(h);const r=await reflection(h);assert.equal(r.exposure.endedReason,kind==='end'?'user-stop':'unknown');
});
