/* Imagery Field 0.1.0. Pure bounded model and interaction controller.
   Engineering exclusions, not calibrated luminance or medical exposure limits. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ImageryModel = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMAT = 'imagery-static-scene';
  const VERSION = 1;
  const SAMPLER = 'sparse-fixed-1';
  const MAX_IMPORT_BYTES = 1048576;
  const REVEAL_GAP_MS = 3000;
  const HISTORY_LIMIT = 40;
  const PALETTES = Object.freeze({slate: '#6e7c88', sage: '#738675', sand: '#8b806a'});
  const SHAPES = Object.freeze(['dots', 'circle', 'square', 'triangle']);
  const OFFSETS = Object.freeze([[0, 0], [-0.48, -0.35], [0.5, -0.3], [-0.25, 0.5], [0.45, 0.5]].map(Object.freeze));
  const clone = value => JSON.parse(JSON.stringify(value));
  function object(value, keys, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error(label + ' must be an ordinary object.');
    const own = Reflect.ownKeys(value);
    if (own.length !== keys.length || own.some(k => typeof k !== 'string' || !keys.includes(k))) throw new Error(label + ' has missing or unsupported fields.');
    if (own.some(k => !Object.getOwnPropertyDescriptor(value, k).hasOwnProperty('value'))) throw new Error(label + ' cannot contain accessors.');
  }
  function integer(value, min, max, label) {
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(label + ' must be a whole number from ' + min + ' to ' + max + '.');
  }
  function rawGeometry(scene) {
    const s = scene.scene, r = s.size / 2;
    if (s.shape === 'dots') return OFFSETS.slice(0, s.dotCount).map((p, i) => ({kind: 'dot', id: 'dot-' + (i + 1), x: s.x + p[0] * s.size, y: s.y + p[1] * s.size, radius: s.dotRadius}));
    if (s.shape === 'circle') return [{kind: 'circle', x: s.x, y: s.y, radius: r, lineWidth: 1}];
    if (s.shape === 'square') return [{kind: 'polygon', points: [[s.x-r,s.y-r],[s.x+r,s.y-r],[s.x+r,s.y+r],[s.x-r,s.y+r]], lineWidth: 1}];
    return [{kind: 'polygon', points: [[s.x,s.y-r],[s.x+r,s.y+r],[s.x-r,s.y+r]], lineWidth: 1}];
  }
  function canonicalScene(value) {
    object(value, ['format', 'version', 'sampler', 'scene'], 'Scene file');
    if (value.format !== FORMAT || value.version !== VERSION || value.sampler !== SAMPLER) throw new Error('Unsupported scene format, version, or sampler. Only version 1 is supported.');
    const s = value.scene;
    object(s, ['name', 'shape', 'x', 'y', 'size', 'dotCount', 'dotRadius', 'palette'], 'Scene');
    if (typeof s.name !== 'string' || s.name.length < 1 || s.name.length > 64 || !s.name.trim() || /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(s.name)) throw new Error('Name must be 1–64 characters without control characters.');
    if (!SHAPES.includes(s.shape)) throw new Error('Choose dots, circle, square, or triangle.');
    integer(s.x,25,75,'Horizontal position'); integer(s.y,25,75,'Vertical position');
    integer(s.size,14,28,'Size'); integer(s.dotCount,1,5,'Dot count'); integer(s.dotRadius,1,2,'Dot radius');
    if (typeof s.palette !== 'string' || !Object.prototype.hasOwnProperty.call(PALETTES,s.palette)) throw new Error('Unsupported palette.');
    const canonical = {format: FORMAT, version: VERSION, sampler: SAMPLER, scene: {name:s.name,shape:s.shape,x:s.x,y:s.y,size:s.size,dotCount:s.dotCount,dotRadius:s.dotRadius,palette:s.palette}};
    const g = rawGeometry(canonical);
    if (s.shape === 'dots') {
      g.forEach((a, i) => {
        if (a.x-a.radius < 8 || a.x+a.radius > 92 || a.y-a.radius < 8 || a.y+a.radius > 92) throw new Error('Dots exceed the inset geometry bounds.');
        g.slice(i+1).forEach(b => {if (Math.hypot(a.x-b.x,a.y-b.y) < a.radius+b.radius+3) throw new Error('Dots need more separation. Increase size or reduce dot radius.');});
      });
      if (g.length * Math.PI * s.dotRadius * s.dotRadius > 100) throw new Error('Dot coverage exceeds this prototype’s engineering bound.');
    } else if (s.x-s.size/2-0.5 < 8 || s.x+s.size/2+0.5 > 92 || s.y-s.size/2-0.5 < 8 || s.y+s.size/2+0.5 > 92) throw new Error('Contour exceeds the inset geometry bounds.');
    return canonical;
  }
  function validateScene(value) { try { return {ok:true,scene:canonicalScene(value)}; } catch(e) { return {ok:false,error:e.message}; } }
  function rejectDuplicateKeys(text) {
    // JSON.parse establishes valid JSON syntax first. This second token pass
    // catches decoded duplicate keys, including differently escaped spellings.
    const stack=[];
    for(let i=0;i<text.length;i++) {
      const c=text[i];
      if(c==='[') throw new Error('Array-based scenes are not supported.');
      if(c==='{') {stack.push({keys:new Set(),expectKey:true});if(stack.length>2)throw new Error('Nested scene capabilities are not supported.');}
      else if(c==='}')stack.pop();
      else if(c===',') {if(stack.length)stack[stack.length-1].expectKey=true;}
      else if(c==='"') {
        const start=i;
        for(i++;i<text.length;i++){if(text[i]==='\\'){i++;continue;}if(text[i]==='"')break;}
        const frame=stack[stack.length-1];
        if(frame && frame.expectKey) {const key=JSON.parse(text.slice(start,i+1));if(frame.keys.has(key))throw new Error('Duplicate JSON fields are not supported.');frame.keys.add(key);frame.expectKey=false;}
      }
    }
  }
  function parseScene(text) {
    if (typeof text !== 'string') throw new Error('Scene data must be JSON text.');
    if (text.length > MAX_IMPORT_BYTES || (typeof TextEncoder !== 'undefined' && new TextEncoder().encode(text).length > MAX_IMPORT_BYTES)) throw new Error('Scene file must be no larger than 1 MiB.');
    let value; try { value = JSON.parse(text); } catch (e) { throw new Error('This is not a valid JSON scene file.'); }
    rejectDuplicateKeys(text);
    return canonicalScene(value);
  }
  function presets() {
    return [
      ['A small constellation','dots',3,'slate'], ['A single point','dots',1,'sage'],
      ['Circle contour','circle',1,'sage'], ['Square contour','square',1,'sand'], ['Triangle contour','triangle',1,'slate']
    ].map(p => canonicalScene({format:FORMAT,version:VERSION,sampler:SAMPLER,scene:{name:p[0],shape:p[1],x:50,y:50,size:22,dotCount:p[2],dotRadius:1,palette:p[3]}}));
  }
  function geometry(value) {return rawGeometry(canonicalScene(value));}
  function describe(value) {
    const s=canonicalScene(value).scene;
    return s.name + ': ' + (s.shape==='dots' ? s.dotCount+' sparse dot'+(s.dotCount===1?'':'s')+', radius '+s.dotRadius : 'one '+s.shape+' contour') + ', '+s.palette+' palette, size '+s.size+', centered at '+s.x+', '+s.y+' on a 100 by 100 black field.';
  }
  function createController(nowFn, initialScene) {
    const clock = nowFn || (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    let current=canonicalScene(initialScene || presets()[0]), draft=clone(current), visible=false, undoStack=[], redoStack=[], epoch=0, revision=0, revealAt=-Infinity, pending=null;
    let lastNow=-Infinity;
    function now() { const n=clock(); if (!Number.isFinite(n)) throw new Error('Invalid interaction clock.'); lastNow=Math.max(lastNow,n); return lastNow; }
    function invalid() {epoch++;pending=null;}
    function conceal(forceLock) { if (visible || forceLock) revealAt=Math.max(revealAt,now()+REVEAL_GAP_MS); visible=false; invalid(); }
    function getState() {return {current:clone(current),draft:clone(draft),visible,dirty:JSON.stringify(current)!==JSON.stringify(draft),undoCount:undoStack.length,redoCount:redoStack.length,revision,epoch,pendingImport:pending!==null,revealInMs:Math.max(0,revealAt-now())};}
    function result(ok,error) {return {ok,error:error||null,state:getState()};}
    function commit(value, history) {
      const checked=validateScene(value); if(!checked.ok)return result(false,checked.error);
      conceal(false);
      if(JSON.stringify(current)!==JSON.stringify(checked.scene)) {
        if(history!==false){undoStack.push(clone(current));if(undoStack.length>HISTORY_LIMIT)undoStack.shift();redoStack=[];}
        current=checked.scene;revision++;
      }
      draft=clone(current);return result(true);
    }
    return Object.freeze({
      getState,
      stage(value) { const checked=validateScene(value); conceal(false); if(!checked.ok)return result(false,checked.error);draft=checked.scene;return result(true); },
      invalidateImport() {invalid();return result(true);},
      show() {
        invalid();
        if(visible)return result(true);
        if(JSON.stringify(draft)!==JSON.stringify(current))return result(false,'Apply or discard staged changes before showing the scene.');
        if(now()<revealAt)return result(false,'Scene stays hidden. Pause briefly, then press Show again. Nothing is queued.');
        visible=true;return result(true);
      },
      hide() {conceal(true);return result(true);},
      end() {conceal(true);return result(true);},
      apply(value) {return commit(value === undefined ? draft : value);},
      discard() {invalid();draft=clone(current);return result(true);},
      undo() { if(!undoStack.length)return result(false,'Nothing to undo.');const previous=undoStack[undoStack.length-1];const checked=validateScene(previous);if(!checked.ok)return result(false,checked.error);redoStack.push(clone(current));undoStack.pop();return commit(checked.scene,false);},
      redo() {if(!redoStack.length)return result(false,'Nothing to redo.');const next=redoStack[redoStack.length-1];const checked=validateScene(next);if(!checked.ok)return result(false,checked.error);undoStack.push(clone(current));redoStack.pop();return commit(checked.scene,false);},
      beginImport() {conceal(false);pending=epoch;return pending;},
      finishImport(token,text) {if(pending===null || token!==pending || token!==epoch)return result(false,'That file read was canceled by a newer action.');pending=null;let checked;try{checked=parseScene(text);}catch(e){return result(false,e.message);}return commit(checked);}
    });
  }
  return Object.freeze({FORMAT,VERSION,SAMPLER,MAX_IMPORT_BYTES,REVEAL_GAP_MS,HISTORY_LIMIT,PALETTES,SHAPES,validateScene,parseScene,canonicalScene,presets,geometry,describe,createController});
}));
