'use strict';
// Dedicated, dependency-free DOM/event/Blob doubles. These checks are NOT
// native-browser, download, rendered-layout or assistive-technology acceptance.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const J = require('../src/journal-model.js');
const copy = value => JSON.parse(JSON.stringify(value));
const SOURCE = path.resolve(__dirname, '../src/journal-ui.js');
function harness(options = {}) {
  const downloads = [], urls = new Map(), revoked = [], timers = new Map(), created = [], calls = [];
  let serial = 0, timerSerial = 0, editCount = 0;
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.parentNode = null; this.ownerDocument = document;
      this.listeners = new Map(); this.attrs = {}; this.value = ''; this.id = ''; this.className = '';
      this.disabled = false; this.hidden = false; this.checked = false; this._text = '';
      created.push(this);
    }
    set textContent(value) { this._text = String(value); this.replaceChildren(); }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    set innerHTML(_) { throw new Error('HTML insertion is forbidden in this test harness.'); }
    set outerHTML(_) { throw new Error('HTML insertion is forbidden in this test harness.'); }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    getAttribute(name) { return this.attrs[name] ?? null; }
    appendChild(child) {
      if (child.parentNode) child.remove();
      child.parentNode = this; this.children.push(child);
      if (this.tagName === 'SELECT' && this.children.length === 1) this.value = child.value;
      return child;
    }
    replaceChildren(...children) {
      for (const child of this.children) child.parentNode = null;
      this.children = []; for (const child of children) this.appendChild(child);
    }
    remove() {
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter(child => child !== this);
        this.parentNode = null;
      }
    }
    contains(other) { return this === other || this.children.some(child => child.contains(other)); }
    addEventListener(type, fn) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(fn);
    }
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
    focus() { document.activeElement = this; }
    click() {
      if (this.tagName === 'A') {
        if (options.downloadThrows) throw new Error('Synthetic download blocked.');
        downloads.push({filename: this.download, href: this.href, blob: urls.get(this.href)});
      } else fire(this, 'click');
    }
  }
  const document = {activeElement: null, createElement(tag) { return new Element(tag); }};
  document.body = new Element('body');
  const container = new Element('section'); document.body.appendChild(container);
  const sandbox = {
    document, console, Blob: options.noBlob ? undefined : Blob,
    URL: {
      createObjectURL(blob) {
        if (options.objectURLThrows) throw new Error('Synthetic URL denied.');
        const url = 'blob:journal-double-' + (++serial); urls.set(url, blob); return url;
      },
      revokeObjectURL(url) { revoked.push(url); urls.delete(url); }
    },
    setTimeout(fn, delay) { const id = ++timerSerial; timers.set(id, {fn, delay}); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'localStorage', 'sessionStorage', 'indexedDB', 'navigator']) {
    Object.defineProperty(sandbox, name, {get() { calls.push(name); throw new Error('Forbidden capability: ' + name); }});
  }
  sandbox.window = sandbox; vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../src/journal-model.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(SOURCE, 'utf8'), sandbox);
  let api;
  api = sandbox.ImageryJournalUI.mount(container, {onEdit() {
    editCount++; if (options.invalidateOnEdit && api) api.invalidateExport();
  }});
  function walk(element = container) { return [element, ...element.children.flatMap(child => walk(child))]; }
  function get(name) {
    const id = name.startsWith('journal-') ? name : 'journal-' + name;
    const element = walk().find(candidate => candidate.id === id);
    assert.ok(element, 'Missing fixture control ' + id); return element;
  }
  function fire(target, type, props = {}) {
    const element = typeof target === 'string' ? get(target) : target;
    const event = {target: element, preventDefault() {}, ...props};
    for (const handler of Array.from(element.listeners.get(type) || [])) handler(event);
  }
  function check(name, checked = true) { get(name).checked = checked; fire(name, 'change'); }
  function input(name, value) { get(name).value = value; fire(name, get(name).tagName === 'SELECT' ? 'change' : 'input'); }
  function add(note = '') {
    if (!get('enable').checked) check('enable');
    if (note) input('note', note);
    fire('add', 'click');
  }
  function preview(ids = ['entry-1']) {
    for (const id of ids) check('include-' + id);
    fire('preview', 'click'); return get('preview-text').textContent;
  }
  function approve(ids) { const text = preview(ids); check('approve'); return text; }
  return {
    api, sandbox, document, container, downloads, urls, revoked, timers, created, calls, walk, get, fire, check, input, add, preview, approve,
    get editCount() { return editCount; },
    state() { return copy(api.getState()); },
    status() { return get('status').textContent; },
    runTimers() { for (const [id, timer] of Array.from(timers)) { timers.delete(id); timer.fn(); } }
  };
}

