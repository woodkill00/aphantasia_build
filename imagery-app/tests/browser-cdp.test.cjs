'use strict';
// Transport/fixture checks only. These never launch Chrome or establish browser compatibility.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {CDP,checkFixtures,settlesWithin,stopChrome,stopChild,initialGuardRemaining} = require('./browser-cdp.cjs');
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
