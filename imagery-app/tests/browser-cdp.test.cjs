'use strict';
// Transport/fixture checks only. These never launch Chrome or establish browser compatibility.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {CDP,checkFixtures,settlesWithin,stopChrome,stopChild,initialGuardRemaining,assertFullscreenSnapshot,assertFullscreenDraftMessage,assertMotionSnapshot,hslRgb} = require('./browser-cdp.cjs');
class FakeSocket extends EventTarget {
  sent=[];
  send(value) { this.sent.push(JSON.parse(value)); }
  reply(value) { this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)})); }
  close() { this.dispatchEvent(new Event('close')); }
}
test('CDP fixture values are accepted or rejected by the actual scene parser', () => {
  assert.deepEqual(checkFixtures(),{valid:3,rejected:14});
});
test('CDP matches out-of-order replies to commands and retains flattened sessions', async () => {
  const socket=new FakeSocket(), cdp=new CDP(socket);
  const one=cdp.send('Page.enable',{},'page-1'),two=cdp.send('Browser.getVersion');
  assert.equal(socket.sent[0].sessionId,'page-1'); assert.ok(!('sessionId' in socket.sent[1]));
  socket.reply({id:2,result:{product:'synthetic'}}); socket.reply({id:1,result:{enabled:true}});
  assert.deepEqual(await one,{enabled:true}); assert.deepEqual(await two,{product:'synthetic'}); assert.equal(cdp.pending.size,0);
  cdp.close();
});
test('CDP surfaces protocol rejection without treating it as success', async () => {
  const socket=new FakeSocket(),cdp=new CDP(socket),request=cdp.send('Test.fail');
  socket.reply({id:1,error:{message:'synthetic failure'}});
  await assert.rejects(request,/Test.fail: synthetic failure/); cdp.close();
});
test('CDP delivers events and listener removal works', () => {
  const socket=new FakeSocket(),cdp=new CDP(socket),seen=[];
  const unsubscribe=cdp.on(message => seen.push(message));
  socket.reply({method:'Page.loadEventFired',sessionId:'page-1',params:{timestamp:1}}); unsubscribe();
  socket.reply({method:'Page.loadEventFired',params:{timestamp:2}});
  assert.equal(seen.length,1); assert.equal(seen[0].sessionId,'page-1'); cdp.close();
});
test('CDP closed socket rejects all in-flight commands', async () => {
  const socket=new FakeSocket(),cdp=new CDP(socket),request=cdp.send('Test.pending'); socket.close();
  await assert.rejects(request,/connection closed/); assert.equal(cdp.pending.size,0);
});
test('CDP malformed message rejects in-flight commands', async () => {
  const socket=new FakeSocket(),cdp=new CDP(socket),request=cdp.send('Test.pending');
  socket.dispatchEvent(new MessageEvent('message',{data:'{'}));
  await assert.rejects(request,SyntaxError); assert.equal(cdp.pending.size,0); cdp.close();
});

test('Initial-viewport settling responds only to observed hide lifecycle events', () => {
  assert.equal(initialGuardRemaining([],0),0);
  assert.equal(initialGuardRemaining([{type:'pageshow',time:50}],100),0);
  assert.equal(initialGuardRemaining([{type:'visibilitychange',time:50,hidden:false}],100),0);
  assert.equal(initialGuardRemaining([{type:'resize',time:50}],100),3050);
  assert.equal(initialGuardRemaining([{type:'blur',time:50}],4000),0);
  assert.equal(initialGuardRemaining([{type:'visibilitychange',time:50,hidden:true}],100),3050);
});
test('Shutdown wait distinguishes a real close from a timeout', async () => {
  assert.equal(await settlesWithin(Promise.resolve(),10),true);
  assert.equal(await settlesWithin(new Promise(()=>{}),1),false);
});
test('Chrome gets a graceful close without a premature termination signal', async () => {
  const calls=[];
  await stopChrome({cdp:{send:async method=>calls.push(method),close:()=>calls.push('socket.close')},closed:Promise.resolve(),processHandle:{kill:signal=>calls.push(signal)}},[1,1,1]);
  assert.deepEqual(calls,['Browser.close','socket.close']);
});
test('Chrome shutdown escalation waits for its close event', async () => {
  const calls=[]; let resolveClosed;
  const closed=new Promise(resolve=>{resolveClosed=resolve;});
  await stopChrome({cdp:{send:async()=>{},close:()=>{}},closed,processHandle:{kill:signal=>{calls.push(signal);resolveClosed();}}},[1,10,10]);
  assert.deepEqual(calls,['SIGTERM']);
});
test('Chrome shutdown failure is surfaced after bounded escalation', async () => {
  const calls=[];
  await assert.rejects(stopChrome({cdp:{send:async()=>{},close:()=>{}},closed:new Promise(()=>{}),processHandle:{kill:signal=>calls.push(signal)}},[1,1,1]),/did not close/);
  assert.deepEqual(calls,['SIGTERM','SIGKILL']);
});

test('Failed-launch cleanup uses the same bounded child termination', async () => {
  const signals=[]; let close;
  const closed=new Promise(resolve=>{close=resolve;});
  await stopChild({kill:signal=>{signals.push(signal);if(signal==='SIGKILL')close();}},closed,[0,1,10]);
  assert.deepEqual(signals,['SIGTERM','SIGKILL']);
});


