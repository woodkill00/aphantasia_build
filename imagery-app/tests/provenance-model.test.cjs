'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const P = require('../src/provenance-model.js');
const J = require('../src/journal-model.js');
const M = require('../src/model.js');
const S = require('../src/sequence-model.js');
const {scene} = require('./fixtures.cjs');
const {sequence} = require('./sequence-fixtures.cjs');
const digest = text => crypto.createHash('sha256').update(text, 'utf8').digest('hex');
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}
function snapshot(overrides = {}) {
  const document = M.canonicalScene(scene());
  return {identity: 1, canonical: JSON.stringify(document), format: document.format, version: document.version,
    rendererVersion: '0.8.0-dev.provenance1', mode: 'static', plannedMs: null, ...overrides};
}
function sequenceSnapshot(overrides = {}) {
  const document = S.canonicalSequence(sequence());
  return snapshot({canonical: JSON.stringify(document), format: document.format, version: document.version,
    mode: 'sequence', plannedMs: S.compileTimeline(document).durationMs, ...overrides});
}
function tracker(hash = text => Promise.resolve(digest(text))) {
  const instance = P.createTracker({hash}); instance.setEnabled(true); return instance;
}
function unavailable(instance) {
  assert.deepEqual(instance.getSummary(), {scene: {status: 'unavailable'}, exposure: {status: 'unavailable'}});
}

// Synthetic scene fixtures only. The model never starts a display or its clock.
test('PROVENANCE: hard opt-out does not inspect snapshot arguments, clocks, or hash', () => {
  let calls = 0, getters = 0;
  const t = P.createTracker({hash: () => { calls++; }});
  const input = {}; Object.defineProperty(input, 'canonical', {get() { getters++; throw Error('unwanted read'); }});
  assert.deepEqual(t.getState(), {enabled: false, status: 'disabled'});
  t.start(input, NaN); t.stop({}, Infinity); t.pause(undefined); t.resume(-1); t.clear();
  assert.equal(calls, 0); assert.equal(getters, 0); unavailable(t);
});

test('PROVENANCE: opt-in does not infer any earlier display or begin measuring', () => {
  let calls = 0; const t = P.createTracker({hash: text => { calls++; return digest(text); }});
  t.setEnabled(true); assert.deepEqual(t.getState(), {enabled: true, status: 'idle'});
  t.stop('user-stop', 10000); unavailable(t); assert.equal(calls, 0);
  for (const input of [undefined, null, 1, 'true', {}]) assert.throws(() => t.setEnabled(input));
});

test('PROVENANCE: actual acknowledged start to conceal uses foreground milliseconds and exact hash', async () => {
  const t = tracker(), input = snapshot();
  t.start(input, 10.25); await flush();
  assert.equal(t.getState().status, 'visible'); unavailable(t);
  t.stop('user-stop', 1010.99);
  const summary = t.getSummary();
  assert.deepEqual(summary.scene, {status: 'available', format: input.format, version: input.version,
    rendererVersion: input.rendererVersion, sha256: digest(input.canonical)});
  assert.deepEqual(summary.exposure, {status: 'available', mode: 'static', plannedMs: null,
    visibleMs: 1000, interrupted: true, endedReason: 'user-stop'});
  assert.equal(t.getState().status, 'ready');
  for (const item of [summary, summary.scene, summary.exposure]) assert.ok(Object.isFrozen(item));
  assert.deepEqual(J.canonicalRecord({...J.emptyRecord(), ...summary}).scene, summary.scene);
});

test('PROVENANCE: repeated same-identity draws do not split, reset, or rehash an interval', async () => {
  let calls = 0; const input = snapshot(), t = tracker(text => { calls++; return digest(text); });
  t.start(input, 100); await flush();
  for (let i = 1; i <= 50; i++) t.start({...input}, 100 + i / 10);
  t.stop('user-stop', 1100); assert.equal(t.getSummary().exposure.visibleMs, 1000); assert.equal(calls, 1);
});

test('PROVENANCE: paused playback remains visible and may exceed its planned duration', async () => {
  const t = tracker(), input = snapshot({mode: 'items', plannedMs: 1000});
  t.start(input, 0); await flush(); t.pause(200); t.resume(5000); t.pause(5100); t.resume(5200);
  unavailable(t); t.stop('completed', 6000);
  assert.deepEqual(t.getSummary().exposure, {status: 'available', mode: 'items', plannedMs: 1000,
    visibleMs: 6000, interrupted: false, endedReason: 'completed'});
});