test('JOURNAL UI double: mount is optional, unchecked, inert and initially empty', () => {
  const h = harness();
  assert.equal(h.get('enable').checked, false);
  assert.equal(h.get('questions').hidden, true); assert.equal(h.get('questions').disabled, true);
  assert.deepEqual(h.state(), {revision: 0, entries: []});
  for (const name of ['add', 'clear', 'preview', 'approve', 'download']) assert.equal(h.get(name).disabled, true);
  assert.equal(h.editCount, 0); assert.equal(h.downloads.length, 0); assert.equal(h.timers.size, 0);
  assert.match(h.container.textContent, /Closing or refreshing/); assert.match(h.container.textContent, /No autosave or transmission/);
});

test('JOURNAL UI double: enable and editing do not record; every default is skipped', () => {
  const h = harness(); h.check('enable');
  assert.equal(h.get('questions').hidden, false); assert.equal(h.get('questions').disabled, false);
  const selects = h.walk().filter(element => element.tagName === 'SELECT');
  assert.equal(selects.length, 14);
  for (const select of selects) assert.equal(select.value, 'skipped');
  h.input('note', 'Synthetic draft only'); assert.equal(h.state().entries.length, 0);
  h.fire('add', 'click');
  const expected = copy(J.emptyRecord()); expected.note = 'Synthetic draft only';
  assert.deepEqual(h.state().entries[0].reflection, expected);
  assert.equal(h.get('note').value, '');
  assert.equal(h.get('include-entry-1').checked, false);
  assert.equal(h.get('preview').disabled, true);
  assert.equal(h.editCount, 3);
});

test('JOURNAL UI double: all categories are independent and retain explicit missingness', () => {
  const h = harness(); h.check('enable');
  const values = {before:'comfortable',after:'moderate-discomfort',perception:'present',afterimage:'uncertain',
    voluntaryImagery:'none',nonvisualMemory:'not-asked',eyestrain:'pre-existing',headache:'new-or-worse',
    dizzinessNausea:'none',distress:'uncertain',otherDiscomfort:'skipped',stoppedEarly:'yes',preference:'disliked',easeOfUse:'easy'};
  for (const [name, value] of Object.entries(values)) h.input(name, value);
  h.fire('add', 'click');
  const record = h.state().entries[0].reflection;
  assert.deepEqual(record.comfort, {before:'comfortable',after:'moderate-discomfort'});
  assert.deepEqual(record.experiences, {perception:'present',afterimage:'uncertain',voluntaryImagery:'none',nonvisualMemory:'not-asked'});
  assert.deepEqual(record.symptoms, {eyestrain:'pre-existing',headache:'new-or-worse',dizzinessNausea:'none',distress:'uncertain',otherDiscomfort:'skipped'});
  assert.equal(record.stoppedEarly,'yes'); assert.equal(record.preference,'disliked'); assert.equal(record.easeOfUse,'easy');
  assert.deepEqual(record.scene,{status:'unavailable'}); assert.deepEqual(record.exposure,{status:'unavailable'});
  assert.equal('timestamp' in record,false); assert.equal('score' in record,false);
});

