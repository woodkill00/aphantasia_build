'use strict';
// Lossless test-evidence transport only. This does not run a browser, change an
// assertion, upload artifacts, or establish native/performance/visual acceptance.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {Console} = require('node:console');
const {Writable} = require('node:stream');

const PREFIX = 'IMAGERY_EVIDENCE_V1 ';
const STATUS_PREFIX = 'IMAGERY_EVIDENCE_STATUS ';
const LIMITS = Object.freeze({
  blockBytes: 1024 * 1024, caseFlushBytes: 256 * 1024, pieceBase64Bytes: 48 * 1024,
  lineBytes: 51200, recordBytes: 4 * 1024 * 1024,
  decodedBytes: 64 * 1024 * 1024, transportBytes: 16 * 1024 * 1024,
  inputBytes: 32 * 1024 * 1024, records: 20000, captures: 1024,
  reserveBytes: 8192, identityBytes: 4096,
});
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error('Evidence transport: ' + message); };
function object(value, keys, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).sort().join('\0') !== [...keys].sort().join('\0')) fail(name + ' fields');
}
function integer(value, min, max, name) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(name + ' bound');
}
function hash(value, name) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) fail(name + ' hash');
}
function parseCanonical(text, name) {
  const value = JSON.parse(text);
  if (JSON.stringify(value) !== text) fail(name + ' noncanonical/duplicate-key JSON');
  return value;
}
function base64(value, maximum, name) {
  if (typeof value !== 'string' || value.length > 4 * Math.ceil(maximum / 3) ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) fail(name + ' base64');
  const bytes = Buffer.from(value, 'base64');
  if (bytes.length > maximum || bytes.toString('base64') !== value) fail(name + ' canonical base64');
  return bytes;
}
function captureFromLine(line, index) {
  const marker = 'IMAGERY_VISUAL_CAPTURE ';
  if (!line.startsWith(marker)) return null;
  const capture = JSON.parse(line.slice(marker.length));
  if (!capture || typeof capture !== 'object' || Array.isArray(capture) ||
      typeof capture.device !== 'string' || typeof capture.name !== 'string' ||
      capture.mime !== 'image/jpeg') fail('capture metadata');
  integer(capture.bytes, 1, LIMITS.recordBytes, 'capture bytes');
  hash(capture.sha256, 'capture');
  const bytes = base64(capture.base64, LIMITS.recordBytes, 'capture');
  if (bytes.length !== capture.bytes || digest(bytes) !== capture.sha256) fail('capture bytes/hash mismatch');
  const {base64: omitted, ...metadata} = capture;
  return {record: index, metadata};
}
function makeCaptureScanner(onCapture) {
  const pending = {stdout: '', stderr: ''};
  return {
    add(record) {
      if (record.kind !== 'output') return;
      pending[record.stream] += record.text;
      let end;
      while ((end = pending[record.stream].indexOf('\n')) >= 0) {
        const line = pending[record.stream].slice(0, end);
        pending[record.stream] = pending[record.stream].slice(end + 1);
        const capture = captureFromLine(line, record.index);
        if (capture) onCapture(capture);
      }
      if (Buffer.byteLength(pending[record.stream]) > LIMITS.recordBytes) fail('unterminated output record bound');
    },
    finish() {
      for (const stream of ['stdout', 'stderr']) {
        const capture = captureFromLine(pending[stream], -1);
        if (capture) onCapture(capture);
      }
    },
  };
}