test('PROVENANCE: no rounding drift accumulates across frequent redraws or pauses', async () => {
  const t = tracker(), input = snapshot(); t.start(input, 0.1); await flush();
  for (let i = 1; i <= 1000; i++) { t.start(input, i / 10 + 0.1); t.pause(i / 10 + 0.1); }
  t.stop('user-stop', 100.2); assert.equal(t.getSummary().exposure.visibleMs, 100);
});

test('PROVENANCE: each explicit end reason is closed and interruption is not fabricated completion', async () => {
  for (const reason of P.END_REASONS) {
    const t = tracker(); t.start(snapshot(), 0); await flush(); t.stop(reason, 10);
    assert.equal(t.getSummary().exposure.endedReason, reason);
    assert.equal(t.getSummary().exposure.interrupted, reason !== 'completed');
  }
  const t = tracker(); t.start(snapshot(), 0); await flush(); t.stop('improved', 10);
  unavailable(t); assert.equal(t.getState().reason, 'invalid-end-reason');
});

test('PROVENANCE: actual hide/hidden-tab/lifecycle intervals exclude the concealed gap', async () => {
  const t = tracker(), input = snapshot();
  t.start(input, 0); await flush(); t.stop('hidden-tab', 50);
  assert.equal(t.getSummary().exposure.visibleMs, 50);
  t.stop('hidden-tab', 9000); assert.equal(t.getSummary().exposure.visibleMs, 50);
  t.start(input, 10000); await flush(); unavailable(t); t.stop('user-stop', 10025);
  assert.equal(t.getSummary().exposure.visibleMs, 25);
});

test('PROVENANCE: changed scene starts a new segment and never exposes the older summary while visible', async () => {
  const t = tracker(), a = snapshot(), b = snapshot({identity: 2});
  const document = JSON.parse(b.canonical); document.scene.name = 'Changed synthetic display'; b.canonical = JSON.stringify(document);
  t.start(a, 0); await flush(); t.start(b, 100); unavailable(t); await flush();
  t.stop('user-stop', 130);
  assert.equal(t.getSummary().scene.sha256, digest(b.canonical));
  assert.equal(t.getSummary().exposure.visibleMs, 30);
  assert.equal(JSON.stringify(t.getSummary()).includes('Changed synthetic'), false);
});

test('PROVENANCE: a whole sequence is hashed, never relabeling the last scene as the sequence', async () => {
  const input = sequenceSnapshot(), t = tracker();
  t.start(input, 0); await flush(); t.pause(300); t.resume(600); t.stop('completed', 5000);
  const summary = t.getSummary();
  assert.equal(summary.scene.format, 'imagery-field-sequence'); assert.equal(summary.scene.sha256, digest(input.canonical));
  assert.equal(summary.exposure.mode, 'sequence');
  const modified = JSON.parse(input.canonical); modified.sequence.steps[0].name = 'Different first step';
  assert.notEqual(summary.scene.sha256, digest(JSON.stringify(modified)));
  assert.deepEqual(J.canonicalRecord({...J.emptyRecord(), ...summary}).scene, summary.scene);
});

test('PROVENANCE: incomplete hash is unavailable, then the completed interval becomes ready', async () => {
  const d = deferred(), t = tracker(() => d.promise); t.start(snapshot(), 0); t.stop('user-stop', 10);
  unavailable(t); assert.equal(t.getState().status, 'pending-digest');
  d.resolve('a'.repeat(64)); await flush(); assert.equal(t.getState().status, 'ready');
  assert.equal(t.getSummary().scene.sha256, 'a'.repeat(64));
});

test('PROVENANCE: opting out during digest revokes results and all available summaries', async () => {
  const d = deferred(), t = tracker(() => d.promise); t.start(snapshot(), 0); t.stop('user-stop', 10);
  t.setEnabled(false); d.resolve('a'.repeat(64)); await flush();
  assert.deepEqual(t.getState(), {enabled: false, status: 'disabled'}); unavailable(t);
  t.setEnabled(true); assert.equal(t.getState().status, 'idle'); unavailable(t);
});

test('PROVENANCE: clear revokes completed and unresolved intervals while preserving opt-in', async () => {
  const d = deferred(), t = tracker(() => d.promise); t.start(snapshot(), 0); t.stop('user-stop', 1); t.clear();
  d.resolve('a'.repeat(64)); await flush(); unavailable(t); assert.deepEqual(t.getState(), {enabled: true, status: 'idle'});
  const ready = tracker(); ready.start(snapshot(), 0); await flush(); ready.stop('user-stop', 1); ready.clear(); unavailable(ready);
});