test('JOURNAL UI double: available options exactly match closed model choices', () => {
  const h = harness();
  for (const [names, values] of [
    [['before','after'],J.COMFORT_VALUES],[J.EXPERIENCES,J.RESPONSE_VALUES],[J.SYMPTOMS,J.SYMPTOM_VALUES],
    [['stoppedEarly'],J.STOP_VALUES],[['preference'],J.PREFERENCE_VALUES],[['easeOfUse'],J.EASE_VALUES]
  ]) for (const name of names) assert.deepEqual(h.get(name).children.map(child => child.value), values);
  assert.equal(h.get('note').maxLength,2000); assert.equal(h.get('note').autocomplete,'off'); assert.equal(h.get('note').spellcheck,false);
});

test('JOURNAL UI double: every input has a semantic label; buttons cannot submit parent form', () => {
  const h = harness(), nodes = h.walk();
  for (const control of nodes.filter(element => ['INPUT','SELECT','TEXTAREA'].includes(element.tagName))) {
    assert.ok(nodes.some(element => element.tagName === 'LABEL' && element.htmlFor === control.id), 'Missing label for '+control.id);
  }
  for (const button of nodes.filter(element => element.tagName === 'BUTTON')) assert.equal(button.type,'button');
  assert.equal(h.get('status').getAttribute('role'),'status'); assert.equal(h.get('status').getAttribute('aria-live'),'polite');
  assert.equal(h.get('preview-text').tabIndex,0); assert.ok(h.get('preview-text').getAttribute('aria-labelledby'));
});

test('JOURNAL UI double: invalid raw values cannot bypass model and never add partial entries', () => {
  const h = harness(); h.check('enable');
  h.input('afterimage','improved'); h.fire('add','click'); assert.equal(h.state().entries.length,0); assert.match(h.status(),/unsupported/);
  h.input('afterimage','skipped'); h.input('note','a'.repeat(2001)); h.fire('add','click'); assert.equal(h.state().entries.length,0);
  h.input('note','\u202e'); h.fire('add','click'); assert.equal(h.state().entries.length,0);
  h.input('note','Synthetic valid'); h.fire('add','click'); assert.equal(h.state().entries[0].id,'entry-1');
});

test('JOURNAL UI double: all journal fields cancel parent viewing and invalidate approval', () => {
  const names = ['before','after',...J.EXPERIENCES,...J.SYMPTOMS,'stoppedEarly','preference','easeOfUse','note'];
  for (const name of names) {
    const h = harness(); h.add(); h.approve();
    const before = h.editCount; h.input(name, name === 'note' ? 'Edited synthetic note' : 'uncertain');
    assert.equal(h.editCount,before+1,name); assert.equal(h.get('approve').checked,false,name);
    assert.equal(h.get('approve').disabled,true,name); assert.equal(h.get('download').disabled,true,name);
    assert.equal(h.get('preview-text').textContent,'',name); assert.equal(h.get('preview-panel').hidden,true,name);
    h.fire('download','click'); assert.equal(h.downloads.length,0,name);
  }
});

test('JOURNAL UI double: turning off discards only unfinished answers and leaves explicit record tools', () => {
  const h = harness(); h.add('Added synthetic'); h.approve(); h.input('note','Unfinished synthetic'); h.check('enable',false);
  assert.equal(h.get('questions').hidden,true); assert.equal(h.get('note').value,'');
  assert.equal(h.state().entries.length,1); assert.equal(h.get('clear').disabled,false);
  assert.equal(h.get('approve').checked,false);
  h.fire('add','click'); assert.equal(h.state().entries.length,1);
  h.approve(); h.fire('download','click'); assert.equal(h.downloads.length,1);
});

test('JOURNAL UI double: exactly selected reflections appear in preview, in record order', () => {
  const h = harness(); h.add('First synthetic'); h.add('Excluded synthetic'); h.add('Third synthetic');
  const text = h.preview(['entry-3','entry-1']), value = JSON.parse(text);
  assert.deepEqual(value.entries.map(entry => entry.id),['entry-1','entry-3']);
  assert.equal(text,JSON.stringify(value,null,2)+'\n'); assert.equal(text.includes('Excluded synthetic'),false);
  assert.equal(h.get('approve').checked,false); assert.equal(h.get('download').disabled,true);
  assert.equal(h.downloads.length,0); assert.equal(h.urls.size,0);
});

