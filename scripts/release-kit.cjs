'use strict';
// Maintainer-only, dependency-free packaging. No network calls or publication.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');

const REPOSITORY = 'woodkill00/aphantasia_build';
const HTML_NAME = 'Imagery-Field.html';
const ZIP_NAME = 'Imagery-Field-portable.zip';
// Exact owner-approved MIT text, including the 2026 woodkill00 notice.
// Update only after a deliberate license review, never by silently accepting
// whichever text happens to be present in a checkout.
const LICENSE_SHA256 = 'e787f2e2f0ecac57514b7d4ad51b6b5f737b042b42ce38ea73dd2ce88b5c6d0c';
const EXAMPLES = Object.freeze([
  'README.md', 'static-starter.scene.json', 'outline-shadow.scene.json',
  'steady-overlap.scene.json', 'mixed-timing.scene.json',
  'snapshot-sequence.sequence.json', 'reference-scene.json', 'reference-sequence.json'
]);
const SOURCE_PARTS = Object.freeze([
  ['/*__STYLE__*/', 'style.css'], ['/*__MODEL__*/', 'model.js'],
  ['/*__SEQUENCE__*/', 'sequence-model.js'], ['/*__ITEMS__*/', 'item-model.js'],
  ['/*__APP__*/', 'app.js']
]);
const INPUTS = Object.freeze([
  'LICENSE', 'imagery-app/index.html', 'imagery-app/SHA256-MANIFEST.json',
  'imagery-app/src/shell.html', ...SOURCE_PARTS.map(([, name]) => 'imagery-app/src/' + name),
  'scripts/release/START-HERE.txt', 'scripts/release/USAGE.txt',
  ...EXAMPLES.map(name => 'examples/' + name)
]);
const PACKAGE_NAMES = Object.freeze([
  HTML_NAME, 'LICENSE', 'START-HERE.txt', 'USAGE.txt', 'release-metadata.json', 'CHECKSUMS.txt',
  ...EXAMPLES.map(name => 'examples/' + name)
].sort());
const OUTPUT_NAMES = Object.freeze([HTML_NAME, ZIP_NAME, 'LICENSE', 'release-metadata.json', 'SHA256SUMS.txt'].sort());
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ZIP_BYTES = 8 * 1024 * 1024;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const jsonBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const fail = message => { throw new Error(message); };