test('PROVENANCE: stale digest cannot overwrite a newer completed interval', async () => {
  const jobs = [], t = tracker(text => { const d = deferred(); jobs.push({text, ...d}); return d.promise; });
  const a = snapshot(), b = snapshot({identity: 2});
  t.start(a, 0); t.start(b, 10); t.stop('user-stop', 20); unavailable(t);
  assert.equal(jobs.length, 1); jobs[0].resolve('a'.repeat(64)); await flush();
  unavailable(t); assert.equal(jobs.length, 2); jobs[1].resolve('b'.repeat(64)); await flush();
  assert.equal(t.getSummary().scene.sha256, 'b'.repeat(64)); assert.equal(t.getSummary().exposure.visibleMs, 10);
});

test('PROVENANCE: rapid edits keep at most one in-flight hash plus one replaceable latest input', async () => {
  const jobs = [], t = tracker(text => { const d = deferred(); jobs.push({text, ...d}); return d.promise; });
  for (let i = 1; i <= 200; i++) {
    const input = snapshot({identity: i}); const doc = JSON.parse(input.canonical); doc.scene.name = 'Synthetic ' + i; input.canonical = JSON.stringify(doc);
    t.start(input, i);
  }
  assert.equal(jobs.length, 1); t.stop('user-stop', 210); jobs[0].resolve('a'.repeat(64)); await flush();
  assert.equal(jobs.length, 2); assert.match(jobs[1].text, /Synthetic 200/);
  jobs[1].resolve(digest(jobs[1].text)); await flush(); assert.equal(t.getSummary().exposure.visibleMs, 10);
});

test('PROVENANCE: opting out or clearing discards queued snapshot content before it can be hashed', async () => {
  for (const cancel of [t => t.clear(), t => t.setEnabled(false)]) {
    let calls = 0; const d = deferred(), t = tracker(() => { calls++; return d.promise; });
    t.start(snapshot(), 0); t.start(snapshot({identity: 2}), 10); cancel(t); d.resolve('a'.repeat(64)); await flush();
    assert.equal(calls, 1); unavailable(t);
  }
});

test('PROVENANCE: disable/re-enable cannot exceed the single in-flight digest bound', async () => {
  const jobs = [], t = tracker(() => { const d = deferred(); jobs.push(d); return d.promise; });
  t.start(snapshot(), 0); t.setEnabled(false); t.setEnabled(true); t.start(snapshot(), 20); t.stop('user-stop', 30);
  assert.equal(jobs.length, 1); jobs[0].resolve('a'.repeat(64)); await flush(); assert.equal(jobs.length, 2); unavailable(t);
  jobs[1].resolve('b'.repeat(64)); await flush(); assert.equal(t.getSummary().scene.sha256, 'b'.repeat(64));
});

test('PROVENANCE: unsupported, rejected, throwing, or malformed hashes never fabricate a reference', async () => {
  const providers = [undefined, () => { throw Error('unsupported'); }, () => Promise.reject(Error('no crypto')),
    ...[null, '', 'A'.repeat(64), 'g'.repeat(64), 'a'.repeat(63), {}, 1].map(value => () => Promise.resolve(value))];
  for (const hash of providers) {
    const t = P.createTracker(hash ? {hash} : {}); t.setEnabled(true); t.start(snapshot(), 0); t.stop('user-stop', 100); await flush();
    unavailable(t); assert.equal(t.getState().status, 'unavailable'); assert.equal(t.getState().reason, 'digest-unavailable');
  }
});

test('PROVENANCE: rejecting obsolete digest does not poison queued latest document', async () => {
  const jobs = [], t = tracker(() => { const d = deferred(); jobs.push(d); return d.promise; });
  t.start(snapshot(), 0); t.start(snapshot({identity: 2}), 1); t.stop('user-stop', 2);
  jobs[0].reject(Error('old failure')); await flush(); unavailable(t);
  jobs[1].resolve('b'.repeat(64)); await flush(); assert.equal(t.getState().status, 'ready');
});

