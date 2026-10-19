'use strict';
// Transport/fixture checks only. These never launch Chrome or establish browser compatibility.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {CDP,checkFixtures} = require('./browser-cdp.cjs');
class FakeSocket extends EventTarget {
  sent=[];
  send(value) { this.sent.push(JSON.parse(value)); }
  reply(value) { this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)})); }
  close() { this.dispatchEvent(new Event('close')); }
}
test('CDP fixture values are accepted or rejected by the actual scene parser', () => {
  assert.deepEqual(checkFixtures(),{valid:2,rejected:10});
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
