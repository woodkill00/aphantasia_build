'use strict';
// Temporary, owner-authorized, fixed-version publisher. Remove after verified publication.
// No credentials are created/saved, no arbitrary inputs, no overwrite/delete/retry path.
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const F = Object.freeze({
  repo: 'woodkill00/aphantasia_build', tag: 'v0.7.0', version: '0.7.0',
  source: '3561bfbbd652f375531220fd9dcd92f58d5c9366',
  tree: '8d5288ed1d2a8ec2ef8359cce05f0f383860024a',
  run: 39395724138, workflow: 389921369,
  publisher: '.github/workflows/publish-v0.7.0.yml',
  draft: 418228303, draftSlug: 'untagged-3479ddf415496b3cb0d7',
  assetIds: Object.freeze({'Imagery-Field-portable.zip': 658875960, 'Imagery-Field.html': 658875970,
    'LICENSE': 658875986, 'SHA256SUMS.txt': 658876005, 'release-metadata.json': 658876019}),
  title: 'Imagery Field v0.7.0: engineering preview',
  notesSha256: 'b0be60e3c26b70d00a5f1943d065cb32844c2895f12076f22ab56cfe4e62b73d',
  assets: Object.freeze({
    'Imagery-Field-portable.zip': Object.freeze([194576, 'cad912119c60d2eba242385e1ee88f33cc902876a0c54c25ad6fc6b8a3696c3c']),
    'Imagery-Field.html': Object.freeze([167297, 'c19be4351ce9fbecfeed5f7ed91578e4659ad299cd83e0e3083ea80e2e00c857']),
    'LICENSE': Object.freeze([1067, 'e787f2e2f0ecac57514b7d4ad51b6b5f737b042b42ce38ea73dd2ce88b5c6d0c']),
    'SHA256SUMS.txt': Object.freeze([340, '9e468ed5d9443fe8575119fc7fc30d84f72121afc4ad03bba74141dac88ea7aa']),
    'release-metadata.json': Object.freeze([2217, 'bf876b943695f3b4c7793c9b999a7fc6054c3d80247c6e868291f8d648eca1a7'])
  })
});
const base = 'https://api.github.com/repos/' + F.repo;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(message); };
const positiveId = id => { if (!Number.isSafeInteger(id) || id <= 0) fail('Invalid GitHub identifier.'); return id; };
function assertJob(env) {
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_REPOSITORY !== F.repo ||
      env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_EVENT_NAME !== 'push' ||
      env.GITHUB_WORKFLOW_REF !== F.repo + '/' + F.publisher + '@refs/heads/main' ||
      !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA || '')) fail('Not the fixed protected-main publisher context.');
}
function childEnv(env) {
  // Whitelist, rather than guessing names of credential-bearing variables.
  return {PATH: env.PATH, HOME: env.RUNNER_TEMP, TMPDIR: env.RUNNER_TEMP,
    LANG: 'C.UTF-8', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_TERMINAL_PROMPT: '0'};
}
function assertWorkflowDiff(text) {
  // The target is older than the new publisher: only its deletion is allowed.
  // No existing workflow may be added/modified in the target versus default.
  // Never request Workflows:write or change the frozen release source.
  if (text.trim() !== 'D\t' + F.publisher) fail('Unexpected source-versus-default workflow change.');
}
function assertRun(run, head, tree) {
  if (!run || run.head_sha !== head || run.head_commit?.id !== head || run.head_commit?.tree_id !== tree ||
      run.workflow_id !== F.workflow || run.path !== '.github/workflows/check.yml' ||
      run.event !== 'push' || run.head_branch !== 'main' || run.status !== 'completed' ||
      run.conclusion !== 'success') fail('Exact-source ordinary CI is not verified successful.');
}
function assertBytes(name, bytes) {
  const expected = F.assets[name];
  if (!expected || !Buffer.isBuffer(bytes) || bytes.length !== expected[0] || sha256(bytes) !== expected[1]) {
    fail('Fixed asset bytes differ: ' + name);
  }
}
function readFiles(directory) {
  if (JSON.stringify(fs.readdirSync(directory).sort()) !== JSON.stringify(Object.keys(F.assets).sort())) fail('Unexpected package file set.');
  return new Map(Object.keys(F.assets).map(name => {
    const file = path.join(directory, name), stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) fail('Nonregular package file.');
    const bytes = fs.readFileSync(file); assertBytes(name, bytes); return [name, bytes];
  }));
}
function assertTag(ref) {
  if (ref?.ref !== 'refs/tags/' + F.tag || ref.object?.type !== 'commit' || ref.object?.sha !== F.source) fail('Fixed lightweight tag does not resolve to the tested source.');
}
function assertRelease(release, notes, draft) {
  if (release?.id !== F.draft) fail('Not the reconciled prepared draft.');
  if (release.tag_name !== F.tag || release.target_commitish !== F.source || release.name !== F.title ||
      release.body !== notes || release.draft !== draft || release.prerelease !== true) fail('Release identity or preview state differs.');
}
function assertAssets(assets, draft = false) {
  if (!Array.isArray(assets) || assets.length !== Object.keys(F.assets).length ||
      new Set(assets.map(asset => asset.name)).size !== assets.length) fail('Unexpected uploaded asset set.');
  for (const asset of assets) {
    const expected = F.assets[asset.name]; positiveId(asset.id);
    if (!expected || asset.id !== F.assetIds[asset.name] || asset.state !== 'uploaded' || asset.size !== expected[0] ||
        asset.digest !== 'sha256:' + expected[1]) fail('Uploaded asset metadata differs.');
    if (asset.browser_download_url !== 'https://github.com/' + F.repo + '/releases/download/' + (draft ? F.draftSlug : F.tag) + '/' + asset.name) fail('Unexpected public asset URL.');
  }
}
function permittedRequest(url, auth) {
  const u = new URL(url);
  if (u.protocol !== 'https:' || u.username || u.password || u.port) fail('Unexpected request origin.');
  const api = u.hostname === 'api.github.com' && u.pathname.startsWith('/repos/' + F.repo + '/');
  const publicDownload = u.hostname === 'github.com' && u.pathname.startsWith('/' + F.repo + '/releases/download/' + F.tag + '/');
  const binaryRedirect = ['release-assets.githubusercontent.com', 'objects.githubusercontent.com'].includes(u.hostname);
  if (auth ? !api : !api && !publicDownload && !binaryRedirect) fail('Request outside fixed GitHub services.');
  return u;
}
function request(url, {token, method = 'GET', body, accept = 'application/vnd.github+json', contentType = 'application/json', limit = 2 * 1024 * 1024, redirects = 0} = {}) {
  const u = permittedRequest(url, Boolean(token));
  return new Promise((resolve, reject) => {
    const headers = {'User-Agent': 'imagery-field-fixed-v0.7.0-publisher', Accept: accept, 'X-GitHub-Api-Version': '2022-11-28'};
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body) { headers['Content-Type'] = contentType; headers['Content-Length'] = body.length; }
    const req = https.request(u, {method, headers}, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        res.resume();
        if (method !== 'GET' || !res.headers.location || redirects >= 3) { reject(new Error('Unexpected redirect; no mutation retry.')); return; }
        // Credential is deliberately dropped, including for signed binary URLs.
        const target = new URL(res.headers.location, u).href;
        try { permittedRequest(target, false); } catch (error) { reject(error); return; }
        request(target, {accept, limit, redirects: redirects + 1}).then(resolve, reject); return;
      }
      const chunks = []; let size = 0;
      res.on('data', chunk => { size += chunk.length; if (size > limit) { req.destroy(new Error('Response exceeds fixed bound.')); } else chunks.push(chunk); });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) { const error = new Error('GitHub HTTP ' + res.statusCode + '; stop and reconcile, without permission escalation or mutation retry.'); error.status = res.statusCode; reject(error); }
        else resolve(Buffer.concat(chunks));
      });
      res.on('error', () => reject(new Error('Response failed; reconcile state before retrying.')));
    });
    req.setTimeout(30000, () => req.destroy(new Error('Request timeout; reconcile state before retrying.')));
    req.on('error', () => reject(new Error('Request failed; reconcile state before retrying.')));
    if (body) req.write(body); req.end();
  });
}
function makeApi(token) {
  return async (method, suffix, input) => {
    if (!suffix.startsWith('/') || suffix.includes('..')) fail('Unexpected API path.');
    if (method !== 'GET' && (method !== 'PATCH' || suffix !== '/releases/' + F.draft ||
        JSON.stringify(input) !== JSON.stringify({draft: false, prerelease: true, make_latest: 'false'}))) {
      fail('Recovery permits only the fixed publish PATCH, never create/upload/retag/delete.');
    }
    const bytes = await request(base + suffix, {token, method, body: input === undefined ? undefined : Buffer.from(JSON.stringify(input))});
    return JSON.parse(bytes.toString('utf8'));
  };
}
async function listAll(api, suffix) {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const items = await api('GET', suffix + '?per_page=100&page=' + page);
    if (!Array.isArray(items)) fail('Invalid paginated GitHub collection.');
    all.push(...items);
    if (items.length < 100) return all;
  }
  fail('Collection exceeds reviewed pagination bound; no mutation.');
}
async function publish(files, notes, io) {
  // No external mutation before every package byte and note has been checked.
  if (files.size !== Object.keys(F.assets).length) fail('Unexpected package file count.');
  for (const [name, bytes] of files) assertBytes(name, bytes);
  if (sha256(Buffer.from(notes)) !== F.notesSha256) fail('Unexpected release notes.');
  // Reconciled failure: the tag and five uploaded assets already exist. Never
  // recreate, retag, upload, replace or delete them. Only this exact draft may proceed.
  const matching = (await listAll(io.api, '/releases')).filter(release => release.tag_name === F.tag);
  if (matching.length !== 1 || matching[0].id !== F.draft || matching[0].draft !== true) fail('Prepared draft is not uniquely pending; stop without mutation.');
  assertTag(await io.api('GET', '/git/ref/tags/' + F.tag));
  let actual = await io.api('GET', '/releases/' + F.draft); assertRelease(actual, notes, true);
  actual.assets = await listAll(io.api, '/releases/' + F.draft + '/assets'); assertAssets(actual.assets, true);
  const downloaded = new Map();
  for (const asset of actual.assets) {
    const bytes = await io.download(asset); assertBytes(asset.name, bytes);
    if (!bytes.equals(files.get(asset.name))) fail('Uploaded/downloaded bytes differ.');
    downloaded.set(asset.name, bytes);
  }
  await io.verify(downloaded, 'draft');
  // Re-read identity and every paginated asset after downloads, before mutation.
  actual = await io.api('GET', '/releases/' + F.draft); assertRelease(actual, notes, true);
  assertAssets(await listAll(io.api, '/releases/' + F.draft + '/assets'), true);
  assertTag(await io.api('GET', '/git/ref/tags/' + F.tag));
  await io.checkDefault();
  // This is the only public-publication call, reached after complete draft verification.
  actual = await io.api('PATCH', '/releases/' + F.draft, {draft: false, prerelease: true, make_latest: 'false'});
  assertRelease(actual, notes, false); assertAssets(actual.assets);
  return actual;
}
async function main() {
  if (process.argv.length !== 2) fail('This publisher accepts no arguments.');
  assertJob(process.env);
  const token = process.env.RELEASE_TOKEN; delete process.env.RELEASE_TOKEN;
  if (!token) fail('Missing job-only release token.');
  const root = path.resolve(__dirname, '..'), env = childEnv(process.env), api = makeApi(token), publicApi = makeApi();
  const exec = (command, args) => execFileSync(command, args, {cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 2 * 1024 * 1024}).trim();
  const git = args => exec('git', ['-c', 'core.hooksPath=/dev/null', ...args]);
  if (git(['rev-parse', 'HEAD']) !== process.env.GITHUB_SHA || git(['status', '--porcelain=v1', '--untracked-files=all'])) fail('Publisher checkout is not the exact clean workflow commit.');
  assertWorkflowDiff(git(['diff', '--name-status', 'HEAD', F.source, '--', '.github/workflows']));
  const publisherTree = git(['rev-parse', 'HEAD^{tree}']);
  assertRun(await publicApi('GET', '/actions/runs/' + F.run), F.source, F.tree);
  console.log('Frozen source CI verified. Waiting for the publisher main commit ordinary CI.');
  let ready = false;
  for (let attempt = 0; attempt < 24; attempt++) {
    const runs = await publicApi('GET', '/actions/workflows/' + F.workflow + '/runs?event=push&head_sha=' + process.env.GITHUB_SHA + '&per_page=10');
    const run = runs.workflow_runs?.filter(run => run.head_sha === process.env.GITHUB_SHA).sort((a, b) => b.id - a.id)[0];
    if (run?.status === 'completed') { assertRun(run, process.env.GITHUB_SHA, publisherTree); ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  if (!ready) fail('Publisher ordinary CI has not completed successfully; no publication.');
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(process.env.RUNNER_TEMP), 'imagery-v070-'));
  const source = path.join(temporary, 'source');
  git(['worktree', 'add', '--detach', source, F.source]);
  if (git(['-C', source, 'rev-parse', 'HEAD^{tree}']) !== F.tree) fail('Frozen source tree differs.');
  const directories = [path.join(temporary, 'first'), path.join(temporary, 'second')];
  for (const directory of directories) {
    exec(process.execPath, [path.join(source, 'scripts/build-release.cjs'), '--version', F.version, '--source-commit', F.source,
      '--tested-html-sha256', F.assets['Imagery-Field.html'][1], '--evidence-url', 'https://github.com/' + F.repo + '/actions/runs/' + F.run, '--output', directory]);
    exec(process.execPath, [path.join(source, 'scripts/verify-release.cjs'), directory]);
  }
  const files = readFiles(directories[0]), second = readFiles(directories[1]);
  for (const [name, bytes] of files) if (!bytes.equals(second.get(name))) fail('Reproducibility mismatch.');
  const notes = fs.readFileSync(path.join(__dirname, 'release-v0.7.0-notes.txt'), 'utf8');
  const checkDefault = async () => {
    const main = await publicApi('GET', '/git/ref/heads/main');
    if (main.object?.sha !== process.env.GITHUB_SHA) fail('Default branch changed; stop for review.');
  };
  await checkDefault();
  console.log('Exact five local assets verified. Resuming only reconciled draft418228303; no create/upload/retag.');
  const verify = async (downloaded, stage) => {
    const directory = path.join(temporary, stage); fs.mkdirSync(directory);
    for (const [name, bytes] of downloaded) fs.writeFileSync(path.join(directory, name), bytes, {flag: 'wx', mode: 0o600});
    exec(process.execPath, [path.join(source, 'scripts/verify-release.cjs'), directory]);
  };
  const release = await publish(files, notes, {api, checkDefault, verify,
    download: asset => request(base + '/releases/assets/' + positiveId(asset.id), {token, accept: 'application/octet-stream', limit: F.assets[asset.name][0]})
  });
  console.log('Prerelease published after draft byte verification. Checking unauthenticated public downloads.');
  const publicRelease = await publicApi('GET', '/releases/' + positiveId(release.id));
  assertRelease(publicRelease, notes, false); assertAssets(publicRelease.assets);
  const publicFiles = new Map();
  for (const asset of publicRelease.assets) {
    const bytes = await request(asset.browser_download_url, {accept: 'application/octet-stream', limit: F.assets[asset.name][0]});
    assertBytes(asset.name, bytes); publicFiles.set(asset.name, bytes);
  }
  await verify(publicFiles, 'public');
  assertTag(await publicApi('GET', '/git/ref/tags/' + F.tag));
  console.log(JSON.stringify({status: 'PASS', release: publicRelease.html_url, source: F.source, prerelease: true,
    publicAssets: Object.entries(F.assets).map(([name, [bytes, hash]]) => ({name, bytes, sha256: hash})),
    reminder: 'Remove the temporary workflow and publisher through a tested protected-main PR.'}));
}
if (require.main === module) main().catch(error => { console.error('STOP: ' + error.message); console.error('Do not rerun blindly, replace assets, widen permissions or change the tested source. Reconcile tag/draft/public state first.'); process.exitCode = 1; });
module.exports = Object.freeze({F, sha256, assertJob, childEnv, assertWorkflowDiff, assertRun, assertBytes, readFiles,
  assertTag, assertRelease, assertAssets, permittedRequest, makeApi, listAll, publish});
