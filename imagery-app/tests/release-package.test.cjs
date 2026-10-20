'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const K = require('../../scripts/release-kit.cjs');
const repository = path.resolve(__dirname, '../..');
const M = require('../src/model.js');
const S = require('../src/sequence-model.js');
const I = require('../src/item-model.js');
const evidenceUrl = 'https://github.com/' + K.REPOSITORY + '/actions/runs/1';

function git(root, args) {
  const env = {...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null'};
  for (const key of Object.keys(env)) if (key.startsWith('GIT_') && !['GIT_CONFIG_NOSYSTEM', 'GIT_CONFIG_GLOBAL'].includes(key)) delete env[key];
  return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-C', root, ...args], {
    env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'imagery-release-test-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  const root = path.join(directory, 'source'); fs.mkdirSync(root);
  for (const name of [...K.INPUTS, 'scripts/release-kit.cjs', 'scripts/build-release.cjs', 'scripts/verify-release.cjs']) {
    fs.mkdirSync(path.dirname(path.join(root, name)), {recursive: true});
    fs.copyFileSync(path.join(repository, name), path.join(root, name));
  }
  git(root, ['init', '-q']);
  git(root, ['config', 'user.name', 'Synthetic release test']);
  git(root, ['config', 'user.email', 'test@example.invalid']);
  git(root, ['add', '.']); git(root, ['commit', '--no-gpg-sign', '-qm', 'Synthetic fixture']);
  const options = {root, version: '0.7.0-preview.1', sourceCommit: git(root, ['rev-parse', 'HEAD']),
    testedHtmlSha256: K.sha256(fs.readFileSync(path.join(root, 'imagery-app/index.html'))),
    evidenceUrl, output: path.join(directory, 'output')};
  return {root, directory, options};
}
function commit(f, file) {
  git(f.root, ['add', '--', file]);
  git(f.root, ['commit', '--no-gpg-sign', '-qm', 'Synthetic mutation']);
  f.options.sourceCommit = git(f.root, ['rev-parse', 'HEAD']);
}

test('current examples parse through production closed validators and are canonical', () => {
  for (const file of K.EXAMPLES.filter(name => name.endsWith('.json') && !name.startsWith('reference-'))) {
    const text = fs.readFileSync(path.join(repository, 'examples', file), 'utf8');
    const parsed = file.includes('sequence') ? S.parseSequence(text) : M.parseScene(text);
    assert.deepEqual(JSON.parse(text), parsed, file);
    assert.deepEqual((parsed.scene || parsed.sequence).background, {h: 4, s: 60, l: 4});
  }
});
test('legacy examples remain old-schema migration fixtures', () => {
  const scene = fs.readFileSync(path.join(repository, 'examples/reference-scene.json'), 'utf8');
  const sequence = fs.readFileSync(path.join(repository, 'examples/reference-sequence.json'), 'utf8');
  assert.equal(JSON.parse(scene).version, 2); assert.equal(M.parseScene(scene).version, 3);
  assert.equal(JSON.parse(sequence).version, 1); assert.equal(S.parseSequence(sequence).version, 2);
  assert.deepEqual(M.parseScene(scene).scene.background, {h: 210, s: 10, l: 8});
});
test('examples demonstrate steady overlap, mixed pulse and a finite snapshot sequence', () => {
  const scene = name => M.parseScene(fs.readFileSync(path.join(repository, 'examples', name), 'utf8'));
  const steady = scene('steady-overlap.scene.json'), mixed = scene('mixed-timing.scene.json');
  assert.equal(I.compileTimeline(steady).durationMs, 6000);
  assert.ok(steady.scene.objects.every(object => !object.timing.pulse.enabled));
  assert.ok(I.frameAt(I.compileTimeline(steady), 3000).items.every(item => item.active && item.alpha === 1));
  assert.equal(I.compileTimeline(mixed).durationMs, 8000);
  assert.deepEqual(mixed.scene.objects.map(object => object.timing.pulse.enabled), [false, true]);
  assert.equal(mixed.scene.pulsePeriodMs, 4000);
  const seq = S.parseSequence(fs.readFileSync(path.join(repository, 'examples/snapshot-sequence.sequence.json'), 'utf8'));
  assert.equal(S.compileTimeline(seq).durationMs, 11000);
});
test('CRC matches standard reference and deterministic ZIP verifies without extraction', () => {
  assert.equal(K.crc32(Buffer.from('123456789')), 0xcbf43926);
  const entries = new Map([['b.txt', Buffer.from('b')], ['a.txt', Buffer.from('a')]]);
  const first = K.makeZip(entries), second = K.makeZip(new Map([...entries].reverse()));
  assert.ok(first.equals(second));
  assert.deepEqual([...K.verifyZip(first, ['a.txt', 'b.txt']).keys()], ['a.txt', 'b.txt']);
});
test('clean explicit source builds repeatable byte-identical portable artifacts', t => {
  const f = fixture(t);
  const first = K.buildRelease(f.options);
  const second = K.buildRelease({...f.options, output: path.join(f.directory, 'second')});
  assert.deepEqual(fs.readdirSync(first.output).sort(), K.OUTPUT_NAMES);
  for (const name of K.OUTPUT_NAMES) assert.ok(fs.readFileSync(path.join(first.output, name)).equals(fs.readFileSync(path.join(second.output, name))), name);
  const result = K.verifyRelease(first.output);
  assert.equal(result.htmlSha256, f.options.testedHtmlSha256);
  const zip = K.verifyZip(fs.readFileSync(path.join(first.output, K.ZIP_NAME)));
  assert.ok(zip.get(K.HTML_NAME).equals(fs.readFileSync(path.join(f.root, 'imagery-app/index.html'))));
  assert.deepEqual([...zip.keys()], K.PACKAGE_NAMES);
  assert.ok([...zip.keys()].every(name => !/test-results|screenshots|src\/|notes\.json|\.git\//.test(name)));
  const metadata = JSON.parse(zip.get('release-metadata.json'));
  assert.equal(metadata.sourceCommit, f.options.sourceCommit);
  assert.equal(metadata.license.spdx, 'MIT');
  assert.equal(metadata.license.file, 'LICENSE');
  assert.equal(metadata.license.copyright, 'Copyright (c) 2026 woodkill00');
  assert.equal(metadata.license.sha256, K.LICENSE_SHA256);
  assert.equal(K.sha256(zip.get('LICENSE')), K.LICENSE_SHA256);
  assert.ok(zip.get('LICENSE').equals(fs.readFileSync(path.join(first.output, 'LICENSE'))));
  assert.match(metadata.testEvidence.status, /not checked/);
  assert.equal(metadata.testEvidence.suppliedActionsRunUrl, evidenceUrl);
});
test('packaging refuses missing or malformed explicit provenance', t => {
  const f = fixture(t);
  for (const key of ['version', 'sourceCommit', 'testedHtmlSha256', 'evidenceUrl']) {
    assert.throws(() => K.buildRelease({...f.options, [key]: undefined}));
  }
  assert.throws(() => K.buildRelease({...f.options, sourceCommit: 'main'}), /40-character/);
  assert.throws(() => K.buildRelease({...f.options, evidenceUrl: evidenceUrl + '?fake=success'}), /evidence-url/);
  assert.throws(() => K.buildRelease({...f.options, evidenceUrl: 'https://example.com/run'}), /evidence-url/);
  assert.ok(!fs.existsSync(f.options.output));
});
test('packaging refuses wrong commit and mismatched tested HTML hash', t => {
  const f = fixture(t);
  assert.throws(() => K.buildRelease({...f.options, sourceCommit: '0'.repeat(40)}), /HEAD/);
  assert.throws(() => K.buildRelease({...f.options, testedHtmlSha256: '0'.repeat(64)}), /tested hash/);
  assert.throws(() => K.buildRelease({...f.options, version: '99.0.0'}), /runtime manifest version/);
  assert.ok(!fs.existsSync(f.options.output));
});
test('packaging refuses dirty tracked or untracked inputs', t => {
  const f = fixture(t);
  fs.appendFileSync(path.join(f.root, 'examples/README.md'), '\nchanged\n');
  assert.throws(() => K.buildRelease(f.options), /clean checkout/);
  git(f.root, ['checkout', '--', 'examples/README.md']);
  fs.writeFileSync(path.join(f.root, 'private-notes.txt'), 'Synthetic private test content');
  assert.throws(() => K.buildRelease(f.options), /clean checkout/);
  assert.ok(!fs.existsSync(f.options.output));
});
test('packaging checks committed bytes despite assume-unchanged flags', t => {
  const f = fixture(t);
  git(f.root, ['update-index', '--assume-unchanged', 'examples/README.md']);
  fs.appendFileSync(path.join(f.root, 'examples/README.md'), '\nchanged\n');
  assert.throws(() => K.buildRelease(f.options), /differs from the selected commit/);
});
test('packaging rejects tracked symlinks and a changed approved license', t => {
  const f = fixture(t), file = 'examples/README.md';
  fs.unlinkSync(path.join(f.root, file));
  fs.symlinkSync('../scripts/release/USAGE.txt', path.join(f.root, file));
  commit(f, file);
  assert.throws(() => K.buildRelease(f.options), /without symlink/);
  git(f.root, ['reset', '--hard', 'HEAD~1']); f.options.sourceCommit = git(f.root, ['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(f.root, 'LICENSE'), 'Synthetic unselected license');
  commit(f, 'LICENSE');
  assert.throws(() => K.buildRelease(f.options), /LICENSE differs from the exact approved MIT text/);
});
test('packaging rejects stale assembly even when HTML itself has the tested hash', t => {
  const f = fixture(t), file = 'imagery-app/src/style.css';
  fs.appendFileSync(path.join(f.root, file), '\n/* synthetic divergence */\n'); commit(f, file);
  assert.throws(() => K.buildRelease(f.options), /source assembly/);
});
test('packaging rejects invalid current or legacy examples before writing output', t => {
  const f = fixture(t), file = 'examples/static-starter.scene.json';
  const example = JSON.parse(fs.readFileSync(path.join(f.root, file))); example.scene.background.s = 101;
  fs.writeFileSync(path.join(f.root, file), JSON.stringify(example)); commit(f, file);
  assert.throws(() => K.buildRelease(f.options), /Saturation/);
  assert.ok(!fs.existsSync(f.options.output));
});
test('packaging refuses an in-checkout output, existing output or missing output', t => {
  const f = fixture(t);
  assert.throws(() => K.buildRelease({...f.options, output: path.join(f.root, 'release-output')}), /outside/);
  fs.mkdirSync(f.options.output);
  assert.throws(() => K.buildRelease(f.options), /already exists/);
  assert.throws(() => K.buildRelease({...f.options, output: undefined}), /explicit --output/);
});
test('ZIP reader rejects traversal, additions, truncation, tampering and links', () => {
  assert.throws(() => K.makeZip(new Map([['../private.txt', Buffer.from('x')]])), /Unsafe/);
  const zip = K.makeZip(new Map([['a.txt', Buffer.from('test')]]));
  assert.throws(() => K.verifyZip(zip, ['other.txt']), /Unexpected/);
  for (const bytes of [zip.subarray(0, zip.length - 1), Buffer.concat([zip, Buffer.from('x')])]) assert.throws(() => K.verifyZip(bytes, ['a.txt']));
  const tampered = Buffer.from(zip); tampered[35] ^= 1;
  assert.throws(() => K.verifyZip(tampered, ['a.txt']), /CRC/);
  const link = Buffer.from(zip), central = link.readUInt32LE(link.length - 6);
  link.writeUInt32LE((0o120777 * 65536) >>> 0, central + 38);
  assert.throws(() => K.verifyZip(link, ['a.txt']), /metadata/);
  const encryption = Buffer.from(zip); encryption.writeUInt16LE(1, central + 8);
  assert.throws(() => K.verifyZip(encryption, ['a.txt']), /metadata/);
});
test('release verifier detects changed assets, mismatched metadata and extra files', t => {
  const f = fixture(t); K.buildRelease(f.options);
  const html = path.join(f.options.output, K.HTML_NAME), original = fs.readFileSync(html);
  fs.appendFileSync(html, 'changed'); assert.throws(() => K.verifyRelease(f.options.output), /checksums mismatch/);
  fs.writeFileSync(html, original);
  fs.writeFileSync(path.join(f.options.output, 'private.log'), 'Synthetic private test content');
  assert.throws(() => K.verifyRelease(f.options.output), /file set/);
});
test('actual CLI prepares and verifies a clean local fixture, then refuses overwrite', t => {
  const f = fixture(t), options = f.options;
  const args = ['scripts/build-release.cjs', '--version', options.version,
    '--source-commit', options.sourceCommit, '--tested-html-sha256', options.testedHtmlSha256,
    '--evidence-url', options.evidenceUrl, '--output', options.output];
  const output = execFileSync(process.execPath, args, {cwd: f.root, encoding: 'utf8'});
  assert.match(output, /Prepared locally, not published/);
  assert.match(output, /not remotely verified/);
  const verification = execFileSync(process.execPath, ['scripts/verify-release.cjs', options.output], {cwd: f.root, encoding: 'utf8'});
  assert.match(verification, /PASS: exact file allowlists/);
  assert.throws(() => execFileSync(process.execPath, args, {cwd: f.root, stdio: 'pipe'}), /already exists/);
});
test('ZIP parser rejects unsafe names and local/directory inconsistency before extraction', () => {
  const zip = K.makeZip(new Map([['a.txt', Buffer.from('data')]]));
  const localMismatch = Buffer.from(zip); localMismatch.writeUInt16LE(1, 6);
  assert.throws(() => K.verifyZip(localMismatch, ['a.txt']), /records differ/);
  const unsafe = Buffer.from(zip), central = unsafe.readUInt32LE(unsafe.length - 6);
  unsafe.write('../xy', 30, 'ascii'); unsafe.write('../xy', central + 46, 'ascii');
  assert.throws(() => K.verifyZip(unsafe, ['../xy']), /Unsafe/);
  const bounds = Buffer.from(zip); bounds.writeUInt32LE(0xffffffff, central + 24);
  assert.throws(() => K.verifyZip(bounds, ['a.txt']), /bounds/);
});
test('CLI rejects ambiguous flags and never publishes', () => {
  const {main} = require('../../scripts/build-release.cjs');
  assert.throws(() => main(['--version', '0.7.0', '--version', '0.7.0']), /unique/);
  assert.throws(() => main(['--publish', 'yes']), /unique/);
  assert.throws(() => main(['--output']), /unique/);
  for (const file of ['build-release.cjs', 'release-kit.cjs', 'verify-release.cjs']) {
    const text = fs.readFileSync(path.join(repository, 'scripts', file), 'utf8');
    assert.doesNotMatch(text, /\bfetch\s*\(|https?\.request\s*\(|gh release|git push/);
  }
});


test('approved MIT notice is exact and required in all portable distributions', () => {
  const license = fs.readFileSync(path.join(repository, 'LICENSE'));
  assert.equal(K.sha256(license), K.LICENSE_SHA256);
  assert.match(license.toString(), /^MIT License\n\nCopyright \(c\) 2026 woodkill00\n/);
  assert.match(license.toString(), /The above copyright notice and this permission notice shall be included/);
  for (const names of [K.INPUTS, K.PACKAGE_NAMES, K.OUTPUT_NAMES]) assert.ok(names.includes('LICENSE'));
});
test('packaging rejects missing or ambiguous license files before output', t => {
  const f = fixture(t);
  git(f.root, ['rm', '--', 'LICENSE']);
  git(f.root, ['commit', '--no-gpg-sign', '-qm', 'Synthetic missing license']);
  f.options.sourceCommit = git(f.root, ['rev-parse', 'HEAD']);
  assert.throws(() => K.buildRelease(f.options), /approved MIT LICENSE is required/);
  assert.ok(!fs.existsSync(f.options.output));
  git(f.root, ['reset', '--hard', 'HEAD~1']);
  f.options.sourceCommit = git(f.root, ['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(f.root, 'LICENSE.md'), 'Synthetic ambiguous license');
  commit(f, 'LICENSE.md');
  assert.throws(() => K.buildRelease(f.options), /Unexpected additional license file/);
  assert.ok(!fs.existsSync(f.options.output));
});
test('release verifier rejects a forged license even with consistent recomputed hashes', t => {
  const f = fixture(t); K.buildRelease(f.options);
  const zipFile = path.join(f.options.output, K.ZIP_NAME);
  const entries = K.verifyZip(fs.readFileSync(zipFile));
  const forged = Buffer.from('Synthetic replacement license\n');
  entries.set('LICENSE', forged);
  const metadata = JSON.parse(entries.get('release-metadata.json'));
  metadata.license.sha256 = K.sha256(forged);
  entries.set('release-metadata.json', Buffer.from(JSON.stringify(metadata, null, 2) + '\n'));
  entries.set('CHECKSUMS.txt', K.checksums(new Map([...entries].filter(([name]) => name !== 'CHECKSUMS.txt'))));
  fs.writeFileSync(zipFile, K.makeZip(entries));
  fs.writeFileSync(path.join(f.options.output, 'LICENSE'), forged);
  fs.writeFileSync(path.join(f.options.output, 'release-metadata.json'), entries.get('release-metadata.json'));
  const external = new Map(K.OUTPUT_NAMES.filter(name => name !== 'SHA256SUMS.txt')
    .map(name => [name, fs.readFileSync(path.join(f.options.output, name))]));
  fs.writeFileSync(path.join(f.options.output, 'SHA256SUMS.txt'), K.checksums(external));
  assert.throws(() => K.verifyRelease(f.options.output), /approved license mismatch/);
});
