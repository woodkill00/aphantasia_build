'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const P = require('../../scripts/publish-v0.7.0.cjs');
const K = require('../../scripts/release-kit.cjs');
const root = path.resolve(__dirname, '../..');
const notes = fs.readFileSync(path.join(root, 'scripts/release-v0.7.0-notes.txt'), 'utf8');
const inputs = new Map(K.INPUTS.map(name => [name, fs.readFileSync(path.join(root, name))]));
// Unit-only construction from already fixed bytes. The real publisher still requires
// an actual clean Git worktree, both CI gates, buildRelease and verifyRelease.
const files = K.packageFiles({version: P.F.version, sourceCommit: P.F.source,
  evidenceUrl: 'https://github.com/' + P.F.repo + '/actions/runs/' + P.F.run},
  {inputs, html: inputs.get('imagery-app/index.html'), runtimeVersion: '0.7.0'});
const validJob = {GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: P.F.repo, GITHUB_REF: 'refs/heads/main',
  GITHUB_EVENT_NAME: 'push', GITHUB_SHA: 'a'.repeat(40),
  GITHUB_WORKFLOW_REF: P.F.repo + '/' + P.F.publisher + '@refs/heads/main'};
const goodRun = {head_sha: P.F.source, head_commit: {id: P.F.source, tree_id: P.F.tree}, workflow_id: P.F.workflow,
  path: '.github/workflows/check.yml', event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success'};
function fixture(options = {}) {
  const calls = [], assets = [];
  const tag = {ref: 'refs/tags/' + P.F.tag, object: {type: 'commit', sha: P.F.source}};
  const release = {id: 7, tag_name: P.F.tag, target_commitish: P.F.source, name: P.F.title,
    body: notes, draft: true, prerelease: true, assets: []};
  let verified = false, downloads = 0;
  const api = async (method, suffix, input) => {
    calls.push([method, suffix, input]);
    if (options.deny === suffix && method !== 'GET') throw new Error('GitHub HTTP 403');
    if (suffix === '/releases?per_page=100&page=1') return options.existingRelease ? [{tag_name: P.F.tag, draft: options.draft}] : [];
    if (suffix.startsWith('/git/matching-refs/')) return options.existingTag ? [tag] : [];
    if (method === 'POST' && suffix === '/git/refs') { assert.deepEqual(input, {ref: tag.ref, sha: P.F.source}); return tag; }
    if (method === 'POST' && suffix === '/releases') {
      assert.equal(input.draft, true); assert.equal(input.prerelease, true); assert.equal(input.make_latest, 'false');
      return {...release, assets: []};
    }
    if (suffix === '/releases/7/assets?per_page=100&page=1') return options.assetMutation ? options.assetMutation(assets) : assets;
    if (method === 'GET' && suffix === '/releases/7') return {...release, assets};
    if (suffix === '/git/ref/tags/' + P.F.tag) return options.movedTag ? {...tag, object: {...tag.object, sha: 'b'.repeat(40)}} : tag;
    if (method === 'PATCH' && suffix === '/releases/7') {
      assert.equal(verified, true); assert.equal(downloads, 5);
      assert.deepEqual(input, {draft: false, prerelease: true, make_latest: 'false'});
      return {...release, draft: false, assets};
    }
    throw new Error('Unexpected fixture API operation: ' + method + ' ' + suffix);
  };
  const io = {api,
    upload: async (id, name, bytes) => {
      calls.push(['UPLOAD', id, name]);
      if (options.uploadDenied) throw new Error('GitHub HTTP 403');
      assets.push({id: 100 + assets.length, name, state: 'uploaded', size: bytes.length, digest: 'sha256:' + P.sha256(bytes),
        browser_download_url: 'https://github.com/' + P.F.repo + '/releases/download/' + P.F.tag + '/' + name});
    },
    download: async asset => { calls.push(['DOWNLOAD', asset.name]); downloads++; return options.badDownload ? Buffer.from('changed') : files.get(asset.name); },
    verify: async result => { calls.push(['VERIFY']); if (options.verifierDenied) throw new Error('Archive verification failed'); assert.deepEqual(result, files); verified = true; },
    checkDefault: async () => { calls.push(['CHECK_DEFAULT']); if (options.defaultMoved) throw new Error('Default branch changed'); }
  };
  return {io, calls};
}
const mutations = calls => calls.filter(([method]) => ['POST', 'PATCH', 'UPLOAD'].includes(method));
const published = calls => calls.some(([method]) => method === 'PATCH');

test('temporary publisher freezes exact five assets and final notes without network', () => {
  assert.deepEqual([...files.keys()].sort(), Object.keys(P.F.assets).sort());
  for (const [name, bytes] of files) assert.doesNotThrow(() => P.assertBytes(name, bytes));
  assert.equal(P.sha256(Buffer.from(notes)), P.F.notesSha256);
  assert.equal(P.F.source, '3561bfbbd652f375531220fd9dcd92f58d5c9366');
});
test('temporary publisher refuses every non-main or untrusted execution context', () => {
  P.assertJob(validJob);
  for (const [key, value] of Object.entries({GITHUB_ACTIONS: 'false', GITHUB_REPOSITORY: 'other/repo', GITHUB_REF: 'refs/pull/7/merge',
    GITHUB_EVENT_NAME: 'pull_request', GITHUB_SHA: 'short', GITHUB_WORKFLOW_REF: P.F.repo + '/' + P.F.publisher + '@refs/heads/feature'})) {
    assert.throws(() => P.assertJob({...validJob, [key]: value}), /context/);
  }
});
test('build and verifier children get a minimal credential-free whitelist', () => {
  const environment = P.childEnv({PATH: '/usr/bin', RUNNER_TEMP: '/tmp/synthetic', RELEASE_TOKEN: 'secret', GH_TOKEN: 'secret', GITHUB_TOKEN: 'secret',
    API_KEY: 'secret', SSH_AUTH_SOCK: '/tmp/secret', GIT_CONFIG_COUNT: '1', NODE_OPTIONS: '--require secret', HOME: '/private'});
  assert.deepEqual(Object.keys(environment).sort(), ['PATH', 'HOME', 'TMPDIR', 'LANG', 'GIT_CONFIG_NOSYSTEM', 'GIT_CONFIG_GLOBAL', 'GIT_TERMINAL_PROMPT'].sort());
  assert.equal(environment.HOME, '/tmp/synthetic'); assert.ok(!Object.values(environment).includes('secret'));
});
test('workflow delta allows only deletion of this new publisher from the target', () => {
  P.assertWorkflowDiff('D\t' + P.F.publisher + '\n');
  for (const bad of ['', 'M\t.github/workflows/check.yml', 'A\t.github/workflows/other.yml', 'D\t.github/workflows/other.yml',
    'D\t' + P.F.publisher + '\nM\t.github/workflows/check.yml']) assert.throws(() => P.assertWorkflowDiff(bad));
});
test('exact-source CI requires final success, identities, tree, event and ordinary workflow', () => {
  P.assertRun(goodRun, P.F.source, P.F.tree);
  for (const [key, value] of Object.entries({head_sha: 'a'.repeat(40), head_commit: {id: P.F.source, tree_id: 'b'.repeat(40)},
    workflow_id: 1, path: P.F.publisher, event: 'pull_request', head_branch: 'feature', status: 'in_progress', conclusion: 'failure'})) {
    assert.throws(() => P.assertRun({...goodRun, [key]: value}, P.F.source, P.F.tree));
  }
});
test('request origin checks never send credentials to redirects or arbitrary hosts', () => {
  P.permittedRequest('https://api.github.com/repos/' + P.F.repo + '/releases', true);
  P.permittedRequest('https://uploads.github.com/repos/' + P.F.repo + '/releases/7/assets?name=LICENSE', true);
  P.permittedRequest('https://release-assets.githubusercontent.com/example', false);
  for (const [url, auth] of [['https://evil.example/releases', false], ['http://api.github.com/repos/' + P.F.repo + '/releases', true],
    ['https://api.github.com/repos/other/repo/releases', true], ['https://release-assets.githubusercontent.com/example', true],
    ['https://github.com/' + P.F.repo + '/releases/download/v0.7.0/LICENSE', true], ['https://user:secret@api.github.com/repos/' + P.F.repo + '/releases', true]]) {
    assert.throws(() => P.permittedRequest(url, auth));
  }
});
test('existing draft, published version or tag is refused without any mutation', async () => {
  for (const options of [{existingRelease: true, draft: true}, {existingRelease: true, draft: false}, {existingTag: true}]) {
    const f = fixture(options); await assert.rejects(P.publish(files, notes, f.io), /Existing version/); assert.equal(mutations(f.calls).length, 0);
  }
});
test('all bytes and notes are checked before even a preflight API call', async () => {
  for (const [candidate, text] of [[new Map([...files].slice(1)), notes], [new Map([...files, ['extra.txt', Buffer.from('x')]]), notes],
    [new Map([...files].map(([name, bytes]) => [name, name === 'LICENSE' ? Buffer.from('changed') : bytes])), notes], [files, notes + 'changed']]) {
    const f = fixture(); await assert.rejects(P.publish(candidate, text, f.io)); assert.equal(f.calls.length, 0);
  }
});
test('pagination includes later-page releases and assets and fails closed at its bound', async () => {
  const all = await P.listAll(async (method, suffix) => suffix.endsWith('page=1') ? Array.from({length: 100}, (_, id) => ({id})) : [{tag_name: P.F.tag}], '/releases');
  assert.equal(all.length, 101); assert.throws(() => P.assertAbsent(all, []), /Existing/);
  await assert.rejects(P.listAll(async () => Array(100).fill({}), '/releases'), /pagination bound/);
  await assert.rejects(P.listAll(async () => ({}), '/releases'));
});
test('tag, draft and upload denials stop once without publication or permission changes', async () => {
  for (const options of [{deny: '/git/refs'}, {deny: '/releases'}, {uploadDenied: true}]) {
    const f = fixture(options); await assert.rejects(P.publish(files, notes, f.io), /403/); assert.equal(published(f.calls), false);
    assert.equal(f.calls.filter(([method, suffix]) => method === 'POST' && suffix === (options.deny || '/unused')).length, options.deny ? 1 : 0);
    assert.ok(!f.calls.some(([method]) => ['DELETE', 'PUT'].includes(method)));
  }
});
test('missing, duplicate, extra, altered and wrong-origin assets prevent publication', async () => {
  const changes = [assets => assets.slice(1), assets => [...assets, assets[0]], assets => [...assets, {...assets[0], name: 'extra.txt', id: 999}],
    assets => assets.map((a, i) => i ? a : {...a, digest: 'sha256:' + '0'.repeat(64)}),
    assets => assets.map((a, i) => i ? a : {...a, browser_download_url: 'https://evil.example/file'})];
  for (const assetMutation of changes) { const f = fixture({assetMutation}); await assert.rejects(P.publish(files, notes, f.io)); assert.equal(published(f.calls), false); }
});
test('download mismatch, archive failure, moved tag or changed default prevent public publication', async () => {
  for (const options of [{badDownload: true}, {verifierDenied: true}, {movedTag: true}, {defaultMoved: true}]) {
    const f = fixture(options); await assert.rejects(P.publish(files, notes, f.io)); assert.equal(published(f.calls), false);
  }
});
test('successful mocked publication verifies all draft bytes and archive before the only publish call', async () => {
  const f = fixture(); const release = await P.publish(files, notes, f.io);
  assert.equal(release.draft, false); assert.equal(release.prerelease, true);
  const methods = f.calls.map(([method]) => method), publishIndex = methods.indexOf('PATCH');
  assert.equal(methods.filter(method => method === 'PATCH').length, 1);
  assert.ok(methods.indexOf('VERIFY') < publishIndex); assert.ok(methods.indexOf('CHECK_DEFAULT') < publishIndex);
  assert.equal(methods.filter(method => method === 'UPLOAD').length, 5); assert.equal(methods.filter(method => method === 'DOWNLOAD').length, 5);
});
test('temporary workflow has one main-path trigger, one job-only write grant and no saved checkout credentials', () => {
  const text = fs.readFileSync(path.join(root, P.F.publisher), 'utf8');
  assert.match(text, /branches: \[main\]/); assert.match(text, /paths: \[\.github\/workflows\/publish-v0\.7\.0\.yml\]/);
  assert.match(text, /permissions: \{\}/); assert.equal((text.match(/contents: write/g) || []).length, 1);
  assert.match(text, /persist-credentials: false/); assert.match(text, /actions\/checkout@11bd71901bbe5b1630ceea73d27597364c9af683/);
  assert.doesNotMatch(text, /pull_request:|workflow_dispatch:|workflow_call:|inputs:|write-all|secrets\./);
  assert.match(text, /RELEASE_TOKEN: \$\{\{ github\.token \}\}/);
  const helper = fs.readFileSync(path.join(root, 'scripts/publish-v0.7.0.cjs'), 'utf8');
  assert.match(helper, /contentType: 'application\/octet-stream'/);
  assert.match(helper, /accept = 'application\/vnd.github\+json', contentType = 'application\/json'/);
});
test('readFiles rejects extra paths and nonregular package inputs', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'imagery-publisher-unit-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  for (const [name, bytes] of files) fs.writeFileSync(path.join(directory, name), bytes);
  assert.deepEqual(P.readFiles(directory), files);
  fs.writeFileSync(path.join(directory, 'extra.txt'), 'x'); assert.throws(() => P.readFiles(directory)); fs.unlinkSync(path.join(directory, 'extra.txt'));
  fs.unlinkSync(path.join(directory, 'LICENSE')); fs.symlinkSync(path.join(directory, 'SHA256SUMS.txt'), path.join(directory, 'LICENSE')); assert.throws(() => P.readFiles(directory));
});