function safeName(name) {
  if (typeof name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(name) ||
      name.split('/').some(part => !part || part === '.' || part === '..')) {
    fail('Unsafe archive path.');
  }
  return name;
}
function readRegular(root, name, maxBytes = MAX_FILE_BYTES) {
  safeName(name);
  let current = root;
  const parts = name.split('/');
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, parts[i]);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || (i < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) {
      fail('Input must be a regular file without symlink components: ' + name);
    }
    if (i === parts.length - 1 && stat.size > maxBytes) fail('Input is too large: ' + name);
  }
  return fs.readFileSync(current);
}
function git(root, args) {
  const env = {...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null'};
  // Do not allow ambient Git routing to substitute another checkout or index.
  for (const key of Object.keys(env)) if (key.startsWith('GIT_') && !['GIT_CONFIG_NOSYSTEM', 'GIT_CONFIG_GLOBAL'].includes(key)) delete env[key];
  return execFileSync('git', ['--no-optional-locks', '-C', root, ...args], {
    encoding: 'utf8', env, maxBuffer: MAX_ZIP_BYTES, stdio: ['ignore', 'pipe', 'pipe']
  });
}
function validateOptions(options) {
  const {version, sourceCommit, testedHtmlSha256, evidenceUrl} = options;
  if (typeof version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*)?$/.test(version)) {
    fail('Provide an explicit release --version, for example 0.7.0-preview.1.');
  }
  if (!/^[0-9a-f]{40}$/.test(sourceCommit || '')) fail('Provide the full 40-character tested --source-commit.');
  if (!/^[0-9a-f]{64}$/.test(testedHtmlSha256 || '')) fail('Provide the exact --tested-html-sha256.');
  const prefix = 'https://github.com/' + REPOSITORY + '/actions/runs/';
  if (typeof evidenceUrl !== 'string' || !evidenceUrl.startsWith(prefix) || !/^[1-9]\d*$/.test(evidenceUrl.slice(prefix.length))) {
    fail('Provide an explicit repository Actions run --evidence-url. It is recorded, not remotely verified.');
  }
}
function validateExamples(root, inputMap) {
  const M = require(path.join(root, 'imagery-app/src/model.js'));
  const S = require(path.join(root, 'imagery-app/src/sequence-model.js'));
  for (const name of EXAMPLES.filter(name => name.endsWith('.json'))) {
    const text = inputMap.get('examples/' + name).toString('utf8');
    const sequence = name.includes('sequence');
    const result = sequence ? S.parseSequence(text) : M.parseScene(text);
    const raw = JSON.parse(text);
    const expectedVersion = sequence ? S.VERSION : M.VERSION;
    if (!name.startsWith('reference-') && raw.version !== expectedVersion) fail('Current example has a legacy version: ' + name);
    if (result.version !== expectedVersion) fail('Example did not validate/migrate to the current schema: ' + name);
  }
}
function loadInputs(root, options) {
  validateOptions(options);
  if (git(root, ['rev-parse', '--show-toplevel']).trim() !== root) fail('Use the root of a Git checkout.');
  if (git(root, ['rev-parse', 'HEAD']).trim() !== options.sourceCommit) fail('HEAD must equal the explicitly tested source commit.');
  if (git(root, ['status', '--porcelain=v1', '--untracked-files=all']).trim()) fail('Packaging requires a clean checkout, including untracked files.');
  if (!fs.existsSync(path.join(root, 'LICENSE'))) fail('The approved MIT LICENSE is required; unlicensed packaging is not permitted.');
  if (fs.existsSync(path.join(root, 'LICENSE.md')) || fs.existsSync(path.join(root, 'LICENSE.txt'))) {
    fail('Unexpected additional license file; review license scope before packaging.');
  }
  const inputs = new Map();
  for (const name of INPUTS) {
    git(root, ['ls-files', '--error-unmatch', '--', name]);
    const bytes = readRegular(root, name);
    // Catch tracked ignore/assume-unchanged/index flags and source substitutions.
    const committed = Buffer.from(git(root, ['show', options.sourceCommit + ':' + name]), 'utf8');
    if (!bytes.equals(committed)) fail('Input differs from the selected commit: ' + name);
    inputs.set(name, bytes);
  }
  const html = inputs.get('imagery-app/index.html');
  if (sha256(inputs.get('LICENSE')) !== LICENSE_SHA256) fail('LICENSE differs from the exact approved MIT text and copyright notice.');
  if (sha256(html) !== options.testedHtmlSha256) fail('HTML does not match the explicitly tested hash.');
  const manifest = JSON.parse(inputs.get('imagery-app/SHA256-MANIFEST.json'));
  if (manifest.files['index.html'] !== options.testedHtmlSha256) fail('Runtime manifest and tested HTML hash differ.');
  if (options.version.split('-')[0] !== manifest.version) fail('Release version must use the runtime manifest version, optionally with a preview suffix.');
  let assembled = inputs.get('imagery-app/src/shell.html').toString('utf8');
  for (const [marker, file] of SOURCE_PARTS) {
    const text = inputs.get('imagery-app/src/' + file).toString('utf8');
    if (text.toLowerCase().includes('</script') || assembled.split(marker).length !== 2) fail('Unsafe or missing assembly marker: ' + file);
    assembled = assembled.replace(marker, () => text);
  }
  if (!Buffer.from(assembled).equals(html)) fail('Generated HTML differs from source assembly. Assemble and retest before packaging.');
  validateExamples(root, inputs);
  return {inputs, html, runtimeVersion: manifest.version};
}

