/* Optional, session-only display provenance. The caller acknowledges a successful
   foreground-visible render and supplies monotonic milliseconds; this module has
   no clock, display, storage or network authority. Visible time is not gaze,
   attention, perceived brightness, a light dose, or a medically safe duration. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ImageryProvenance = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_CANONICAL_BYTES = 1048576;
  const MAX_VISIBLE_MS = 3600000;
  const END_REASONS = Object.freeze(['user-stop', 'completed', 'hidden-tab', 'resize', 'edit', 'technical-failure', 'unknown']);
  const FORMAT_VERSIONS = Object.freeze({'imagery-static-scene': 4, 'imagery-field-sequence': 3});
  const UNAVAILABLE = Object.freeze({scene: Object.freeze({status: 'unavailable'}), exposure: Object.freeze({status: 'unavailable'})});
  function record(value, keys, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error(label + ' must be an ordinary record.');
    const own = Reflect.ownKeys(value);
    if (own.length !== keys.length || own.some(key => typeof key !== 'string' || !keys.includes(key))) throw new Error(label + ' has missing or unsupported fields.');
    const result = Object.create(null);
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) throw new Error(label + ' cannot contain accessors.');
      result[key] = descriptor.value;
    }
    return result;
  }
  function byteLengthBounded(text) {
    let bytes = 0;
    for (const character of text) {
      const code = character.codePointAt(0);
      bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
      if (bytes > MAX_CANONICAL_BYTES) return bytes;
    }
    return bytes;
  }
  function descriptor(value) {
    const input = record(value, ['identity', 'canonical', 'format', 'version', 'rendererVersion', 'mode', 'plannedMs'], 'Rendered snapshot');
    if (!Number.isSafeInteger(input.identity) || input.identity < 1) throw new Error('Snapshot identity must be a positive safe integer.');
    if (typeof input.canonical !== 'string' || !input.canonical.length || input.canonical.length > MAX_CANONICAL_BYTES ||
        byteLengthBounded(input.canonical) > MAX_CANONICAL_BYTES) throw new Error('Canonical snapshot exceeds its byte bound.');
    if (typeof input.format !== 'string' || !Object.prototype.hasOwnProperty.call(FORMAT_VERSIONS, input.format) || !Number.isSafeInteger(input.version) ||
        input.version < 1 || input.version > FORMAT_VERSIONS[input.format]) throw new Error('Snapshot format or version is unsupported.');
    if (typeof input.rendererVersion !== 'string' || !/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(?:-[a-z0-9.-]{1,24})?$/.test(input.rendererVersion)) throw new Error('Renderer version is unsupported.');
    if (!['static', 'items', 'sequence'].includes(input.mode) ||
        (input.mode === 'sequence') !== (input.format === 'imagery-field-sequence')) throw new Error('Display mode does not match its document.');
    if (input.plannedMs !== null && (!Number.isSafeInteger(input.plannedMs) || input.plannedMs < 0 || input.plannedMs > MAX_VISIBLE_MS)) throw new Error('Planned duration is out of range.');
    // The scene/sequence validator remains authoritative. Verify the metadata
    // association without pretending this module validates display capabilities.
    let document;
    try { document = JSON.parse(input.canonical); } catch (_) { throw new Error('Canonical snapshot must be JSON.'); }
    if (!document || typeof document !== 'object' || Array.isArray(document) || document.format !== input.format || document.version !== input.version) throw new Error('Canonical document and reference disagree.');
    return input;
  }
  function metadata(input) {
    return {identity: input.identity, format: input.format, version: input.version,
      rendererVersion: input.rendererVersion, mode: input.mode, plannedMs: input.plannedMs};
  }
  function sameMetadata(a, b) {
    return ['identity', 'format', 'version', 'rendererVersion', 'mode', 'plannedMs'].every(key => a[key] === b[key]);
  }
  function createTracker(options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(options)) ||
        Reflect.ownKeys(options).some(key => key !== 'hash' && key !== 'onChange')) throw new Error('Tracker options are unsupported.');
    const hashDescriptor = Object.getOwnPropertyDescriptor(options, 'hash');
    if (hashDescriptor && !Object.prototype.hasOwnProperty.call(hashDescriptor, 'value')) throw new Error('Hash provider cannot be an accessor.');
    const hash = hashDescriptor && hashDescriptor.value;
    if (hash !== undefined && typeof hash !== 'function') throw new Error('Hash provider must be a function.');
    const changeDescriptor = Object.getOwnPropertyDescriptor(options, 'onChange');
    if (changeDescriptor && !Object.prototype.hasOwnProperty.call(changeDescriptor, 'value')) throw new Error('Status callback cannot be an accessor.');
    const onChange = changeDescriptor && changeDescriptor.value;
    if (onChange !== undefined && typeof onChange !== 'function') throw new Error('Status callback must be a function.');
    let enabled = false, active = null, completed = null, lastNow = null, failure = null;
    let inFlight = null, queued = null, latestIdentity = null;
    // A fresh token per interval revokes old promises without retaining any list
    // of intervals. Interval records contain metadata only; queued holds at
    // most one bounded latest source string until it can be sent to hash.
    let token = null;
    function state() {
      let status = 'idle';
      if (!enabled) status = 'disabled';
      else if (failure || (active ? active.hashState === 'failed' : completed && completed.hashState === 'failed')) status = 'unavailable';
      else if (active) status = 'visible';
      else if (completed) status = completed.hashState === 'ready' ? 'ready' : 'pending-digest';
      return Object.freeze(failure ? {enabled, status, reason: failure} : {enabled, status});
    }
    function reset() {
      token = null; active = null; completed = null; lastNow = null; failure = null;
      queued = null; latestIdentity = null;
    }
    function fail(reason) {
      token = null; active = null; completed = null; queued = null; failure = reason;
      return state();
    }
    function clock(now) {
      if (typeof now !== 'number' || !Number.isFinite(now) || now < 0 || now > Number.MAX_SAFE_INTEGER ||
          (lastNow !== null && now < lastNow)) {
        fail('invalid-clock'); return false;
      }
      lastNow = now;
      if (active && now - active.startedAt > MAX_VISIBLE_MS) {
        fail('duration-bound'); return false;
      }
      return true;
    }
    function complete(reason, now) {
      if (!active) return;
      completed = {
        ...active.reference, token: active.token, hashState: active.hashState, sha256: active.sha256,
        visibleMs: Math.floor(now - active.startedAt), interrupted: reason !== 'completed', endedReason: reason
      };
      active = null;
    }
    function acceptDigest(expectedToken, result) {
      // Only the latest interval can receive a result. A completed older segment
      // never gains fresh metadata after a superseding visible render or clear.
      if (!enabled || token !== expectedToken) return;
      const target = active || completed;
      if (!target || target.token !== expectedToken) return;
      if (typeof result !== 'string' || !/^[a-f0-9]{64}$/.test(result)) {
        target.hashState = 'failed'; target.sha256 = null; failure = 'digest-unavailable';
      } else {
        target.hashState = 'ready'; target.sha256 = result;
      }
      return true;
    }
    function finishDigest(job, result) {
      if (inFlight !== job) return;
      inFlight = null;
      if (acceptDigest(job.token, result) && onChange) {
        // Status-only notification after accepting a settled digest, not on
        // frames. A UI callback failure must not change display or data state.
        try { onChange(state()); } catch (_) { /* The host owns its status UI. */ }
      }
      const next = queued;
      queued = null;
      if (next && enabled && next.token === token) beginDigest(next.token, next.canonical);
    }
    function beginDigest(expectedToken, canonical) {
      if (!hash) { acceptDigest(expectedToken, null); return; }
      if (inFlight) {
        // Browser digest operations are not cancellable. Never accumulate jobs:
        // retain just the latest bounded input until the current job settles.
        queued = {token: expectedToken, canonical};
        return;
      }
      const job = {token: expectedToken};
      inFlight = job;
      try {
        const pending = hash(canonical);
        Promise.resolve(pending).then(result => finishDigest(job, result), () => finishDigest(job, null));
      } catch (_) { finishDigest(job, null); }
    }
    function start(value, now) {
      // Opt-out is a hard boundary: do not even inspect arguments or call hash.
      if (!enabled) return state();
      let input;
      try { input = descriptor(value); } catch (_) { return fail('invalid-snapshot'); }
      // Do not let the next RAF silently reset a failed/overlong continuous
      // display into a fresh apparently complete interval. A new caller-owned
      // display generation (or explicit clear/opt-in reset) is required.
      if (failure && latestIdentity !== null && input.identity <= latestIdentity) return state();
      if (!clock(now)) return state();
      if (latestIdentity !== null && input.identity < latestIdentity) return fail('stale-snapshot');
      if (active && input.identity === active.reference.identity) {
        // Identity is the caller's private snapshot generation, never exported.
        // It must change whenever canonical content or display mode changes.
        if (!sameMetadata(input, active.reference)) return fail('identity-mismatch');
        return state();
      }
      if (active) complete('edit', now);
      // A new actual render supersedes all previous failures and queued work.
      failure = null; token = {}; latestIdentity = input.identity; queued = null;
      active = {reference: metadata(input), startedAt: now, token, hashState: 'pending', sha256: null};
      // Hash exactly the supplied canonical bytes. Once dispatched, no source
      // string or parsed document is retained here. The host can hold at most
      // one bounded digest input; a waiting latest input is separately bounded.
      beginDigest(token, input.canonical);
      return state();
    }
    function stop(reason, now) {
      if (!enabled) return state();
      if (!END_REASONS.includes(reason)) return fail('invalid-end-reason');
      if (!clock(now)) return state();
      complete(reason, now);
      return state();
    }
    function visiblePause(now) {
      if (!enabled || !active) return state();
      clock(now);
      // A paused playback leaves its last frame visible. It does not stop or
      // subtract foreground-visible time. Concealment must call stop instead.
      return state();
    }
    function getSummary() {
      if (!enabled || active || failure || !completed || completed.hashState !== 'ready' || completed.token !== token) return UNAVAILABLE;
      return Object.freeze({
        scene: Object.freeze({status: 'available', format: completed.format, version: completed.version,
          sha256: completed.sha256, rendererVersion: completed.rendererVersion}),
        exposure: Object.freeze({status: 'available', mode: completed.mode, plannedMs: completed.plannedMs,
          visibleMs: completed.visibleMs, interrupted: completed.interrupted, endedReason: completed.endedReason})
      });
    }
    return Object.freeze({
      getState: state, getSummary, start, stop, pause: visiblePause, resume: visiblePause,
      setEnabled(value) {
        if (typeof value !== 'boolean') throw new Error('Provenance opt-in must be true or false.');
        if (!value || !enabled) reset();
        enabled = value;
        return state();
      },
      clear() { reset(); return state(); }
    });
  }
  return Object.freeze({MAX_CANONICAL_BYTES, MAX_VISIBLE_MS, END_REASONS, FORMAT_VERSIONS, createTracker});
}));
