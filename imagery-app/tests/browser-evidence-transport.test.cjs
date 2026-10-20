'use strict';
// Transport/decoder tests only, never native, visual, or performance acceptance.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {Console} = require('node:console');
const {Writable} = require('node:stream');
const {PREFIX, STATUS_PREFIX, LIMITS, digest, createConsoleTransport, decodeEvidence} = require('./browser-evidence-transport.cjs');
const identity = {commit: 'a'.repeat(40), tree: 'b'.repeat(40), runtimeSha256: 'c'.repeat(64),
  workingTreeClean: true, runId: 'synthetic-run', attempt: '1', scope: 'Synthetic transport fixture only'};
const report = changes => ({status: 'PASS', suiteCompleted: true, results: [{device: 'synthetic', name: 'one case', status: 'PASS'}],
  cleanup: {browserClosed: true, profileRemoved: true}, ...changes});
function setup(options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'imagery-evidence-test-')), lines = [];
  const transport = createConsoleTransport({outputDir: dir, identity, maxTransportBytes: 1000000,
    write: (text, done) => { lines.push(text); done(); }, ...options});
  return {dir, lines, transport, clean: () => fs.rmSync(dir, {recursive: true, force: true})};
}
async function finish(h, final = report()) {
  for (const result of final.results) h.transport.beginCase(result.device, result.name);
  h.transport.console.log(JSON.stringify(final, null, 2)); h.transport.markFinalReport();
  h.transport.console.log('Browser report: synthetic/results.json');
  return h.transport.finalize(final);
}
function envelopes(lines) { return lines.filter(line => line.startsWith(PREFIX)).map(line => JSON.parse(line.slice(PREFIX.length))); }
function encode(values) { return values.map(value => PREFIX + JSON.stringify(value) + '\n').join(''); }
function capture(bytes = Buffer.from('synthetic original JPEG fixture bytes')) {
  return {device: 'synthetic', name: 'a/../name-is-data-not-a-path', mime: 'image/jpeg',
    sha256: digest(bytes), bytes: bytes.length, viewport: {width: 1366, height: 900, dpr: 1},
    captureScale: 0.5, base64: bytes.toString('base64')};
}

