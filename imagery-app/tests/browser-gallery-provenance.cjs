'use strict';
// Native trusted controls, real Canvas pixels and real browser SubtleCrypto.
// All scenes and reflections are synthetic. Short waits are test scheduling,
// not viewing guidance, an exposure prescription or a clinical safety claim.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {setTimeout: sleep} = require('node:timers/promises');
const M = require('../src/model.js');
const S = require('../src/sequence-model.js');
const P = require('../src/preset-model.js');
const {scene} = require('./fixtures.cjs');
const {sequence} = require('./sequence-fixtures.cjs');
const sha256 = value => crypto.createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
// Independent CSS HSL conversion, not the production formatter or geometry.
function rgb(h, s, l) {
  const light = l / 100, amplitude = s / 100 * Math.min(light, 1 - light);
  return [0, 8, 4].map(offset => { const k = (offset + h / 30) % 12; return Math.round(255 * (light - amplitude * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); });
}
async function wait(check, label) {
  const end = Date.now() + 15000;
  while (Date.now() < end) { if (await check()) return; await sleep(25); }
  throw Error('Timed out: ' + label);
}
async function runGalleryProvenanceScenarios({page, runCase}) {
  const thumbnailState = () => page.evaluate(() => Array.from(document.querySelectorAll('.gallery-thumbnail'), canvas => {
    const result = {id: canvas.id, hidden: canvas.hidden, width: canvas.width, height: canvas.height};
    if (!canvas.hidden) {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      result.coloredPixels = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i] || pixels[i + 1] || pixels[i + 2]) result.coloredPixels++;
    }
    return result;
  }));
  async function thumbnailsHidden() {
    assert.ok((await thumbnailState()).every(item => item.hidden && item.width === 1 && item.height === 1));
    assert.equal(await page.property('#gallery-toggle-thumbnails', 'textContent'), 'Show static thumbnails');
    await page.hidden();
  }
  async function openJournal(track = true) {
    await page.click('#journal-container summary');
    assert.equal(await page.property('#journal-enable', 'checked'), false);
    await page.click('#journal-enable');
    assert.equal(await page.property('#journal-track-display', 'checked'), false);
    if (track) await page.click('#journal-track-display');
    await page.hidden();
  }
  async function ready() {
    await wait(async () => /ready to attach/.test(await page.property('#journal-tracking-status', 'textContent')), 'completed display SHA-256 accepted');
  }
  async function previewEntry(id = 'entry-1') {
    await page.click('#journal-add');
    await page.click('#journal-include-' + id);
    await page.click('#journal-preview');
    assert.equal(await page.property('#journal-approve', 'checked'), false);
    assert.equal(await page.property('#journal-download', 'disabled'), true);
    const text = await page.property('#journal-preview-text', 'textContent');
    const document = JSON.parse(text);
    assert.equal(document.version, 2);
    assert.equal(document.entries.length, 1);
    return {text, document, reflection: document.entries[0].reflection};
  }
  async function capturePreview(name) {
    await page.focus('#journal-preview-text');
    await page.evaluate(() => {
      const element = document.getElementById('journal-preview-text');
      element.scrollIntoView({block: 'center', behavior: 'instant'}); element.scrollTop = 0; element.scrollLeft = 0;
    });
    await page.visualCapture(name);
  }
  async function brieflyShow() {
    // Respect the ordinary reveal guard, never bypass its clock or retry Show.
    await sleep(M.REVEAL_GAP_MS + 100);
    const beforeShow = await page.evaluate(() => performance.now());
    await page.click('#show-scene');
    const afterShow = await page.evaluate(() => performance.now());
    await page.visible();
    await sleep(120);
    const beforeHide = await page.evaluate(() => performance.now());
    await page.click('#hide-scene');
    const afterHide = await page.evaluate(() => performance.now());
    await page.hidden();
    return {beforeShow, afterShow, beforeHide, afterHide};
  }
  function checkMetadata(reflection, value, mode, plannedMs) {
    assert.deepEqual(reflection.scene, {status: 'available', format: value.format, version: value.version,
      sha256: sha256(value), rendererVersion: '0.8.0-dev.provenance1'});
    assert.equal(reflection.exposure.status, 'available');
    assert.equal(reflection.exposure.mode, mode); assert.equal(reflection.exposure.plannedMs, plannedMs);
    assert.equal(reflection.exposure.endedReason, 'user-stop'); assert.equal(reflection.exposure.interrupted, true);
    assert.ok(Number.isSafeInteger(reflection.exposure.visibleMs) && reflection.exposure.visibleMs >= 0);
    for (const key of ['canonical', 'identity', 'objects', 'steps', 'background', 'image', 'timestamp', 'deviceId', 'events']) {
      assert.equal(JSON.stringify(reflection).includes('"' + key + '"'), false, 'Unexpected private/raw provenance field: ' + key);
    }
  }

  await runCase('v9 gallery text default and explicit static thumbnails use native pixels and Escape revocation', async () => {
    assert.equal((await thumbnailState()).length, 0);
    assert.equal(await page.property('#gallery-toggle-thumbnails', 'textContent'), 'Show static thumbnails');
    await page.click('#gallery-toggle-thumbnails'); await page.hidden();
    const shown = await thumbnailState(); assert.equal(shown.length, 12);
    assert.ok(shown.every(item => !item.hidden && item.width === 64 && item.height === 48 && item.coloredPixels > 0));
    // Independently chosen fully interior pixels for the authored 4:3 house:
    // wall at (27,30), roof at (32,20), door at (32,30), background at (5,5).
    // A canvas that paints only the nonblack background must fail this oracle.
    const house = await page.evaluate(() => {
      const context = document.getElementById('gallery-thumbnail-simple-house').getContext('2d');
      const sample = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data).slice(0, 3);
      return {wall: sample(27, 30), roof: sample(32, 20), door: sample(32, 30), background: sample(5, 5)};
    });
    const expected = {wall: rgb(40, 22, 46), roof: rgb(208, 18, 44), door: rgb(145, 18, 44), background: rgb(4, 60, 4)};
    for (const key of Object.keys(expected)) {
      house[key].forEach((channel, index) => assert.ok(Math.abs(channel - expected[key][index]) <= 2, JSON.stringify({key, actual: house[key], expected: expected[key]})));
      if (key !== 'background') assert.notDeepEqual(house[key], house.background, key + ' must differ from the actual background');
    }
    await page.evaluate(() => document.getElementById('gallery-panel').scrollIntoView({block: 'start', behavior: 'instant'}));
    await page.visualCapture('v9-original-gallery-full-controls');
    await page.evaluate(() => document.getElementById('gallery-entry-balanced-contours').scrollIntoView({block: 'center', behavior: 'instant'}));
    await page.visualCapture('v9-original-gallery-static-thumbnails');
    await page.key('Escape'); await thumbnailsHidden();
    await page.key('Tab'); await thumbnailsHidden();
    assert.equal(await page.evaluate(() => window.__testRAFRequests || 0), 0, 'Static gallery actions must not schedule display animation');
  });

  await runCase('v9 gallery native filters and Use draft remain hidden and separate from Apply', async () => {
    const undoBefore = await page.property('#undo', 'disabled');
    await page.click('#gallery-toggle-thumbnails');
    await page.nativeSelect('#gallery-filter-colors', '1'); await thumbnailsHidden();
    await page.nativeSelect('#gallery-filter-symmetry', 'vertical'); await thumbnailsHidden();
    const matches = await page.evaluate(() => Array.from(document.querySelectorAll('#gallery-list > li')).filter(row => !row.hidden).map(row => row.id));
    assert.deepEqual(matches, ['gallery-entry-symmetric-pair']);
    await page.click('#gallery-toggle-thumbnails');
    assert.deepEqual((await thumbnailState()).filter(item => !item.hidden).map(item => item.id), ['gallery-thumbnail-symmetric-pair']);
    await page.click('#gallery-use-symmetric-pair'); await thumbnailsHidden();
    assert.equal(await page.property('#scene-name', 'value'), 'Symmetric pair');
    assert.equal(await page.property('#draft-label', 'textContent'), 'Changes staged');
    assert.equal(await page.property('#undo', 'disabled'), undoBefore, 'Use draft must not alter accepted history');
    await page.click('#apply-changes'); await page.hidden();
    const exported = await page.download('#export-scene', 'imagery-field-scene-v4.json');
    assert.deepEqual(exported.json, P.create('symmetric-pair'));
    assert.doesNotMatch(exported.bytes.toString('utf8'), /"(?:presetId|revision|provenance)"/);
    await page.click('#gallery-reset-filters'); await thumbnailsHidden();
    assert.equal(await page.evaluate(() => Array.from(document.querySelectorAll('#gallery-list > li')).filter(row => !row.hidden).length), 12);
    assert.equal(await page.evaluate(() => window.__testRAFRequests || 0), 0, 'Filter, Use draft and Apply must not start timed playback');
  });

  await runCase('v9 gallery narrow filters thumbnail and complete Use label remain reachable', async () => {
    async function targetMetrics(id, scrollIntoView = true) {
      return page.evaluate((id, scrollIntoView) => {
        const element = document.getElementById(id);
        if (scrollIntoView) element.scrollIntoView({block: 'center', behavior: 'instant'});
        const box = element.getBoundingClientRect(), scroll = document.getElementById('editor-scroll'), aperture = scroll.getBoundingClientRect();
        const rect = r => ({left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height});
        const points = [[box.left + 4, box.top + 4], [box.right - 4, box.top + 4],
          [box.left + 4, box.bottom - 4], [box.right - 4, box.bottom - 4], [box.left + box.width / 2, box.top + box.height / 2]];
        const range = document.createRange(); range.selectNodeContents(element);
        return {id, box: rect(box), text: element.tagName === 'BUTTON' ? Array.from(range.getClientRects(), rect) : [],
          visible: {left: Math.max(0, aperture.left + scroll.clientLeft), right: Math.min(innerWidth, aperture.left + scroll.clientLeft + scroll.clientWidth),
            top: Math.max(0, aperture.top + scroll.clientTop), bottom: Math.min(innerHeight, aperture.top + scroll.clientTop + scroll.clientHeight)},
          hit: points.every(([x, y]) => {const hit = document.elementFromPoint(x, y); return hit === element || element.contains(hit);})};
      }, id, scrollIntoView);
    }
    function assertWholeTarget(metrics, thumbnail = false) {
      const {box, visible} = metrics;
      assert.ok(metrics.hit && box.left >= visible.left && box.right <= visible.right && box.top >= visible.top && box.bottom <= visible.bottom,
        'Gallery target clips behind inspector chrome: ' + JSON.stringify(metrics));
      if (thumbnail) {assert.equal(box.width, 64); assert.equal(box.height, 48);}
      else assert.ok(box.width >= 44 && box.height >= 44, JSON.stringify(metrics));
      for (const text of metrics.text) assert.ok(text.left >= box.left && text.right <= box.right && text.top >= box.top && text.bottom <= box.bottom,
        'Gallery action label clips: ' + JSON.stringify(metrics));
    }
    await page.viewport(320, 568); await page.hidden(); await page.noOverflow(320);
    for (const id of ['gallery-filter-items', 'gallery-filter-colors', 'gallery-filter-symmetry', 'gallery-filter-overlap', 'gallery-filter-timing', 'gallery-toggle-thumbnails', 'gallery-reset-filters']) {
      await page.focus('#' + id);
      assertWholeTarget(await targetMetrics(id));
    }
    await page.nativeSelect('#gallery-filter-colors', '1');
    await page.nativeSelect('#gallery-filter-symmetry', 'vertical');
    await page.click('#gallery-toggle-thumbnails');
    await page.focus('#gallery-use-symmetric-pair');
    assertWholeTarget(await targetMetrics('gallery-use-symmetric-pair'));
    assertWholeTarget(await targetMetrics('gallery-thumbnail-symmetric-pair'), true);
    await page.noOverflow(320);
    // The short viewport establishes individual reachability. It cannot show
    // this entire row at once without clipping under pinned inspector actions.
    // Keep the stronger whole-group capture explicitly labeled as 320×760.
    await page.viewport(320, 760); await thumbnailsHidden(); await page.noOverflow(320);
    await page.click('#gallery-toggle-thumbnails'); await page.focus('#gallery-use-symmetric-pair');
    await page.evaluate(() => document.getElementById('gallery-entry-symmetric-pair').scrollIntoView({block: 'center', behavior: 'instant'}));
    assertWholeTarget(await targetMetrics('gallery-entry-symmetric-pair', false));
    assertWholeTarget(await targetMetrics('gallery-use-symmetric-pair', false));
    assertWholeTarget(await targetMetrics('gallery-thumbnail-symmetric-pair', false), true);
    await page.noOverflow(320); await page.visualCapture('v9-narrow-gallery-320x760-whole-thumbnail-and-use');
    await page.click('#hide-scene'); await thumbnailsHidden();
  });

  await runCase('v9 optional provenance hashes actual scene and real foreground interval with exact local export', async () => {
    const value = M.canonicalScene(scene({name: 'Synthetic provenance reference'}));
    await page.file('synthetic-provenance-scene.json', value); await openJournal();
    const times = await brieflyShow(); await ready();
    const preview = await previewEntry(); checkMetadata(preview.reflection, value, 'static', null);
    // Independent brackets around trusted Show/Hide input bound the real duration;
    // this does not assert browser scheduling is exact or measure attention.
    assert.ok(preview.reflection.exposure.visibleMs >= Math.floor(times.beforeHide - times.afterShow) - 1, JSON.stringify({times, exposure: preview.reflection.exposure}));
    assert.ok(preview.reflection.exposure.visibleMs <= Math.ceil(times.afterHide - times.beforeShow) + 1, JSON.stringify({times, exposure: preview.reflection.exposure}));
    await capturePreview('v9-provenance-exact-scene-json-preview');
    await page.click('#journal-approve');
    const downloaded = await page.download('#journal-download', 'imagery-field-journal-v2.json');
    assert.equal(downloaded.bytes.toString('utf8'), preview.text);
    assert.deepEqual(downloaded.json, preview.document);
    assert.equal(await page.property('#journal-download', 'disabled'), true);
    await page.click('#journal-clear'); assert.equal(await page.property('#journal-entries', 'textContent'), '');
    assert.equal(await page.property('#journal-preview-text', 'textContent'), '');
    assert.match(await page.property('#journal-tracking-status', 'textContent'), /idle/);
  });

  await runCase('v9 provenance Clear before reflection and opt-out prevent stale attachment', async () => {
    await openJournal(); await brieflyShow(); await ready();
    assert.equal(await page.property('#journal-clear', 'disabled'), false, 'Provenance alone must be clearable');
    await page.click('#journal-clear');
    assert.match(await page.property('#journal-tracking-status', 'textContent'), /idle/);
    const cleared = await previewEntry();
    assert.deepEqual(cleared.reflection.scene, {status: 'unavailable'}); assert.deepEqual(cleared.reflection.exposure, {status: 'unavailable'});
    await page.click('#journal-clear');
    await page.click('#journal-track-display'); assert.equal(await page.property('#journal-track-display', 'checked'), false);
    await brieflyShow();
    const declined = await previewEntry('entry-2');
    assert.deepEqual(declined.reflection.scene, {status: 'unavailable'}); assert.deepEqual(declined.reflection.exposure, {status: 'unavailable'});
    assert.match(await page.property('#journal-tracking-status', 'textContent'), /off/);
    await capturePreview('v9-provenance-opt-out-unavailable-json');
  });

  await runCase('v9 whole-sequence SHA identity and paused visible time remain distinct from timeline progress', async () => {
    await page.motionPreference('no-preference');
    const value = S.canonicalSequence(sequence());
    await page.file('synthetic-provenance-sequence.json', value, true, '#sequence-import');
    await openJournal(); await sleep(M.REVEAL_GAP_MS + 100);
    const beforeShow = await page.evaluate(() => performance.now());
    await page.click('#sequence-play'); const afterShow = await page.evaluate(() => performance.now());
    await page.visible(); await sleep(60); await page.click('#sequence-pause'); await page.visible();
    const paused = await page.property('#sequence-progress', 'textContent'); assert.match(paused, /Paused/);
    await sleep(60); const beforeHide = await page.evaluate(() => performance.now());
    await page.click('#sequence-stop'); const afterHide = await page.evaluate(() => performance.now());
    await page.hidden(); await ready();
    const preview = await previewEntry(); checkMetadata(preview.reflection, value, 'sequence', S.compileTimeline(value).durationMs);
    assert.ok(preview.reflection.exposure.visibleMs >= Math.floor(beforeHide - afterShow) - 1, JSON.stringify(preview.reflection.exposure));
    assert.ok(preview.reflection.exposure.visibleMs <= Math.ceil(afterHide - beforeShow) + 1, JSON.stringify(preview.reflection.exposure));
    const changed = JSON.parse(JSON.stringify(value)); changed.sequence.steps[1].name = 'Changed undisplayed later snapshot';
    assert.notEqual(preview.reflection.scene.sha256, sha256(changed), 'Whole sequence, including later steps, determines identity');
    await capturePreview('v9-provenance-whole-sequence-json-preview');
    await page.click('#journal-clear'); await page.hidden();
  });
}
module.exports = {runGalleryProvenanceScenarios};