test('PROVENANCE: nonfinite, negative, unsafe and regressing clocks fail closed', async () => {
  for (const now of [NaN, Infinity, -Infinity, -1, '10', null, undefined, Number.MAX_SAFE_INTEGER + 1, 9.999]) {
    const t = tracker(); t.start(snapshot(), 10); await flush(); t.stop('user-stop', now);
    unavailable(t); assert.equal(t.getState().reason, 'invalid-clock');
  }
  const t = tracker(); t.start(snapshot(), 100); await flush(); t.stop('user-stop', 110);
  t.start(snapshot({identity: 2}), 109); unavailable(t); assert.equal(t.getState().reason, 'invalid-clock');
});

test('PROVENANCE: regression on redraw, pause or resume invalidates data and late hash', async () => {
  for (const action of [t => t.start(snapshot(), 9), t => t.pause(9), t => t.resume(9)]) {
    const d = deferred(), t = tracker(() => d.promise); t.start(snapshot(), 10); action(t); d.resolve('a'.repeat(64)); await flush();
    unavailable(t); assert.equal(t.getState().reason, 'invalid-clock');
  }
});

test('PROVENANCE: exact one-hour engineering cap is accepted and over-cap intervals are unavailable', async () => {
  const t = tracker(); t.start(snapshot(), 5); await flush(); t.stop('user-stop', 5 + P.MAX_VISIBLE_MS);
  assert.equal(t.getSummary().exposure.visibleMs, P.MAX_VISIBLE_MS);
  for (const action of [(t, time) => t.stop('user-stop', time), (t, time) => t.pause(time), (t, time) => t.start(snapshot(), time)]) {
    const over = tracker(); over.start(snapshot(), 5); await flush(); action(over, 5 + P.MAX_VISIBLE_MS + 0.1);
    unavailable(over); assert.equal(over.getState().reason, 'duration-bound');
  }
});

test('PROVENANCE: zero visible time is explicit zero, not unavailable or assumed planned duration', async () => {
  const t = tracker(); t.start(snapshot({mode: 'items', plannedMs: 1000}), 0); await flush(); t.stop('user-stop', 0);
  assert.equal(t.getSummary().exposure.visibleMs, 0); assert.equal(t.getSummary().exposure.plannedMs, 1000);
});

test('PROVENANCE: closed snapshot metadata rejects malformed, unknown and mismatched capabilities', () => {
  const invalid = [null, [], {}, ...[
    ['identity', 0], ['identity', '1'], ['identity', 1.1], ['identity', Number.MAX_SAFE_INTEGER + 1],
    ['canonical', null], ['canonical', ''], ['canonical', 'not JSON'], ['canonical', '{}'],
    ['format', 'unknown'], ['format', 'imagery-field-sequence'], ['version', 0], ['version', 5], ['version', '3'],
    ['rendererVersion', '0.8.0\n'], ['rendererVersion', 'a'.repeat(200)], ['mode', 'trial'], ['mode', 'sequence'],
    ['plannedMs', NaN], ['plannedMs', -1], ['plannedMs', 0.5], ['plannedMs', P.MAX_VISIBLE_MS + 1]
  ].map(([key, value]) => ({...snapshot(), [key]: value}))];
  for (const input of invalid) {
    let calls = 0; const t = tracker(() => { calls++; }); t.start(input, 0);
    unavailable(t); assert.equal(t.getState().reason, 'invalid-snapshot'); assert.equal(calls, 0);
  }
});

test('PROVENANCE: strict metadata rejects accessors without evaluation, symbols and custom prototypes', () => {
  for (const key of Object.keys(snapshot())) {
    let reads = 0; const input = snapshot(); Object.defineProperty(input, key, {get() { reads++; throw Error('no'); }});
    const t = tracker(); t.start(input, 0); unavailable(t); assert.equal(reads, 0);
  }
  for (const mutate of [v => { v.image = 'private'; }, v => { v[Symbol('extra')] = 1; }, v => { delete v.identity; }, v => Object.setPrototypeOf(v, {bad: true})]) {
    const input = snapshot(); mutate(input); const t = tracker(); t.start(input, 0); unavailable(t);
  }
  let coercions = 0; const t = tracker(); t.start(snapshot({format: {toString() { coercions++; return 'imagery-static-scene'; }}}), 0);
  assert.equal(coercions, 0); unavailable(t);
});

test('PROVENANCE: strict provider options reject accessors, extras and nonfunctions', () => {
  let reads = 0; const options = {}; Object.defineProperty(options, 'hash', {get() { reads++; }});
  assert.throws(() => P.createTracker(options)); assert.equal(reads, 0);
  for (const value of [null, [], {unknown: 1}, {hash: null}, {hash: 'sha256'}, {[Symbol('x')]: 1}]) assert.throws(() => P.createTracker(value));
});