test('JOURNAL UI double: local download requires separate current approval and exactly matches preview bytes', async () => {
  const h = harness(); h.add('Synthetic export');
  const text = h.preview(); h.fire('download','click'); assert.equal(h.downloads.length,0);
  h.preview(); h.check('approve'); h.fire('download','click');
  assert.equal(h.downloads.length,1);
  assert.equal(h.downloads[0].filename,'imagery-field-journal-v1.json');
  assert.equal(h.downloads[0].blob.type,'application/json');
  assert.equal(await h.downloads[0].blob.text(),text);
  assert.match(h.downloads[0].href,/^blob:/);
  assert.equal(h.get('approve').checked,false); assert.equal(h.get('download').disabled,true);
  h.fire('download','click'); assert.equal(h.downloads.length,1);
  assert.equal(h.urls.size,1); assert.equal(h.timers.size,1);
  assert.equal([...h.timers.values()][0].delay,1000);
  h.runTimers(); assert.equal(h.urls.size,0); assert.deepEqual(h.revoked,[h.downloads[0].href]);
  assert.equal(h.walk(h.document.body).filter(node => node.tagName === 'A').length,0);
});

test('JOURNAL UI double: selection changes invalidate rather than silently expanding approved exports', () => {
  for (const include of [true,false]) {
    const h = harness(); h.add('First synthetic'); h.add('Second synthetic'); h.approve();
    h.check(include ? 'include-entry-2' : 'include-entry-1',include);
    assert.equal(h.get('approve').checked,false); assert.equal(h.get('download').disabled,true);
    assert.equal(h.get('preview-text').textContent,''); h.fire('download','click'); assert.equal(h.downloads.length,0);
  }
});

test('JOURNAL UI double: add, delete and clear invalidate export state and keep model revision current', () => {
  for (const operation of ['add','delete-entry-1','clear']) {
    const h = harness(); h.add(); h.add(); h.approve(); const revision = h.state().revision;
    h.fire(operation,'click');
    assert.ok(h.state().revision > revision);
    assert.equal(h.get('approve').checked,false); assert.equal(h.get('preview-text').textContent,'');
    h.fire('download','click'); assert.equal(h.downloads.length,0);
  }
});

test('JOURNAL UI double: removing approval blocks download without altering records', () => {
  const h = harness(); h.add(); h.approve(); const before = h.state();
  h.check('approve',false); assert.equal(h.get('download').disabled,true);
  h.fire('download','click'); assert.equal(h.downloads.length,0); assert.deepEqual(h.state(),before);
});

test('JOURNAL UI double: external invalidation is nonrecursive, keeps records and prevents a stale click', () => {
  const h = harness({invalidateOnEdit:true}); h.add(); h.approve(); const before = h.state(), edits = h.editCount;
  h.api.invalidateExport();
  assert.equal(h.editCount,edits); assert.deepEqual(h.state(),before);
  assert.equal(h.get('approve').checked,false); assert.match(h.status(),/cleared by a change/);
  h.check('approve'); h.fire('download','click'); assert.equal(h.downloads.length,0);
  h.approve(); h.fire('download','click'); assert.equal(h.downloads.length,1);
});

test('JOURNAL UI double: deletion preserves unselected entries, stable IDs and keyboard focus', () => {
  const h = harness(); h.add('One'); h.add('Two'); h.add('Three'); h.check('include-entry-1'); h.check('include-entry-2');
  h.fire('delete-entry-2','click');
  assert.deepEqual(h.state().entries.map(entry => entry.id),['entry-1','entry-3']);
  assert.equal(h.document.activeElement.id,'journal-delete-entry-3');
  assert.equal(h.get('include-entry-1').checked,true);
  assert.deepEqual(JSON.parse(h.preview()).entries.map(entry => entry.id),['entry-1']);
  h.fire('delete-entry-1','click'); h.fire('delete-entry-3','click');
  assert.equal(h.document.activeElement,h.get('enable')); assert.equal(h.get('clear').disabled,true);
  h.add(); assert.equal(h.state().entries[0].id,'entry-4');
});