test('evidence preserves formatted multiline/non-ASCII console bytes, stream identity and order', async () => {
  const h = setup(), original = [];
  const sink = stream => new Writable({write(chunk, encoding, done) { original.push({stream, text: chunk.toString()}); done(); }});
  const baseline = new Console({stdout: sink('stdout'), stderr: sink('stderr'), colorMode: false, ignoreErrors: false});
  try {
    const calls = [['log', 'Synthetic café 😀\nsecond line %d', 12], ['error', 'FAIL synthetic: assertion\nexpected 2\nactual 3'],
      ['log', {unicode: '日本語', nested: {a: true}}]];
    for (const [method, ...args] of calls) { baseline[method](...args); h.transport.console[method](...args); }
    const result = await finish(h), decoded = decodeEvidence(h.lines.join(''), {expectedCases: 1, expectedIdentity: identity, jobConclusion: 'success'});
    assert.equal(result.complete, true); assert.equal(decoded.complete, true); assert.equal(decoded.accepted, true);
    assert.deepEqual(decoded.records.slice(0, calls.length).map(({stream, text}) => ({stream, text})), original);
    assert.equal(h.lines.filter(line => line.startsWith(STATUS_PREFIX)).length, 1);
    assert.deepEqual(Buffer.concat(decoded.records.map(record => Buffer.from(JSON.stringify(record) + '\n'))),
      fs.readFileSync(h.transport.spoolPath));
  } finally { h.clean(); }
});
test('evidence spans blocks without changing exact capture metadata, bytes or hashes', async () => {
  const h = setup({maxTransportBytes: 3000000}), value = capture(crypto.randomBytes(900000));
  try {
    h.transport.console.log('IMAGERY_VISUAL_CAPTURE ' + JSON.stringify(value));
    await finish(h);
    const decoded = decodeEvidence(h.lines.join(''), {expectedCaptures: 1});
    assert.ok(new Set(envelopes(h.lines).filter(v => v.kind === 'block').map(v => v.index)).size > 1);
    const actual = JSON.parse(decoded.records[0].text.slice('IMAGERY_VISUAL_CAPTURE '.length));
    assert.deepEqual(actual, value);
    assert.deepEqual(Buffer.from(actual.base64, 'base64'), Buffer.from(value.base64, 'base64'));
    assert.equal(h.lines.join('').includes(value.base64), false, 'raw payload must not also be emitted');
    assert.equal(decoded.captures[0].metadata.sha256, value.sha256);
  } finally { h.clean(); }
});
test('evidence final marker follows the exact original report and keeps native failure distinct', async () => {
  const h = setup(), final = report({status: 'FAIL', results: [{device: 'synthetic', name: 'original failure', status: 'FAIL', error: 'full\nstack'}]});
  try {
    h.transport.console.error('FAIL synthetic: original failure\nfull\nstack');
    const result = await finish(h, final), decoded = decodeEvidence(h.lines.join(''));
    assert.equal(result.complete, true); assert.equal(decoded.complete, true); assert.equal(decoded.accepted, false);
    assert.deepEqual(decoded.report, final); assert.equal(envelopes(h.lines).at(-1).kind, 'end');
  } finally { h.clean(); }
});
test('evidence cleanup failure remains failure even with complete transport', async () => {
  const h = setup();
  try {
    await finish(h, report({status: 'ERROR', cleanup: {error: 'Synthetic Chrome closure failure'}}));
    const decoded = decodeEvidence(h.lines.join(''));
    assert.equal(decoded.complete, true); assert.equal(decoded.accepted, false);
    assert.equal(decoded.report.cleanup.error, 'Synthetic Chrome closure failure');
  } finally { h.clean(); }
});
test('evidence cap keeps complete local records, later failure and cleanup without throwing through tests', async () => {
  const h = setup({maxTransportBytes: 20000});
  try {
    assert.doesNotThrow(() => h.transport.console.log(crypto.randomBytes(100000).toString('base64')));
    h.transport.console.error('FAIL synthetic: later original assertion\nall diagnostics');
    const final = report({status: 'FAIL', results: [{device: 'synthetic', name: 'later', status: 'FAIL'}]});
    const result = await finish(h, final);
    assert.equal(result.complete, false); assert.ok(result.emittedBytes <= 20000);
    assert.throws(() => decodeEvidence(h.lines.join('')), /incomplete transport/);
    const partial = decodeEvidence(h.lines.join(''), {allowPartial: true});
    assert.equal(partial.complete, false); assert.equal(partial.accepted, false);
    const spool = fs.readFileSync(h.transport.spoolPath, 'utf8');
    assert.match(spool, /later original assertion/); assert.match(spool, /browserClosed/);
    assert.ok(result.failures.some(f => f.includes('cap')));
  } finally { h.clean(); }
});
test('evidence corrupt original capture latches failure but subsequent assertions/report continue', async () => {
  const h = setup(), value = {...capture(), sha256: 'f'.repeat(64)};
  try {
    assert.doesNotThrow(() => h.transport.console.log('IMAGERY_VISUAL_CAPTURE ' + JSON.stringify(value)));
    h.transport.console.log('PASS synthetic: subsequent assertion completed');
    const result = await finish(h);
    assert.equal(result.complete, false);
    assert.match(fs.readFileSync(h.transport.spoolPath, 'utf8'), /subsequent assertion completed/);
    assert.throws(() => decodeEvidence(h.lines.join('')), /incomplete transport/);
  } finally { h.clean(); }
});
test('evidence awaits asynchronous output errors before a completeness decision', async () => {
  const lines = [], callbacks = [], h = setup({write: (text, done) => { lines.push(text); callbacks.push(done); }});
  try {
    h.transport.console.log('PASS synthetic: original');
    const finished = finish(h);
    let settled = false;
    finished.finally(() => { settled = true; });
    for (let turn = 0; turn < 20 && !settled; turn++) {
      await new Promise(resolve => setImmediate(resolve));
      while (callbacks.length) callbacks.shift()(turn === 0 ? new Error('Synthetic output failure') : undefined);
    }
    assert.equal(settled, true, 'all manually delayed callbacks were acknowledged within bounded test turns');
    const result = await finished;
    assert.equal(result.complete, false);
    assert.equal(envelopes(lines).at(-1).complete, false);
  } finally { h.clean(); }
});
test('evidence invalidates an emitted final marker when its write callback fails', async () => {
  const lines = [], h = setup({write: (text, done) => {
    lines.push(text);
    done(text.includes('"kind":"end"') ? new Error('Synthetic terminal write failed') : undefined);
  }});
  try {
    const result = await finish(h);
    assert.equal(result.complete, false);
    assert.equal(envelopes(lines).at(-1).kind, 'abort');
    assert.throws(() => decodeEvidence(lines.join(''), {expectedCases: 1, expectedIdentity: identity, jobConclusion: 'success'}), /incomplete/);
    assert.equal(decodeEvidence(lines.join(''), {allowPartial: true}).accepted, false);
  } finally { h.clean(); }
});
test('evidence latches actual Writable error events instead of crashing past cleanup', async () => {
  const stream = new Writable({write(chunk, encoding, done) { done(new Error('Synthetic output stream failure')); }});
  const h = setup({write: undefined, outputStream: stream});
  try {
    h.transport.console.log('PASS synthetic: still runs');
    const result = await finish(h);
    assert.equal(result.complete, false);
    assert.ok(result.failures.some(f => /output/.test(f)));
    assert.equal(result.end.cleanup.profileRemoved, true);
  } finally { h.clean(); }
});
test('evidence on a dead terminal output cannot self-assert external execution acceptance', async () => {
  const lines = [], h = setup({write: (text, done) => {
    if (!text.includes('"kind":"abort"')) lines.push(text);
    done(text.includes('"kind":"end"') || text.includes('"kind":"abort"') ? new Error('Synthetic dead pipe') : undefined);
  }});
  try {
    assert.equal((await finish(h)).complete, false);
    const decoded = decodeEvidence(lines.join(''), {expectedCases: 1, expectedIdentity: identity});
    assert.equal(decoded.complete, true); assert.equal(decoded.accepted, false);
    assert.equal(decodeEvidence(lines.join(''), {expectedCases: 1, expectedIdentity: identity, jobConclusion: 'failure'}).accepted, false);
    assert.equal(decodeEvidence(lines.join(''), {expectedCases: 1, jobConclusion: 'success'}).accepted, false);
  } finally { h.clean(); }
});
for (const mode of ['zero', 'throw', 'flush']) test('evidence latches spool ' + mode + ' failure without hanging assertions/cleanup', async () => {
  const io = {...fs};
  if (mode === 'zero') io.writeSync = () => 0;
  if (mode === 'throw') io.writeSync = () => { throw Error('Synthetic disk write error'); };
  if (mode === 'flush') io.fsyncSync = () => { throw Error('Synthetic disk flush error'); };
  const h = setup({spoolIO: io});
  try {
    assert.doesNotThrow(() => h.transport.console.error('FAIL synthetic: original diagnostic'));
    const result = await finish(h);
    assert.equal(result.complete, false); assert.ok(result.failures.some(f => /spool/.test(f)));
    assert.throws(() => decodeEvidence(h.lines.join('')), /incomplete transport/);
  } finally { h.clean(); }
});
test('evidence stops an over-limit spool explicitly while later assertions and final cleanup run', async () => {
  const h = setup();
  try {
    assert.doesNotThrow(() => h.transport.console.log('x'.repeat(LIMITS.recordBytes)));
    h.transport.console.log('PASS synthetic: later assertion');
    const result = await finish(h);
    assert.equal(result.complete, false);
    assert.equal(fs.statSync(h.transport.spoolPath).size, 0);
    assert.ok(result.failures.some(f => /not retained/.test(f)));
    assert.equal(result.end.cleanup.profileRemoved, true);
  } finally { h.clean(); }
});
test('evidence binds ordered case starts and rejects a claimed complete PASS subset', async () => {
  const h = setup();
  try {
    h.transport.beginCase('synthetic', 'unexpected extra case');
    await finish(h);
    assert.throws(() => decodeEvidence(h.lines.join('')), /case-start/);
  } finally { h.clean(); }
  const subset = setup();
  try {
    await finish(subset, report({suiteCompleted: false}));
    assert.equal(decodeEvidence(subset.lines.join(''), {expectedCases: 1, expectedIdentity: identity, jobConclusion: 'success'}).accepted, false);
    assert.throws(() => decodeEvidence(subset.lines.join(''), {expectedCases: 2, expectedIdentity: identity, jobConclusion: 'success'}), /case count/);
  } finally { subset.clean(); }
});
test('evidence refuses replacing a prior spool', async () => {
  const h = setup();
  try {
    assert.throws(() => createConsoleTransport({outputDir: h.dir, identity, maxTransportBytes: 1000000}), /EEXIST/);
    await finish(h);
  } finally { h.clean(); }
});
test('evidence accepts unrelated Actions lines and timestamp prefixes, not forged completion substitutes', async () => {
  const h = setup();
  try {
    h.transport.console.log('PASS synthetic: one');
    await finish(h);
    const logged = 'setup output\n' + h.lines.map(line => '2026-10-20T12:00:00.1234567Z ' + line).join('') + 'job success\n';
    assert.equal(decodeEvidence(logged).complete, true);
    assert.equal(decodeEvidence(h.lines.map(line => '\uFEFF2026-10-20T12:00:00.1234567Z ' + line).join('')).complete, true);
    assert.equal(decodeEvidence('\uFEFF' + h.lines.join('')).complete, true);
    assert.throws(() => decodeEvidence('PASS synthetic: all\njob success\n'), /missing start/);
  } finally { h.clean(); }
});
test('evidence rejects missing end/block, reordered or duplicate blocks, trailing blocks and duplicate end', async () => {
  const h = setup();
  try {
    h.transport.console.log(crypto.randomBytes(90000).toString('base64'));
    await finish(h);
    const all = envelopes(h.lines), block = all.find(v => v.kind === 'block'), last = all.at(-1);
    const bad = [all.slice(0, -1), all.filter(v => v !== block), [all[0], block, block, ...all.slice(2)],
      [...all, block], [...all, last], [all[0], all[2], all[1], ...all.slice(3)], [all[0], ...all]];
    for (const stream of bad) assert.throws(() => decodeEvidence(encode(stream)));
    const recovered = decodeEvidence(encode(all.slice(0, -1)), {allowPartial: true});
    assert.equal(recovered.complete, false); assert.equal(recovered.accepted, false);
  } finally { h.clean(); }
});
test('evidence rejects bad keys, canonical base64, length/hash/count/identity and original-report mismatches', async () => {
  const h = setup();
  try {
    h.transport.console.log('IMAGERY_VISUAL_CAPTURE ' + JSON.stringify(capture()));
    await finish(h);
    const all = envelopes(h.lines), bi = all.findIndex(v => v.kind === 'block');
    const mutate = fn => { const values = structuredClone(all); fn(values); return encode(values); };
    for (const fn of [
      v => { v[bi].unknown = true; }, v => { v[bi].base64 += '\n'; }, v => { v[bi].packedBytes++; },
      v => { v[bi].rawSha256 = '0'.repeat(64); }, v => { v[bi].packedSha256 = '0'.repeat(64); },
      v => { v[bi].piece++; }, v => { v[bi].pieces++; },
      v => { v.at(-1).records++; }, v => { v.at(-1).captures++; },
      v => { v.at(-1).reportSha256 = '0'.repeat(64); }, v => { v.at(-1).captureManifestSha256 = '0'.repeat(64); },
      v => { v.at(-1).complete = 'true'; }, v => { v[0].maxTransportBytes = Infinity; },
    ]) assert.throws(() => decodeEvidence(mutate(fn)));
    assert.throws(() => decodeEvidence(encode(all).replace('"kind":"start"', '"kind":"start","kind":"start"')), /duplicate-key/);
    assert.throws(() => decodeEvidence(encode(all), {expectedCases: 2}), /case count/);
    assert.throws(() => decodeEvidence(encode(all), {expectedCaptures: 2}), /capture count/);
    assert.throws(() => decodeEvidence(encode(all), {expectedIdentity: {wrong: true}}), /identity/);
  } finally { h.clean(); }
});
test('evidence bounds malicious decompression before parsing', async () => {
  const h = setup();
  try {
    await finish(h);
    const values = envelopes(h.lines), index = values.findIndex(v => v.kind === 'block');
    const bomb = zlib.brotliCompressSync(Buffer.alloc(LIMITS.blockBytes + 1, 65));
    values[index] = {kind: 'block', index: 0, pieces: 1, rawBytes: LIMITS.blockBytes,
      rawSha256: digest(Buffer.alloc(LIMITS.blockBytes, 65)), packedBytes: bomb.length,
      packedSha256: digest(bomb), piece: 0, base64: bomb.toString('base64')};
    assert.throws(() => decodeEvidence(encode(values)), /larger than|output|length|Buffer/i);
  } finally { h.clean(); }
});
test('evidence rejects truncated JSON, huge line and unterminated reconstructed record', async () => {
  const h = setup();
  try {
    await finish(h);
    assert.throws(() => decodeEvidence(h.lines.join('').slice(0, -20)));
    assert.throws(() => decodeEvidence(PREFIX + 'x'.repeat(LIMITS.lineBytes + 1)), /line bound/);
    const values = envelopes(h.lines), block = values.find(v => v.kind === 'block');
    const raw = zlib.brotliDecompressSync(Buffer.from(block.base64, 'base64')).subarray(0, -1), packed = zlib.brotliCompressSync(raw);
    Object.assign(block, {rawBytes: raw.length, rawSha256: digest(raw), packedBytes: packed.length,
      packedSha256: digest(packed), base64: packed.toString('base64')});
    assert.throws(() => decodeEvidence(encode(values)), /truncated record/);
  } finally { h.clean(); }
});
test('evidence bounds incompressible pieces and rejects conflicting/interleaved piece metadata', async () => {
  const h = setup({maxTransportBytes: 3000000});
  try {
    h.transport.console.log(crypto.randomBytes(800000).toString('base64'));
    await finish(h);
    assert.ok(h.lines.every(line => Buffer.byteLength(line) <= LIMITS.lineBytes));
    const values = envelopes(h.lines), pieces = values.filter(value => value.kind === 'block');
    assert.ok(pieces.length > 10);
    assert.ok(pieces.every(piece => piece.base64.length <= LIMITS.pieceBase64Bytes));
    assert.equal(decodeEvidence(h.lines.join('')).complete, true);
    const changed = structuredClone(values), second = changed.find(v => v.kind === 'block' && v.piece === 1);
    second.rawSha256 = 'f'.repeat(64);
    assert.throws(() => decodeEvidence(encode(changed)), /conflicting/);
    const lost = values.filter(v => v !== pieces[1]);
    assert.throws(() => decodeEvidence(encode(lost)), /reordered|piece/);
    const partial = decodeEvidence(encode(values.slice(0, 4)), {allowPartial: true});
    assert.equal(partial.records.length, 0, 'unverified partial compressed block is not exposed');
    assert.equal(partial.accepted, false);
  } finally { h.clean(); }
});
test('evidence rejects unused trailing Brotli junk and concatenated streams even with updated compressed hash', async () => {
  const h = setup();
  try {
    await finish(h);
    const original = envelopes(h.lines), blockIndex = original.findIndex(v => v.kind === 'block');
    for (const tail of [Buffer.from('junk'), zlib.brotliCompressSync(Buffer.from('second stream'))]) {
      const values = structuredClone(original), block = values[blockIndex];
      assert.equal(block.pieces, 1);
      const packed = Buffer.concat([Buffer.from(block.base64, 'base64'), tail]);
      Object.assign(block, {packedBytes: packed.length, packedSha256: digest(packed), base64: packed.toString('base64')});
      assert.throws(() => decodeEvidence(encode(values)), /unused\/trailing/);
    }
  } finally { h.clean(); }
});
