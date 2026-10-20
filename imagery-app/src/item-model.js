/* Finite per-item timeline. Pure data and injected-clock state only.
   Timing/color limits are supported engineering bounds, not safety guarantees. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'));
  else root.ImageryItems=factory(root.ImageryModel);
}(typeof globalThis!=='undefined'?globalThis:this,function(M){
  'use strict';
  const compiledTimelines=new WeakSet();
  function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.keys(value).forEach(k=>freeze(value[k]));Object.freeze(value);}return value;}
  function compileTimeline(value){
    const document=M.canonicalScene(value),objects=document.scene.objects;
    if(!objects.length)throw new Error('Add at least one item before timed preview.');
    const tracks=objects.map((o,index)=>{const t=o.timing,startMs=t.startMs,fadeInEndMs=startMs+t.fadeInMs,holdEndMs=fadeInEndMs+t.holdMs,endMs=holdEndMs+t.fadeOutMs;return {id:o.id,index,startMs,fadeInEndMs,holdEndMs,endMs};});
    const durationMs=Math.max(...tracks.map(t=>t.endMs));
    const timeline=freeze({document,tracks,durationMs,pulsePeriodMs:document.scene.pulsePeriodMs});
    compiledTimelines.add(timeline);return timeline;
  }
  function frameAt(timeline,elapsedMs){
    if(!compiledTimelines.has(timeline))throw new Error('Use a validated compiled item timeline.');
    if(typeof elapsedMs!=='number'||!Number.isFinite(elapsedMs)||elapsedMs<0)throw new Error('Elapsed time must be a finite nonnegative number.');
    const elapsed=Math.min(elapsedMs,timeline.durationMs),done=elapsed>=timeline.durationMs;
    const items=timeline.tracks.map(track=>{
      const timing=timeline.document.scene.objects[track.index].timing;
      let phase='waiting',envelope=0;
      if(done||elapsed>=track.endMs)phase='finished';
      else if(elapsed<track.startMs)phase='waiting';
      else if(elapsed<track.fadeInEndMs){phase='fade-in';envelope=(elapsed-track.startMs)/timing.fadeInMs;}
      else if(elapsed<track.holdEndMs){phase='hold';envelope=1;}
      else {phase='fade-out';envelope=1-(elapsed-track.holdEndMs)/timing.fadeOutMs;}
      // One shared absolute phase prevents independently beating item clocks.
      // This bound does not certify the composite pattern or hardware output.
      const pulse=timing.pulse.enabled?timing.pulse.minOpacity+(1-timing.pulse.minOpacity)*(1+Math.cos(2*Math.PI*elapsed/timeline.pulsePeriodMs))/2:1;
      return Object.freeze({id:track.id,index:track.index,phase,alpha:Math.max(0,Math.min(1,envelope*pulse)),active:phase!=='waiting'&&phase!=='finished'});
    });
    return Object.freeze({phase:done?'finished':'items',items:Object.freeze(items),elapsedMs:elapsed,remainingMs:timeline.durationMs-elapsed,durationMs:timeline.durationMs,done});
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
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid item timeline clock.');
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

  return Object.freeze({compileTimeline,frameAt,createTimeline});
}));