test('Fullscreen delivery snapshot accepts only a synchronously concealed, focused transition',()=>{
 assert.doesNotThrow(()=>assertFullscreenSnapshot({trusted:true,coloredPixels:0,element:'stage-root',visibility:'Hidden',canvasLabel:'Scene hidden.',focus:'exit-fullscreen'},'stage-root'));
 assert.doesNotThrow(()=>assertFullscreenSnapshot({trusted:true,coloredPixels:0,element:null,visibility:'Hidden',canvasLabel:'Scene hidden.',focus:'fullscreen'},null));
});
test('Fullscreen delivery snapshot rejects missing event, visible scene or incorrect focus',()=>{
 const valid={trusted:true,coloredPixels:0,element:null,visibility:'Hidden',canvasLabel:'Scene hidden.',focus:'fullscreen'};
 for(const snapshot of [undefined,{...valid,trusted:false},{...valid,coloredPixels:1},{...valid,visibility:'Visible'},{...valid,canvasLabel:'Scene shown.'},{...valid,focus:'show-scene'},{...valid,element:'stage-root'}])assert.throws(()=>assertFullscreenSnapshot(snapshot,null));
});


test('Independent HSL swatch oracle covers hue sectors, achromatic gray and zero lightness',()=>{
 for(const [h,rgb]of [[0,[255,0,0]],[60,[255,255,0]],[120,[0,255,0]],[180,[0,255,255]],[240,[0,0,255]],[300,[255,0,255]]])assert.deepEqual(hslRgb({h,s:100,l:50}),rgb);
 assert.deepEqual(hslRgb({h:359,s:0,l:50}),[128,128,128]);assert.deepEqual(hslRgb({h:359,s:70,l:0}),[0,0,0]);assert.deepEqual(hslRgb({h:300,s:40,l:100}),[255,255,255]);
});

test('Independent native-user fixture and separate RGB oracle remain deterministic',()=>{
 const {referenceScene,rgb}=require('./independent-user-scenarios.cjs'),M=require('../src/model.js');assert.deepEqual(M.parseScene(JSON.stringify(referenceScene)),referenceScene);
 for(const [color,want]of [[{h:0,s:0,l:0},[0,0,0]],[{h:0,s:0,l:50},[128,128,128]],[{h:260,s:30,l:50},[115,89,166]]])assert.deepEqual(rgb(color),want);
});

test('Fullscreen draft message requires both editor directions without requiring sentence order',()=>{
 for(const text of ['Exit fullscreen to apply or discard staged changes before showing the scene.','Apply or discard staged changes before showing the scene. Exit fullscreen to return to the editor.'])assert.doesNotThrow(()=>assertFullscreenDraftMessage(text));
 for(const text of ['Apply or discard staged changes.','Exit fullscreen.','Changes staged.'])assert.throws(()=>assertFullscreenDraftMessage(text));
});

test('independent sequence user fixture and temporal/color oracle are valid without launching a browser',()=>{
 const {referenceSequence,referenceWeights,rgb}=require('./independent-sequence-user-scenarios.cjs'),S=require('../src/sequence-model.js');assert.deepEqual(S.parseSequence(JSON.stringify(referenceSequence)),referenceSequence);for(const [t,w]of [[0,[1,0,0]],[2999,[1,0,0]],[3500,[.5,.5,0]],[4000,[0,1,0]],[7500,[0,.5,.5]],[8000,[0,0,1]],[11000,null]])assert.deepEqual(referenceWeights(t),w);assert.deepEqual(rgb({h:210,s:30,l:50}),[89,128,166]);assert.deepEqual(rgb({h:359,s:0,l:50}),[128,128,128]);assert.deepEqual(rgb({h:240,s:50,l:0}),[0,0,0]);
});
test('native sequence pixel blend oracle uses independent RGB arithmetic',()=>{
 const {rgb,mix}=require('./browser-sequence.cjs');assert.deepEqual(rgb({h:210,s:30,l:50}),[89,128,166]);assert.deepEqual(mix([0,10,200],[200,110,0],.5),[100,60,100]);assert.deepEqual(mix([0,10,200],[200,110,0],0),[0,10,200]);assert.deepEqual(mix([0,10,200],[200,110,0],1),[200,110,0]);
});

test('Native motion event snapshot accepts both preference directions only when synchronously concealed',()=>{
 for(const matches of [false,true])assert.doesNotThrow(()=>assertMotionSnapshot(Object.freeze({trusted:true,matches,visibility:'Hidden',canvasLabel:'Scene hidden.',coloredPixels:0}),matches));
});
test('Native motion event snapshot rejects missing, untrusted, wrong-preference, visible or colored snapshots',()=>{
 const valid={trusted:true,matches:true,visibility:'Hidden',canvasLabel:'Scene hidden.',coloredPixels:0};for(const snapshot of [undefined,{...valid,trusted:false},{...valid,matches:false},{...valid,visibility:'Visible'},{...valid,canvasLabel:'Scene shown.'},{...valid,coloredPixels:1}])assert.throws(()=>assertMotionSnapshot(snapshot,true));
});
