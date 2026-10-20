/* Imagery Field 0.6.0. Styled scene model and interaction controller.
   Counts, geometry, colors and buffer limits are engineering choices only.
   They are not calibrated luminance, sensory safety or exposure thresholds. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ImageryModel = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMAT = 'imagery-static-scene';
  const VERSION = 3;
  const SAMPLER = 'styled-objects-3';
  const MAX_IMPORT_BYTES = 1048576;
  const MAX_OBJECTS = 12;
  const MAX_ITEM_TIME_MS = 600000;
  const MAX_ITEM_TOTAL_MS = 3600000;
  const ITEM_TIME_INCREMENT_MS = 100;
  const MIN_PULSE_PERIOD_MS = 2000;
  const MAX_PULSE_PERIOD_MS = 60000;
  const DEFAULT_PULSE_PERIOD_MS = 4000;
  const DEFAULT_BACKGROUND = Object.freeze({h:4,s:60,l:4});
  const REVEAL_GAP_MS = 3000;
  const HISTORY_LIMIT = 40;
  const MAX_CANVAS_DIMENSION = 4096;
  const MAX_CANVAS_PIXELS = 8388608;
  // Legacy colors migrate to the nearest whole-number HSL, an approximation.
  const PALETTES = Object.freeze({slate:'#6e7c88',sage:'#738675',sand:'#8b806a'});
  const LEGACY_COLORS = Object.freeze({slate:{h:208,s:11,l:48},sage:{h:126,s:8,l:49},sand:{h:40,s:13,l:48}});
  const SHAPES = Object.freeze(['dot','pixel','circle','square','triangle']);
  const OFFSETS = Object.freeze([[0,0],[-0.48,-0.35],[0.5,-0.3],[-0.25,0.5],[0.45,0.5]].map(Object.freeze));
  const clone = value => JSON.parse(JSON.stringify(value));
  function object(value, keys, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) throw new Error(label+' must be an ordinary object.');
    const own=Reflect.ownKeys(value);
    if (own.length!==keys.length || own.some(k=>typeof k!=='string'||!keys.includes(k))) throw new Error(label+' has missing or unsupported fields.');
    if (own.some(k=>!Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(value,k),'value'))) throw new Error(label+' cannot contain accessors.');
  }
  function integer(value,min,max,label) {
    if (!Number.isInteger(value)||value<min||value>max) throw new Error(label+' must be a whole number from '+min+' to '+max+'.');
  }
  function position(value,label) {
    if (typeof value!=='number'||!Number.isFinite(value)||value<0||value>100||Math.abs(value*100-Math.round(value*100))>1e-8) throw new Error(label+' must be from 0 to 100, with at most two decimal places.');
  }
  function name(value) {
    if (typeof value!=='string'||value.length<1||value.length>64||!value.trim()||/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(value)) throw new Error('Name must be 1–64 characters without control characters.');
    return value;
  }
  function color(value,background,effect) {
    object(value,['h','s','l'],background?'Background':'Object color');
    integer(value.h,0,359,'Hue');integer(value.s,0,background?60:70,'Saturation');integer(value.l,background||effect?0:10,background?40:70,'Lightness');
    return {h:value.h,s:value.s,l:value.l};
  }
  function decimal(value,min,max,scale,label) {
    if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||Math.abs(value*scale-Math.round(value*scale))>1e-8)throw new Error(label+' is outside its supported range or precision.');
    return value===0?0:value;
  }
  function boolean(value,label) {if(typeof value!=='boolean')throw new Error(label+' must be true or false.');return value;}
  function itemTime(value,label) {integer(value,0,MAX_ITEM_TIME_MS,label);if(value%ITEM_TIME_INCREMENT_MS!==0)throw new Error(label+' must use 100 ms increments.');return value===0?0:value;}
  function pulsePeriod(value) {integer(value,MIN_PULSE_PERIOD_MS,MAX_PULSE_PERIOD_MS,'Shared pulse period');if(value%ITEM_TIME_INCREMENT_MS!==0)throw new Error('Shared pulse period must use 100 ms increments.');return value;}
  function defaultEffects() {return {outline:{enabled:false,width:1,color:{h:0,s:0,l:30}},shadow:{enabled:false,offsetX:1,offsetY:1,blur:2,color:{h:0,s:0,l:0}},timing:{startMs:0,fadeInMs:0,holdMs:3000,fadeOutMs:0,pulse:{enabled:false,minOpacity:0.8}}};}
  function effects(o) {
    object(o.outline,['enabled','width','color'],'Outline');object(o.shadow,['enabled','offsetX','offsetY','blur','color'],'Shadow');
    object(o.timing,['startMs','fadeInMs','holdMs','fadeOutMs','pulse'],'Item timing');object(o.timing.pulse,['enabled','minOpacity'],'Item pulse');
    const outline={enabled:boolean(o.outline.enabled,'Outline enabled'),width:decimal(o.outline.width,0.1,4,10,'Outline width'),color:color(o.outline.color,false,true)};
    const shadow={enabled:boolean(o.shadow.enabled,'Shadow enabled'),offsetX:decimal(o.shadow.offsetX,-12,12,10,'Shadow horizontal offset'),offsetY:decimal(o.shadow.offsetY,-12,12,10,'Shadow vertical offset'),blur:decimal(o.shadow.blur,0,6,10,'Shadow blur'),color:color(o.shadow.color,false,true)};
    const t=o.timing,timing={startMs:itemTime(t.startMs,'Item start'),fadeInMs:itemTime(t.fadeInMs,'Item fade in'),holdMs:itemTime(t.holdMs,'Item hold'),fadeOutMs:itemTime(t.fadeOutMs,'Item fade out'),pulse:{enabled:boolean(t.pulse.enabled,'Item pulse enabled'),minOpacity:decimal(t.pulse.minOpacity,0.5,1,100,'Minimum pulse opacity')}};
    const lifetime=timing.fadeInMs+timing.holdMs+timing.fadeOutMs;
    if(lifetime<=0)throw new Error('Each item needs a positive total fade/hold duration.');
    if(timing.startMs+lifetime>MAX_ITEM_TOTAL_MS)throw new Error('Item end exceeds the one-hour timeline resource limit.');
    return {outline,shadow,timing};
  }
  function objectExtent(o) {return o.size/2+(['dot','pixel'].includes(o.shape)?0:0.5);}
  function defaultObject(id='object-1',shape='dot') {
    const o={id,shape,x:50,y:50,size:['dot','pixel'].includes(shape)?2:20,color:{h:208,s:11,l:48},...defaultEffects()};
    return canonicalScene({format:FORMAT,version:VERSION,sampler:SAMPLER,scene:{name:'New item',background:clone(DEFAULT_BACKGROUND),pulsePeriodMs:DEFAULT_PULSE_PERIOD_MS,objects:[o]}}).scene.objects[0];
  }
  function colorCSS(value) {return 'hsl('+value.h+' '+value.s+'% '+value.l+'%)';}
  function legacy(value) {
    if(value.sampler!=='sparse-fixed-1')throw new Error('Unsupported version 1 sampler.');
    const s=value.scene;
    object(s,['name','shape','x','y','size','dotCount','dotRadius','palette'],'Version 1 scene');name(s.name);
    if(!['dots','circle','square','triangle'].includes(s.shape))throw new Error('Unsupported version 1 shape.');
    integer(s.x,25,75,'Horizontal position');integer(s.y,25,75,'Vertical position');integer(s.size,14,28,'Size');integer(s.dotCount,1,5,'Dot count');integer(s.dotRadius,1,2,'Dot radius');
    if(typeof s.palette!=='string'||!Object.prototype.hasOwnProperty.call(PALETTES,s.palette))throw new Error('Unsupported version 1 palette.');
    const points=s.shape==='dots'?OFFSETS.slice(0,s.dotCount).map(p=>({x:s.x+p[0]*s.size,y:s.y+p[1]*s.size})): [{x:s.x,y:s.y}];
    if(s.shape==='dots') {
      points.forEach((a,i)=>{
        if(a.x-s.dotRadius<8||a.x+s.dotRadius>92||a.y-s.dotRadius<8||a.y+s.dotRadius>92)throw new Error('Version 1 dots exceed the inset geometry bounds.');
        points.slice(i+1).forEach(b=>{if(Math.hypot(a.x-b.x,a.y-b.y)<s.dotRadius*2+3)throw new Error('Version 1 dots need more separation.');});
      });
      if(points.length*Math.PI*s.dotRadius*s.dotRadius>100)throw new Error('Version 1 dot coverage exceeds its engineering bound.');
    } else if(s.x-s.size/2-0.5<8||s.x+s.size/2+0.5>92||s.y-s.size/2-0.5<8||s.y+s.size/2+0.5>92)throw new Error('Version 1 contour exceeds its inset bounds.');
    return {format:FORMAT,version:2,sampler:'static-objects-2',scene:{name:s.name,background:{h:0,s:0,l:0},objects:points.map((p,i)=>({id:'object-'+(i+1),shape:s.shape==='dots'?'dot':s.shape,x:Math.round(p.x*100)/100,y:Math.round(p.y*100)/100,size:s.shape==='dots'?2*s.dotRadius:s.size,color:clone(LEGACY_COLORS[s.palette])}))}};
  }
  function canonicalScene(value) {
    object(value,['format','version','sampler','scene'],'Scene file');
    if(value.format!==FORMAT)throw new Error('Unsupported scene format.');
    if(value.version===1)return canonicalScene(legacy(value));
    const old=value.version===2&&value.sampler==='static-objects-2';
    if(!old&&(value.version!==VERSION||value.sampler!==SAMPLER))throw new Error('Unsupported scene version or sampler. Only versions 1, 2 and 3 are supported.');
    const s=value.scene;
    object(s,old?['name','background','objects']:['name','background','pulsePeriodMs','objects'],'Scene');name(s.name);
    const pulsePeriodMs=old?DEFAULT_PULSE_PERIOD_MS:pulsePeriod(s.pulsePeriodMs);
    const background=color(s.background,true),list=s.objects;
    if(!Array.isArray(list)||Object.getPrototypeOf(list)!==Array.prototype||list.length>MAX_OBJECTS)throw new Error('Scene objects must be an array with 0–12 objects.');
    const keys=Reflect.ownKeys(list);
    if(keys.length!==list.length+1||keys.some(k=>k!=='length'&&(typeof k!=='string'||!/^\d+$/.test(k)||Number(k)>=list.length)))throw new Error('Object array has missing or unsupported fields.');
    const ids=new Set(),objects=[];
    for(let i=0;i<list.length;i++) {
      const descriptor=Object.getOwnPropertyDescriptor(list,String(i));
      if(!descriptor||!Object.prototype.hasOwnProperty.call(descriptor,'value'))throw new Error('Object array cannot contain holes or accessors.');
      const o=descriptor.value;
      object(o,old?['id','shape','x','y','size','color']:['id','shape','x','y','size','color','outline','shadow','timing'],'Object');
      if(typeof o.id!=='string'||!/^object-[1-9][0-9]{0,5}$/.test(o.id)||ids.has(o.id))throw new Error('Each object needs a unique object-1 style identifier.');
      ids.add(o.id);
      if(!SHAPES.includes(o.shape))throw new Error('Choose dot, pixel, circle, square, or triangle.');
      position(o.x,'Horizontal position');position(o.y,'Vertical position');
      const filled=o.shape==='dot'||o.shape==='pixel';
      integer(o.size,1,filled?8:28,'Object size');
      const extent=objectExtent(o);
      if(o.x-extent<1||o.x+extent>99||o.y-extent<1||o.y+extent>99)throw new Error('Keep the complete object within the 1-unit field inset. Move it inward or reduce its size.');
      objects.push({id:o.id,shape:o.shape,x:o.x,y:o.y,size:o.size,color:color(o.color,false),...(old?defaultEffects():effects(o))});
    }
    return {format:FORMAT,version:VERSION,sampler:SAMPLER,scene:{name:s.name,background,pulsePeriodMs,objects}};
  }
  function validateScene(value) {try{return {ok:true,scene:canonicalScene(value)};}catch(e){return {ok:false,error:e.message};}}
  function rejectDuplicateKeys(text) {
    // JSON.parse validates syntax. This iterative token pass then checks every
    // object, including objects inside arrays, using decoded key spellings.
    const stack=[];
    for(let i=0;i<text.length;i++) {
      const c=text[i];
      if(c==='{'||c==='[') {
        stack.push(c==='{'?{kind:'object',keys:new Set(),expectKey:true}:{kind:'array'});
        if(stack.length>32)throw new Error('Scene nesting exceeds the format resource bound.');
      } else if(c==='}'||c===']')stack.pop();
      else if(c===',') {const frame=stack[stack.length-1];if(frame&&frame.kind==='object')frame.expectKey=true;}
      else if(c==='"') {
        const start=i;
        for(i++;i<text.length;i++){if(text[i]==='\\'){i++;continue;}if(text[i]==='"')break;}
        const frame=stack[stack.length-1];
        if(frame&&frame.kind==='object'&&frame.expectKey) {
          const key=JSON.parse(text.slice(start,i+1));
          if(frame.keys.has(key))throw new Error('Duplicate JSON fields are not supported.');
          frame.keys.add(key);frame.expectKey=false;
        }
      }
    }
  }
  function parseScene(text) {
    if(typeof text!=='string')throw new Error('Scene data must be JSON text.');
    if(text.length>MAX_IMPORT_BYTES||(typeof TextEncoder!=='undefined'&&new TextEncoder().encode(text).length>MAX_IMPORT_BYTES))throw new Error('Scene file must be no larger than 1 MiB.');
    let value;try{value=JSON.parse(text);}catch(e){throw new Error('This is not a valid JSON scene file.');}
    rejectDuplicateKeys(text);return canonicalScene(value);
  }
  function presets() {
    return [
      ['A small constellation','dots',3,'slate'],['A single point','dots',1,'sage'],
      ['Circle contour','circle',1,'sage'],['Square contour','square',1,'sand'],['Triangle contour','triangle',1,'slate']
    ].map(p=>{const result=canonicalScene({format:FORMAT,version:1,sampler:'sparse-fixed-1',scene:{name:p[0],shape:p[1],x:50,y:50,size:22,dotCount:p[2],dotRadius:1,palette:p[3]}});result.scene.background=clone(DEFAULT_BACKGROUND);return result;});
  }
  function geometry(value,width=100,height=100) {
    const s=canonicalScene(value).scene;
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('Field dimensions must be finite positive numbers.');
    const unit=Math.min(width,height)/100;
    return s.objects.map(o=>{
      const x=o.x*width/100,y=o.y*height/100,r=o.size*unit/2,base={id:o.id,color:colorCSS(o.color),outline:{enabled:o.outline.enabled,width:o.outline.width*unit,color:colorCSS(o.outline.color)},shadow:{enabled:o.shadow.enabled,offsetX:o.shadow.offsetX*unit,offsetY:o.shadow.offsetY*unit,blur:o.shadow.blur*unit,color:colorCSS(o.shadow.color)}};
      if(o.shape==='dot')return {...base,kind:'dot',x,y,radius:r};
      if(o.shape==='circle')return {...base,kind:'circle',x,y,radius:r,lineWidth:unit};
      const points=o.shape==='triangle'?[[x,y-r],[x+r,y+r],[x-r,y+r]]:[[x-r,y-r],[x+r,y-r],[x+r,y+r],[x-r,y+r]];
      return {...base,kind:'polygon',points,lineWidth:unit,filled:o.shape==='pixel'};
    });
  }
  function describe(value) {
    const s=canonicalScene(value).scene,b=s.background;
    const objects=s.objects.length?s.objects.map((o,i)=>{
      const style=(o.outline.enabled?', outline width '+o.outline.width+' H'+o.outline.color.h+' S'+o.outline.color.s+' L'+o.outline.color.l:'')+(o.shadow.enabled?', shadow offset '+o.shadow.offsetX+'/'+o.shadow.offsetY+' blur '+o.shadow.blur+' H'+o.shadow.color.h+' S'+o.shadow.color.s+' L'+o.shadow.color.l:'');
      const t=o.timing,timing=', authored timing start '+t.startMs+' ms, fade in '+t.fadeInMs+' ms, hold '+t.holdMs+' ms, fade out '+t.fadeOutMs+' ms'+(t.pulse.enabled?', shared pulse minimum opacity '+Math.round(t.pulse.minOpacity*100)+'%':'');
      return (i+1)+': '+o.shape+', size '+o.size+', at '+o.x+', '+o.y+', color H'+o.color.h+' S'+o.color.s+' L'+o.color.l+style+timing;
    }).join('; '):'no objects';
    return s.name+': '+s.objects.length+' object'+(s.objects.length===1?'':'s')+'. Background H'+b.h+' S'+b.s+' L'+b.l+'. '+objects+'. Positions are percentages; sizes use the field’s shorter side.';
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
      conceal(false);
      const checked=validateScene(value); if(!checked.ok)return result(false,checked.error);
      if(JSON.stringify(current)!==JSON.stringify(checked.scene)) {
        if(history!==false){undoStack.push(clone(current));if(undoStack.length>HISTORY_LIMIT)undoStack.shift();redoStack=[];}
        current=checked.scene;revision++;
      }
      draft=clone(current);return result(true);
    }
    return Object.freeze({
      getState,
      stage(value) { const checked=validateScene(value); conceal(false); if(!checked.ok)return result(false,checked.error);draft=checked.scene;return result(true); },
      // Live staging can update an already visible draft, but never reveal one.
      stageLive(value) {
        const checked=validateScene(value);invalid();
        if(!checked.ok){conceal(false);return result(false,checked.error);}
        draft=checked.scene;return result(true);
      },
      // Only an explicit preview action may reveal a draft. Accepted data and
      // history remain unchanged until Apply/capture.
      previewDraft(value) {
        const checked=validateScene(value);invalid();
        if(!checked.ok){conceal(false);return result(false,checked.error);}
        draft=checked.scene;
        if(!visible&&now()<revealAt)return result(false,'Scene stays hidden during the temporary repeat-action lock. Start Live preview again later; nothing is queued.');
        visible=true;return result(true);
      },
      invalidateImport() {invalid();return result(true);},
      show() {
        invalid();
        if(visible)return result(true);
        if(JSON.stringify(draft)!==JSON.stringify(current))return result(false,'Apply or discard staged changes before showing the scene.');
        if(now()<revealAt)return result(false,'Scene stays hidden during the temporary repeat-action lock. Press Show again later; nothing is queued.');
        visible=true;return result(true);
      },
      hide() {conceal(true);return result(true);},
      end() {conceal(true);return result(true);},
      apply(value) {return commit(value === undefined ? draft : value);},
      discard() {conceal(false);draft=clone(current);return result(true);},
      undo() { conceal(false);if(!undoStack.length)return result(false,'Nothing to undo.');const previous=undoStack[undoStack.length-1];const checked=validateScene(previous);if(!checked.ok)return result(false,checked.error);redoStack.push(clone(current));undoStack.pop();return commit(checked.scene,false);},
      redo() {conceal(false);if(!redoStack.length)return result(false,'Nothing to redo.');const next=redoStack[redoStack.length-1];const checked=validateScene(next);if(!checked.ok)return result(false,checked.error);undoStack.push(clone(current));redoStack.pop();return commit(checked.scene,false);},
      beginImport() {conceal(false);pending=epoch;return pending;},
      finishImport(token,text) {if(pending===null || token!==pending || token!==epoch)return result(false,'That file read was canceled by a newer action.');pending=null;let checked;try{checked=parseScene(text);}catch(e){return result(false,e.message);}return commit(checked);}
    });
  }
  return Object.freeze({FORMAT,VERSION,SAMPLER,MAX_IMPORT_BYTES,MAX_OBJECTS,MAX_ITEM_TIME_MS,MAX_ITEM_TOTAL_MS,ITEM_TIME_INCREMENT_MS,MIN_PULSE_PERIOD_MS,MAX_PULSE_PERIOD_MS,DEFAULT_PULSE_PERIOD_MS,DEFAULT_BACKGROUND,MAX_CANVAS_DIMENSION,MAX_CANVAS_PIXELS,REVEAL_GAP_MS,HISTORY_LIMIT,PALETTES,SHAPES,defaultEffects,defaultObject,objectExtent,colorCSS,validateScene,parseScene,canonicalScene,presets,geometry,describe,createController});
}));