test('PROVENANCE: input is neither mutated nor retained in exported metadata', async () => {
  const input = snapshot(), before = {...input}, t = tracker(); t.start(input, 0);
  assert.deepEqual(input, before); assert.equal(Object.isFrozen(input), false);
  input.mode = 'sequence'; input.rendererVersion = '9.9.9'; input.canonical = 'private changed source';
  await flush(); t.stop('user-stop', 1); const summary = t.getSummary();
  assert.equal(summary.exposure.mode, 'static'); assert.equal(summary.scene.rendererVersion, before.rendererVersion);
  for (const key of ['identity', 'canonical', 'name', 'startedAt', 'lastNow', 'timestamp', 'device', 'events']) {
    assert.equal(JSON.stringify(summary).includes('"' + key + '"'), false);
    assert.equal(JSON.stringify(t.getState()).includes('"' + key + '"'), false);
  }
});

test('PROVENANCE: changing metadata under the same identity and stale generations fail closed', async () => {
  for (const change of [{mode: 'items'}, {plannedMs: 10}, {rendererVersion: '0.8.1'}]) {
    const t = tracker(); t.start(snapshot(), 0); await flush(); t.start(snapshot(change), 1);
    unavailable(t); assert.equal(t.getState().reason, 'identity-mismatch');
  }
  const t = tracker(); t.start(snapshot({identity: 2}), 0); await flush(); t.start(snapshot({identity: 1}), 1);
  unavailable(t); assert.equal(t.getState().reason, 'stale-snapshot');
});

test('PROVENANCE: canonical UTF-8 bound is applied before hash, with exact boundary accepted', async () => {
  const base = snapshot(); const doc = JSON.parse(base.canonical); doc.syntheticPadding = '';
  const empty = JSON.stringify(doc), remaining = P.MAX_CANONICAL_BYTES - Buffer.byteLength(empty);
  const bounded = JSON.stringify({...doc, syntheticPadding: 'x'.repeat(remaining)});
  assert.equal(Buffer.byteLength(bounded), P.MAX_CANONICAL_BYTES);
  const t = tracker(); t.start({...base, canonical: bounded}, 0); await flush(); t.stop('user-stop', 1);
  assert.equal(t.getState().status, 'ready');
  for (const canonical of [bounded + ' ', JSON.stringify({...doc, syntheticPadding: '界'.repeat(Math.ceil(remaining / 3) + 1)})]) {
    let calls = 0; const invalid = tracker(() => { calls++; }); invalid.start({...base, canonical}, 0);
    assert.equal(calls, 0); unavailable(invalid); assert.equal(invalid.getState().reason, 'invalid-snapshot');
  }
});

test('PROVENANCE: stopped summaries cannot carry raw scene, sequence, image, events or identifiers into journal export', async () => {
  const t = tracker(), input = sequenceSnapshot(); t.start(input, 0); await flush(); t.stop('completed', 10);
  const journal = J.createJournal(), entry = journal.add({...J.emptyRecord(), ...t.getSummary()});
  const preview = journal.previewExport([entry.id]);
  assert.equal(preview.document.version, 2);
  for (const forbidden of ['canonical', 'identity', 'objects', 'steps', 'background', 'deviceId', 'timestamp', 'events', 'image']) {
    assert.equal(Object.hasOwn(preview.document.entries[0].reflection.scene, forbidden), false);
    assert.equal(preview.text.includes('"' + forbidden + '"'), false);
  }
  assert.throws(() => journal.confirmExport(preview, false));
  assert.equal(journal.confirmExport(preview, true), preview.text);
});