function createConsoleTransport({outputDir, identity, maxTransportBytes, write, outputStream, spoolIO = fs}) {
  integer(maxTransportBytes, 2 * LIMITS.reserveBytes, LIMITS.transportBytes, 'configured transport bytes');
  if (Buffer.byteLength(JSON.stringify(identity)) > LIMITS.identityBytes) fail('identity bound');
  // Create-new protects earlier evidence; never replace a prior run's spool.
  const spoolPath = path.join(outputDir, 'evidence-records.jsonl');
  let fd = spoolIO.openSync(spoolPath, 'wx');
  let recordCount = 0, rawBytes = 0, emittedBytes = 0, blockCount = 0;
  let pending = Buffer.alloc(0), ended = false, payloadStopped = false, spoolStopped = false;
  let reportRecord = null;
  const failures = [], captures = [], waiting = new Set();
  const transcript = crypto.createHash('sha256');
  const remember = error => {
    const message = String(error?.message || error).slice(0, 400);
    if (failures.length < 12 && !failures.includes(message)) failures.push(message);
    payloadStopped = true;
  };
  const target = outputStream || (!write ? process.stdout : null);
  if (!write) write = (text, done) => target.write(text, done);
  const outputError = error => remember(new Error('output stream failed: ' + error.message));
  target?.on('error', outputError);
  const emitText = (text, terminal = false) => {
    const bytes = Buffer.byteLength(text);
    if (bytes > LIMITS.lineBytes || emittedBytes + bytes > maxTransportBytes - (terminal ? 0 : LIMITS.reserveBytes)) {
      remember(new Error('configured encoded-output cap exceeded'));
      return false;
    }
    emittedBytes += bytes;
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    waiting.add(promise);
    let called = false;
    const done = error => {
      if (called) return;
      called = true;
      if (error) remember(new Error('output flush failed: ' + error.message));
      waiting.delete(promise); resolve();
    };
    try { write(text, done); } catch (error) { done(error); }
    return true;
  };
  const emit = (value, terminal = false) => emitText(PREFIX + JSON.stringify(value) + '\n', terminal);
  const scanner = makeCaptureScanner(capture => {
    if (captures.length >= LIMITS.captures) fail('capture count bound');
    captures.push(capture);
  });
  const seal = bytes => {
    if (!bytes.length || payloadStopped) return;
    try {
      const packed = zlib.brotliCompressSync(bytes, {params: {[zlib.constants.BROTLI_PARAM_QUALITY]: 6}});
      const encoded = packed.toString('base64'), pieces = Math.ceil(encoded.length / LIMITS.pieceBase64Bytes);
      const metadata = {kind: 'block', index: blockCount, pieces, rawBytes: bytes.length,
        rawSha256: digest(bytes), packedBytes: packed.length, packedSha256: digest(packed)};
      let complete = true;
      for (let piece = 0; piece < pieces; piece++) {
        if (!emit({...metadata, piece, base64: encoded.slice(piece * LIMITS.pieceBase64Bytes, (piece + 1) * LIMITS.pieceBase64Bytes)})) {
          complete = false; break;
        }
      }
      if (complete) blockCount++;
    } catch (error) { remember(error); }
  };
  const accept = record => {
    if (ended) fail('write after final marker');
    const bytes = Buffer.from(JSON.stringify({...record, index: recordCount++}) + '\n');
    transcript.update(bytes); rawBytes += bytes.length;
    if (bytes.length > LIMITS.recordBytes || recordCount > LIMITS.records || rawBytes > LIMITS.decodedBytes) {
      remember(new Error('whole-stream/record bound exceeded; subsequent spool records are not retained'));
      spoolStopped = true;
    }
    // Even after a transport cap/failure, retain complete original synthetic
    // records locally and continue all assertions and browser/profile cleanup.
    if (fd !== null && !spoolStopped) {
      try {
        let offset = 0;
        while (offset < bytes.length) {
          const written = spoolIO.writeSync(fd, bytes, offset);
          if (!Number.isSafeInteger(written) || written <= 0 || written > bytes.length - offset) fail('local spool write made no valid progress');
          offset += written;
        }
      } catch (error) {
        spoolStopped = true;
        remember(new Error('local spool write failed; later records not retained: ' + error.message));
      }
    }
    try {
      if (bytes.length > LIMITS.recordBytes || recordCount > LIMITS.records || rawBytes > LIMITS.decodedBytes) fail('whole-stream/record bound exceeded');
      scanner.add({...record, index: recordCount - 1});
    } catch (error) { remember(error); }
    if (!payloadStopped) {
      let offset = 0;
      while (offset < bytes.length && !payloadStopped) {
        const length = Math.min(LIMITS.blockBytes - pending.length, bytes.length - offset);
        pending = Buffer.concat([pending, bytes.subarray(offset, offset + length)]);
        offset += length;
        if (pending.length === LIMITS.blockBytes) { seal(pending); pending = Buffer.alloc(0); }
      }
    }
    return recordCount - 1;
  };
  const sink = stream => new Writable({
    write(chunk, encoding, callback) {
      try {
        const text = chunk.toString('utf8');
        if (!Buffer.from(text).equals(chunk)) fail('non-UTF-8 console output');
        const index = accept({kind: 'output', stream, text});
        const status = /^(PASS|FAIL) ([^\n]*)/.exec(text);
        if (status && !payloadStopped) emitText(STATUS_PREFIX + JSON.stringify({
          record: index, stream, status: status[1], label: status[2].slice(0, 256),
        }) + '\n');
      } catch (error) { remember(error); }
      callback();
    },
  });
  const stdout = sink('stdout'), stderr = sink('stderr');
  const console = new Console({stdout, stderr, colorMode: false, ignoreErrors: false});
  emit({kind: 'start', version: 1, codec: 'brotli-base64', blockBytes: LIMITS.blockBytes,
    pieceBase64Bytes: LIMITS.pieceBase64Bytes,
    maxTransportBytes, identity});
  return {
    console, spoolPath,
    get recordCount() { return recordCount; },
    beginCase(device, name) {
      try {
        if (pending.length >= LIMITS.caseFlushBytes) { seal(pending); pending = Buffer.alloc(0); }
        accept({kind: 'case-start', device, name});
      } catch (error) { remember(error); }
    },
    markFinalReport() { reportRecord = recordCount - 1; },
    async finalize(report) {
      if (ended) fail('duplicate finalize');
      try { scanner.finish(); } catch (error) { remember(error); }
      seal(pending); pending = Buffer.alloc(0);
      try { spoolIO.fsyncSync(fd); }
      catch (error) { remember(new Error('local spool flush failed: ' + error.message)); }
      finally {
        try { spoolIO.closeSync(fd); fd = null; }
        catch (error) { remember(new Error('local spool close failed: ' + error.message)); }
      }
      await Promise.all([...waiting]);
      // Writable error events can follow their write callbacks on nextTick.
      await new Promise(resolve => setImmediate(resolve));
      ended = true;
      const originalReport = JSON.stringify(report);
      const end = {kind: 'end', complete: failures.length === 0, blocks: blockCount,
        records: recordCount, rawBytes, transcriptSha256: transcript.digest('hex'),
        captures: captures.length, captureManifestSha256: digest(JSON.stringify(captures)),
        reportRecord, reportSha256: digest(originalReport), testStatus: report.status,
        cases: report.results.length, suiteCompleted: report.suiteCompleted,
        cleanup: report.cleanup, failures: [...failures]};
      emit(end, true);
      await Promise.all([...waiting]);
      await new Promise(resolve => setImmediate(resolve));
      // A terminal write may have reached the reader even when its callback
      // reports failure. Explicitly invalidate it when output remains usable.
      // External terminal job status is also mandatory for acceptance because
      // no process can guarantee delivery of an abort over a dead output pipe.
      if (end.complete && failures.length) {
        emit({kind: 'abort', failures: [...failures]}, true);
        await Promise.all([...waiting]);
        await new Promise(resolve => setImmediate(resolve));
      }
      target?.removeListener('error', outputError);
      return {complete: failures.length === 0, failures: [...failures], emittedBytes, spoolPath, end};
    },
  };
}

