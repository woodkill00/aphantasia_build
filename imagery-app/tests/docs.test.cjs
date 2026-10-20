'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const docs = require('../../scripts/check-docs.cjs');
const M = require('../src/model.js');
const S = require('../src/sequence-model.js');
const {createHarness} = require('./dom-harness.cjs');
const ROOT = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');

test('DOCS: checker recognizes local links, image targets, reference definitions and duplicate heading anchors', () => {
  const input = '# Keep your work\n## Keep your work\n## Appearance & timing\n## Open `index.html`\n' +
    '[guide](guide.md#keep-your-work) ![image](images/a.jpg)\n' +
    '[sample]: examples/test.json\n```text\n[not a link](missing.txt)\n```\n';
  assert.deepEqual([...docs.anchors(input)], ['keep-your-work', 'keep-your-work-1', 'appearance--timing', 'open-indexhtml']);
  assert.deepEqual(docs.links(input), ['guide.md#keep-your-work', 'images/a.jpg', 'examples/test.json']);
});

test('DOCS: checker rejects missing targets, missing fragments and repository escapes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'imagery-doc-check-'));
  try {
    fs.writeFileSync(path.join(dir, 'README.md'),
      '# Start\n[valid](#start)\n[missing](gone.md)\n[fragment](#nope)\n[escape](../private.md)\n');
    const result = docs.checkDocumentation(dir);
    assert.equal(result.localLinks, 4);
    assert.equal(result.errors.length, 3);
    for (const expression of [/missing local target/, /missing fragment/, /leaves repository/])
      assert.ok(result.errors.some(error => expression.test(error)));
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});

test('DOCS: every repository Markdown local target and fragment resolves', () => {
  const result = docs.checkDocumentation(ROOT);
  assert.ok(result.files >= 15);
  assert.ok(result.localLinks >= 50);
  assert.deepEqual(result.errors, []);
});

test('DOCS: screenshots are reviewed static JPEGs bound to the unchanged runtime', () => {
  const manifest = JSON.parse(read('docs/images/capture-manifest.json'));
  assert.equal(manifest.appVersion, '0.7');
  assert.equal(manifest.runtimeSha256, sha256(fs.readFileSync(path.join(ROOT, 'imagery-app/index.html'))));
  assert.equal(manifest.sourceRun, 'https://github.com/woodkill00/aphantasia_build/actions/runs/39378606917');
  assert.match(manifest.platform, /Linux.*Chrome 155\.0\.8059\.39.*sandbox/);
  assert.match(manifest.limitations, /not.*Windows.*physical phones/i);
  assert.ok(manifest.captures.length >= 3);
  const named = new Set();
  for (const capture of manifest.captures) {
    assert.match(capture.file, /^[a-z0-9-]+\.jpg$/);
    assert.equal(capture.mime, 'image/jpeg');
    assert.equal(named.has(capture.file), false);
    named.add(capture.file);
    const bytes = fs.readFileSync(path.join(ROOT, 'docs/images', capture.file));
    assert.equal(bytes.length, capture.bytes);
    assert.equal(sha256(bytes), capture.sha256);
    assert.equal(bytes.readUInt16BE(0), 0xffd8);
    assert.equal(bytes.readUInt16BE(bytes.length - 2), 0xffd9);
    assert.ok(capture.viewport.width > 0 && capture.viewport.height > 0);
    assert.ok(capture.captureScale > 0 && capture.captureScale <= 1);
  }
  const mediaFiles = fs.readdirSync(path.join(ROOT, 'docs/images')).filter(name => /\.(?:jpe?g|png|gif|webp|mp4|webm)$/i.test(name));
  assert.deepEqual(mediaFiles.sort(), [...named].sort(), 'Only the explicitly reviewed static captures are public.');
});