test('JOURNAL UI double: clear removes records, unfinished answers, selections and exact preview', () => {
  const h = harness(); h.add('Synthetic kept'); h.approve(); h.get('note').value='Synthetic unfinished';
  h.fire('clear','click');
  assert.equal(h.state().entries.length,0); assert.equal(h.get('note').value,''); assert.equal(h.get('entries').children.length,0);
  assert.equal(h.get('preview-text').textContent,''); assert.equal(h.get('approve').checked,false);
  assert.equal(h.get('preview').disabled,true); assert.equal(h.get('download').disabled,true);
  assert.equal(h.document.activeElement,h.get('enable'));
  assert.match(h.status(),/Previously downloaded files are unchanged/);
});

test('JOURNAL UI double: Clear can discard unadded answers without creating an entry', () => {
  const h = harness(); h.check('enable'); h.input('note','Synthetic unfinished only');
  assert.equal(h.state().entries.length,0); assert.equal(h.get('clear').disabled,false);
  h.fire('clear','click'); assert.equal(h.get('note').value,''); assert.equal(h.get('clear').disabled,true);
  assert.equal(h.state().entries.length,0);
  h.input('before','uncertain'); assert.equal(h.get('clear').disabled,false);
  h.fire('clear','click'); assert.equal(h.get('before').value,'skipped');
});

test('JOURNAL UI double: Clear promptly releases any pending export URL and cleanup timer', () => {
  const h = harness(); h.add(); h.approve(); h.fire('download','click');
  assert.equal(h.urls.size,1); assert.equal(h.timers.size,1);
  h.fire('clear','click'); assert.equal(h.urls.size,0); assert.equal(h.timers.size,0); assert.equal(h.revoked.length,1);
  h.runTimers(); assert.equal(h.revoked.length,1);
});

test('JOURNAL UI double: capacity is bounded to 20; deletion restores one slot without reusing IDs', () => {
  const h = harness(); for (let i=0;i<20;i++) h.add('Synthetic '+i);
  assert.equal(h.state().entries.length,20); assert.equal(h.get('add').disabled,true); assert.match(h.status(),/20-reflection/);
  assert.equal(h.document.activeElement,h.get('status'));
  h.fire('add','click'); assert.equal(h.state().entries.length,20);
  h.fire('delete-entry-10','click'); assert.equal(h.get('add').disabled,false);
  h.add(); assert.equal(h.state().entries.length,20); assert.equal(h.state().entries.at(-1).id,'entry-21');
});

test('JOURNAL UI double: oversized selected UTF-8 export fails closed without download or approval', () => {
  const h = harness(); for (let i=0;i<20;i++) h.add('界'.repeat(2000));
  h.preview(h.state().entries.map(entry => entry.id));
  assert.match(h.status(),/resource bound/); assert.equal(h.get('approve').disabled,true); assert.equal(h.get('download').disabled,true);
  assert.equal(h.get('preview-text').textContent,''); assert.equal(h.downloads.length,0);
  assert.equal(h.state().entries.length,20);
});

test('JOURNAL UI double: user markup stays inert literal text in record review and export', () => {
  const h = harness(), note = '<img src="https://example.test/not-requested" onerror="alert(1)"> & <script>not executed</script>';
  h.add(note); const text = h.preview();
  assert.equal(JSON.parse(text).entries[0].reflection.note,note);
  const review = h.walk(h.get('entries')).find(element => element.tagName === 'PRE');
  assert.equal(JSON.parse(review.textContent).note,note);
  assert.equal(h.walk().some(element => ['IMG','SCRIPT','IFRAME'].includes(element.tagName)),false);
  assert.deepEqual(h.calls,[]);
});

