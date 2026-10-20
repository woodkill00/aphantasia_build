/* Local scene editor and explicit finite, single-pass sequence presentation.
   One visibility gate. Live manual draft edits preserve an explicitly visible field; interruptions conceal. */
(function () {
  'use strict';
  const M=window.ImageryModel,S=window.ImagerySequence,I=window.ImageryItems,E=window.ImageryEditor,G=window.ImageryGeometry,P=window.ImageryPresets;
  const $=id=>document.getElementById(id);
  let lastGateClock=0,gateClockFault=false;
  function gateClock(){
    try{const value=performance.now();if(Number.isFinite(value)){lastGateClock=Math.max(lastGateClock,value);return lastGateClock;}}catch(e){/* Keep concealment available even if the clock fails. */}
    gateClockFault=true;return lastGateClock;
  }
  const controller=M.createController(gateClock);
  const canvas=$('scene-canvas'),root=$('stage-root');
  const offscreen=document.createElement('canvas');
  offscreen.width=1;offscreen.height=1;
  let context=null,offscreenContext=null;
  try {context=canvas.getContext('2d',{alpha:false});offscreenContext=offscreen.getContext('2d',{alpha:true});}catch(e){/* Data controls remain available. */}
  let journalUI=null,imageUI=null,imageReplacement=null,galleryUI=null;
  let provenanceIdentity=1;
  const provenance=window.ImageryProvenance.createTracker({onChange:()=>{if(journalUI)journalUI.refreshProvenance();},hash:async canonical=>{
    if(!window.crypto||!window.crypto.subtle||typeof TextEncoder!=='function')throw new Error('SHA-256 unavailable');
    const bytes=new TextEncoder().encode(canonical);
    try{return Array.from(new Uint8Array(await window.crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');}
    finally{bytes.fill(0);}
  }});
  function provenanceNow(){try{return performance.now();}catch(e){return NaN;}}
  function stopProvenance(reason){provenance.stop(reason,provenanceNow());provenanceIdentity++;if(journalUI)journalUI.refreshProvenance();}
  function recordVisibleDisplay(state){
    if(!provenance.getState().enabled||!state.visible||document.hidden)return;
    const timed=displayKind==='timed',items=displayKind==='items';
    const value=timed?sequence:items?itemSource:displayKind==='step'?stepScene(stepIndex):displayKind==='live'?state.draft:state.current;
    provenance.start({identity:provenanceIdentity,canonical:JSON.stringify(value),format:value.format,version:value.version,rendererVersion:'0.8.0-dev.provenance1',mode:timed?'sequence':items?'items':'static',plannedMs:timed?compiledSequence.durationMs:items?compiledItems.durationMs:null},provenanceNow());
  }
  let formDirty=false,notePreview=null,selectedId=null,placing=false,editorOpen=true;
  let lockedTouchIntent=null,gesture=null,moveUndo=[],moveRedo=[],lastHit=null,moveStaging=false;
  const locks=E.createLocks();let snapStep=0;
  let working=controller.getState().current;
  let section='scene',sequence=null,stepIndex=0,sequenceError='',displayKind='scene';
  let generation=0,rafId=null,paintedFrame=null,lastPhaseKey='';
  const timeline=S.createTimeline(()=>performance.now()),itemTimeline=I.createTimeline(()=>performance.now());
  let itemSource=null,compiledItems=null,itemFrame=null;
  const reducedMotion=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  let motionReduced=!!(reducedMotion&&reducedMotion.matches);
  const objectURLs=new Set();
  const colorPrefixes=['object','background','outline','shadow'];
  const sliderIDs=colorPrefixes.flatMap(prefix=>['hue','saturation','lightness'].map(channel=>prefix+'-'+channel)).concat(['outline-width','shadow-offset-x','shadow-offset-y','shadow-blur']);
  const objectFields=['shape','position-x','position-y','size','object-hue','object-saturation','object-lightness','outline-enabled','outline-width','outline-hue','outline-saturation','outline-lightness','shadow-enabled','shadow-offset-x','shadow-offset-y','shadow-blur','shadow-hue','shadow-saturation','shadow-lightness','item-start','item-fade-in','item-hold','item-fade-out','pulse-enabled','pulse-min-opacity'];
  const fieldIDs=['scene-name',...objectFields,'background-hue','background-saturation','background-lightness','pulse-period'];
  const geometryFields=['geometry-height','geometry-rotation','geometry-fill','geometry-sides','geometry-inner','geometry-corner'];
  const rawPrecision=new Map();
  const categories=Object.freeze(['unsure','none','external-perception','residual-aftereffect','voluntary-imagery','conceptual-knowledge','mixed']);
  const copy=value=>JSON.parse(JSON.stringify(value));
  const number=id=>{const raw=rawPrecision.has(id)?rawPrecision.get(id):$(id).value;return raw.trim()===''?NaN:Number(raw);};
  const milliseconds=id=>{const value=number(id);return Number.isFinite(value)&&Math.abs(value*10-Math.round(value*10))<1e-8?Math.round(value*1000):NaN;};
  function say(message,error){
    const text=String(message).slice(0,300);
    ['status','fullscreen-status'].forEach(id=>{$(id).textContent=text;$(id).className=error?'error':'';});
  }
  function dimensions(){
    const rect=canvas.getBoundingClientRect();
    const width=Number.isFinite(rect.width)&&rect.width>0?rect.width:1;
    const height=Number.isFinite(rect.height)&&rect.height>0?rect.height:1;
    const dpr=Math.min(2,Math.max(1,Number(window.devicePixelRatio)||1));
    const ratio=Math.min(dpr,M.MAX_CANVAS_DIMENSION/width,M.MAX_CANVAS_DIMENSION/height,Math.sqrt(M.MAX_CANVAS_PIXELS/(2*width*height)));
    return {width,height,bufferWidth:Math.max(1,Math.floor(width*ratio)),bufferHeight:Math.max(1,Math.floor(height*ratio))};
  }
  function resetContext(ctx){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#000';ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;}
  function prepareBuffers(){
    const d=dimensions();
    if(canvas.width!==d.bufferWidth||canvas.height!==d.bufferHeight||offscreen.width!==d.bufferWidth||offscreen.height!==d.bufferHeight){
      // Shrink both first: even intermediate resize allocations respect the cap.
      canvas.width=1;canvas.height=1;offscreen.width=1;offscreen.height=1;
      canvas.width=d.bufferWidth;canvas.height=d.bufferHeight;offscreen.width=d.bufferWidth;offscreen.height=d.bufferHeight;
    }
    return d;
  }
  function shapePath(ctx,item){
    ctx.beginPath();
    if(item.kind==='dot'||item.kind==='circle')ctx.arc(item.x,item.y,item.radius,0,Math.PI*2);
    else{item.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();}
  }
  function filledOutlinePath(ctx,item,width){
    ctx.beginPath();
    if(item.kind==='dot'){ctx.arc(item.x,item.y,item.radius+width,0,Math.PI*2);return;}
    // The other filled shape is a pixel. One rounded outer silhouette gives
    // its body and outline a single solid shadow, without double compositing.
    const [[left,top],[right],[,bottom]]=item.points;
    ctx.moveTo(left,top-width);ctx.lineTo(right,top-width);ctx.arc(right,top,width,-Math.PI/2,0);
    ctx.lineTo(right+width,bottom);ctx.arc(right,bottom,width,0,Math.PI/2);
    ctx.lineTo(left,bottom+width);ctx.arc(left,bottom,width,Math.PI/2,Math.PI);
    ctx.lineTo(left-width,top);ctx.arc(left,top,width,Math.PI,Math.PI*1.5);ctx.closePath();
  }
  function authoredOuterSilhouette(ctx,item,width){
    // Nonzero-winding union: body plus edge rectangles and vertex disks.
    // One fill casts one solid shadow, including concave filled shapes.
    let points=item.points;const area=points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0);if(area<0)points=points.slice().reverse();
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
    points.forEach((a,i)=>{const b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length){const nx=-dy*width/length,ny=dx*width/length;ctx.moveTo(a[0]-nx,a[1]-ny);ctx.lineTo(b[0]-nx,b[1]-ny);ctx.lineTo(b[0]+nx,b[1]+ny);ctx.lineTo(a[0]+nx,a[1]+ny);ctx.closePath();}ctx.moveTo(a[0]+width,a[1]);ctx.arc(a[0],a[1],width,0,Math.PI*2);ctx.closePath();});
  }
  function paintObject(ctx,item,o,d,ratio){
    const unit=Math.min(d.width,d.height)/100;
    ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
    if(o.shadow.enabled){ctx.shadowColor=M.colorCSS(o.shadow.color);ctx.shadowBlur=o.shadow.blur*unit*ratio;ctx.shadowOffsetX=o.shadow.offsetX*unit*ratio;ctx.shadowOffsetY=o.shadow.offsetY*unit*ratio;}
    const filled=item.kind==='dot'||item.filled;
    if(o.outline.enabled){
      if(filled){if(o.geometry){authoredOuterSilhouette(ctx,item,o.outline.width*unit);ctx.fillStyle=M.colorCSS(o.outline.color);ctx.fill();}else{filledOutlinePath(ctx,item,o.outline.width*unit);ctx.fillStyle=M.colorCSS(o.outline.color);ctx.fill();}}
      else{shapePath(ctx,item);ctx.strokeStyle=M.colorCSS(o.outline.color);ctx.lineWidth=item.lineWidth+2*o.outline.width*unit;ctx.stroke();}
      ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
    }
    ctx.fillStyle=item.color;ctx.strokeStyle=item.color;ctx.lineWidth=item.lineWidth||1;shapePath(ctx,item);if(filled)ctx.fill();else ctx.stroke();
  }
  function paintScene(ctx,target,documentValue,d,frame){
    const accepted=M.canonicalScene(documentValue);resetContext(ctx);
    const content=M.contentRect(accepted,d.width,d.height);
    ctx.fillStyle='#000';ctx.fillRect(0,0,target.width,target.height);
    ctx.fillStyle=M.colorCSS(accepted.scene.background);ctx.fillRect(content.x*target.width/d.width,content.y*target.height/d.height,content.width*target.width/d.width,content.height*target.height/d.height);
    const ratio=target.width/d.width;
    ctx.setTransform(ratio,0,0,target.height/d.height,0,0);ctx.lineJoin='round';
    const alphas=frame?new Map(frame.items.map(item=>[item.id,item.alpha])):null;
    M.geometry(accepted,d.width,d.height).forEach((item,index)=>{
      const o=accepted.scene.objects[index],alpha=alphas?(alphas.get(o.id)||0):1;
      if(alpha<=0)return;
      if(alpha<1){
        if(!offscreenContext||target===offscreen)throw new Error('The item compositing canvas is unavailable.');
        // Build one transparent item layer, including its effects, then apply
        // opacity once. Reuse the existing second canvas, never a third buffer.
        resetContext(offscreenContext);offscreenContext.clearRect(0,0,offscreen.width,offscreen.height);
        offscreenContext.setTransform(offscreen.width/d.width,0,0,offscreen.height/d.height,0,0);offscreenContext.lineJoin='round';
        paintObject(offscreenContext,item,o,content,offscreen.width/d.width);resetContext(offscreenContext);
        resetContext(ctx);ctx.globalAlpha=alpha;ctx.drawImage(offscreen,0,0);resetContext(ctx);
        ctx.setTransform(ratio,0,0,target.height/d.height,0,0);ctx.lineJoin='round';
      }else paintObject(ctx,item,o,content,ratio);
    });
    resetContext(ctx);
  }
  function stepScene(index){
    const step=sequence.sequence.steps[index];
    const authored=sequence.version===S.AUTHORED_VERSION;
    return M.canonicalScene({format:M.FORMAT,version:authored?M.AUTHORED_VERSION:M.VERSION,sampler:authored?M.AUTHORED_SAMPLER:M.SAMPLER,scene:{name:step.name,background:sequence.sequence.background,pulsePeriodMs:step.pulsePeriodMs,objects:step.objects,...(authored?{canvas:step.canvas}:{})}});
  }
  function draw(state){
    const d=prepareBuffers();if(!context)return false;
    resetContext(context);context.fillStyle='#000';context.fillRect(0,0,canvas.width,canvas.height);
    if(!state.visible)return true;
    if(displayKind==='items'&&itemFrame){paintScene(context,canvas,itemSource,d,itemFrame);}
    else if(displayKind==='timed'&&paintedFrame){
      const frame=paintedFrame;paintScene(context,canvas,stepScene(frame.stepIndex),d);
      if(frame.phase==='transition'){
        if(!offscreenContext)throw new Error('The transition canvas is unavailable.');
        paintScene(offscreenContext,offscreen,stepScene(frame.nextStepIndex),d);
        resetContext(context);context.globalAlpha=frame.alpha;context.drawImage(offscreen,0,0);resetContext(context);
      }
    }else paintScene(context,canvas,displayKind==='step'?stepScene(stepIndex):displayKind==='live'?state.draft:state.current,d);
    recordVisibleDisplay(state);return true;
  }
  // These bounded editor samples represent only the current form colors. They
  // never change the accepted scene, call Show, or paint a scene preview.
  function updateColorSample(prefix){
    const swatch=$(prefix+'-color-swatch'),description=$(prefix+'-color-text');
    const present=prefix==='background'||!!selected();
    const color={h:number(prefix+'-hue'),s:number(prefix+'-saturation'),l:number(prefix+'-lightness')};
    const background=prefix==='background',effect=prefix==='outline'||prefix==='shadow';
    const valid=Number.isInteger(color.h)&&color.h>=0&&color.h<=359&&Number.isInteger(color.s)&&color.s>=0&&color.s<=(background?100:70)&&Number.isInteger(color.l)&&color.l>=((background||effect)?0:10)&&color.l<=(background?40:70);
    swatch.hidden=!present;
    if(!present||!valid){
      swatch.style.backgroundColor='transparent';
      swatch.setAttribute('aria-label',present?'Color sample unavailable: check the color values.':'No object selected.');
      description.textContent=present?'Check the color values.':'No object selected.';
      ['hue','saturation','lightness'].forEach(channel=>{$(prefix+'-'+channel).style.backgroundImage='none';});
      return;
    }
    const css=M.colorCSS(color),text='HSL '+color.h+'° / '+color.s+'% / '+color.l+'%';
    swatch.style.backgroundColor=css;
    swatch.setAttribute('aria-label',prefix[0].toUpperCase()+prefix.slice(1)+' color sample: '+text+'.');
    description.textContent=text;
    const gradient=colors=>'linear-gradient(to right, '+colors.join(', ')+')';
    $(prefix+'-hue').style.backgroundImage=gradient([0,60,120,180,240,300,359].map(h=>M.colorCSS({...color,h})+' '+(h/359*100)+'%'));
    $(prefix+'-saturation').style.backgroundImage=gradient([0,background?100:70].map(s=>M.colorCSS({...color,s})));
    const min=background||effect?0:10,max=background?40:70;
    $(prefix+'-lightness').style.backgroundImage=gradient((background?[min,max]:[min,50,max]).map(l=>M.colorCSS({...color,l})+' '+((l-min)/(max-min)*100)+'%'));
  }
  function precisionLimit(id,key){const node=$(id),value=node[key]||node.getAttribute(key);return Number(value);}
  function updateOutputs(){
    sliderIDs.forEach(id=>{
      const node=$(id),numeric=$(id+'-value');
      if(!rawPrecision.has(id))numeric.value=node.value;
      numeric.disabled=node.disabled;numeric.min=String(precisionLimit(id,'min'));numeric.max=String(precisionLimit(id,'max'));
      const value=number(id),min=precisionLimit(id,'min'),step=precisionLimit(id,'step'),steps=(value-min)/step;
      const valid=Number.isFinite(value)&&value>=min&&value<=precisionLimit(id,'max')&&Math.abs(steps-Math.round(steps))<1e-8;
      numeric.setAttribute('aria-invalid',String(!valid));
      $(id+'-decrease').disabled=node.disabled||!valid||value<=precisionLimit(id,'min');
      $(id+'-increase').disabled=node.disabled||!valid||value>=precisionLimit(id,'max');
    });
    colorPrefixes.forEach(updateColorSample);
  }
  function render(){
    let state=controller.getState();
    if(gateClockFault&&state.visible){cancelPlayback('technical-failure');controller.hide();state=controller.getState();}
    const full=document.fullscreenElement===root;
    root.className='stage-root'+(full?' fullscreen-mode':'')+(state.visible?' scene-visible':'')+(state.visible&&['live','items'].includes(displayKind)&&editorOpen&&!full?' live-editor':'');
    $('editor-panel').hidden=!editorOpen;
    // Resolve control rows before sizing the canvas; mode switches must not
    // resize a freshly painted frame or let an inspector obscure item playback.
    updateOutputs();renderSequence();renderItemEditor();renderItemPlayback();
    try{draw(state);}catch(e){
      // If even clearing fails, remove the raster surface; the root is black.
      cancelPlayback('technical-failure');controller.hide();canvas.hidden=true;context=null;state=controller.getState();
      say('The canvas could not be drawn. The field is hidden; data controls remain available.',true);
    }
    $('visibility-label').textContent=state.visible?'Visible':'Hidden';
    $('show-scene').setAttribute('aria-pressed',String(state.visible));
    canvas.setAttribute('aria-label',placing?'Placement active. Click or tap a position for the selected object.'+(isLive()?' Live draft displayed.':' The scene is hidden.')+' Escape cancels.':state.visible?(displayKind==='live'?'Live draft. '+M.describe(state.draft):displayKind==='items'?itemDescription():displayKind==='scene'?M.describe(state.current):sequenceDescription()):'Scene hidden. No design is displayed.');
    $('undo').disabled=state.undoCount===0;$('redo').disabled=state.redoCount===0;
    $('draft-label').textContent=formDirty?(isLive()?'Live draft':'Changes staged'):'Applied';
    $('show-scene').textContent=isLive()?'Live preview on':'Resume live preview';$('show-scene').disabled=isLive();
    $('scene-description').textContent=(isLive()?'Live draft: ':'Applied scene: ')+M.describe(isLive()?state.draft:state.current);
    $('object-count').textContent=working.scene.objects.length+' / '+M.MAX_OBJECTS;
    $('add-object').disabled=working.scene.objects.length>=M.MAX_OBJECTS;
    $('place-object').setAttribute('aria-pressed',String(placing));
    $('place-object').textContent=placing?'Cancel placement':'Place on field';
    canvas.setAttribute('tabindex',!full&&(placing||(isLive()&&section==='scene'))?'0':'-1');
    canvas.className=placing?'placing':isLive()&&section==='scene'&&!full?'direct-edit'+(gesture&&gesture.moved?' dragging':''):'';
    $('undo-image-replacement').disabled=!imageReplacement;
    $('undo-move').disabled=!moveUndo.length;$('redo-move').disabled=!moveRedo.length;
    $('cycle-overlap').disabled=!lastHit||lastHit.ids.length<2;
    ['nudge-left','nudge-right','nudge-up','nudge-down','layer-back','layer-front'].forEach(id=>{$(id).disabled=!selected();});
    $('editor-panel').hidden=!editorOpen;
    $('editor-toggle').setAttribute('aria-expanded',String(editorOpen));
    $('editor-toggle').textContent=editorOpen?'Close editor':'Open editor';
    // Native fullscreen is a viewing surface. Hide whole editor/navigation
    // subtrees so their controls leave both the layout and keyboard tab order.
    ['masthead','stage-body','viewing-bar','skip-controls'].forEach(id=>{$(id).hidden=full;});
    $('hidden-label').hidden=state.visible||full;
    $('fullscreen-start').hidden=!full||state.visible;
    $('fullscreen').hidden=full;$('exit-fullscreen').hidden=!full;
    syncArrangementControls();
  }
  function cancelPlacement(){placing=false;}
  function selected(){return working.scene.objects.find(o=>o.id===selectedId);}
  function updateObjectList(){
    $('object-select').replaceChildren();
    working.scene.objects.forEach((o,i)=>{const option=document.createElement('option');option.value=o.id;option.textContent=(i+1)+'. '+o.shape+' ('+o.id+')'+(locks.has(o.id)?' · locked':'');$('object-select').appendChild(option);});
    if(!working.scene.objects.length){const option=document.createElement('option');option.value='';option.textContent='No objects · background only';$('object-select').appendChild(option);}
    $('object-select').value=selectedId||'';$('object-select').disabled=!working.scene.objects.length;
  }
  function fillSelected(){
    const o=selected(),authored=working.version===M.AUTHORED_VERSION;
    ['shape','add-shape'].forEach(id=>{const value=$(id).value;$(id).replaceChildren();(authored?G.SHAPES:M.SHAPES).forEach(shape=>{const opt=document.createElement('option');opt.value=shape;opt.textContent=shape;$(id).appendChild(opt);});if((authored?G.SHAPES:M.SHAPES).includes(value))$(id).value=value;});
    $('canvas-ratio').disabled=!authored;$('canvas-ratio').value=authored?working.scene.canvas.ratio:'1:1';
    $('canvas-mode-hint').textContent=authored?'Fixed-ratio v4 draft. Black margins are outside the authored canvas. Apply commits this format for download.':'Legacy viewport scene. Conversion is explicit and may change proportions; review before Apply.';
    $('authored-geometry').hidden=!authored;
    geometryFields.forEach(id=>$(id).disabled=!authored||!o);
    if(authored&&o){const g=o.geometry;$('geometry-height').value=String(g.height);$('geometry-rotation').value=String(g.rotation);$('geometry-fill').value=g.fill?'filled':'outline';$('geometry-sides').value=String(g.sides||5);$('geometry-inner').value=String(g.innerRatio||0.5);$('geometry-corner').value=String(g.cornerRadius??0.2);$('geometry-height').disabled=['dot','pixel','circle','square'].includes(o.shape);$('geometry-fill').disabled=['dot','pixel'].includes(o.shape);$('geometry-sides').disabled=!['polygon','star'].includes(o.shape);$('geometry-sides').max=o.shape==='star'?'16':'32';$('geometry-inner').disabled=o.shape!=='star';$('geometry-corner').disabled=o.shape!=='rounded-rectangle';}

    [...objectFields,'place-object','delete-object','duplicate-object','item-after-previous'].forEach(id=>{$(id).disabled=!o;});
    if(o){
      $('shape').value=o.shape;$('position-x').value=String(o.x);$('position-y').value=String(o.y);$('size').value=String(o.size);
      $('object-hue').value=String(o.color.h);$('object-saturation').value=String(o.color.s);$('object-lightness').value=String(o.color.l);
      $('size').max=o.shape==='dot'||o.shape==='pixel'?'8':'28';
      ['outline','shadow'].forEach(prefix=>{
        const effect=o[prefix];$(prefix+'-enabled').checked=effect.enabled;
        ['hue','saturation','lightness'].forEach((channel,i)=>$(prefix+'-'+channel).value=String(effect.color[['h','s','l'][i]]));
      });
      $('outline-width').value=String(o.outline.width);$('shadow-offset-x').value=String(o.shadow.offsetX);$('shadow-offset-y').value=String(o.shadow.offsetY);$('shadow-blur').value=String(o.shadow.blur);
      [['item-start','startMs'],['item-fade-in','fadeInMs'],['item-hold','holdMs'],['item-fade-out','fadeOutMs']].forEach(([id,key])=>$(id).value=String(o.timing[key]/1000));
      $('pulse-enabled').value=o.timing.pulse.enabled?'pulse':'steady';$('pulse-min-opacity').value=String(Math.round(o.timing.pulse.minOpacity*100));
    }
    objectFields.forEach(id=>rawPrecision.delete(id));updateObjectList();updateOutputs();
  }
  function fillFields(scene){
    clearMoveHistory();rawPrecision.clear();working=copy(M.canonicalScene(scene));
    if(!working.scene.objects.some(o=>o.id===selectedId))selectedId=working.scene.objects[0]?.id||null;
    $('scene-name').value=working.scene.name;$('pulse-period').value=String(working.scene.pulsePeriodMs/1000);
    const b=working.scene.background;$('background-hue').value=String(b.h);$('background-saturation').value=String(b.s);$('background-lightness').value=String(b.l);
    fillSelected();
  }
  function readFields(){
    const next=copy(working),s=next.scene;
    s.name=$('scene-name').value;s.pulsePeriodMs=milliseconds('pulse-period');s.background={h:number('background-hue'),s:number('background-saturation'),l:number('background-lightness')};
    const o=s.objects.find(item=>item.id===selectedId);
    if(o&&!locks.has(o.id)){o.shape=$('shape').value;o.x=number('position-x');o.y=number('position-y');o.size=number('size');o.color={h:number('object-hue'),s:number('object-saturation'),l:number('object-lightness')};
      o.outline={enabled:$('outline-enabled').checked,width:number('outline-width'),color:{h:number('outline-hue'),s:number('outline-saturation'),l:number('outline-lightness')}};
      o.shadow={enabled:$('shadow-enabled').checked,offsetX:number('shadow-offset-x'),offsetY:number('shadow-offset-y'),blur:number('shadow-blur'),color:{h:number('shadow-hue'),s:number('shadow-saturation'),l:number('shadow-lightness')}};
      if(next.version===M.AUTHORED_VERSION)o.geometry={height:['dot','pixel','circle','square'].includes(o.shape)?o.size:number('geometry-height'),rotation:number('geometry-rotation'),fill:['dot','pixel'].includes(o.shape)||$('geometry-fill').value==='filled',...(['polygon','star'].includes(o.shape)?{sides:number('geometry-sides')}:{}),...(o.shape==='star'?{innerRatio:number('geometry-inner')}:{}),...(o.shape==='rounded-rectangle'?{cornerRadius:number('geometry-corner')}:{})};
      o.timing={startMs:milliseconds('item-start'),fadeInMs:milliseconds('item-fade-in'),holdMs:milliseconds('item-hold'),fadeOutMs:milliseconds('item-fade-out'),pulse:{enabled:$('pulse-enabled').value==='pulse',minOpacity:number('pulse-min-opacity')/100}};
    }
    return next;
  }
  function hide(message,reason='unknown'){cancelPlacement();conceal(reason);render();say(message||'Scene hidden. Showing it again requires a fresh action after the repeat-action lock.');}
  function isLive(){return displayKind==='live'&&controller.getState().visible;}
  function beginManualEdit(){
    if(journalUI)journalUI.invalidateExport();if(imageUI)imageUI.invalidate();if(galleryUI)galleryUI.invalidate('Static thumbnails hidden because the scene or controls changed.');
    cancelDirectGesture();
    if(isLive())controller.invalidateImport();
    else if(controller.getState().visible)conceal();
    else{cancelPlayback();controller.invalidateImport();}
    cancelPlacement();
  }
  function locksAllow(value){
    if(!locks.ids().length||locks.allows(value))return true;
    say('Unlock affected items before changing or removing their stored properties.',true);return false;
  }
  function blockedSelected(){
    if(!locks.has(selectedId))return false;
    fillSelected();render();say('This item is locked. Unlock it to edit its stored properties.',true);return true;
  }
  function clearReplacementLocks(){const changed=locks.clear();if(changed)fillSelected();return changed?' Session item locks cleared because the scene was replaced.':'';}
  function replaceDraft(value,message){
    const next=M.canonicalScene(value),before=copy(working),id=selectedId;
    fillFields(next);
    if(stageWorking(message,true))return true;
    selectedId=id;fillFields(before);render();return false;
  }
  function syncArrangementControls(){
    const locked=locks.has(selectedId),count=locks.ids().length;
    $('lock-selected').disabled=!selected();$('lock-selected').textContent=locked?'Unlock selected item':'Lock selected item';$('lock-selected').setAttribute('aria-pressed',String(locked));
    $('unlock-all').disabled=!count;$('lock-status').textContent=count?count+' session item lock'+(count===1?'':'s')+'. Accepted scene Undo/Redo unavailable until all items are unlocked.':'No session item locks.';
    if(count){$('undo').disabled=true;$('redo').disabled=true;}
    if(locked)[...objectFields,...geometryFields,'place-object','delete-object','item-after-previous','nudge-left','nudge-right','nudge-up','nudge-down','layer-back','layer-front'].forEach(id=>$(id).disabled=true);
    ['align-x','align-y','align-both'].forEach(id=>$(id).disabled=!selected()||locked);
    if(moveUndo.length&&count&&!locks.allows(moveUndo.at(-1).before))$('undo-move').disabled=true;
    if(moveRedo.length&&count&&!locks.allows(moveRedo.at(-1).after))$('redo-move').disabled=true;
    updateOutputs();
  }
  $('lock-selected').addEventListener('click',()=>{
    beginManualEdit();
    if(locks.has(selectedId)){locks.unlock(selectedId);fillSelected();render();say('Item unlocked.');return;}
    try{const value=M.canonicalScene(readFields());if(!selected())return;locks.lock(value,selectedId);working=value;fillSelected();render();say('Item locked for this session. Global background and shared timing remain editable.');}catch(e){render();say(e.message,true);}
  });
  $('unlock-all').addEventListener('click',()=>{beginManualEdit();locks.clear();fillSelected();render();say('All session item locks cleared.');});
  $('snap-step').addEventListener('change',()=>{beginManualEdit();const value=Number($('snap-step').value);if(![0,1,5,10].includes(value)){$('snap-step').value=String(snapStep);render();say('Choose Off, 1, 5 or 10 for snapping.',true);return;}snapStep=value;render();say(snapStep?'Drag and placement snap to '+snapStep+'-unit centers. Typed positions and nudges remain exact.':'Drag and placement snapping off.');});
  ['x','y','both'].forEach(axis=>$('align-'+axis).addEventListener('click',()=>{
    if(blockedSelected()||!selected())return;beginManualEdit();
    try{const before=M.canonicalScene(readFields()),next=E.align(before,selectedId,axis);if(stageMove(next)){recordMove(before,next);render();}}catch(e){render();say(e.message,true);}
  }));
  function stageWorking(message,replacement=false){
    if(!replacement&&M.validateScene(working).ok&&!locksAllow(working)){working=copy(controller.getState().draft);fillSelected();render();say('Locked item change rejected. Unlock affected items first.',true);return false;}
    if(!moveStaging)clearMoveHistory();
    const live=isLive();formDirty=true;
    if(live&&!sameScene(controller.getState().draft,working))provenanceIdentity++;
    const result=live?controller.stageLive(working):controller.stage(working);
    if(!result.ok&&live)conceal();
    const replacementNotice=result.ok&&replacement?clearReplacementLocks():'';
    render();say(result.ok?(live?'Live draft updated. Apply keeps it for history and download; Hide stops preview.':message)+replacementNotice:result.error+' Preview stopped. Your applied scene is unchanged.',!result.ok);return result.ok;
  }
  function edited(event){
    if([...objectFields,...geometryFields].includes(event.target.id)&&blockedSelected())return;
    beginManualEdit();
    if(event.target.id==='size'&&working.version===M.AUTHORED_VERSION&&['dot','pixel','circle','square'].includes($('shape').value))$('geometry-height').value=$('size').value;
    if(event.target.id==='shape'){
      const max=$('shape').value==='dot'||$('shape').value==='pixel'?8:28;$('size').max=String(max);if(number('size')>max)$('size').value=String(max);
    }
    working=readFields();if(event.target.id==='shape')fillSelected();updateObjectList();stageWorking('Changes staged. Choose Resume live preview to see this draft immediately.');
  }
  fieldIDs.concat(geometryFields).forEach(id=>$(id).addEventListener(id.endsWith('-enabled')?'change':'input',event=>{if(sliderIDs.includes(id))rawPrecision.delete(id);edited(event);}));
  sliderIDs.forEach(id=>{
    const range=$(id),numeric=$(id+'-value');
    numeric.addEventListener('input',()=>{
      rawPrecision.set(id,numeric.value);const value=number(id);
      if(Number.isFinite(value)&&value>=precisionLimit(id,'min')&&value<=precisionLimit(id,'max'))range.value=String(value);
      edited({target:range});
    });
    ['decrease','increase'].forEach(direction=>$(id+'-'+direction).addEventListener('click',()=>{
      const value=number(id);if(!Number.isFinite(value)||range.disabled){say('Enter a valid number before using the step buttons.',true);return;}
      const step=precisionLimit(id,'step'),next=Math.max(precisionLimit(id,'min'),Math.min(precisionLimit(id,'max'),value+(direction==='increase'?step:-step)));
      rawPrecision.delete(id);range.value=String(Math.round(next*100)/100);numeric.value=range.value;edited({target:range});
    }));
  });
  $('object-select').addEventListener('change',()=>{
    const nextId=$('object-select').value;beginManualEdit();working=readFields();
    if(working.scene.objects.some(o=>o.id===nextId))selectedId=nextId;
    fillSelected();render();say('Selected '+(selectedId||'background only')+'. Existing staged changes are kept.'+(isLive()?' Live preview continues.':' The field is hidden.'));
  });
  $('add-shape').addEventListener('change',()=>{beginManualEdit();render();say('New object type selected.'+(isLive()?' Add it to update the live draft.':' The field is hidden.'));});
  $('add-object').addEventListener('click',()=>{
    beginManualEdit();working=readFields();
    const checked=M.validateScene(working);
    if(!checked.ok){render();say('Fix the staged fields before adding an object. '+checked.error,true);return;}
    if(working.scene.objects.length>=M.MAX_OBJECTS){render();say('This prototype supports up to 12 objects.',true);return;}
    const shape=$('add-shape').value;if(!(working.version===M.AUTHORED_VERSION?G.SHAPES:M.SHAPES).includes(shape)){render();say('Choose one of the listed object shapes.',true);return;}
    let n=1;while(working.scene.objects.some(o=>o.id==='object-'+n))n++;
    const o=working.version===M.AUTHORED_VERSION?M.defaultAuthoredObject('object-'+n,shape):M.defaultObject('object-'+n,shape);
    working.scene.objects.push(o);selectedId=o.id;fillSelected();stageWorking('New '+shape+' staged at the center. Set its position or choose Place on field.');
  });
  function reorderObject(direction){if(blockedSelected())return;beginManualEdit();try{working=M.canonicalScene(readFields());const index=working.scene.objects.findIndex(o=>o.id===selectedId),next=index+direction;if(index<0||next<0||next>=working.scene.objects.length){render();say('This item is already at that edge of the layer order.');return;}[working.scene.objects[index],working.scene.objects[next]]=[working.scene.objects[next],working.scene.objects[index]];fillSelected();stageWorking('Layer order changed in the draft. Later items appear in front.');}catch(e){render();say(e.message,true);}}
  $('layer-back').addEventListener('click',()=>reorderObject(-1));$('layer-front').addEventListener('click',()=>reorderObject(1));
  $('delete-object').addEventListener('click',()=>{
    if(blockedSelected())return;beginManualEdit();working=readFields();
    const index=working.scene.objects.findIndex(o=>o.id===selectedId);if(index<0){render();return;}
    working.scene.objects.splice(index,1);selectedId=working.scene.objects[Math.min(index,working.scene.objects.length-1)]?.id||null;
    fillSelected();stageWorking('Object removed from the draft. Apply changes to keep this composition.');
  });
  $('place-object').addEventListener('click',()=>{
    if(blockedSelected())return;const wasPlacing=placing;beginManualEdit();working=readFields();
    const checked=M.validateScene(working);if(!checked.ok){render();say('Fix the staged fields before placing an object. '+checked.error,true);return;}
    if(!selected()){render();return;}
    placing=!wasPlacing;if(placing)editorOpen=false;render();
    say(placing?'Placement active for '+selectedId+'. Click or tap the field once.'+(isLive()?' Live preview continues.':' The draft stays hidden.')+' Escape, Hide or End cancels.':'Placement canceled.');
    if(placing)canvas.focus();
  });
  canvas.addEventListener('pointerup',event=>{
    if(!placing||locks.has(selectedId)||event.isPrimary===false||(event.button!==undefined&&event.button!==0))return;
    const o=selected(),outer=canvas.getBoundingClientRect(),content=M.contentRect(working,outer.width,outer.height),rect={left:outer.left+content.x,top:outer.top+content.y,width:content.width,height:content.height};
    if(!o||rect.width<=0||rect.height<=0||!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return;
    if(working.version===M.AUTHORED_VERSION&&(event.clientX<rect.left||event.clientX>rect.left+rect.width||event.clientY<rect.top||event.clientY>rect.top+rect.height)){say('Choose a position inside the authored canvas, not the black margins.',true);return;}
    const before=copy(working);
    try{const next=E.place(before,o.id,(event.clientX-rect.left)*100/rect.width,(event.clientY-rect.top)*100/rect.height,snapStep);cancelPlacement();editorOpen=true;if(stageMove(next)){recordMove(before,next);render();$('position-x').focus();}}catch(e){hide('Placement canceled. '+e.message);}

  });
  // A drag is a draft transaction, never an Apply or a reveal action.
  function clearMoveHistory(){imageReplacement=null;moveUndo=[];moveRedo=[];lastHit=null;}
  function sameScene(a,b){return JSON.stringify(a)===JSON.stringify(b);}
  function releaseCapture(active){if(!active)return;try{if(typeof canvas.hasPointerCapture==='function'&&canvas.hasPointerCapture(active.pointerId))canvas.releasePointerCapture(active.pointerId);}catch(e){/* Concealment and rollback do not depend on capture. */}}
  function cancelDirectGesture(){
    lockedTouchIntent=null;
    const active=gesture;if(!active)return;gesture=null;releaseCapture(active);
    working=copy(active.before);selectedId=active.id;formDirty=active.wasDirty;controller.stage(working);fillSelected();
  }
  function recordMove(before,after,id=selectedId){
    if(sameScene(before,after))return;
    moveUndo.push({before:copy(before),after:copy(after),id});if(moveUndo.length>E.HISTORY_LIMIT)moveUndo.shift();moveRedo=[];
  }
  function stageMove(next){
    if(!locksAllow(next))return false;
    if(!sameScene(working,next)){lastHit=null;imageReplacement=null;}
    working=copy(next);fillSelected();moveStaging=true;
    try{return stageWorking('Position changed in the draft. Apply keeps it for download.');}finally{moveStaging=false;}
  }
  function selectAtEnd(){
    editorOpen=true;section='scene';fillSelected();render();
    $('object-select').scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
    say('Selected '+selectedId+'. Drag or use the position controls to move it.');
  }
  canvas.addEventListener('pointerdown',event=>{
    lockedTouchIntent=null;
    if(gesture){if(event.pointerId!==gesture.pointerId)hide('Move canceled because another pointer touched the field.');return;}
    if(placing||!isLive()||section!=='scene'||document.fullscreenElement===root||event.isPrimary===false||(event.button!==undefined&&event.button!==0))return;
    const rect=canvas.getBoundingClientRect(),p=E.point(rect,event.clientX,event.clientY);if(!p)return;
    const checked=M.validateScene(readFields());if(!checked.ok){hide('Fix invalid fields before direct editing.');return;}
    const ids=E.hits(checked.scene,rect.width,rect.height,p.x,p.y,event.pointerType==='touch'?12:6);
    lastHit={ids,x:p.x,y:p.y,width:rect.width,height:rect.height};if(!ids.length){render();return;}
    working=copy(checked.scene);selectedId=ids[0];fillSelected();
    if(locks.has(selectedId)){selectAtEnd();if(event.pointerType==='touch'&&event.isPrimary===true)lockedTouchIntent={id:selectedId};say('Selected locked item. Unlock it in the inspector to move it.');return;}
    gesture={id:selectedId,pointerId:event.pointerId,pointerType:event.pointerType,isPrimary:event.isPrimary===true,before:copy(working),wasDirty:formDirty,startX:event.clientX,startY:event.clientY,rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height},moved:false,selectionOnly:typeof canvas.setPointerCapture!=='function'};
    try{if(typeof canvas.setPointerCapture==='function')canvas.setPointerCapture(event.pointerId);}catch(e){hide('Move canceled because pointer capture is unavailable. Use position controls.');return;}
    // Touch panning is disabled by touch-action:none, not cancellation of pointer events.
    if(event.pointerType!=='touch')event.preventDefault();canvas.focus();
  });
  canvas.addEventListener('touchstart',event=>{
    const intent=lockedTouchIntent;lockedTouchIntent=null;
    if(intent&&event.target===canvas&&event.cancelable&&event.touches?.length===1&&isLive()&&!placing&&section==='scene'&&document.fullscreenElement!==root&&selectedId===intent.id&&locks.has(intent.id)&&M.validateScene(readFields()).ok)event.preventDefault();
  },{passive:false});
  ['touchend','touchcancel'].forEach(type=>canvas.addEventListener(type,()=>{lockedTouchIntent=null;},{passive:true}));
  canvas.addEventListener('touchstart',event=>{
    const active=gesture;
    // Consume only the direct-edit touch start, upstream of browser scroll/fling recognition.
    // Pointer events continue to own selection, translation, capture and transaction history.
    if(event.target!==canvas||!event.cancelable||!event.touches||event.touches.length!==1||!active||active.pointerType!=='touch'||!active.isPrimary||active.selectionOnly||placing||!isLive()||section!=='scene'||document.fullscreenElement===root||selectedId!==active.id||!M.validateScene(readFields()).ok)return;
    event.preventDefault();
  },{passive:false});
  function updateDirectGesture(event,cancelDefault=true){
    const active=gesture;if(!active||active.selectionOnly||event.pointerId!==active.pointerId||!isLive())return;
    if(selectedId!==active.id){hide('Move canceled because the selected item changed.');return;}
    if(!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return;
    const current=canvas.getBoundingClientRect();if(['left','top','width','height'].some(key=>current[key]!==active.rect[key])){hide('Move canceled because the preview layout changed.');return;}
    const dx=event.clientX-active.startX,dy=event.clientY-active.startY;
    if(!active.moved&&Math.hypot(dx,dy)<E.DRAG_THRESHOLD)return;
    active.moved=true;if(cancelDefault&&event.pointerType!=='touch')event.preventDefault();
    try{if(!stageMove(E.translate(active.before,active.id,dx,dy,active.rect.width,active.rect.height,snapStep)))hide('Move canceled because the position is invalid.');}catch(e){hide('Move canceled. '+e.message);}
  }
  canvas.addEventListener('pointermove',updateDirectGesture);
  canvas.addEventListener('pointerup',event=>{
    lockedTouchIntent=null;
    const active=gesture;if(!active||event.pointerId!==active.pointerId)return;
    updateDirectGesture(event,false);if(gesture!==active)return;
    gesture=null;releaseCapture(active);
    if(active.moved)recordMove(active.before,working,active.id);
    selectAtEnd();
  });
  ['pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,event=>{lockedTouchIntent=null;if(gesture&&event.pointerId===gesture.pointerId)hide('Move canceled. Starting position restored; preview hidden.');}));
  $('cycle-overlap').addEventListener('click',()=>{
    lockedTouchIntent=null;
    if(gesture){hide('Move canceled. Select overlapping items after releasing the pointer.');return;}
    if(!lastHit||lastHit.ids.length<2)return;
    const ids=lastHit.ids.filter(id=>working.scene.objects.some(o=>o.id===id));if(!ids.length)return;
    selectedId=ids[(ids.indexOf(selectedId)+1)%ids.length];fillSelected();render();say('Selected overlapping item '+selectedId+'.');
  });
  function nudge(dx,dy){
    if(!selected()||blockedSelected())return;
    beginManualEdit();const before=readFields(),checked=M.validateScene(before);if(!checked.ok){hide('Fix invalid fields before moving.');return;}
    try{const rect=M.contentRect(checked.scene,100,100),next=E.translate(checked.scene,selectedId,dx*rect.width/100,dy*rect.height/100,100,100);if(stageMove(next)){recordMove(checked.scene,next);render();}}catch(e){hide('Move canceled. '+e.message);}
  }
  [['left',-1,0],['right',1,0],['up',0,-1],['down',0,1]].forEach(([direction,dx,dy])=>$('nudge-'+direction).addEventListener('click',()=>nudge(dx,dy)));
  canvas.addEventListener('keydown',event=>{
    const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(event.target!==canvas||!directions[event.key]||event.ctrlKey||event.altKey||event.metaKey||!isLive()||section!=='scene'||document.fullscreenElement===root)return;
    event.preventDefault();const step=event.shiftKey?0.1:1;nudge(...directions[event.key].map(value=>value*step));
  });
  [['undo-move','before'],['redo-move','after']].forEach(([id,key])=>$(id).addEventListener('click',()=>{
    cancelDirectGesture();const from=key==='before'?moveUndo:moveRedo,to=key==='before'?moveRedo:moveUndo,entry=from.at(-1);if(!entry)return;
    if(!locksAllow(entry[key]))return;
    const expected=key==='before'?entry.after:entry.before;
    if(!sameScene(readFields(),expected)){clearMoveHistory();render();say('Move history cleared because other fields changed.');return;}
    conceal();from.pop();to.push(entry);selectedId=entry.id;stageMove(entry[key]);formDirty=!sameScene(controller.getState().current,working);render();say('Draft move '+(key==='before'?'undone':'redone')+'. The preview is hidden; applied scene is unchanged.');
  }));
  $('skip-controls').addEventListener('click',event=>{
    event.preventDefault();conceal();cancelPlacement();editorOpen=true;section='scene';render();$('controls').focus();say('Scene controls focused. The field is hidden.');
  });
  $('viewing-guidance').addEventListener('click',()=>{
    conceal();cancelPlacement();editorOpen=true;render();$('guidance-title').setAttribute('tabindex','-1');$('guidance-title').focus();say('Viewing guidance focused. The field is hidden.');
  });
  $('editor-toggle').addEventListener('click',()=>{
    beginManualEdit();editorOpen=!editorOpen;render();
    say((editorOpen?'Editor open.':'Editor closed.')+(isLive()?' Live preview continues.':' The field is hidden; choose Resume live preview when you choose.'));
    if(editorOpen){const heading=$(section==='scene'?'controls':'sequence-title');heading.setAttribute('tabindex','-1');heading.focus();}else $('editor-toggle').focus();
  });
  function authoredDraft(fresh){
    beginManualEdit();
    try{const next=M.upgradeScene(fresh?M.presets()[1]:readFields(),{mode:'fixed',ratio:'1:1'});replaceDraft(next,'Fixed-ratio draft created. Review proportions and Apply before download.');}catch(e){render();say(e.message,true);}
  }
  $('new-authored-scene').addEventListener('click',()=>authoredDraft(true));
  $('upgrade-scene').addEventListener('click',()=>authoredDraft(false));
  $('canvas-ratio').addEventListener('change',()=>{const ratio=$('canvas-ratio').value;beginManualEdit();try{working=readFields();if(working.version!==M.AUTHORED_VERSION)throw Error('Convert this draft explicitly first.');working.scene.canvas={mode:'fixed',ratio};working=M.canonicalScene(working);stageWorking('Aspect ratio changed in the draft.');}catch(e){render();say(e.message,true);}});
  P.list().forEach(preset=>{const opt=document.createElement('option');opt.value=preset.id;opt.textContent=preset.title;$('authored-preset').appendChild(opt);});
  $('authored-preset').addEventListener('change',()=>{const id=$('authored-preset').value;if(!id)return;beginManualEdit();try{const meta=P.list().find(p=>p.id===id);const next=P.create(id);$('authored-preset-hint').textContent=meta.description+' No efficacy claim. Fully editable; timed playback is optional.';replaceDraft(next,'Authored preset staged, not saved. Playback did not start.');}catch(e){render();say(e.message,true);}});
  $('preset').addEventListener('change',()=>{
    const index=Number($('preset').value);if($('preset').value===''||!Number.isInteger(index)||!M.presets()[index])return;
    beginManualEdit();const next=M.presets()[index];replaceDraft(next,'Preset staged. Choose Resume live preview to see it without Apply.');
  });
  $('scene-form').addEventListener('submit',event=>{
    event.preventDefault();cancelPlacement();conceal();
    const candidate=readFields();if(M.validateScene(candidate).ok&&!locksAllow(candidate)){render();return;}
    const result=controller.apply(candidate);
    if(!result.ok){render();say(result.error,true);return;}
    formDirty=false;fillFields(result.state.current);render();say('Changes applied. The scene is hidden; choose Resume live preview to display it.');
  });
  $('discard').addEventListener('click',()=>{
    cancelPlacement();conceal();if(!locksAllow(controller.getState().current)){render();return;}controller.discard();formDirty=false;fillFields(controller.getState().current);$('preset').value='';render();say('Staged changes discarded. Your applied scene is hidden.');
  });
  function showScene(){
    if(controller.getState().visible&&displayKind!=='live'&&displayKind!=='scene'){hide('Preview mode changed. The field is hidden; choose Resume live preview again after the repeat-action lock.');return;}
    cancelPlayback();cancelPlacement();controller.invalidateImport();
    if(gateClockFault){hide('The display clock failed. Reload this page before showing a scene; keep any unsaved files first.','technical-failure');return;}
    if(!context){render();say('Canvas is unavailable in this browser. The scene stays hidden; JSON editing and downloads remain available.',true);return;}
    working=readFields();
    const result=controller.previewDraft(working);
    if(gateClockFault){hide('The display clock failed. The field is hidden; reload before viewing.','technical-failure');return;}
    if(result.ok)displayKind='live';
    render();say(result.ok?'Live preview on. Object and background edits appear immediately. Apply keeps changes for history/download; Hide or Escape stops preview.':result.error+(document.fullscreenElement===root?' Exit fullscreen to fix the fields or discard the draft.':''),!result.ok);
    if(result.ok&&document.fullscreenElement===root)$('exit-fullscreen').focus();
  }
  $('show-scene').addEventListener('click',showScene);
  $('fullscreen-show').addEventListener('click',()=>section==='sequence'?showStep():showScene());
  $('hide-scene').addEventListener('click',()=>hide(undefined,'user-stop'));
  $('end-viewing').addEventListener('click',()=>{
    cancelPlayback('user-stop');cancelPlacement();controller.end();editorOpen=true;render();say('Viewing ended. Your scene and optional note remain in this open page.');
    $('guidance-title').setAttribute('tabindex','-1');$('guidance-title').focus();
  });
  ['undo','redo'].forEach(action=>$(action).addEventListener('click',()=>{
    if(locks.ids().length){say('Unlock all items before accepted scene Undo/Redo.',true);return;}
    cancelPlacement();conceal();const result=controller[action]();
    if(result.ok){formDirty=false;fillFields(result.state.current);$('preset').value='';}
    render();say(result.ok?(action==='undo'?'Previous':'Next')+' scene restored and hidden. Choose Resume live preview to display it again.':result.error,!result.ok);
  }));
  // Fullscreen is optional. Entry/exit/failure never reveal; the common ancestor
  // includes the always-reachable Exit control. Do not schedule a later Show.
  let fullscreenOperation=0;
  function fullscreenFailure(message){
    hide(message+(document.fullscreenElement===root?' The field is hidden. Try Exit again or leave fullscreen with your browser (usually Escape).':' The field is hidden. The full-window editor and controls are available.'));
  }
  async function changeFullscreen(enter){
    hide(enter?'Entering fullscreen with the field hidden.':'Leaving fullscreen with the field hidden.');
    const operation=++fullscreenOperation,owner=enter?root:document,method=enter?'requestFullscreen':'exitFullscreen';
    if(typeof owner[method]!=='function'){fullscreenFailure('Browser fullscreen could not be changed.');return;}
    try{await owner[method]();if(operation===fullscreenOperation){conceal();cancelPlacement();render();say('Display mode changed. The field is hidden; use the visible preview control when ready.');}}
    catch(e){if(operation===fullscreenOperation)fullscreenFailure('Fullscreen could not be changed.');}
  }
  $('fullscreen').addEventListener('click',()=>changeFullscreen(true));
  $('exit-fullscreen').addEventListener('click',()=>changeFullscreen(false));
  document.addEventListener('fullscreenchange',()=>{
    hide('Fullscreen changed. The field is hidden and will not resume automatically.');
    $(document.fullscreenElement===root?'exit-fullscreen':'fullscreen').focus();
  });
  document.addEventListener('fullscreenerror',()=>fullscreenFailure('Fullscreen was unavailable or rejected.'));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){hide('Scene hidden with Escape. Placement and pending file reads were canceled.','user-stop');}
    if(event.repeat&&(event.key==='Enter'||event.key===' ')&&event.target&&event.target.closest&&event.target.closest('button'))event.preventDefault();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hide('Scene hidden while the page was away. It will not resume automatically.','hidden-tab');});
  window.addEventListener('blur',()=>hide('Scene hidden because the window lost focus. Show it again when you choose.','hidden-tab'));
  window.addEventListener('pagehide',()=>{cancelPlacement();conceal('hidden-tab');render();objectURLs.forEach(url=>URL.revokeObjectURL(url));objectURLs.clear();});
  document.addEventListener('freeze',()=>hide('Scene hidden while the page was suspended. Choose Resume live preview to display it again.','hidden-tab'));
  window.addEventListener('pageshow',event=>{if(event.persisted)hide('Scene hidden after returning to this page. Choose Resume live preview to display it again.');});
  // Initial browser sizing can dispatch resize without changing the viewport.
  // Only a real geometry/DPR change interrupts display; this never reveals it.
  const viewportSize=()=>[window.innerWidth,window.innerHeight,window.devicePixelRatio||1].join(':');
  let lastViewportSize=viewportSize();
  window.addEventListener('resize',()=>{const next=viewportSize();if(next===lastViewportSize)return;lastViewportSize=next;hide('Scene hidden after the window size changed. Choose Resume live preview to display it again.','resize');});
  function download(value,filename) {
    const serialized=JSON.stringify(value,null,2)+'\n';
    let url;
    try {
      const blob=new Blob([serialized],{type:'application/json;charset=utf-8'});
      url=URL.createObjectURL(blob);objectURLs.add(url);
      const link=document.createElement('a');link.href=url;link.download=filename;link.hidden=true;document.body.appendChild(link);link.click();link.remove();
      // Resource cleanup only: never calls the renderer or changes visibility.
      setTimeout(()=>{URL.revokeObjectURL(url);objectURLs.delete(url);},60000);
      say('Download requested. Check your browser’s Downloads to confirm the file was kept.');
    } catch(e) {if(url){URL.revokeObjectURL(url);objectURLs.delete(url);}say('The download could not be started. Your data is still in this page. Try another browser or keep this page open.',true);}
  }
  $('export-scene').addEventListener('click',()=>{
    if(formDirty){controller.invalidateImport();say('Apply or discard staged changes before downloading the scene.',true);return;}
    hide('Scene hidden for download.');
    try{download(M.canonicalScene(controller.getState().current),'imagery-field-scene-v'+controller.getState().current.version+'.json');}catch(e){say(e.message,true);}
  });
  $('scene-import').addEventListener('change',async()=>{
    const file=$('scene-import').files&&$('scene-import').files[0];$('scene-import').value='';if(!file)return;
    cancelPlayback();cancelPlacement();const token=controller.beginImport();render();
    if(file.size>M.MAX_IMPORT_BYTES){controller.invalidateImport();say('Scene file must be no larger than 1 MiB. Your applied scene is unchanged.',true);return;}
    say('Reading the local scene file. The field stays hidden.');
    try{
      const text=await file.text(),state=controller.getState();if(token!==state.epoch||!state.pendingImport)return;
      const result=controller.finishImport(token,text);
      let notice='';if(result.ok){notice=clearReplacementLocks();formDirty=false;fillFields(result.state.current);$('preset').value='';}
      render();say(result.ok?'Scene opened and hidden. Choose Resume live preview to display it again.'+notice:result.error+' Your applied scene is unchanged.',!result.ok);
    }catch(e){const state=controller.getState();if(token!==state.epoch||!state.pendingImport)return;controller.invalidateImport();render();say('The file could not be read. Your applied scene is unchanged.',true);}
  });
  function clearPreview() {notePreview=null;$('include-note').checked=false;$('export-notes').disabled=true;$('notes-export-area').hidden=true;$('notes-preview').textContent='';}
  function readNote() {
    const category=$('note-category').value,text=$('notes').value;
    if(!categories.includes(category))throw new Error('Choose one of the listed observation categories.');
    if(typeof text!=='string' || text.length>4000 || /[\u0000]/.test(text))throw new Error('The note must be at most 4,000 characters and cannot contain null characters.');
    return {format:'imagery-field-note',version:1,category,text};
  }
  function noteEdited(){clearPreview();hide('The field is hidden while you edit your note.');}
  $('notes').addEventListener('input',noteEdited);$('note-category').addEventListener('change',noteEdited);
  $('preview-notes').addEventListener('click',()=>{
    hide('Scene hidden while you review your note.');
    try {notePreview=readNote();$('notes-preview').textContent=JSON.stringify(notePreview,null,2);$('notes-export-area').hidden=false;$('include-note').checked=false;$('export-notes').disabled=true;say('Review the note below, then explicitly include it to enable its separate download.');}catch(e){clearPreview();say(e.message,true);}
  });
  $('include-note').addEventListener('change',()=>{$('export-notes').disabled=!notePreview || !$('include-note').checked;});
  $('export-notes').addEventListener('click',()=>{
    if(!notePreview || !$('include-note').checked){say('Preview and explicitly include the note before downloading it.',true);return;}
    try {
      if(JSON.stringify(readNote())!==JSON.stringify(notePreview)){clearPreview();say('The note changed. Preview it again before downloading.',true);return;}
      hide('Scene hidden for note download.');download(notePreview,'imagery-field-note-v1.json');
    }catch(e){say(e.message,true);}
  });
  // Sequence documents stay separate from static scene history and optional notes.
  let acceptedSequenceName='My sequence',compiledSequence=null;
  function itemDescription(){
    if(!itemFrame||!itemSource)return 'Item preview.';
    const visible=itemFrame.items.filter(item=>item.alpha>0).map(item=>item.id+' '+item.phase+' '+Math.round(item.alpha*100)+' percent');
    return 'Timed items at '+(itemFrame.elapsedMs/1000).toFixed(1)+' seconds. '+(visible.length?visible.join('; '):'Only the steady background is visible.');
  }
  function renderItemEditor(){
    const list=$('item-timeline');list.replaceChildren();
    let compiled=null,error='';
    try{compiled=I.compileTimeline(readFields());}catch(e){error=e.message;}
    const selectedIndex=working.scene.objects.findIndex(o=>o.id===selectedId);
    $('duplicate-object').disabled=!selected()||working.scene.objects.length>=M.MAX_OBJECTS;
    $('item-after-previous').disabled=selectedIndex<=0;
    const pulsing=compiled?compiled.document.scene.objects.filter(o=>o.timing.pulse.enabled).length:0;
    const steady=compiled?compiled.tracks.length-pulsing:0;
    $('item-total').textContent=compiled?'Preview duration: '+(compiled.durationMs/1000)+' seconds · '+steady+' steady · '+pulsing+' pulsing · ends at the last item.':error;
    $('pulse-min-opacity').disabled=!selected()||$('pulse-enabled').value!=='pulse';
    $('pulse-period-hint').textContent=pulsing?'All '+pulsing+' pulsing item'+(pulsing===1?'':'s')+' share this cycle and timeline phase. Steady items do not pulse.':'No pulsing items. This cycle is saved for later and does not affect steady items.';
    $('item-end').textContent=compiled&&selectedIndex>=0?'Selected item ends at '+(compiled.tracks[selectedIndex].endMs/1000)+' seconds.':'Fix the item timing to calculate its end.';
    if(compiled)compiled.tracks.forEach(track=>{
      const o=compiled.document.scene.objects[track.index],button=document.createElement('button');button.type='button';button.className='timeline-track';button.setAttribute('aria-pressed',String(o.id===selectedId));
      const label=document.createElement('span');label.className='track-label';label.textContent=(track.index+1)+'. '+o.shape+' · '+track.startMs/1000+'–'+track.endMs/1000+' s'+(o.timing.pulse.enabled?' · Pulse':' · Steady');button.appendChild(label);
      const detail=document.createElement('span');detail.className='track-detail';detail.textContent='In '+o.timing.fadeInMs/1000+' s · hold '+o.timing.holdMs/1000+' s · out '+o.timing.fadeOutMs/1000+' s';button.appendChild(detail);
      const bar=document.createElement('span');bar.className='track-bar';bar.setAttribute('aria-hidden','true');bar.style.left=(track.startMs/compiled.durationMs*100)+'%';bar.style.width=((track.endMs-track.startMs)/compiled.durationMs*100)+'%';bar.style.color=M.colorCSS(o.color);
      [['fade-in',o.timing.fadeInMs],['hold',o.timing.holdMs],['fade-out',o.timing.fadeOutMs]].forEach(([phase,duration])=>{if(duration){const segment=document.createElement('span');segment.className='track-segment '+phase;segment.style.width=(duration/(track.endMs-track.startMs)*100)+'%';bar.appendChild(segment);}});button.appendChild(bar);
      button.addEventListener('click',()=>{beginManualEdit();working=readFields();selectedId=o.id;fillSelected();render();if(list.children[track.index])list.children[track.index].focus();say('Item '+(track.index+1)+' selected. Timing tracks show overlaps; no automatic chaining.');});list.appendChild(button);
    });
    $('item-play').disabled=!compiled||motionReduced||document.fullscreenElement===root||!context||!offscreenContext;
    $('item-motion-note').hidden=!motionReduced;
  }
  function renderItemPlayback(){
    const previouslyFocused=document.activeElement,state=itemTimeline.getState(),running=state.status==='running',paused=state.status==='paused',active=displayKind==='items'&&(running||paused);
    $('item-view-actions').hidden=!active||section!=='scene';
    if(active&&section==='scene')$('scene-view-actions').hidden=true;
    $('item-pause').hidden=!running;$('item-resume').hidden=!paused;
    $('item-progress').textContent=active?(paused?'Paused':'Playing')+' · '+((itemFrame?itemFrame.elapsedMs:0)/1000).toFixed(1)+' / '+(compiledItems.durationMs/1000)+' s':'Stopped';
    $('item-play').disabled=$('item-play').disabled||active;
    if(!active&&['item-pause','item-resume','item-stop'].some(id=>previouslyFocused===$(id)))$('hide-scene').focus();
  }
  $('duplicate-object').addEventListener('click',()=>{
    beginManualEdit();working=readFields();
    try{working=copy(M.canonicalScene(working));if(!selected())throw new Error('Select an object first.');if(working.scene.objects.length>=M.MAX_OBJECTS)throw new Error('The scene already has 12 objects.');
      let id=1;while(working.scene.objects.some(o=>o.id==='object-'+id))id++;const duplicate=copy(selected());duplicate.id='object-'+id;working.scene.objects.push(duplicate);selectedId=duplicate.id;fillSelected();stageWorking('Item duplicated with the same style, position and timing. It overlaps until you change it.');
    }catch(e){conceal();render();say(e.message,true);}
  });
  $('item-after-previous').addEventListener('click',()=>{
    if(blockedSelected())return;beginManualEdit();working=readFields();
    const index=working.scene.objects.findIndex(o=>o.id===selectedId);if(index<=0){render();return;}
    const t=working.scene.objects[index-1].timing,end=t.startMs+t.fadeInMs+t.holdMs+t.fadeOutMs;
    $('item-start').value=String(end/1000);working=readFields();stageWorking('Start copied from the previous item’s end. Later edits do not automatically move this item.');
  });
  function startItems(){
    if(itemTimeline.getState().status!=='stopped')return;
    // An explicit Play gesture may replace the already visible static editor.
    // Other visible modes must stop first; hidden previews still use the same
    // reveal lock below. cancelPlayback and previewDraft invalidate old work.
    if(controller.getState().visible&&!isLive()){hide('Preview mode changed. Choose Play items once again after the repeat-action lock.');return;}
    if(document.fullscreenElement===root||motionReduced){say(motionReduced?'Reduced motion is on. Use Live preview for a static composition.':'Exit fullscreen to use timed item preview.',true);return;}
    if(!context||!offscreenContext||typeof window.requestAnimationFrame!=='function'){say('Timed item preview is unavailable. Static Live preview may still work.',true);return;}
    cancelPlayback();cancelPlacement();
    try{
      itemSource=M.canonicalScene(readFields());compiledItems=I.compileTimeline(itemSource);const result=controller.previewDraft(itemSource);
      if(gateClockFault){hide('The display clock failed. Reload before viewing.','technical-failure');return;}
      if(!result.ok){render();say(result.error,true);return;}
      const started=itemTimeline.start(compiledItems);displayKind='items';itemFrame=started.frame;render();paintPlayback(started.frame);scheduleFrame();$('item-pause').focus();
      say('Playing items once for '+compiledItems.durationMs/1000+' seconds. Pause retains the displayed frame; Stop / Hide ends preview.');
    }catch(e){hide('Item preview stopped. '+e.message,'technical-failure');}
  }
  $('item-play').addEventListener('click',startItems);
  $('item-pause').addEventListener('click',()=>{
    if(itemTimeline.getState().status!=='running'||!controller.getState().visible)return;
    generation++;if(rafId!==null){window.cancelAnimationFrame(rafId);rafId=null;}
    try{itemTimeline.pause();render();say('Item preview paused at the displayed frame. Resume continues; Stop / Hide conceals.');$('item-resume').focus();}catch(e){hide('Item preview stopped. '+e.message,'technical-failure');}
  });
  $('item-resume').addEventListener('click',()=>{
    if(itemTimeline.getState().status!=='paused'||!controller.getState().visible||motionReduced||document.fullscreenElement===root)return;
    try{generation++;itemTimeline.resume();render();scheduleFrame();say('Item preview resumed.');$('item-pause').focus();}catch(e){hide('Item preview stopped. '+e.message,'technical-failure');}
  });
  $('item-stop').addEventListener('click',()=>hide('Item preview stopped. Field hidden; nothing will replay.','user-stop'));
  function cancelPlayback(reason='edit'){
    stopProvenance(reason);if(galleryUI)galleryUI.invalidate('Static thumbnails hidden. Showing them again requires an explicit gallery action.');
    if(journalUI)journalUI.invalidateExport();if(imageUI)imageUI.invalidate();if(galleryUI)galleryUI.invalidate('Static thumbnails hidden because the scene or controls changed.');
    cancelDirectGesture();
    generation++;
    if(rafId!==null){window.cancelAnimationFrame(rafId);rafId=null;}
    timeline.stop();itemTimeline.stop();paintedFrame=null;itemFrame=null;lastPhaseKey='';displayKind='scene';
  }
  function conceal(reason='edit'){cancelPlayback(reason);controller.hide();}
  function sequenceDescription(){
    if(!sequence)return 'No sequence steps.';
    if(displayKind==='timed'&&paintedFrame){
      const f=paintedFrame,a=sequence.sequence.steps[f.stepIndex];
      return f.phase==='transition'?'Crossfade from '+a.name+' to '+sequence.sequence.steps[f.nextStepIndex].name+', '+Math.round(f.alpha*100)+' percent. '+M.describe(stepScene(f.stepIndex))+' '+M.describe(stepScene(f.nextStepIndex)):M.describe(stepScene(f.stepIndex));
    }
    return M.describe(stepScene(stepIndex));
  }
  function fillStepList(){
    const select=$('sequence-step-select');select.replaceChildren();
    if(sequence)sequence.sequence.steps.forEach((step,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=(i+1)+'. '+step.name;select.appendChild(option);});
    else{const option=document.createElement('option');option.value='';option.textContent='No snapshots yet';select.appendChild(option);}
    select.value=sequence?String(stepIndex):'';
  }
  function fillSequenceFields(){
    $('sequence-name').value=sequence?sequence.sequence.name:acceptedSequenceName;
    fillStepList();const step=sequence&&sequence.sequence.steps[stepIndex];
    $('sequence-step-name').value=step?step.name:'';
    $('sequence-hold').value=String(step?step.holdMs/1000:3);
    $('sequence-transition').value=String(step?step.transitionMs/1000:0);
  }
  function renderSequence(){
    // Native browsers blur a focused control as soon as it becomes hidden or
    // disabled. Preserve the reference before any visibility mutations.
    const previouslyFocused=document.activeElement;
    const count=sequence?sequence.sequence.steps.length:0,invalid=!!sequenceError,full=document.fullscreenElement===root;
    const playback=timeline.getState(),running=playback.status==='running',paused=playback.status==='paused';
    $('hidden-hint').textContent=section==='sequence'?'Capture or load snapshots, then choose Show step or Play once.':'Choose Resume live preview, then edit to see changes immediately.';
    $('workspace-scene').setAttribute('aria-pressed',String(section==='scene'));
    $('workspace-sequence').setAttribute('aria-pressed',String(section==='sequence'));
    $('scene-panel').hidden=section!=='scene';$('sequence-panel').hidden=section!=='sequence';
    $('scene-apply-actions').hidden=section!=='scene';$('sequence-count').textContent=String(count);
    const readableName=value=>String(value).slice(0,64).replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'�').trim()||'Unnamed draft';
    const sourceName=readableName($('scene-name').value),sourceState=formDirty?'Staged edits':'Applied';
    $('capture-source').textContent='From scene: '+sourceName;$('capture-source').title='From scene: '+sourceName;
    $('capture-source-state').textContent=sourceState;
    const replaceContext=count?'Replace selected step '+(stepIndex+1)+' “'+sequence.sequence.steps[stepIndex].name+'” with scene “'+sourceName+'” ('+sourceState.toLowerCase()+').':'Add a scene before replacing a step.';
    $('capture-replace-context').textContent=replaceContext;$('capture-replace').title=replaceContext;
    $('capture-replace').setAttribute('aria-label',(formDirty?'Apply scene and replace step. ':'')+replaceContext);
    $('capture-add').textContent=formDirty?'Apply scene and add step':'Add scene as step';
    $('capture-replace').textContent=formDirty?'Apply scene and replace step':'Replace selected step';
    $('capture-add').disabled=invalid||count>=S.MAX_STEPS;$('capture-replace').disabled=invalid||!count;
    $('sequence-inspector').hidden=!count;$('sequence-step-select').disabled=!count||invalid;
    $('sequence-transition').disabled=!count||stepIndex===count-1;
    $('sequence-final-hint').hidden=!count||stepIndex!==count-1;
    $('sequence-summary').textContent=count?count+' / '+S.MAX_STEPS+' snapshots · '+(compiledSequence.durationMs/1000)+' seconds total · shared background HSL '+sequence.sequence.background.h+'° / '+sequence.sequence.background.s+'% / '+sequence.sequence.background.l+'%':'No steps yet. Add the scene, or load the example.';
    $('sequence-description').textContent=count?M.describe(stepScene(stepIndex)):'';
    $('sequence-error').textContent=sequenceError;$('sequence-error').hidden=!invalid;$('sequence-discard').hidden=!invalid;
    ['sequence-name','sequence-step-name','sequence-hold','sequence-transition'].forEach(id=>$(id).setAttribute('aria-invalid',String(invalid)));
    $('sequence-move-up').disabled=invalid||!count||stepIndex===0;$('sequence-move-down').disabled=invalid||!count||stepIndex===count-1;
    ['sequence-delete','sequence-load','sequence-export'].forEach(id=>{$(id).disabled=invalid||!count;});
    $('sequence-show').disabled=invalid||!count||running||paused;
    $('sequence-previous').disabled=invalid||!count||stepIndex===0;$('sequence-next').disabled=invalid||!count||stepIndex===count-1;
    $('sequence-example').disabled=invalid;
    $('sequence-play').disabled=invalid||!count||motionReduced||full||!context||!offscreenContext;
    $('sequence-play').hidden=running||paused;$('sequence-pause').hidden=!running;$('sequence-resume').hidden=!paused;
    $('sequence-view-actions').hidden=section!=='sequence';$('scene-view-actions').hidden=section==='sequence';
    $('reduced-motion-note').hidden=!motionReduced;
    $('fullscreen-show').textContent=section==='sequence'?'Show selected step':'Live preview';
    if(running||paused){
      const f=paintedFrame,elapsed=f?f.elapsedMs:0;
      $('sequence-progress').textContent=(paused?'Paused':'Playing')+' · '+(elapsed/1000).toFixed(1)+' / '+(compiledSequence.durationMs/1000)+' s';
    }else $('sequence-progress').textContent='Stopped';
    // Completion/cancellation must not strand keyboard focus on a removed
    // Pause/Resume control. Never move focus away from an editing field.
    if(section==='sequence'&&!full){
      if(['sequence-play','sequence-pause','sequence-resume','sequence-show'].some(id=>previouslyFocused===$(id)&&($(id).hidden||$(id).disabled)))$('sequence-stop').focus();
    }
  }
  function setAcceptedSequence(value,compiled){
    sequence=value;compiledSequence=compiled||S.compileTimeline(value);acceptedSequenceName=value.sequence.name;
    stepIndex=Math.min(stepIndex,value.sequence.steps.length-1);sequenceError='';fillSequenceFields();
  }
  function sequencePrecondition(){
    if(sequenceError){say('Fix or discard the invalid sequence fields first. '+sequenceError,true);return false;}
    return true;
  }
  function readSequenceFields(){
    if(!sequence){
      const check=copy(controller.getState().current);check.scene.name=$('sequence-name').value;
      M.canonicalScene(check);return null;
    }
    const next=copy(sequence),step=next.sequence.steps[stepIndex];next.sequence.name=$('sequence-name').value;
    step.name=$('sequence-step-name').value;step.holdMs=number('sequence-hold')*1000;
    step.transitionMs=stepIndex===next.sequence.steps.length-1?0:number('sequence-transition')*1000;
    return S.canonicalSequence(next);
  }
  function editSequence(){
    conceal();cancelPlacement();
    try{
      const accepted=readSequenceFields();
      if(accepted){const compiled=S.compileTimeline(accepted);sequence=accepted;compiledSequence=compiled;acceptedSequenceName=accepted.sequence.name;fillStepList();}
      else acceptedSequenceName=$('sequence-name').value;
      sequenceError='';render();say('Sequence change saved in this page. The field is hidden.');
    }catch(e){sequenceError=e.message;render();say(sequenceError+' Accepted sequence unchanged.',true);}
  }
  ['sequence-name','sequence-step-name','sequence-hold','sequence-transition'].forEach(id=>$(id).addEventListener('input',editSequence));
  $('sequence-discard').addEventListener('click',()=>{conceal();sequenceError='';fillSequenceFields();render();say('Invalid sequence fields discarded. Accepted snapshots are unchanged.');});
  function chooseSection(next){
    conceal();cancelPlacement();section=next;render();$('editor-scroll').scrollTop=0;
    say(next==='sequence'?'Sequence editor. Select a step, then Show step, or choose Play once.':'Scene editor. Choose Resume live preview to see draft changes immediately.');
  }
  $('workspace-scene').addEventListener('click',()=>chooseSection('scene'));
  $('workspace-sequence').addEventListener('click',()=>chooseSection('sequence'));
  function normalizeSteps(steps,formerFinalId){
    const adjusted=[];
    steps.forEach((step,i)=>{
      const value=i===steps.length-1?0:(step.id===formerFinalId?S.DEFAULT_TRANSITION_MS:step.transitionMs);
      if(step.transitionMs!==value){step.transitionMs=value;adjusted.push(step.name+' transition '+value/1000+'s');}
    });
    return adjusted.length?' Adjusted '+adjusted.join('; ')+'.':'';
  }
  function capture(replace){
    conceal();cancelPlacement();
    if(!sequencePrecondition()){render();return;}
    try{
      const scene=M.canonicalScene(readFields());if(!locksAllow(scene)){render();return;}
      if(!scene.scene.objects.length)throw new Error('A sequence step needs at least one object.');
      if(sequence&&JSON.stringify(scene.scene.background)!==JSON.stringify(sequence.sequence.background))throw new Error('This scene background differs from the sequence. Match its shared background before capturing.');
      if(replace&&!sequence)throw new Error('Add a step before replacing it.');
      const authored=scene.version===M.AUTHORED_VERSION;
      if(sequence&&(sequence.version===S.AUTHORED_VERSION)!==authored)throw Error('Scene and sequence formats differ. Start a compatible sequence instead.');
      if(sequence&&authored&&JSON.stringify(sequence.sequence.canvas)!==JSON.stringify(scene.scene.canvas))throw Error('Match the sequence authored ratio before capturing.');
      const next=sequence?copy(sequence):{format:S.FORMAT,version:authored?S.AUTHORED_VERSION:S.VERSION,sampler:authored?S.AUTHORED_SAMPLER:S.SAMPLER,sequence:{name:acceptedSequenceName,background:scene.scene.background,...(authored?{canvas:copy(scene.scene.canvas)}:{}),steps:[]}};
      const steps=next.sequence.steps,formerFinalId=steps.length?steps[steps.length-1].id:null;
      let newIndex;
      if(replace){newIndex=stepIndex;steps[newIndex]={...steps[newIndex],name:scene.scene.name,pulsePeriodMs:scene.scene.pulsePeriodMs,objects:copy(scene.scene.objects),...(authored?{canvas:copy(scene.scene.canvas)}:{})};}
      else{
        let id=1;while(steps.some(step=>step.id==='step-'+id))id++;
        steps.push({id:'step-'+id,name:scene.scene.name,holdMs:S.DEFAULT_HOLD_MS,transitionMs:0,pulsePeriodMs:scene.scene.pulsePeriodMs,objects:copy(scene.scene.objects),...(authored?{canvas:copy(scene.scene.canvas)}:{})});newIndex=steps.length-1;
      }
      const adjustments=normalizeSteps(steps,formerFinalId),accepted=S.canonicalSequence(next),compiled=S.compileTimeline(accepted);
      // Both preflights finish before either accepted document/history mutates.
      const result=controller.apply(scene);if(!result.ok)throw new Error(result.error);
      formDirty=false;fillFields(result.state.current);stepIndex=newIndex;setAcceptedSequence(accepted,compiled);section='sequence';render();
      say((replace?'Selected snapshot replaced.':'Scene captured as step '+(stepIndex+1)+'.')+adjustments+' The field is hidden.');
    }catch(e){render();say(e.message+' Neither accepted document was changed.',true);}
  }
  $('capture-add').addEventListener('click',()=>capture(false));$('capture-replace').addEventListener('click',()=>capture(true));
  function selectStep(index){
    conceal();cancelPlacement();if(!sequencePrecondition()){render();return;}
    if(!sequence||!Number.isInteger(index)||index<0||index>=sequence.sequence.steps.length){render();return;}
    stepIndex=index;fillSequenceFields();render();say('Step '+(index+1)+' selected and hidden. Choose Show step to display it.');
  }
  $('sequence-step-select').addEventListener('change',()=>selectStep(Number($('sequence-step-select').value)));
  $('sequence-previous').addEventListener('click',()=>selectStep(stepIndex-1));$('sequence-next').addEventListener('click',()=>selectStep(stepIndex+1));
  function changeSteps(action){
    conceal();cancelPlacement();if(!sequencePrecondition()||!sequence){render();return;}
    try{
      const next=copy(sequence),steps=next.sequence.steps,formerFinalId=steps[steps.length-1].id;
      let nextIndex=stepIndex;
      if(action==='delete'){steps.splice(stepIndex,1);nextIndex=Math.min(stepIndex,steps.length-1);}
      else{nextIndex=stepIndex+(action==='up'?-1:1);if(nextIndex<0||nextIndex>=steps.length){render();return;}[steps[stepIndex],steps[nextIndex]]=[steps[nextIndex],steps[stepIndex]];}
      if(!steps.length){sequence=null;compiledSequence=null;stepIndex=0;fillSequenceFields();render();$('capture-add').focus();say('Last snapshot deleted. The scene and notes are unchanged.');return;}
      const adjustments=normalizeSteps(steps,formerFinalId),accepted=S.canonicalSequence(next),compiled=S.compileTimeline(accepted);
      stepIndex=nextIndex;setAcceptedSequence(accepted,compiled);render();say('Sequence updated and hidden.'+adjustments);
    }catch(e){render();say(e.message+' Accepted sequence unchanged.',true);}
  }
  $('sequence-move-up').addEventListener('click',()=>changeSteps('up'));$('sequence-move-down').addEventListener('click',()=>changeSteps('down'));$('sequence-delete').addEventListener('click',()=>changeSteps('delete'));
  $('sequence-load').addEventListener('click',()=>{
    conceal();cancelPlacement();if(!sequencePrecondition()||!sequence){render();return;}
    if(formDirty){render();say('Apply or discard the scene edits before loading a step copy.',true);return;}
    const result=controller.apply(stepScene(stepIndex));if(!result.ok){render();say(result.error,true);return;}
    const notice=clearReplacementLocks();formDirty=false;fillFields(result.state.current);section='scene';render();$('editor-scroll').scrollTop=0;$('controls').focus();say('Step copied into the scene editor. Its saved snapshot is unchanged.'+notice);
  });
  $('sequence-example').addEventListener('click',()=>{
    conceal();cancelPlacement();if(!sequencePrecondition()){render();return;}
    const scenes=M.presets().slice(2,5);
    const next=S.canonicalSequence({format:S.FORMAT,version:S.VERSION,sampler:S.SAMPLER,sequence:{name:'Circle, square, triangle',background:scenes[0].scene.background,steps:scenes.map((scene,i)=>({id:'step-'+(i+1),name:scene.scene.name,holdMs:3000,transitionMs:i===2?0:1000,pulsePeriodMs:scene.scene.pulsePeriodMs,objects:scene.scene.objects}))}});
    stepIndex=0;setAcceptedSequence(next);render();say('11-second example loaded and hidden. Circle 3s, fade 1s, square 3s, fade 1s, triangle 3s. Choose Show step or Play once.');
  });
  function canPresent(){
    controller.getState();
    if(gateClockFault){hide('The display clock failed. Reload this page before viewing; keep any unsaved files first.','technical-failure');return false;}
    if(!sequencePrecondition())return false;
    if(!sequence){say('Capture a scene or load the example first.',true);return false;}
    if(formDirty){say('Apply, discard, or capture the scene edits before displaying the sequence.',true);return false;}
    if(!context){say('Canvas is unavailable. The sequence stays hidden.',true);return false;}
    return true;
  }
  function showStep(){
    if(controller.getState().visible&&displayKind!=='step'){hide('Preview mode changed. The field is hidden; choose Show step again after the repeat-action lock.');return;}
    cancelPlacement();if(!canPresent()){render();return;}
    cancelPlayback();const result=controller.show();
    if(gateClockFault){hide('The display clock failed. The field is hidden; reload before viewing.','technical-failure');return;}
    if(result.ok)displayKind='step';render();say(result.ok?'Step '+(stepIndex+1)+' visible: '+sequence.sequence.steps[stepIndex].name+'. Stop / Hide or Escape conceals it.':result.error,!result.ok);
    if(result.ok&&document.fullscreenElement===root)$('exit-fullscreen').focus();
  }
  $('sequence-show').addEventListener('click',showStep);
  function playbackEngine(){return displayKind==='items'?itemTimeline:timeline;}
  function paintPlayback(frame){
    const state=controller.getState();if(gateClockFault)throw new Error('The display clock failed. Reload before viewing.');
    const items=displayKind==='items',engine=playbackEngine();if(items)itemFrame=frame;else paintedFrame=frame;
    if(!draw(state))throw new Error('Canvas could not paint the preview.');
    if(!engine.markPainted(frame))throw new Error('The preview frame was canceled.');
    const key=items?frame.items.map(item=>item.id+':'+item.phase).join('|'):frame.phase+':'+frame.stepIndex;
    if(key!==lastPhaseKey){lastPhaseKey=key;canvas.setAttribute('aria-label',items?itemDescription():sequenceDescription());
      if(!items)say(frame.phase==='transition'?'Transition from '+sequence.sequence.steps[frame.stepIndex].name+' to '+sequence.sequence.steps[frame.nextStepIndex].name+'. Pause keeps the displayed frame visible.':'Playing step '+(frame.stepIndex+1)+': '+sequence.sequence.steps[frame.stepIndex].name+'. Stop / Hide is available.');}
    renderSequence();renderItemPlayback();
  }
  function scheduleFrame(){
    const gate=controller.getState();if(gateClockFault){hide('The display clock failed. The field is hidden; reload before viewing.','technical-failure');return;}
    const kind=displayKind,engine=playbackEngine();
    if(rafId!==null||engine.getState().status!=='running'||!gate.visible||!['timed','items'].includes(kind))return;
    const capturedEpoch=gate.epoch,capturedGeneration=generation,engineGeneration=engine.getState().generation;
    rafId=window.requestAnimationFrame(()=>{
      if(capturedGeneration!==generation)return;
      rafId=null;const state=controller.getState(),playback=engine.getState();
      if(gateClockFault){hide('The display clock failed. The field is hidden; reload before viewing.','technical-failure');return;}
      if(state.epoch!==capturedEpoch||!state.visible||displayKind!==kind||playback.status!=='running'||playback.generation!==engineGeneration)return;
      try{
        const next=engine.tick();
        if(next.status==='finished'||next.frame.done){hide((kind==='items'?'Item preview':'Sequence')+' finished. Field hidden. Playback reset; nothing will replay.','completed');return;}
        if(capturedGeneration!==generation||controller.getState().epoch!==capturedEpoch)return;
        paintPlayback(next.frame);scheduleFrame();
      }catch(e){hide('Playback stopped. '+e.message,'technical-failure');}
    });
  }
  $('sequence-play').addEventListener('click',()=>{
    if(timeline.getState().status!=='stopped'){return;}
    if(!canPresent()){render();return;}
    if(controller.getState().visible){hide('Manual preview hidden. Choose Play once again after the repeat-action lock.');return;}
    if(document.fullscreenElement===root){say('Exit fullscreen to play once. Fullscreen supports manual step previews only.',true);return;}
    if(motionReduced){say('Reduced motion is on. Use Previous or Next, then Show step.',true);return;}
    if(!offscreenContext||typeof window.requestAnimationFrame!=='function'){say('Timed playback is unavailable in this browser. Use manual step previews.',true);return;}
    cancelPlacement();cancelPlayback();const result=controller.show();if(gateClockFault){hide('The display clock failed. The field is hidden; reload before viewing.','technical-failure');return;}if(!result.ok){render();say(result.error,true);return;}
    try{const started=timeline.start(compiledSequence);displayKind='timed';paintPlayback(started.frame);render();scheduleFrame();$('sequence-pause').focus();}
    catch(e){hide('Playback stopped. '+e.message,'technical-failure');}
  });
  $('sequence-pause').addEventListener('click',()=>{
    if(timeline.getState().status!=='running'||!controller.getState().visible)return;
    generation++;if(rafId!==null){window.cancelAnimationFrame(rafId);rafId=null;}
    try{timeline.pause();render();say('Paused at the last displayed frame. It remains visible. Resume continues; Stop / Hide conceals.');$('sequence-resume').focus();}
    catch(e){hide('Playback stopped. '+e.message,'technical-failure');}
  });
  $('sequence-resume').addEventListener('click',()=>{
    if(timeline.getState().status!=='paused'||!controller.getState().visible||motionReduced||document.fullscreenElement===root)return;
    try{generation++;timeline.resume();render();scheduleFrame();say('Sequence resumed from the paused frame.');$('sequence-pause').focus();}
    catch(e){hide('Playback stopped. '+e.message,'technical-failure');}
  });
  $('sequence-stop').addEventListener('click',()=>hide('Sequence stopped. Field hidden; playback reset.','user-stop'));
  if(reducedMotion){
    const changed=event=>{motionReduced=!!event.matches;hide(motionReduced?'Reduced motion is on. Playback stopped; use manual Previous / Next and Show step.':'Motion preference changed. Playback stopped and will not resume automatically.');};
    if(typeof reducedMotion.addEventListener==='function')reducedMotion.addEventListener('change',changed);
    else if(typeof reducedMotion.addListener==='function')reducedMotion.addListener(changed);
  }
  $('sequence-export').addEventListener('click',()=>{
    conceal();cancelPlacement();render();if(!sequencePrecondition()||!sequence)return;
    try{download(S.canonicalSequence(sequence),'imagery-field-sequence-v'+sequence.version+'.json');}catch(e){say(e.message,true);}
  });
  $('sequence-import').addEventListener('change',async()=>{
    const file=$('sequence-import').files&&$('sequence-import').files[0];$('sequence-import').value='';if(!file)return;
    conceal();cancelPlacement();const token=controller.getState().epoch,seqToken=generation;render();
    if(file.size>S.MAX_IMPORT_BYTES){say('Sequence file must be no larger than 1 MiB. Accepted sequence unchanged.',true);return;}
    say('Reading the local sequence file. The field stays hidden.');
    try{
      const text=await file.text();if(controller.getState().epoch!==token||generation!==seqToken)return;
      const accepted=S.parseSequence(text),compiled=S.compileTimeline(accepted);stepIndex=0;setAcceptedSequence(accepted,compiled);section='sequence';render();say('Sequence opened and hidden. Choose Show step or Play once.');
    }catch(e){if(controller.getState().epoch!==token||generation!==seqToken)return;render();say(e.message+' Accepted sequence unchanged.',true);}
  });

  $('undo-image-replacement').addEventListener('click',()=>{if(!imageReplacement)return;const previous=imageReplacement;beginManualEdit();conceal();selectedId=previous.id;replaceDraft(previous.before,'Previous draft restored and hidden. Apply keeps it for download.');});
  journalUI=window.ImageryJournalUI.mount($('journal-container'),{onEdit:()=>{conceal('edit');render();},onTrackingChange:enabled=>{provenance.setEnabled(enabled);provenanceIdentity++;},clearTracking:()=>provenance.clear(),getProvenance:()=>provenance.getSummary(),getTrackingState:()=>provenance.getState()});
  galleryUI=window.ImageryGalleryUI.mount($('gallery-container'),{onEdit:()=>{conceal();render();},onUseDraft:value=>{conceal();section='scene';replaceDraft(value,'Original gallery scene staged and hidden. Edit freely; Apply keeps it for download. No playback started.');}});
  $('open-image-tools').addEventListener('click',()=>{conceal();render();if(!imageUI)imageUI=window.ImageryImageUI.mount($('image-tools-container'),{onEdit:()=>{conceal();render();},onUseDraft:value=>{const before=M.canonicalScene(readFields()),id=selectedId;conceal();section='scene';if(replaceDraft(value,'Image approximation staged and hidden. Undo image draft replacement restores the previous draft until another edit. Apply commits it for download.')){imageReplacement={before,id};render();}}});$('image-tools-container').hidden=false;$('open-image-tools').hidden=true;$('open-image-tools').setAttribute('aria-expanded','true');$('image-file').focus();});
  fillFields(controller.getState().current);fillSequenceFields();render();
  // The user requested an initially visible static editor. This synchronous,
  // one-time action schedules nothing: Hide and lifecycle stops cannot be undone
  // by a deferred startup callback. Timed playback remains an explicit action.
  if(context&&!document.hidden)showScene();
  if(!context)say('Canvas is unavailable in this browser. No scene is displayed. JSON editing and downloads remain available.',true);
}());
