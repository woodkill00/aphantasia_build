/* Optional private, session-only reflections. Custom exploratory categories:
   not a validated instrument, diagnosis, outcome score, or research service.
   This module has no display, clock, persistence, network or download authority. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ImageryJournal = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMAT = 'imagery-private-journal';
  const VERSION = 1;
  const MAX_ENTRIES = 20;
  const MAX_NOTE_LENGTH = 2000;
  const MAX_EXPORT_BYTES = 131072;
  const MAX_EXPOSURE_MS = 3600000;
  const EXPERIENCES = Object.freeze(['perception', 'afterimage', 'voluntaryImagery', 'nonvisualMemory']);
  const RESPONSE_VALUES = Object.freeze(['not-asked', 'skipped', 'none', 'uncertain', 'present']);
  const COMFORT_VALUES = Object.freeze(['not-asked', 'skipped', 'uncertain', 'comfortable', 'mild-discomfort', 'moderate-discomfort', 'severe-discomfort']);
  const SYMPTOMS = Object.freeze(['eyestrain', 'headache', 'dizzinessNausea', 'distress', 'otherDiscomfort']);
  const SYMPTOM_VALUES = Object.freeze(['not-asked', 'skipped', 'none', 'pre-existing', 'new-or-worse', 'uncertain']);
  const STOP_VALUES = Object.freeze(['not-asked', 'skipped', 'uncertain', 'no', 'yes']);
  const PREFERENCE_VALUES = Object.freeze(['not-asked', 'skipped', 'uncertain', 'disliked', 'neutral', 'liked']);
  const EASE_VALUES = Object.freeze(['not-asked', 'skipped', 'uncertain', 'difficult', 'neither', 'easy']);
  const SUBMISSION = Object.freeze({
    enabled: false,
    status: 'not-available',
    prerequisites: Object.freeze([
      'identified-responsible-operator',
      'applicable-jurisdictions-and-population',
      'competent-ethics-determination',
      'reviewed-protocol-and-statistical-plan',
      'instrument-rights-and-scoring-review',
      'privacy-and-security-review',
      'granular-consent-and-payload-preview',
      'retention-deletion-and-withdrawal-policy',
      'incident-and-adverse-experience-handling',
      'separate-explicit-activation-authorization'
    ])
  });
  function record(value, keys, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
      throw new Error(label + ' must be an ordinary record.');
    }
    const own = Reflect.ownKeys(value);
    if (own.length !== keys.length || own.some(key => typeof key !== 'string' || !keys.includes(key))) {
      throw new Error(label + ' has missing or unsupported fields.');
    }
    const result = Object.create(null);
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new Error(label + ' cannot contain accessors.');
      }
      result[key] = descriptor.value;
    }
    return result;
  }
  function choice(value, allowed, label) {
    if (typeof value !== 'string' || !allowed.includes(value)) throw new Error(label + ' is unsupported.');
    return value;
  }
  function integer(value, min, max, label) {
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(label + ' is out of range.');
    return value === 0 ? 0 : value;
  }
  function flag(value, label) {
    if (typeof value !== 'boolean') throw new Error(label + ' must be true or false.');
    return value;
  }
  function freeze(value) {
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) freeze(value[key]);
      Object.freeze(value);
    }
    return value;
  }
  function states(value, keys, allowed, label) {
    const input = record(value, keys, label), result = {};
    for (const key of keys) result[key] = choice(input[key], allowed, label + ' ' + key);
    return result;
  }
  function sceneReference(value) {
    // Inspect the status descriptor without invoking a getter.
    if (!value || typeof value !== 'object') throw new Error('Scene reference is required.');
    const descriptor = Object.getOwnPropertyDescriptor(value, 'status');
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) throw new Error('Scene reference status is required.');
    if (descriptor.value === 'unavailable') {
      record(value, ['status'], 'Scene reference');
      return {status: 'unavailable'};
    }
    const input = record(value, ['status', 'format', 'version', 'sha256', 'rendererVersion'], 'Scene reference');
    choice(input.status, ['available'], 'Scene reference status');
    choice(input.format, ['imagery-static-scene'], 'Scene reference format');
    integer(input.version, 1, 4, 'Scene reference version');
    if (typeof input.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(input.sha256)) throw new Error('Scene reference requires a lowercase SHA-256 digest.');
    if (typeof input.rendererVersion !== 'string' || !/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(?:-[a-z0-9.-]{1,24})?$/.test(input.rendererVersion)) throw new Error('Renderer version is unsupported.');
    // The caller must compute this from its actual frozen scene. A valid digest
    // string is not proof of equivalent rendering, anonymity or calibrated light.
    return {status: 'available', format: input.format, version: input.version, sha256: input.sha256, rendererVersion: input.rendererVersion};
  }
  function exposureReference(value) {
    if (!value || typeof value !== 'object') throw new Error('Exposure summary is required.');
    const descriptor = Object.getOwnPropertyDescriptor(value, 'status');
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) throw new Error('Exposure status is required.');
    if (descriptor.value === 'unavailable') {
      record(value, ['status'], 'Exposure summary');
      return {status: 'unavailable'};
    }
    const input = record(value, ['status', 'mode', 'plannedMs', 'visibleMs', 'interrupted', 'endedReason'], 'Exposure summary');
    choice(input.status, ['available'], 'Exposure status');
    return {
      status: 'available',
      mode: choice(input.mode, ['static', 'items', 'sequence'], 'Exposure mode'),
      plannedMs: input.plannedMs === null ? null : integer(input.plannedMs, 0, MAX_EXPOSURE_MS, 'Planned duration'),
      visibleMs: integer(input.visibleMs, 0, MAX_EXPOSURE_MS, 'Visible duration'),
      interrupted: flag(input.interrupted, 'Interrupted'),
      endedReason: choice(input.endedReason, ['user-stop', 'completed', 'hidden-tab', 'resize', 'edit', 'technical-failure', 'unknown'], 'End reason')
    };
  }
  function canonicalRecord(value) {
    const input = record(value, ['scene', 'exposure', 'experiences', 'comfort', 'symptoms', 'stoppedEarly', 'preference', 'easeOfUse', 'note'], 'Reflection');
    const comfort = states(input.comfort, ['before', 'after'], COMFORT_VALUES, 'Comfort');
    if (typeof input.note !== 'string' || input.note.length > MAX_NOTE_LENGTH ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(input.note)) {
      throw new Error('Optional note must be at most 2,000 characters without control or direction-override characters.');
    }
    return freeze({
      scene: sceneReference(input.scene),
      exposure: exposureReference(input.exposure),
      experiences: states(input.experiences, EXPERIENCES, RESPONSE_VALUES, 'Experience'),
      comfort,
      symptoms: states(input.symptoms, SYMPTOMS, SYMPTOM_VALUES, 'Symptom'),
      stoppedEarly: choice(input.stoppedEarly, STOP_VALUES, 'Early stop'),
      preference: choice(input.preference, PREFERENCE_VALUES, 'Preference'),
      easeOfUse: choice(input.easeOfUse, EASE_VALUES, 'Ease of use'),
      note: input.note
    });
  }
  function emptyRecord() {
    return canonicalRecord({
      scene: {status: 'unavailable'},
      exposure: {status: 'unavailable'},
      experiences: Object.fromEntries(EXPERIENCES.map(key => [key, 'skipped'])),
      comfort: {before: 'skipped', after: 'skipped'},
      symptoms: Object.fromEntries(SYMPTOMS.map(key => [key, 'skipped'])),
      stoppedEarly: 'skipped',
      preference: 'skipped',
      easeOfUse: 'skipped',
      note: ''
    });
  }
  function denseIds(value) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || !value.length || value.length > MAX_ENTRIES) {
      throw new Error('Select between one and twenty journal entries.');
    }
    const own = Reflect.ownKeys(value);
    if (own.length !== value.length + 1 || own.some(key => key !== 'length' && (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length))) {
      throw new Error('Entry selection must be a dense ordinary array.');
    }
    const result = [], seen = new Set();
    for (let index = 0; index < value.length; index++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) throw new Error('Entry selection cannot contain holes or accessors.');
      const id = descriptor.value;
      if (typeof id !== 'string' || !/^entry-[1-9][0-9]{0,8}$/.test(id) || seen.has(id)) throw new Error('Entry selection has an invalid or repeated identifier.');
      seen.add(id); result.push(id);
    }
    return result;
  }
  function byteLength(text) {
    // Export length bound is independent of whether TextEncoder is available.
    let bytes = 0;
    for (const character of text) {
      const code = character.codePointAt(0);
      bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
    }
    return bytes;
  }
  function createJournal() {
    let entries = [], nextId = 1, revision = 0;
    const previews = new WeakMap();
    function state() { return freeze({revision, entries: entries.slice()}); }
    return Object.freeze({
      getState: state,
      add(value) {
        if (entries.length >= MAX_ENTRIES) throw new Error('This session holds at most twenty reflections. Export or delete entries before adding another.');
        if (nextId > 999999999) throw new Error('Session identifier capacity reached.');
        const reflection = canonicalRecord(value);
        const entry = freeze({id: 'entry-' + nextId, reflection});
        entries.push(entry); nextId++; revision++;
        return entry;
      },
      remove(id) {
        if (typeof id !== 'string' || !entries.some(entry => entry.id === id)) throw new Error('Choose an existing journal entry to delete.');
        entries = entries.filter(entry => entry.id !== id); revision++;
        return state();
      },
      clear() { entries = []; revision++; return state(); },
      previewExport(ids) {
        const selection = denseIds(ids);
        const selected = selection.map(id => {
          const entry = entries.find(item => item.id === id);
          if (!entry) throw new Error('A selected journal entry is no longer available.');
          return entry;
        });
        const document = freeze({format: FORMAT, version: VERSION, purpose: 'private-exploratory-reflection', entries: selected});
        const text = JSON.stringify(document, null, 2) + '\n';
        if (byteLength(text) > MAX_EXPORT_BYTES) throw new Error('Selected reflection export exceeds its resource bound.');
        const preview = freeze({revision, document, text});
        previews.set(preview, revision);
        return preview;
      },
      confirmExport(preview, include) {
        if (include !== true) throw new Error('Explicitly include the selected reflections after reviewing their exact export.');
        if (!preview || typeof preview !== 'object' || !previews.has(preview) || previews.get(preview) !== revision) {
          throw new Error('The journal changed or this preview is invalid. Review a new export.');
        }
        // Consume the preview so an old checkbox cannot silently authorize a
        // second export. The caller handles an explicitly requested download.
        previews.delete(preview);
        return preview.text;
      }
    });
  }
  return Object.freeze({
    FORMAT, VERSION, MAX_ENTRIES, MAX_NOTE_LENGTH, MAX_EXPORT_BYTES, MAX_EXPOSURE_MS,
    EXPERIENCES, RESPONSE_VALUES, COMFORT_VALUES, SYMPTOMS, SYMPTOM_VALUES, STOP_VALUES, PREFERENCE_VALUES, EASE_VALUES,
    SUBMISSION, canonicalRecord, emptyRecord, createJournal
  });
}));