test('PROVENANCE: browser UMD loads without environment APIs and exposes no event log or display authority', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/provenance-model.js'), 'utf8');
  const sandbox = {}; vm.createContext(sandbox); vm.runInContext(source, sandbox);
  assert.ok(sandbox.ImageryProvenance);
  assert.equal(sandbox.ImageryProvenance.createTracker().getState().status, 'disabled');
  for (const pattern of [/\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bWebSocket\b/, /\bDate\b/, /\bperformance\b/,
    /\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /\bdocument\s*\.(?:createElement|visibilityState|hidden|body)/, /\beval\s*\(/, /new\s+Function\b/,
    /\bsetTimeout\s*\(/, /\bsetInterval\s*\(/, /\brequestAnimationFrame\s*\(/]) {
    assert.doesNotMatch(source, pattern);
  }
  for (const key of ['events', 'history', 'show', 'hide', 'download', 'submit', 'save']) assert.equal(key in P.createTracker(), false);
});

test('PROVENANCE: async status callback observes an already accepted ready summary', async () => {
  const d = deferred(), observed = [];
  const t = P.createTracker({hash: () => d.promise, onChange: state => observed.push({state, summary: t.getSummary()})});
  t.setEnabled(true); t.start(snapshot(), 0); t.stop('user-stop', 10);
  assert.equal(observed.length, 0); d.resolve('a'.repeat(64)); await flush();
  assert.equal(observed.length, 1); assert.deepEqual(observed[0].state, {enabled: true, status: 'ready'});
  assert.equal(observed[0].summary.scene.sha256, 'a'.repeat(64)); assert.ok(Object.isFrozen(observed[0].state));
  t.stop('user-stop', 20); assert.equal(observed.length, 1);
});

test('PROVENANCE: callback exceptions cannot corrupt accepted hashes or become rejected tasks', async () => {
  let calls = 0; const t = P.createTracker({hash: digest, onChange() { calls++; throw Error('broken host UI'); }});
  t.setEnabled(true); t.start(snapshot(), 0); t.stop('user-stop', 10); await flush();
  assert.equal(calls, 1); assert.equal(t.getState().status, 'ready'); assert.equal(t.getSummary().exposure.visibleMs, 10);
});

test('PROVENANCE: canceled and superseded results never call status callbacks', async () => {
  for (const cancel of [t => t.clear(), t => t.setEnabled(false), t => t.start(snapshot({identity: 2}), 10)]) {
    const jobs = []; let calls = 0;
    const t = P.createTracker({hash: () => { const d = deferred(); jobs.push(d); return d.promise; }, onChange() { calls++; }});
    t.setEnabled(true); t.start(snapshot(), 0); cancel(t); jobs[0].resolve('a'.repeat(64)); await flush();
    assert.equal(calls, 0);
  }
});

test('PROVENANCE: callbacks can clear pending state without reviving queued data', async () => {
  const t = P.createTracker({hash: digest, onChange() { t.clear(); }});
  t.setEnabled(true); t.start(snapshot(), 0); t.stop('user-stop', 10); await flush();
  unavailable(t); assert.deepEqual(t.getState(), {enabled: true, status: 'idle'});
  let reads = 0; const options = {}; Object.defineProperty(options, 'onChange', {get() { reads++; }});
  assert.throws(() => P.createTracker(options)); assert.equal(reads, 0);
  for (const onChange of [null, 'callback', 1, {}]) assert.throws(() => P.createTracker({onChange}));
});

test('PROVENANCE: failed prior intervals do not poison a newer valid visible interval', async () => {
  let calls = 0; const t = tracker(text => ++calls === 1 ? Promise.reject(Error('temporary failure')) : digest(text));
  t.start(snapshot(), 0); await flush(); t.stop('user-stop', 10); assert.equal(t.getState().status, 'unavailable');
  t.start(snapshot({identity: 2}), 20); assert.equal(t.getState().status, 'visible'); await flush();
  assert.equal(t.getState().status, 'visible'); unavailable(t); t.stop('user-stop', 30);
  assert.equal(t.getState().status, 'ready'); assert.equal(t.getSummary().exposure.visibleMs, 10);
});

test('PROVENANCE: repeated RAFs cannot reset a regressed or overlong continuous display into valid data', async () => {
  for (const badTime of [-1, P.MAX_VISIBLE_MS + 1]) {
    let calls = 0; const t = tracker(text => { calls++; return digest(text); });
    t.start(snapshot(), 0); await flush(); t.start(snapshot(), badTime); unavailable(t);
    for (let i = 1; i <= 5; i++) t.start(snapshot(), P.MAX_VISIBLE_MS + 1 + i);
    t.stop('user-stop', P.MAX_VISIBLE_MS + 10); unavailable(t); assert.equal(calls, 1);
    t.start(snapshot({identity: 2}), P.MAX_VISIBLE_MS + 20); await flush(); t.stop('user-stop', P.MAX_VISIBLE_MS + 30);
    assert.equal(t.getSummary().exposure.visibleMs, 10); assert.equal(calls, 2);
  }
});