function validateRecord(record, index) {
  if (record?.kind === 'output') {
    object(record, ['kind', 'stream', 'text', 'index'], 'output record');
    if (!['stdout', 'stderr'].includes(record.stream) || typeof record.text !== 'string') fail('output record values');
  } else if (record?.kind === 'case-start') {
    object(record, ['kind', 'device', 'name', 'index'], 'case-start record');
    if (typeof record.device !== 'string' || typeof record.name !== 'string') fail('case-start values');
  } else fail('unknown record kind');
  if (record.index !== index) fail('record order');
}

function decodeEvidence(input, {allowPartial = false, expectedCases, expectedCaptures, expectedIdentity, jobConclusion} = {}) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (bytes.length > LIMITS.inputBytes) fail('input bound');
  const text = bytes.toString('utf8');
  if (!Buffer.from(text).equals(bytes)) fail('input UTF-8');
  let start = null, end = null, abort = null, assembling = null, transportBytes = 0, rawBytes = 0;
  const blocks = [];
  for (const original of text.split('\n')) {
    // GitHub may prefix the first line of an interior log segment with a BOM.
    // Remove only that wrapper position, never bytes inside original records.
    const line = original.replace(/^\uFEFF/, '').replace(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z /, '');
    if (line.startsWith(STATUS_PREFIX)) {
      // These bounded human progress lines are not original transcript records.
      if (!start || end || Buffer.byteLength(line + '\n') > 1024) fail('live status outside stream/bound');
      transportBytes += Buffer.byteLength(line + '\n');
      const status = parseCanonical(line.slice(STATUS_PREFIX.length), 'live status');
      object(status, ['record', 'stream', 'status', 'label'], 'live status');
      integer(status.record, 0, LIMITS.records - 1, 'live record');
      if (!['stdout', 'stderr'].includes(status.stream) || !['PASS', 'FAIL'].includes(status.status) ||
          typeof status.label !== 'string' || status.label.length > 256) fail('live status values');
      continue;
    }
    if (!line.startsWith(PREFIX)) continue; // Unrelated Actions/setup/TAP lines are not envelope records.
    if (Buffer.byteLength(line + '\n') > LIMITS.lineBytes) fail('encoded line bound');
    transportBytes += Buffer.byteLength(line + '\n');
    if (transportBytes > LIMITS.transportBytes) fail('whole encoded stream bound');
    const value = parseCanonical(line.slice(PREFIX.length), 'envelope');
    if (value.kind === 'start') {
      object(value, ['kind', 'version', 'codec', 'blockBytes', 'pieceBase64Bytes', 'maxTransportBytes', 'identity'], 'start');
      if (start || end || blocks.length) fail('duplicate/misordered start');
      if (value.version !== 1 || value.codec !== 'brotli-base64' || value.blockBytes !== LIMITS.blockBytes ||
          value.pieceBase64Bytes !== LIMITS.pieceBase64Bytes) fail('unsupported protocol');
      integer(value.maxTransportBytes, 2 * LIMITS.reserveBytes, LIMITS.transportBytes, 'declared transport bytes');
      if (Buffer.byteLength(JSON.stringify(value.identity)) > LIMITS.identityBytes) fail('identity bound');
      if (expectedIdentity && JSON.stringify(value.identity) !== JSON.stringify(expectedIdentity)) fail('identity mismatch');
      start = value;
    } else if (value.kind === 'block') {
      object(value, ['kind', 'index', 'pieces', 'rawBytes', 'rawSha256', 'packedBytes', 'packedSha256', 'piece', 'base64'], 'block');
      if (!start || end) fail('block outside stream');
      if (value.index !== blocks.length) fail('block order');
      integer(value.rawBytes, 1, LIMITS.blockBytes, 'block raw bytes');
      integer(value.packedBytes, 1, LIMITS.blockBytes + 65536, 'block compressed bytes');
      integer(value.pieces, 1, Math.ceil((LIMITS.blockBytes + 65536) * 4 / 3 / LIMITS.pieceBase64Bytes), 'piece count');
      if (value.pieces !== Math.ceil(4 * Math.ceil(value.packedBytes / 3) / LIMITS.pieceBase64Bytes)) fail('compressed length/piece count mismatch');
      integer(value.piece, 0, value.pieces - 1, 'piece index');
      hash(value.rawSha256, 'raw'); hash(value.packedSha256, 'compressed');
      const {piece, base64: encoded, ...metadata} = value;
      if (!assembling) {
        if (piece !== 0) fail('missing first block piece');
        assembling = {metadata, pieces: [], bytes: 0};
      }
      if (JSON.stringify(metadata) !== JSON.stringify(assembling.metadata) ||
          piece !== assembling.pieces.length) fail('conflicting/reordered/interleaved block piece');
      if (piece < value.pieces - 1 && encoded.length !== LIMITS.pieceBase64Bytes) fail('short nonfinal block piece');
      const part = base64(encoded, LIMITS.pieceBase64Bytes * 3 / 4, 'block piece');
      if (!part.length || (piece < value.pieces - 1 && part.length !== LIMITS.pieceBase64Bytes * 3 / 4)) fail('block piece byte length');
      assembling.bytes += part.length;
      if (assembling.bytes > value.packedBytes) fail('compressed assembly bound');
      assembling.pieces.push(part);
      if (assembling.pieces.length === value.pieces) {
        const packed = Buffer.concat(assembling.pieces);
        if (packed.length !== value.packedBytes || digest(packed) !== value.packedSha256) fail('compressed bytes/hash mismatch');
        if (rawBytes + value.rawBytes > LIMITS.decodedBytes) fail('whole decoded stream bound');
        const decoded = zlib.brotliDecompressSync(packed, {maxOutputLength: LIMITS.blockBytes, info: true});
        if (decoded.engine.bytesWritten !== packed.length) fail('unused/trailing compressed bytes');
        const raw = decoded.buffer;
        if (raw.length !== value.rawBytes || digest(raw) !== value.rawSha256) fail('decoded bytes/hash mismatch');
        rawBytes += raw.length; blocks.push(raw); assembling = null;
      }
    } else if (value.kind === 'end') {
      object(value, ['kind', 'complete', 'blocks', 'records', 'rawBytes', 'transcriptSha256',
        'captures', 'captureManifestSha256', 'reportRecord', 'reportSha256', 'testStatus', 'cases',
        'suiteCompleted', 'cleanup', 'failures'], 'end');
      if (!start || end) fail('duplicate/misordered end');
      if (typeof value.complete !== 'boolean' || !Array.isArray(value.failures) ||
          typeof value.suiteCompleted !== 'boolean' || value.failures.length > 12 ||
          value.failures.some(f => typeof f !== 'string' || f.length > 400)) fail('end values');
      end = value;
    } else if (value.kind === 'abort') {
      object(value, ['kind', 'failures'], 'abort');
      if (!end || abort || !Array.isArray(value.failures) || !value.failures.length ||
          value.failures.length > 12 || value.failures.some(f => typeof f !== 'string' || f.length > 400)) fail('abort values/order');
      abort = value;
    } else fail('unknown envelope kind');
  }
  if (!start) fail('missing start');
  if (transportBytes > start.maxTransportBytes) fail('declared encoded cap exceeded');
  const raw = Buffer.concat(blocks), records = [], captures = [];
  const scanner = makeCaptureScanner(capture => {
    if (captures.length >= LIMITS.captures) fail('capture count bound');
    captures.push(capture);
  });
  let offset = 0, newline;
  while ((newline = raw.indexOf(10, offset)) >= 0) {
    const slice = raw.subarray(offset, newline);
    if (slice.length > LIMITS.recordBytes || records.length >= LIMITS.records) fail('decoded record bound');
    const decoded = slice.toString('utf8');
    if (!Buffer.from(decoded).equals(slice)) fail('record UTF-8');
    const record = parseCanonical(decoded, 'record');
    validateRecord(record, records.length);
    records.push(record); scanner.add(record); offset = newline + 1;
  }
  const partial = !end || end.complete !== true || abort;
  if (partial) {
    if (!allowPartial) fail(!end ? 'missing final completeness marker' : 'incomplete transport');
    return {complete: false, accepted: false, identity: start.identity, records, captures,
      report: null, end, abort, incompleteRecordBytes: raw.length - offset};
  }
  if (assembling) fail('missing block pieces');
  if (offset !== raw.length) fail('truncated record');
  scanner.finish();
  integer(end.blocks, 0, LIMITS.decodedBytes, 'end blocks');
  integer(end.records, 0, LIMITS.records, 'end records');
  integer(end.rawBytes, 0, LIMITS.decodedBytes, 'end raw bytes');
  integer(end.captures, 0, LIMITS.captures, 'end captures');
  integer(end.cases, 0, LIMITS.records, 'end cases');
  integer(end.reportRecord, 0, records.length - 1, 'report record');
  for (const name of ['transcriptSha256', 'captureManifestSha256', 'reportSha256']) hash(end[name], name);
  if (!Array.isArray(end.failures) || end.failures.length) fail('complete marker contains failures');
  if (end.blocks !== blocks.length || end.records !== records.length || end.rawBytes !== raw.length ||
      end.transcriptSha256 !== digest(raw)) fail('final counts/transcript mismatch');
  if (end.captures !== captures.length || end.captureManifestSha256 !== digest(JSON.stringify(captures))) fail('capture manifest mismatch');
  const reportOutput = records[end.reportRecord];
  if (reportOutput.kind !== 'output' || reportOutput.stream !== 'stdout') fail('final report source');
  const report = JSON.parse(reportOutput.text);
  if (digest(JSON.stringify(report)) !== end.reportSha256 || report.status !== end.testStatus ||
      !Array.isArray(report.results) || report.results.length !== end.cases ||
      report.suiteCompleted !== end.suiteCompleted ||
      JSON.stringify(report.cleanup) !== JSON.stringify(end.cleanup)) fail('final original report mismatch');
  if (!['PASS', 'FAIL', 'ERROR', 'BLOCKED'].includes(report.status)) fail('nonterminal native status');
  if (expectedCases !== undefined && end.cases !== expectedCases) fail('expected case count mismatch');
  if (expectedCaptures !== undefined && captures.length !== expectedCaptures) fail('expected capture count mismatch');
  const starts = records.filter(record => record.kind === 'case-start');
  if (starts.length !== report.results.length || starts.some((record, index) =>
    record.device !== report.results[index].device || record.name !== report.results[index].name)) fail('case-start/final-result order mismatch');
  const verifiedIdentity = expectedIdentity && /^[0-9a-f]{40}$/.test(expectedIdentity.commit || '') &&
    /^[0-9a-f]{40}$/.test(expectedIdentity.tree || '') && /^[0-9a-f]{64}$/.test(expectedIdentity.runtimeSha256 || '') &&
    expectedIdentity.workingTreeClean === true;
  return {complete: true, accepted: !!verifiedIdentity && jobConclusion === 'success' && Number.isSafeInteger(expectedCases) &&
    report.suiteCompleted === true && report.status === 'PASS' && report.results.length > 0 &&
    report.results.every(result => result.status === 'PASS') && report.cleanup?.browserClosed === true &&
    report.cleanup?.profileRemoved === true, identity: start.identity, records, captures, report, end};
}

module.exports = {PREFIX, STATUS_PREFIX, LIMITS, digest, createConsoleTransport, decodeEvidence};