test('DOCS: current procedure identifies final runtime evidence without rewriting historical gates', () => {
  const procedure = read('imagery-app/tests/BROWSER-TEST-PROCEDURE.md').split('## Historical procedure records')[0];
  assert.match(procedure, /^# Version 0\.7 verification procedure/);
  for (const token of ['457 non-browser', '98 native', '78 synthetic', '39378606917',
    'ten minutes', 'twelve-minute', '455.236', 'Emulation is not physical-device'])
    assert.ok(procedure.includes(token), token);
  assert.doesNotMatch(procedure, /awaits native|final gate.*pending/i);
  assert.match(read('imagery-app/src/shell.html'), /ITEM STUDIO \/ 0\.7/);
});

test('DOCS: no published-release download URL is invented before an approved publication', () => {
  for (const file of docs.markdownFiles(ROOT)) {
    for (const target of docs.links(fs.readFileSync(file, 'utf8'))) {
      assert.doesNotMatch(target, /github\.com\/woodkill00\/aphantasia_build\/releases\/(?:latest\/download|download\/)/,
        `${path.relative(ROOT, file)} advertises a not-yet-published release asset.`);
    }
  }
});

test('DOCS: beginner guidance describes the current source download, version and separate file saves', () => {
  const readme = read('README.md');
  const guide = read('imagery-app/README.md');
  assert.match(readme, /Code\s*→\s*Download ZIP/);
  assert.match(readme, /imagery-app\/index\.html/);
  assert.ok(fs.statSync(path.join(ROOT, 'imagery-app/index.html')).isFile());
  assert.match(guide, /Version 0\.7 engineering preview/);
  assert.doesNotMatch(guide.split('## In this guide')[0], /candidate|await|pending/i);
  for (const text of [readme, guide]) {
    assert.match(text, /no autosave/i);
    assert.match(text, /Apply changes/);
    assert.match(text, /Download scene JSON/);
    assert.match(text, /physical-device|physical-phone/i);
  }
  for (const label of ['Open scene JSON', 'Open sequence JSON', 'Download sequence JSON',
    'Viewing guidance', 'Hide', 'Resume live preview']) assert.ok(guide.includes(label), label);
});

test('DOCS: documented Node entry points exist in the checkout', () => {
  const files = ['README.md', 'CONTRIBUTING.md', 'docs/releases.md', 'examples/README.md'];
  for (const file of files) {
    const text = read(file);
    for (const match of text.matchAll(/\bnode\s+(?:(?:--check|--test)\s+)?([a-zA-Z0-9_./*-]+\.cjs)\b/g)) {
      const commandPath = match[1];
      assert.ok(!commandPath.startsWith('/') && !commandPath.includes('..'), `${file}: unexpected command path ${commandPath}`);
      if (commandPath.includes('*')) {
        const dir = path.dirname(commandPath);
        const basename = path.basename(commandPath);
        const expression = new RegExp(`^${basename.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
        assert.ok(fs.readdirSync(path.join(ROOT, dir)).some(name => expression.test(name)), `${file}: unmatched ${commandPath}`);
      } else {
        assert.ok(fs.statSync(path.join(ROOT, commandPath)).isFile(), `${file}: missing ${commandPath}`);
      }
    }
  }
});

test('DOCS: Actions maintenance is weekly, bounded and does not add automerge or privileged workflows', () => {
  const config = read('.github/dependabot.yml');
  assert.match(config, /^version: 2/m);
  assert.equal((config.match(/package-ecosystem:/g) || []).length, 1);
  assert.match(config, /package-ecosystem: github-actions/);
  assert.match(config, /directory: \//);
  assert.match(config, /interval: weekly/);
  assert.match(config, /open-pull-requests-limit: 2/);
  assert.doesNotMatch(config, /auto.?merge|registries:|token:|password:/i);
  const workflow = read('.github/workflows/check.yml');
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /pull_request_target:|contents: write|--no-sandbox/);
  assert.match(workflow, /node --test imagery-app\/tests\/\*\.test\.cjs/);
});

test('CI: real-checkout packaging follows the complete browser gate without publishing', () => {
  const workflow = read('.github/workflows/check.yml');
  const browser = workflow.indexOf('- name: Real Chrome browser checks with sandbox enabled');
  const packaging = workflow.indexOf('- name: Prepare and verify portable files without publishing');
  assert.ok(browser >= 0 && packaging > browser);
  const smoke = workflow.slice(packaging);
  assert.match(workflow, /timeout-minutes: 12/);
  assert.match(workflow.slice(browser, packaging), /timeout-minutes: 10/);
  assert.match(workflow.slice(browser, packaging), /run: node imagery-app\/tests\/browser-cdp\.cjs/);
  assert.match(smoke, /timeout-minutes: 1/);
  assert.match(smoke, /RELEASE_OUTPUT: \$\{\{ runner\.temp \}\}\/imagery-release-smoke/);
  assert.match(smoke, /git status --porcelain=v1 --untracked-files=all/);
  assert.match(smoke, /source_commit="\$\(git rev-parse HEAD\)"/);
  assert.match(smoke, /--source-commit "\$source_commit"/);
  assert.match(smoke, /--version 0\.7\.0-preview\.1/);
  assert.match(smoke, /--tested-html-sha256 c19be4351ce9fbecfeed5f7ed91578e4659ad299cd83e0e3083ea80e2e00c857/);
  assert.match(smoke, /actions\/runs\/\$\{\{ github\.run_id \}\}/);
  assert.match(smoke, /supplied reference only; this run is still in progress/);
  assert.match(smoke, /node scripts\/build-release\.cjs/);
  assert.match(smoke, /node scripts\/verify-release\.cjs "\$RELEASE_OUTPUT"/);
  assert.doesNotMatch(smoke, /\bif:|continue-on-error:|upload-artifact|gh release|git push|contents: write/);
});

const examples = fs.readdirSync(path.join(ROOT, 'examples')).filter(name => name.endsWith('.json')).sort();
test('EXAMPLES: current scene-v3 and sequence-v2 examples stay distinct from legacy migration fixtures', () => {
  const current = ['static-starter.scene.json', 'outline-shadow.scene.json', 'steady-overlap.scene.json',
    'mixed-timing.scene.json', 'snapshot-sequence.sequence.json'];
  for (const name of current) {
    assert.ok(examples.includes(name));
    const value = JSON.parse(read(`examples/${name}`));
    assert.equal(value.version, value.format === M.FORMAT ? M.VERSION : S.VERSION);
  }
  assert.equal(JSON.parse(read('examples/reference-scene.json')).version, 2);
  assert.equal(JSON.parse(read('examples/reference-sequence.json')).version, 1);
});

for (const name of examples) {
  test(`EXAMPLES: ${name} validates, imports hidden and round-trips through the production UI double`, async () => {
    const raw = read(`examples/${name}`);
    const value = JSON.parse(raw);
    assert.ok(Buffer.byteLength(raw) <= 1024 * 1024);
    const h = createHarness();
    assert.equal(h.visible(), true, 'The valid starter is visible without timed autoplay.');
    assert.equal(h.rafPending.size, 0);
    if (value.format === M.FORMAT) {
      const expected = M.parseScene(raw);
      await h.import(raw);
      assert.equal(h.visible(), false);
      assert.equal(h.rafPending.size, 0);
      assert.deepEqual(await h.exportScene(), expected);
      const exported = JSON.stringify(await h.exportScene());
      await h.import(exported);
      assert.deepEqual(await h.exportScene(), expected);
    } else {
      assert.equal(value.format, S.FORMAT, 'Examples contain only closed scene or sequence schemas.');
      const expected = S.parseSequence(raw);
      h.get('sequence-import').files = [{size: Buffer.byteLength(raw), text: async () => raw}];
      await h.fire('sequence-import', 'change');
      assert.equal(h.visible(), false);
      assert.equal(h.rafPending.size, 0);
      await h.fire('sequence-export', 'click');
      const exported = await h.downloads.at(-1).blob.text();
      assert.deepEqual(JSON.parse(exported), expected);
      assert.deepEqual(S.parseSequence(exported), expected);
    }
    assert.equal(h.visible(), false, 'Export never reveals the field.');
    assert.equal(h.rafPending.size, 0, 'Import/export never starts a timer.');
  });
}

test('ONBOARDING: Hide, edit, Apply, export and reimport preserve the documented boundary', async () => {
  const h = createHarness();
  assert.equal(h.visible(), true);
  await h.fire('hide-scene', 'click');
  await h.input('object-hue-value', 125);
  assert.equal(h.visible(), false);
  assert.equal(await h.exportScene(), null, 'An unapplied draft cannot silently be exported.');
  await h.submit();
  const exported = await h.exportScene();
  assert.equal(exported.scene.objects[0].color.h, 125);
  assert.equal(h.visible(), false);
  await h.import(JSON.stringify(exported));
  assert.deepEqual(await h.exportScene(), exported);
  assert.equal(h.visible(), false);
  h.advance();
  await h.fire('show-scene', 'click');
  assert.equal(h.visible(), true);
  assert.equal(h.rafPending.size, 0);
});


test('DOCS: selected MIT license is preserved with third-party attribution boundaries', () => {
  const license = read('LICENSE');
  assert.match(license, /^MIT License\n\nCopyright \(c\) 2026 woodkill00\n/);
  const K = require('../../scripts/release-kit.cjs');
  assert.equal(sha256(Buffer.from(license)), K.LICENSE_SHA256);
  for (const file of ['README.md', 'CONTRIBUTING.md', 'docs/releases.md']) {
    assert.match(read(file), /MIT License/);
    assert.match(read(file), /third.party/i);
  }
  for (const file of ['scripts/release/START-HERE.txt', 'scripts/release/USAGE.txt'])
    assert.match(read(file), /LICENSE/);
});
