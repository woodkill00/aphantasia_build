/* One-pass sequence data and timeline engine. No display or scheduling authority.
   Counts and timing limits are engineering bounds, not exposure prescriptions. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model.js'));
  else root.ImagerySequence = factory(root.ImageryModel);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (M) {
  'use strict';
  const FORMAT = 'imagery-field-sequence';
  const VERSION = 2;
  const SAMPLER = 'ordered-crossfade-2';
  const AUTHORED_VERSION=3, AUTHORED_SAMPLER='ordered-crossfade-3';
  const MAX_IMPORT_BYTES = 1048576;
  const MAX_STEPS = 32;
  const MIN_HOLD_MS = 1000;
  const MAX_HOLD_MS = 600000;
  const MAX_TRANSITION_MS = 60000;
  const TIME_INCREMENT_MS = 500;
  const MAX_TOTAL_MS = 3600000;
  const DEFAULT_HOLD_MS = 3000;
  const DEFAULT_TRANSITION_MS = 1000;
  const MAX_DEPTH = 32;
  const compiledTimelines = new WeakSet();

  function record(value, keys, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
      throw new Error(label + ' must be an ordinary object.');
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

  function list(value, min, max, label) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype ||
        value.length < min || value.length > max) {
      throw new Error(label + ' must be an array with ' + min + '\u2013' + max + ' entries.');
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length !== value.length + 1 || keys.some(key => key !== 'length' &&
        (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length))) {
      throw new Error(label + ' has missing or unsupported fields.');
    }
    const result = [];
    for (let i = 0; i < value.length; i++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new Error(label + ' cannot contain holes or accessors.');
      }
      result.push(descriptor.value);
    }
    return result;
  }

  function name(value, label) {
    if (typeof value !== 'string' || value.length < 1 || value.length > 64 || !value.trim() ||
        /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(value)) {
      throw new Error(label + ' must be 1\u201364 characters without control characters.');
    }
    return value;
  }

  function time(value, min, max, label) {
    if (!Number.isSafeInteger(value) || value < min || value > max || value % TIME_INCREMENT_MS !== 0) {
      throw new Error(label + ' must be a whole number from ' + min + ' to ' + max +
        ' ms, in ' + TIME_INCREMENT_MS + ' ms increments.');
    }
    return value === 0 ? 0 : value;
  }

  // Count UTF-8 even in an environment without TextEncoder. Lone surrogates
  // encode as the replacement character, just as TextEncoder encodes them.
  function checkBytes(text) {
    let bytes = 0;
    if (text.length > MAX_IMPORT_BYTES) throw new Error('Sequence file must be no larger than 1 MiB.');
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code < 0x80) bytes++;
      else if (code < 0x800) bytes += 2;
      else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length &&
          text.charCodeAt(i + 1) >= 0xdc00 && text.charCodeAt(i + 1) <= 0xdfff) {
        bytes += 4;
        i++;
      } else bytes += 3;
      if (bytes > MAX_IMPORT_BYTES) throw new Error('Sequence file must be no larger than 1 MiB.');
    }
  }

  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.keys(value).forEach(key => freeze(value[key]));
      Object.freeze(value);
    }
    return value;
  }

  function canonicalSequence(value) {
    const file = record(value, ['format', 'version', 'sampler', 'sequence'], 'Sequence file');
    if (file.format !== FORMAT) throw new Error('Unsupported sequence format.');
    const legacy = file.version === 1 && file.sampler === 'ordered-crossfade-1';
    const authored=file.version===AUTHORED_VERSION&&file.sampler===AUTHORED_SAMPLER;
    if (!legacy && !authored && (file.version !== VERSION || file.sampler !== SAMPLER)) {
      throw new Error('Unsupported sequence version or sampler.');
    }
    const sequence = record(file.sequence, ['name', 'background', 'steps', ...(authored?['canvas']:[])], 'Sequence');
    const sequenceName = name(sequence.name, 'Sequence name');
    const sourceSteps = list(sequence.steps, 1, MAX_STEPS, 'Sequence steps');
    const ids = new Set();
    let total = 0, background;
    const steps = sourceSteps.map((entry, index) => {
      const label = 'Step ' + (index + 1);
      const step = record(entry, legacy ? ['id', 'name', 'holdMs', 'transitionMs', 'objects'] : ['id', 'name', 'holdMs', 'transitionMs', 'pulsePeriodMs', 'objects', ...(authored?['canvas']:[])], label);
      const id = name(step.id, label + ' identifier');
      if (ids.has(id)) throw new Error('Step identifiers must be unique within the sequence.');
      ids.add(id);
      const stepName = name(step.name, label + ' name');
      const holdMs = time(step.holdMs, MIN_HOLD_MS, MAX_HOLD_MS, label + ' hold');
      const final = index === sourceSteps.length - 1;
      const transitionMs = time(step.transitionMs, 0, final ? 0 : MAX_TRANSITION_MS,
        final ? 'Final step transition' : label + ' transition');
      total += holdMs + transitionMs;
      if (!Number.isSafeInteger(total) || total > MAX_TOTAL_MS) {
        throw new Error('Sequence total must be no greater than ' + MAX_TOTAL_MS + ' ms.');
      }
      // Keep every static geometry/color/object rule authoritative and unchanged.
      // Each snapshot is independently bounded; a crossfade may use 12 + 12.
      list(step.objects, 1, M.MAX_OBJECTS, label + ' objects');
      const scene = M.canonicalScene({format: M.FORMAT, version: legacy ? 2 : authored?M.AUTHORED_VERSION:M.VERSION, sampler: legacy ? 'static-objects-2' : authored?M.AUTHORED_SAMPLER:M.SAMPLER,
        scene: {name: stepName, background: sequence.background, ...(!legacy ? {pulsePeriodMs:step.pulsePeriodMs} : {}), objects: step.objects, ...(authored?{canvas:step.canvas}:{})}}).scene;
      if(authored) {
        const reference=M.canonicalScene({format:M.FORMAT,version:M.AUTHORED_VERSION,sampler:M.AUTHORED_SAMPLER,scene:{...scene,canvas:sequence.canvas}}).scene.canvas;
        if(JSON.stringify(reference)!==JSON.stringify(scene.canvas))throw new Error('Sequence snapshots must share the same authored canvas.');
      }
      if (index === 0) background = scene.background;
      return {id, name: scene.name, holdMs, transitionMs, pulsePeriodMs:scene.pulsePeriodMs, objects: scene.objects, ...(authored?{canvas:scene.canvas}:{})};
    });
    const result = {format: FORMAT, version: authored?AUTHORED_VERSION:VERSION, sampler: authored?AUTHORED_SAMPLER:SAMPLER,
      sequence: {name: sequenceName, background, steps, ...(authored?{canvas:steps[0].canvas}:{})}};
    checkBytes(JSON.stringify(result));
    return freeze(result);
  }

  function validateSequence(value) {
    try { return {ok: true, sequence: canonicalSequence(value)}; }
    catch (error) { return {ok: false, error: error.message}; }
  }

  function checkJSONStructure(text) {
    // Syntax has already been checked by JSON.parse. This iterative pass checks
    // decoded duplicate keys in every object, including objects inside arrays.
    const stack = [];
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '{' || c === '[') {
        stack.push(c === '{' ? {kind: 'object', keys: new Set(), expectKey: true} : {kind: 'array'});
        if (stack.length > MAX_DEPTH) throw new Error('Sequence nesting exceeds the format resource bound.');
      } else if (c === '}' || c === ']') stack.pop();
      else if (c === ',') {
        const frame = stack[stack.length - 1];
        if (frame && frame.kind === 'object') frame.expectKey = true;
      } else if (c === '"') {
        const start = i;
        for (i++; i < text.length; i++) {
          if (text[i] === '\\') { i++; continue; }
          if (text[i] === '"') break;
        }
        const frame = stack[stack.length - 1];
        if (frame && frame.kind === 'object' && frame.expectKey) {
          const key = JSON.parse(text.slice(start, i + 1));
          if (frame.keys.has(key)) throw new Error('Duplicate JSON fields are not supported.');
          frame.keys.add(key);
          frame.expectKey = false;
        }
      }
    }
  }

  function parseSequence(text) {
    if (typeof text !== 'string') throw new Error('Sequence data must be JSON text.');
    checkBytes(text);
    let value;
    try { value = JSON.parse(text); }
    catch (error) { throw new Error('This is not a valid JSON sequence file.'); }
    checkJSONStructure(text);
    return canonicalSequence(value);
  }

  function serializeSequence(value) {
    const text = JSON.stringify(canonicalSequence(value), null, 2);
    checkBytes(text);
    return text;
  }

  function compileTimeline(value) {
    const document = canonicalSequence(value);
    const phases = [];
    let durationMs = 0;
    document.sequence.steps.forEach((step, index) => {
      phases.push({phase: 'hold', stepIndex: index, nextStepIndex: null,
        startMs: durationMs, endMs: durationMs + step.holdMs});
      durationMs += step.holdMs;
      if (step.transitionMs > 0) {
        phases.push({phase: 'transition', stepIndex: index, nextStepIndex: index + 1,
          startMs: durationMs, endMs: durationMs + step.transitionMs});
        durationMs += step.transitionMs;
      }
    });
    const timeline = freeze({document, durationMs, phases});
    compiledTimelines.add(timeline);
    return timeline;
  }

  function frameAt(timeline, elapsedMs) {
    if (!compiledTimelines.has(timeline)) throw new Error('Use a validated compiled sequence timeline.');
    if (typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs) || elapsedMs < 0) {
      throw new Error('Elapsed time must be a finite nonnegative number.');
    }
    const durationMs = timeline.durationMs;
    const elapsed = Math.min(elapsedMs, durationMs);
    if (elapsed >= durationMs) return Object.freeze({phase: 'finished', stepIndex: null,
      nextStepIndex: null, alpha: 0, elapsedMs: durationMs, remainingMs: 0, durationMs, done: true});
    // At most 63 phases. There are no zero-duration phases or gaps, including cuts.
    const phase = timeline.phases.find(entry => elapsed >= entry.startMs && elapsed < entry.endMs);
    return Object.freeze({phase: phase.phase, stepIndex: phase.stepIndex, nextStepIndex: phase.nextStepIndex,
      alpha: phase.phase === 'transition' ? (elapsed - phase.startMs) / (phase.endMs - phase.startMs) : 0,
      elapsedMs: elapsed, remainingMs: durationMs - elapsed, durationMs, done: false});
  }

  function createTimeline(nowFn) {
    if (typeof nowFn !== 'function') throw new Error('An injected monotonic clock function is required.');
    let timeline = null, status = 'stopped', generation = 0;
    let elapsedMs = 0, paintedElapsedMs = 0, anchorElapsedMs = 0, anchorNow = 0;
    let frame = null, paintedFrame = null, lastNow = -Infinity;
    // Only genuine frames emitted by this player in this generation may be
    // acknowledged as painted. Weak keys do not retain a whole run of frames.
    const issued = new WeakMap();

    function now() {
      const value = nowFn();
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid sequence clock.');
      lastNow = Math.max(lastNow, value);
      return lastNow;
    }

    function issue(elapsed) {
      const result = Object.freeze({...frameAt(timeline, elapsed), generation});
      issued.set(result, generation);
      return result;
    }

    function getState() {
      return Object.freeze({status, generation, elapsedMs, paintedElapsedMs,
        durationMs: timeline ? timeline.durationMs : 0, frame});
    }

    function stop() {
      generation++;
      status = 'stopped';
      elapsedMs = paintedElapsedMs = anchorElapsedMs = 0;
      frame = paintedFrame = null;
      return getState();
    }

    return Object.freeze({
      getState,
      start(value) {
        const compiled = compiledTimelines.has(value) ? value : compileTimeline(value);
        const currentNow = now();
        generation++;
        timeline = compiled;
        status = 'running';
        elapsedMs = paintedElapsedMs = anchorElapsedMs = 0;
        anchorNow = currentNow;
        paintedFrame = null;
        frame = issue(0);
        return getState();
      },
      tick() {
        if (status !== 'running') return getState();
        // Subtraction can overflow only for an adversarial finite clock jump;
        // clamping still terminates the bounded timeline rather than replaying.
        const next = Math.min(timeline.durationMs, anchorElapsedMs + (now() - anchorNow));
        elapsedMs = Math.max(elapsedMs, next);
        if (elapsedMs >= timeline.durationMs) {
          generation++;
          status = 'finished';
          frame = issue(timeline.durationMs);
          elapsedMs = paintedElapsedMs = anchorElapsedMs = 0;
          paintedFrame = null;
        } else frame = issue(elapsedMs);
        return getState();
      },
      markPainted(candidate) {
        if (status !== 'running' || !candidate || issued.get(candidate) !== generation ||
            candidate.done || candidate.elapsedMs < paintedElapsedMs || candidate.elapsedMs > elapsedMs) return false;
        paintedFrame = candidate;
        paintedElapsedMs = candidate.elapsedMs;
        return true;
      },
      pause() {
        if (status !== 'running') return getState();
        // No clock read: the only authoritative paused image is the last image
        // the caller confirmed it actually painted, not the click-time blend.
        generation++;
        elapsedMs = paintedElapsedMs;
        anchorElapsedMs = elapsedMs;
        status = 'paused';
        frame = paintedFrame ? Object.freeze({...paintedFrame, generation}) : issue(0);
        return getState();
      },
      resume() {
        if (status !== 'paused') return getState();
        const currentNow = now();
        generation++;
        anchorNow = currentNow;
        anchorElapsedMs = elapsedMs;
        status = 'running';
        frame = issue(elapsedMs);
        return getState();
      },
      stop
    });
  }

  return Object.freeze({FORMAT, VERSION, SAMPLER, AUTHORED_VERSION, AUTHORED_SAMPLER, MAX_IMPORT_BYTES, MAX_STEPS,
    MIN_HOLD_MS, MAX_HOLD_MS, MAX_TRANSITION_MS, TIME_INCREMENT_MS, MAX_TOTAL_MS,
    DEFAULT_HOLD_MS, DEFAULT_TRANSITION_MS, canonicalSequence, validateSequence,
    parseSequence, serializeSequence, compileTimeline, frameAt, createTimeline});
}));