test('JOURNAL UI double: absent download capabilities or failed download preserve records and consume UI approval', () => {
  for (const options of [{noBlob:true},{objectURLThrows:true},{downloadThrows:true}]) {
    const h = harness(options); h.add('Synthetic failure'); h.approve(); const before = h.state(); h.fire('download','click');
    assert.equal(h.downloads.length,0); assert.deepEqual(h.state(),before);
    assert.equal(h.get('approve').checked,false); assert.equal(h.get('download').disabled,true);
    assert.match(h.status(),/could not be started/);
    h.runTimers(); assert.equal(h.urls.size,0);
  }
});

test('JOURNAL UI double: detached record listeners are removed on rerender and cannot mutate state', () => {
  const h = harness(); h.add('Old synthetic'); const oldDelete = h.get('delete-entry-1'), oldInclude = h.get('include-entry-1');
  h.add('New synthetic'); const before = h.state(), edits = h.editCount;
  h.fire(oldDelete,'click'); h.fire(oldInclude,'change');
  assert.deepEqual(h.state(),before); assert.equal(h.editCount,edits);
  assert.equal([...oldDelete.listeners.values()].reduce((sum,set)=>sum+set.size,0),0);
});

test('JOURNAL UI double: destroy clears memory, controls, listeners and pending Blob URLs', () => {
  const h = harness(); h.add('Synthetic to clear'); h.approve(); h.fire('download','click');
  const enable = h.get('enable'), edits = h.editCount;
  h.api.destroy(); assert.equal(h.container.children.length,0); assert.equal(h.state().entries.length,0);
  assert.equal(h.urls.size,0); assert.equal(h.timers.size,0); assert.equal(h.revoked.length,1);
  h.fire(enable,'change'); assert.equal(h.editCount,edits);
  h.api.destroy(); assert.equal(h.revoked.length,1);
});

test('JOURNAL UI double: fresh page instance starts empty without any retained draft or selection', () => {
  const a = harness(); a.add('Synthetic private'); a.approve();
  const b = harness(); assert.equal(b.state().entries.length,0); assert.equal(b.get('enable').checked,false);
  assert.equal(b.get('note').value,''); assert.equal(b.get('approve').checked,false); assert.equal(b.get('preview-text').textContent,'');
  assert.deepEqual(a.calls,[]); assert.deepEqual(b.calls,[]);
});

test('JOURNAL UI double: multiple mounted journals have unique label IDs and independent memory', () => {
  const h = harness(); h.add('First mount synthetic');
  const second = h.document.createElement('section'); h.document.body.appendChild(second);
  const api = h.sandbox.ImageryJournalUI.mount(second);
  const ids = h.walk(h.document.body).map(element => element.id).filter(Boolean);
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(api.getState().entries.length,0); assert.equal(h.state().entries.length,1);
  api.destroy(); assert.equal(second.children.length,0); assert.equal(h.state().entries.length,1);
});

test('JOURNAL UI double: research section is disabled with no send route or consent controls', () => {
  const h = harness(), panel = h.get('research');
  assert.equal(panel.disabled,true); assert.match(panel.textContent,/Research submission is not available/);
  assert.match(panel.textContent,/Your local journal is not sent anywhere/);
  assert.match(panel.textContent,/one report, linking reports over time and recontact/);
  assert.equal(h.walk(panel).some(element => ['BUTTON','INPUT','FORM'].includes(element.tagName)),false);
  assert.equal(h.walk().some(element => element.tagName === 'FORM'),false);
});

test('JOURNAL UI source: no persistence, network, markup execution, hidden scene or timestamp authority', () => {
  const source = fs.readFileSync(SOURCE,'utf8');
  for (const forbidden of [
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/,
    /\b(?:localStorage|sessionStorage|indexedDB|cookie)\b/,
    /(?:innerHTML|outerHTML|insertAdjacentHTML|eval\s*\(|new Function)/,
    /(?:requestAnimationFrame|setInterval|Date\.|performance\.|showScene|resumeLive)/
  ]) assert.doesNotMatch(source,forbidden);
  assert.match(source,/\.textContent =/); assert.match(source,/createElement\(/);
  assert.match(source,/revokeObjectURL/); assert.match(source,/application\/json/);
});