const crcTable = Array.from({length: 256}, (_, number) => {
  let value = number;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function checksums(entries) {
  return Buffer.from([...entries].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([name, bytes]) => sha256(bytes) + '  ' + safeName(name) + '\n').join(''));
}
function makeZip(entries) {
  // STORE avoids compression-library/version variation. Fixed DOS timestamp:
  // 1980-01-01 00:00:00, fixed Unix regular-file mode, no extras or comments.
  const local = [], central = [];
  let offset = 0;
  for (const [name, data] of [...entries].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    const filename = Buffer.from(safeName(name));
    if (!Buffer.isBuffer(data) || data.length > MAX_FILE_BYTES) fail('Invalid ZIP input.');
    const crc = crc32(data), header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x21, 12); header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(filename.length, 26);
    local.push(header, filename, data);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0); directory.writeUInt16LE(0x0314, 4);
    directory.writeUInt16LE(20, 6); directory.writeUInt16LE(0x21, 14);
    directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(data.length, 20);
    directory.writeUInt32LE(data.length, 24); directory.writeUInt16LE(filename.length, 28);
    directory.writeUInt32LE((0o100644 * 65536) >>> 0, 38); directory.writeUInt32LE(offset, 42);
    central.push(directory, filename);
    offset += header.length + filename.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.size, 8);
  end.writeUInt16LE(entries.size, 10); end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  const zip = Buffer.concat([...local, directory, end]);
  if (zip.length > MAX_ZIP_BYTES) fail('ZIP exceeds the package size bound.');
  return zip;
}
function verifyZip(zip, allowedNames = PACKAGE_NAMES) {
  // Parse without extracting. Reject paths, metadata and ZIP features that the
  // small deterministic writer never emits, including links and data descriptors.
  if (!Buffer.isBuffer(zip) || zip.length < 22 || zip.length > MAX_ZIP_BYTES) fail('Invalid ZIP size.');
  const end = zip.length - 22;
  if (zip.readUInt32LE(end) !== 0x06054b50 || zip.readUInt16LE(end + 4) ||
      zip.readUInt16LE(end + 6) || zip.readUInt16LE(end + 20)) fail('Invalid ZIP end record.');
  const count = zip.readUInt16LE(end + 10), size = zip.readUInt32LE(end + 12), start = zip.readUInt32LE(end + 16);
  if (count !== zip.readUInt16LE(end + 8) || count !== allowedNames.length || start + size !== end) fail('Invalid ZIP directory bounds.');
  const entries = new Map();
  let cursor = start, localEnd = 0;
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > end || zip.readUInt32LE(cursor) !== 0x02014b50) fail('Invalid ZIP directory entry.');
    const c = zip.subarray(cursor, cursor + 46), length = c.readUInt16LE(28);
    if (cursor + 46 + length > end || c.readUInt16LE(4) !== 0x0314 || c.readUInt16LE(6) !== 20 ||
        c.readUInt16LE(8) || c.readUInt16LE(10) || c.readUInt16LE(12) || c.readUInt16LE(14) !== 0x21 ||
        c.readUInt16LE(30) || c.readUInt16LE(32) || c.readUInt16LE(34) || c.readUInt16LE(36) ||
        c.readUInt32LE(38) !== (0o100644 * 65536) >>> 0) fail('Unsupported ZIP entry metadata.');
    const name = zip.subarray(cursor + 46, cursor + 46 + length).toString('utf8');
    safeName(name);
    if (name !== [...allowedNames].sort()[index] || entries.has(name)) fail('Unexpected, duplicate or unordered ZIP entry.');
    const offset = c.readUInt32LE(42), bytes = c.readUInt32LE(24);
    if (bytes > MAX_FILE_BYTES || bytes !== c.readUInt32LE(20) || offset !== localEnd || offset + 30 + length + bytes > start) fail('Invalid ZIP entry bounds.');
    const h = zip.subarray(offset, offset + 30);
    if (h.readUInt32LE(0) !== 0x04034b50 || h.readUInt16LE(4) !== 20 || h.readUInt16LE(6) ||
        h.readUInt16LE(8) || h.readUInt16LE(10) || h.readUInt16LE(12) !== 0x21 ||
        h.readUInt32LE(14) !== c.readUInt32LE(16) || h.readUInt32LE(18) !== bytes ||
        h.readUInt32LE(22) !== bytes || h.readUInt16LE(26) !== length || h.readUInt16LE(28) ||
        !zip.subarray(offset + 30, offset + 30 + length).equals(Buffer.from(name))) fail('ZIP local and directory records differ.');
    const data = zip.subarray(offset + 30 + length, offset + 30 + length + bytes);
    if (crc32(data) !== c.readUInt32LE(16)) fail('ZIP CRC mismatch.');
    entries.set(name, data);
    localEnd = offset + 30 + length + bytes;
    cursor += 46 + length;
  }
  if (cursor !== end || localEnd !== start) fail('ZIP contains unexplained bytes.');
  return entries;
}
function packageFiles(options, loaded) {
  const {inputs, html, runtimeVersion} = loaded;
  const metadata = {
    format: 'imagery-field-release-kit', version: 1,
    releaseVersion: options.version, runtimeVersion,
    status: 'Engineering preview preparation; not publication approval',
    repository: 'https://github.com/' + REPOSITORY,
    sourceCommit: options.sourceCommit,
    sourceUrl: 'https://github.com/' + REPOSITORY + '/tree/' + options.sourceCommit,
    artifact: {name: HTML_NAME, bytes: html.length, sha256: sha256(html)},
    testEvidence: {
      suppliedActionsRunUrl: options.evidenceUrl,
      status: 'Operator-supplied reference; success, exact-commit coverage and environment are not checked by this offline builder',
      requiredBeforePublication: 'Review successful CI and browser evidence for this exact source commit and HTML hash'
    },
    packaging: {format: 'ZIP STORE', timestamp: '1980-01-01T00:00:00Z', entryOrder: 'ASCII ascending', fileMode: '0644'},
    license: {
      spdx: 'MIT', name: 'MIT License', file: 'LICENSE',
      copyright: 'Copyright (c) 2026 woodkill00', sha256: LICENSE_SHA256,
      notice: 'Keep the copyright and permission notices with copies or substantial portions. See LICENSE for the full terms and warranty/liability disclaimers.'
    },
    knownLimits: [
      'Experimental visual editor; no diagnostic, treatment or efficacy claims',
      'Engineering limits are not sensory-safety or medical thresholds',
      'No durable autosave; export and verify saved files before closing',
      'No universal browser or ordinary OS opening-workflow compatibility claim',
      'Physical mobile devices, Safari and full manual accessibility are not fully verified',
      'Timed playback requires explicit action, remains finite and windowed, and does not automatically resume',
      'Snapshot playback ignores nested item animation; reduced-motion preferences restrict timed playback',
      'Checksums detect mismatches, not source authenticity or software safety'
    ]
  };
  const entries = new Map([
    [HTML_NAME, html], ['LICENSE', inputs.get('LICENSE')], ['START-HERE.txt', inputs.get('scripts/release/START-HERE.txt')],
    ['USAGE.txt', inputs.get('scripts/release/USAGE.txt')], ['release-metadata.json', jsonBytes(metadata)],
    ...EXAMPLES.map(name => ['examples/' + name, inputs.get('examples/' + name)])
  ]);
  entries.set('CHECKSUMS.txt', checksums(entries));
  const zip = makeZip(entries);
  const verified = verifyZip(zip);
  for (const [name, bytes] of entries) if (!bytes.equals(verified.get(name))) fail('ZIP verification byte mismatch.');
  const output = new Map([[HTML_NAME, html], [ZIP_NAME, zip], ['LICENSE', inputs.get('LICENSE')],
    ['release-metadata.json', entries.get('release-metadata.json')]]);
  output.set('SHA256SUMS.txt', checksums(output));
  return output;
}
function buildRelease(options) {
  const root = fs.realpathSync(options.root || path.join(__dirname, '..'));
  if (!options.output) fail('Provide an explicit --output directory outside the checkout.');
  const output = path.resolve(options.output);
  // Require a real existing parent and a new leaf: no overwrites or symlink traversal.
  const parent = fs.realpathSync(path.dirname(output));
  const resolved = path.join(parent, path.basename(output));
  if (resolved === root || resolved.startsWith(root + path.sep)) fail('Output must be outside the source checkout.');
  if (fs.existsSync(resolved)) fail('Output already exists; choose a new directory.');
  const loaded = loadInputs(root, options), files = packageFiles(options, loaded);
  // Recheck after validation to catch ordinary concurrent edits before any output.
  loadInputs(root, options);
  fs.mkdirSync(resolved);
  for (const [name, bytes] of files) fs.writeFileSync(path.join(resolved, name), bytes, {flag: 'wx', mode: 0o644});
  verifyRelease(resolved);
  return {output: resolved, htmlSha256: sha256(files.get(HTML_NAME)), zipSha256: sha256(files.get(ZIP_NAME))};
}
function verifyRelease(directory) {
  const root = fs.realpathSync(directory);
  if (JSON.stringify(fs.readdirSync(root).sort()) !== JSON.stringify(OUTPUT_NAMES)) fail('Unexpected release output file set.');
  const files = new Map(OUTPUT_NAMES.map(name => [name, readRegular(root, name, name === ZIP_NAME ? MAX_ZIP_BYTES : MAX_FILE_BYTES)]));
  const external = new Map([...files].filter(([name]) => name !== 'SHA256SUMS.txt'));
  if (!files.get('SHA256SUMS.txt').equals(checksums(external))) fail('External checksums mismatch.');
  const entries = verifyZip(files.get(ZIP_NAME));
  for (const name of [HTML_NAME, 'LICENSE', 'release-metadata.json']) if (!entries.get(name).equals(files.get(name))) fail('Standalone and ZIP bytes differ: ' + name);
  if (!entries.get('CHECKSUMS.txt').equals(checksums(new Map([...entries].filter(([name]) => name !== 'CHECKSUMS.txt'))))) fail('Internal checksums mismatch.');
  const metadata = JSON.parse(files.get('release-metadata.json'));
  validateOptions({version: metadata.releaseVersion, sourceCommit: metadata.sourceCommit,
    testedHtmlSha256: metadata.artifact.sha256, evidenceUrl: metadata.testEvidence.suppliedActionsRunUrl});
  if (metadata.format !== 'imagery-field-release-kit' || metadata.version !== 1 ||
      metadata.artifact.name !== HTML_NAME || metadata.artifact.bytes !== files.get(HTML_NAME).length ||
      metadata.artifact.sha256 !== sha256(files.get(HTML_NAME)) ||
      metadata.license.spdx !== 'MIT' || metadata.license.file !== 'LICENSE' ||
      metadata.license.copyright !== 'Copyright (c) 2026 woodkill00' ||
      metadata.license.sha256 !== LICENSE_SHA256 || sha256(files.get('LICENSE')) !== LICENSE_SHA256) fail('Release metadata or approved license mismatch.');
  return {files: [...files.keys()], entries: [...entries.keys()], htmlSha256: sha256(files.get(HTML_NAME)), zipSha256: sha256(files.get(ZIP_NAME))};
}
module.exports = Object.freeze({REPOSITORY, HTML_NAME, ZIP_NAME, LICENSE_SHA256, EXAMPLES, INPUTS, PACKAGE_NAMES, OUTPUT_NAMES,
  sha256, crc32, checksums, makeZip, verifyZip, validateOptions, validateExamples, loadInputs, packageFiles, buildRelease, verifyRelease});
