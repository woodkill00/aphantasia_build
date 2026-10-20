/* Local scene editor and explicit finite, single-pass sequence presentation.
   One visibility gate. Every edit/lifecycle interruption cancels before concealment. */
(function () {
  'use strict';
  const M=window.ImageryModel,S=window.ImagerySequence;
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
  try {context=canvas.getContext('2d',{alpha:false});offscreenContext=offscreen.getContext('2d',{alpha:false});}catch(e){/* Data controls remain available. */}
  let formDirty=false,notePreview=null,selectedId=null,placing=false,editorOpen=true;
  let working=controller.getState().current;
  let section='scene',sequence=null,stepIndex=0,sequenceError='',displayKind='scene';
  let generation=0,rafId=null,paintedFrame=null,lastPhaseKey='';
  const timeline=S.createTimeline(()=>performance.now());
  const reducedMotion=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  let motionReduced=!!(reducedMotion&&reducedMotion.matches);
  const objectURLs=new Set();
  const objectFields=['shape','position-x','position-y','size','object-hue','object-saturation','object-lightness'];
  const fieldIDs=['scene-name',...objectFields,'background-hue','background-saturation','background-lightness'];
  const sliderIDs=['object-hue','object-saturation','object-lightness','background-hue','background-saturation','background-lightness'];
  const categories=Object.freeze(['unsure','none','external-perception','residual-aftereffect','voluntary-imagery','conceptual-knowledge','mixed']);
  const copy=value=>JSON.parse(JSON.stringify(value));
  const number=id=>$(id).value.trim()===''?NaN:Number($(id).value);
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
  function resetContext(ctx){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
  function prepareBuffers(){
    const d=dimensions();
    if(canvas.width!==d.bufferWidth||canvas.height!==d.bufferHeight||offscreen.width!==d.bufferWidth||offscreen.height!==d.bufferHeight){
      // Shrink both first: even intermediate resize allocations respect the cap.
      canvas.width=1;canvas.height=1;offscreen.width=1;offscreen.height=1;
      canvas.width=d.bufferWidth;canvas.height=d.bufferHeight;offscreen.width=d.bufferWidth;offscreen.height=d.bufferHeight;
    }
    return d;
  }
  function paintScene(ctx,target,documentValue,d){
    const accepted=M.canonicalScene(documentValue);resetContext(ctx);
    ctx.fillStyle=M.colorCSS(accepted.scene.background);ctx.fillRect(0,0,target.width,target.height);
    ctx.setTransform(target.width/d.width,0,0,target.height/d.height,0,0);ctx.lineJoin='round';
    M.geometry(accepted,d.width,d.height).forEach(item=>{
      ctx.fillStyle=item.color;ctx.strokeStyle=item.color;ctx.beginPath();
      if(item.kind==='dot'){ctx.arc(item.x,item.y,item.radius,0,Math.PI*2);ctx.fill();}
      else if(item.kind==='circle'){ctx.lineWidth=item.lineWidth;ctx.arc(item.x,item.y,item.radius,0,Math.PI*2);ctx.stroke();}
      else{ctx.lineWidth=item.lineWidth;item.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(item.filled)ctx.fill();else ctx.stroke();}
    });
    resetContext(ctx);
  }
  function stepScene(index){
    const step=sequence.sequence.steps[index];
    return M.canonicalScene({format:M.FORMAT,version:M.VERSION,sampler:M.SAMPLER,scene:{name:step.name,background:sequence.sequence.background,objects:step.objects}});
  }
  function draw(state){
    const d=prepareBuffers();if(!context)return false;
    resetContext(context);context.fillStyle='#000';context.fillRect(0,0,canvas.width,canvas.height);
    if(!state.visible)return true;
    if(displayKind==='timed'&&paintedFrame){
      const frame=paintedFrame;paintScene(context,canvas,stepScene(frame.stepIndex),d);
      if(frame.phase==='transition'){
        if(!offscreenContext)throw new Error('The transition canvas is unavailable.');
        paintScene(offscreenContext,offscreen,stepScene(frame.nextStepIndex),d);
        resetContext(context);context.globalAlpha=frame.alpha;context.drawImage(offscreen,0,0);resetContext(context);
      }
    }else paintScene(context,canvas,displayKind==='step'?stepScene(stepIndex):state.current,d);
    return true;
  }
  // These bounded editor samples represent only the current form colors. They
  // never change the accepted scene, call Show, or paint a scene preview.
  function updateColorSample(prefix){
    const swatch=$(prefix+'-color-swatch'),description=$(prefix+'-color-text');
    const present=prefix==='background'||!!selected();
    const color={h:number(prefix+'-hue'),s:number(prefix+'-saturation'),l:number(prefix+'-lightness')};
    const background=prefix==='background';
    const valid=Number.isInteger(color.h)&&color.h>=0&&color.h<=359&&Number.isInteger(color.s)&&color.s>=0&&color.s<=(background?60:70)&&Number.isInteger(color.l)&&color.l>=(background?0:10)&&color.l<=(background?40:70);
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
    swatch.setAttribute('aria-label',(background?'Background':'Object')+' color sample: '+text+'.');
    description.textContent=text;
    const gradient=colors=>'linear-gradient(to right, '+colors.join(', ')+')';
    $(prefix+'-hue').style.backgroundImage=gradient([0,60,120,180,240,300,359].map(h=>M.colorCSS({...color,h})+' '+(h/359*100)+'%'));
    $(prefix+'-saturation').style.backgroundImage=gradient([0,background?60:70].map(s=>M.colorCSS({...color,s})));
    const min=background?0:10,max=background?40:70;
    $(prefix+'-lightness').style.backgroundImage=gradient((background?[min,max]:[min,50,max]).map(l=>M.colorCSS({...color,l})+' '+((l-min)/(max-min)*100)+'%'));
  }
  function updateOutputs(){
    sliderIDs.forEach(id=>{$(id+'-value').textContent=$(id).value+(id.endsWith('hue')?'°':'%');});
    updateColorSample('object');updateColorSample('background');
  }
  function render(){
    let state=controller.getState();
    if(gateClockFault&&state.visible){cancelPlayback();controller.hide();state=controller.getState();}
    try{draw(state);}catch(e){
      // If even clearing fails, remove the raster surface; the root is black.
      cancelPlayback();controller.hide();canvas.hidden=true;context=null;state=controller.getState();
      say('The canvas could not be drawn. The field is hidden; data controls remain available.',true);
    }
    $('visibility-label').textContent=state.visible?'Visible':'Hidden';
    $('show-scene').setAttribute('aria-pressed',String(state.visible));
    canvas.setAttribute('aria-label',placing?'Placement active. Click or tap a position for the selected object. The scene is hidden. Escape cancels.':state.visible?(displayKind==='scene'?M.describe(state.current):sequenceDescription()):'Scene hidden. No design is displayed.');
    $('undo').disabled=state.undoCount===0;$('redo').disabled=state.redoCount===0;
    $('draft-label').textContent=formDirty?'Changes staged':'Applied';
    $('scene-description').textContent=M.describe(state.current);
    $('object-count').textContent=working.scene.objects.length+' / '+M.MAX_OBJECTS;
    $('add-object').disabled=working.scene.objects.length>=M.MAX_OBJECTS;
    $('place-object').setAttribute('aria-pressed',String(placing));
    $('place-object').textContent=placing?'Cancel placement':'Place on field';
    canvas.className=placing?'placing':'';
    $('editor-panel').hidden=!editorOpen;
    $('editor-toggle').setAttribute('aria-expanded',String(editorOpen));
    $('editor-toggle').textContent=editorOpen?'Close editor':'Open editor';
    const full=document.fullscreenElement===root;
    root.className='stage-root'+(full?' fullscreen-mode':'')+(state.visible?' scene-visible':'');
    // Native fullscreen is a viewing surface. Hide whole editor/navigation
    // subtrees so their controls leave both the layout and keyboard tab order.
    ['masthead','stage-body','viewing-bar','skip-controls'].forEach(id=>{$(id).hidden=full;});
    $('hidden-label').hidden=state.visible||full;
    $('fullscreen-start').hidden=!full||state.visible;
    $('fullscreen').hidden=full;$('exit-fullscreen').hidden=!full;
    updateOutputs();renderSequence();
  }
  function cancelPlacement(){placing=false;}
  function selected(){return working.scene.objects.find(o=>o.id===selectedId);}
  function updateObjectList(){
    $('object-select').replaceChildren();
    working.scene.objects.forEach((o,i)=>{const option=document.createElement('option');option.value=o.id;option.textContent=(i+1)+'. '+o.shape+' ('+o.id+')';$('object-select').appendChild(option);});
    if(!working.scene.objects.length){const option=document.createElement('option');option.value='';option.textContent='No objects · background only';$('object-select').appendChild(option);}
    $('object-select').value=selectedId||'';$('object-select').disabled=!working.scene.objects.length;
  }
  function fillSelected(){
    const o=selected();
    [...objectFields,'place-object','delete-object'].forEach(id=>{$(id).disabled=!o;});
    if(o){
      $('shape').value=o.shape;$('position-x').value=String(o.x);$('position-y').value=String(o.y);$('size').value=String(o.size);
      $('object-hue').value=String(o.color.h);$('object-saturation').value=String(o.color.s);$('object-lightness').value=String(o.color.l);
      $('size').max=o.shape==='dot'||o.shape==='pixel'?'8':'28';
    }
    updateObjectList();updateOutputs();
  }
  function fillFields(scene){
    working=copy(M.canonicalScene(scene));
    if(!working.scene.objects.some(o=>o.id===selectedId))selectedId=working.scene.objects[0]?.id||null;
    $('scene-name').value=working.scene.name;
    const b=working.scene.background;$('background-hue').value=String(b.h);$('background-saturation').value=String(b.s);$('background-lightness').value=String(b.l);
    fillSelected();
  }
  function readFields(){
    const next=copy(working),s=next.scene;
    s.name=$('scene-name').value;s.background={h:number('background-hue'),s:number('background-saturation'),l:number('background-lightness')};
    const o=s.objects.find(item=>item.id===selectedId);
    if(o){o.shape=$('shape').value;o.x=number('position-x');o.y=number('position-y');o.size=number('size');o.color={h:number('object-hue'),s:number('object-saturation'),l:number('object-lightness')};}
    return next;
  }
  function hide(message){cancelPlacement();conceal();render();say(message||'Scene hidden. Showing it again requires a fresh action after the repeat-action lock.');}
  function stageWorking(message){
    formDirty=true;const result=controller.stage(working);render();say(result.ok?message:result.error+' Your applied scene is unchanged.',!result.ok);return result.ok;
  }
  function edited(event){
    conceal();cancelPlacement();
    if(event.target.id==='shape'){
      const max=$('shape').value==='dot'||$('shape').value==='pixel'?8:28;$('size').max=String(max);if(number('size')>max)$('size').value=String(max);
    }
    working=readFields();updateObjectList();stageWorking('Changes staged. Apply them before showing the scene.');
  }
  fieldIDs.forEach(id=>$(id).addEventListener('input',edited));
  $('object-select').addEventListener('change',()=>{
    const nextId=$('object-select').value;conceal();cancelPlacement();working=readFields();
    if(working.scene.objects.some(o=>o.id===nextId))selectedId=nextId;
    fillSelected();render();say('Selected '+(selectedId||'background only')+'. Existing staged changes are kept; the field is hidden.');
  });
  $('add-shape').addEventListener('change',()=>hide('New object type selected. The field is hidden.'));
  $('add-object').addEventListener('click',()=>{
    conceal();cancelPlacement();working=readFields();
    const checked=M.validateScene(working);
    if(!checked.ok){render();say('Fix the staged fields before adding an object. '+checked.error,true);return;}
    if(working.scene.objects.length>=M.MAX_OBJECTS){render();say('This prototype supports up to 12 objects.',true);return;}
    const shape=$('add-shape').value;if(!M.SHAPES.includes(shape)){render();say('Choose one of the listed object shapes.',true);return;}
    let n=1;while(working.scene.objects.some(o=>o.id==='object-'+n))n++;
    const o={id:'object-'+n,shape,x:50,y:50,size:shape==='dot'||shape==='pixel'?2:18,color:{h:126,s:8,l:49}};
    working.scene.objects.push(o);selectedId=o.id;fillSelected();stageWorking('New '+shape+' staged at the center. Set its position or choose Place on field.');
  });
  $('delete-object').addEventListener('click',()=>{
    conceal();cancelPlacement();working=readFields();
    const index=working.scene.objects.findIndex(o=>o.id===selectedId);if(index<0){render();return;}
    working.scene.objects.splice(index,1);selectedId=working.scene.objects[Math.min(index,working.scene.objects.length-1)]?.id||null;
    fillSelected();stageWorking('Object removed from the draft. Apply changes to keep this composition.');
  });
  $('place-object').addEventListener('click',()=>{
    const wasPlacing=placing;conceal();cancelPlacement();working=readFields();
    const checked=M.validateScene(working);if(!checked.ok){render();say('Fix the staged fields before placing an object. '+checked.error,true);return;}
    if(!selected()){render();return;}
    placing=!wasPlacing;if(placing)editorOpen=false;render();
    say(placing?'Placement active for '+selectedId+'. Click or tap the field once. The draft stays hidden. Escape, Hide or End cancels.':'Placement canceled.');
    if(placing)canvas.focus();
  });
  canvas.addEventListener('pointerup',event=>{
    if(!placing||event.isPrimary===false||(event.button!==undefined&&event.button!==0))return;
    const o=selected(),rect=canvas.getBoundingClientRect();
    if(!o||rect.width<=0||rect.height<=0||!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return;
    const extent=o.size/2+(o.shape==='dot'||o.shape==='pixel'?0:0.5),min=1+extent,max=99-extent;
    const clamp=v=>Math.round(Math.max(min,Math.min(max,v))*100)/100;
    o.x=clamp((event.clientX-(rect.left||0))*100/rect.width);o.y=clamp((event.clientY-(rect.top||0))*100/rect.height);
    cancelPlacement();fillSelected();editorOpen=true;stageWorking('Position staged at '+o.x+', '+o.y+'. Apply changes, then Show when you choose.');$('position-x').focus();
  });
  $('skip-controls').addEventListener('click',event=>{
    event.preventDefault();conceal();cancelPlacement();editorOpen=true;section='scene';render();$('controls').focus();say('Scene controls focused. The field is hidden.');
  });
  $('viewing-guidance').addEventListener('click',()=>{
    conceal();cancelPlacement();editorOpen=true;render();$('guidance-title').setAttribute('tabindex','-1');$('guidance-title').focus();say('Viewing guidance focused. The field is hidden.');
  });
  $('editor-toggle').addEventListener('click',()=>{
    conceal();cancelPlacement();editorOpen=!editorOpen;render();
    say(editorOpen?'Editor open. The field is hidden.':'Editor closed. Choose Show to use the whole field.');
    if(editorOpen){const heading=$(section==='scene'?'controls':'sequence-title');heading.setAttribute('tabindex','-1');heading.focus();}else $('editor-toggle').focus();
  });
  $('preset').addEventListener('change',()=>{
    const index=Number($('preset').value);if($('preset').value===''||!Number.isInteger(index)||!M.presets()[index])return;
    cancelPlacement();conceal();const next=M.presets()[index];controller.stage(next);fillFields(next);formDirty=true;render();say('Preset staged. Choose Apply changes, then Show scene when you choose.');
  });
  $('scene-form').addEventListener('submit',event=>{
    event.preventDefault();cancelPlacement();conceal();
    const result=controller.apply(readFields());
    if(!result.ok){render();say(result.error,true);return;}
    formDirty=false;fillFields(result.state.current);render();say('Changes applied. The scene is hidden; choose Show scene to display it.');
  });
  $('discard').addEventListener('click',()=>{
    cancelPlacement();conceal();controller.discard();formDirty=false;fillFields(controller.getState().current);$('preset').value='';render();say('Staged changes discarded. Your applied scene is hidden.');
  });
  function showScene(){
    if(controller.getState().visible&&displayKind!=='scene'){hide('Preview mode changed. The field is hidden; choose Show scene again after the repeat-action lock.');return;}
    cancelPlayback();cancelPlacement();controller.invalidateImport();
    if(gateClockFault){hide('The display clock failed. Reload this page before showing a scene; keep any unsaved files first.');return;}
    if(!context){render();say('Canvas is unavailable in this browser. The scene stays hidden; JSON editing and downloads remain available.',true);return;}
    if(formDirty){render();say((document.fullscreenElement===root?'Apply or discard staged changes before showing the scene. Exit fullscreen to return to the editor.':'Apply or discard staged changes before showing the scene.'),true);return;}
    displayKind='scene';const result=controller.show();if(gateClockFault){hide('The display clock failed. The field is hidden; reload before viewing.');return;}render();say(result.ok?'Scene visible. Hide or press Escape at any time.':result.error,!result.ok);
    if(result.ok&&document.fullscreenElement===root)$('exit-fullscreen').focus();
  }
  $('show-scene').addEventListener('click',showScene);
  $('fullscreen-show').addEventListener('click',()=>section==='sequence'?showStep():showScene());
  $('hide-scene').addEventListener('click',()=>hide());
  $('end-viewing').addEventListener('click',()=>{
    cancelPlayback();cancelPlacement();controller.end();editorOpen=true;render();say('Viewing ended. Your scene and optional note remain in this open page.');
    $('guidance-title').setAttribute('tabindex','-1');$('guidance-title').focus();
  });
  ['undo','redo'].forEach(action=>$(action).addEventListener('click',()=>{
    cancelPlacement();conceal();const result=controller[action]();
    if(result.ok){formDirty=false;fillFields(result.state.current);$('preset').value='';}
    render();say(result.ok?(action==='undo'?'Previous':'Next')+' scene restored and hidden. Choose Show scene when you choose.':result.error,!result.ok);
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
    try{await owner[method]();if(operation===fullscreenOperation){conceal();cancelPlacement();render();say('Display mode changed. The field is hidden; choose Show when you choose.');}}
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
    if(event.key==='Escape'){hide('Scene hidden with Escape. Placement and pending file reads were canceled.');}
    if(event.repeat&&(event.key==='Enter'||event.key===' ')&&event.target&&event.target.closest&&event.target.closest('button'))event.preventDefault();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hide('Scene hidden while the page was away. It will not resume automatically.');});
  window.addEventListener('blur',()=>hide('Scene hidden because the window lost focus. Show it again when you choose.'));
  window.addEventListener('pagehide',()=>{cancelPlacement();conceal();render();objectURLs.forEach(url=>URL.revokeObjectURL(url));objectURLs.clear();});
  document.addEventListener('freeze',()=>hide('Scene hidden while the page was suspended. Choose Show scene when you choose.'));
  window.addEventListener('pageshow',event=>{if(event.persisted)hide('Scene hidden after returning to this page. Choose Show scene to resume.');});
  window.addEventListener('resize',()=>hide('Scene hidden after the window size changed. Choose Show scene when you choose.'));
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
    try{download(M.canonicalScene(controller.getState().current),'imagery-field-scene-v2.json');}catch(e){say(e.message,true);}
  });
  $('scene-import').addEventListener('change',async()=>{
    const file=$('scene-import').files&&$('scene-import').files[0];$('scene-import').value='';if(!file)return;
    cancelPlayback();cancelPlacement();const token=controller.beginImport();render();
    if(file.size>M.MAX_IMPORT_BYTES){controller.invalidateImport();say('Scene file must be no larger than 1 MiB. Your applied scene is unchanged.',true);return;}
    say('Reading the local scene file. The field stays hidden.');
    try{
      const text=await file.text(),state=controller.getState();if(token!==state.epoch||!state.pendingImport)return;
      const result=controller.finishImport(token,text);
      if(result.ok){formDirty=false;fillFields(result.state.current);$('preset').value='';}
      render();say(result.ok?'Scene opened and hidden. Choose Show scene when you choose.':result.error+' Your applied scene is unchanged.',!result.ok);
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
  function cancelPlayback(){
    generation++;
    if(rafId!==null){window.cancelAnimationFrame(rafId);rafId=null;}
    timeline.stop();paintedFrame=null;lastPhaseKey='';displayKind='scene';
  }
  function conceal(){cancelPlayback();controller.hide();}
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
    $('hidden-hint').textContent=section==='sequence'?'Capture or load snapshots, then choose Show step or Play once.':'Compose, apply, then show when you choose.';
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
    $('fullscreen-show').textContent=section==='sequence'?'Show selected step':'Show scene';
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
    say(next==='sequence'?'Sequence editor. Select a step, then Show step, or choose Play once.':'Scene editor. Changes remain hidden until Apply and Show.');
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
      const scene=M.canonicalScene(readFields());
      if(!scene.scene.objects.length)throw new Error('A sequence step needs at least one object.');
      if(sequence&&JSON.stringify(scene.scene.background)!==JSON.stringify(sequence.sequence.background))throw new Error('This scene background differs from the sequence. Match its shared background before capturing.');
      if(replace&&!sequence)throw new Error('Add a step before replacing it.');
      const next=sequence?copy(sequence):{format:'imagery-field-sequence',version:1,sampler:'ordered-crossfade-1',sequence:{name:acceptedSequenceName,background:scene.scene.background,steps:[]}};
      const steps=next.sequence.steps,formerFinalId=steps.length?steps[steps.length-1].id:null;
      let newIndex;
      if(replace){newIndex=stepIndex;steps[newIndex]={...steps[newIndex],name:scene.scene.name,objects:copy(scene.scene.objects)};}
      else{
        let id=1;while(steps.some(step=>step.id==='step-'+id))id++;
        steps.push({id:'step-'+id,name:scene.scene.name,holdMs:S.DEFAULT_HOLD_MS,transitionMs:0,objects:copy(scene.scene.objects)});newIndex=steps.length-1;
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
    formDirty=false;fillFields(result.state.current);section='scene';render();$('editor-scroll').scrollTop=0;$('controls').focus();say('Step copied into the scene editor. Its saved snapshot is unchanged.');
  });
  $('sequence-example').addEventListener('click',()=>{
    conceal();cancelPlacement();if(!sequencePrecondition()){render();return;}
    const scenes=M.presets().slice(2,5);
    const next=S.canonicalSequence({format:'imagery-field-sequence',version:1,sampler:'ordered-crossfade-1',sequence:{name:'Circle, square, triangle',background:scenes[0].scene.background,steps:scenes.map((scene,i)=>({id:'step-'+(i+1),name:scene.scene.name,holdMs:3000,transitionMs:i===2?0:1000,objects:scene.scene.objects}))}});
    stepIndex=0;setAcceptedSequence(next);render();say('11-second example loaded and hidden. Circle 3s, fade 1s, square 3s, fade 1s, triangle 3s. Choose Show step or Play once.');
  });
  function canPresent(){
    controller.getState();
    if(gateClockFault){hide('The display clock failed. Reload this page before viewing; keep any unsaved files first.');return false;}
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
    if(gateClockFault){hide('The display clock failed. The field is hidden; reload before viewing.');return;}
    if(result.ok)displayKind='step';render();say(result.ok?'Step '+(stepIndex+1)+' visible: '+sequence.sequence.steps[stepIndex].name+'. Stop / Hide or Escape conceals it.':result.error,!result.ok);
    if(result.ok&&document.fullscreenElement===root)$('exit-fullscreen').focus();
  }
  $('sequence-show').addEventListener('click',showStep);
  function paintPlayback(frame){
    const state=controller.getState();if(gateClockFault)throw new Error('The display clock failed. Reload before viewing.');
    paintedFrame=frame;if(!draw(state))throw new Error('Canvas could not paint the sequence.');
    if(!timeline.markPainted(frame))throw new Error('The sequence frame was canceled.');
    const key=frame.phase+':'+frame.stepIndex;
    if(key!==lastPhaseKey){lastPhaseKey=key;canvas.setAttribute('aria-label',sequenceDescription());say(frame.phase==='transition'?'Transition from '+sequence.sequence.steps[frame.stepIndex].name+' to '+sequence.sequence.steps[frame.nextStepIndex].name+'. Pause keeps the displayed frame visible.':'Playing step '+(frame.stepIndex+1)+': '+sequence.sequence.steps[frame.stepIndex].name+'. Stop / Hide is available.');}
    renderSequence();
  }
  function scheduleFrame(){
    const gate=controller.getState();if(gateClockFault){hide('The display clock failed. The field is hidden; reload before viewing.');return;}
    if(rafId!==null||timeline.getState().status!=='running'||!gate.visible||displayKind!=='timed')return;
    const capturedEpoch=gate.epoch,capturedGeneration=generation,engineGeneration=timeline.getState().generation;
    rafId=window.requestAnimationFrame(()=>{
      // A stale callback must not even clear a newer generation's pending handle.
      if(capturedGeneration!==generation)return;
      rafId=null;const state=controller.getState(),playback=timeline.getState();
      if(gateClockFault){hide('The display clock failed. The field is hidden; reload before viewing.');return;}
      if(state.epoch!==capturedEpoch||!state.visible||displayKind!=='timed'||playback.status!=='running'||playback.generation!==engineGeneration)return;
      try{
        const next=timeline.tick();
        if(next.status==='finished'||next.frame.done){hide('Sequence finished. Field hidden. Playback reset; nothing will replay.');return;}
        if(capturedGeneration!==generation||controller.getState().epoch!==capturedEpoch)return;
        paintPlayback(next.frame);scheduleFrame();
      }catch(e){hide('Playback stopped. '+e.message);}
    });
  }
  $('sequence-play').addEventListener('click',()=>{
    if(timeline.getState().status!=='stopped'){return;}
    if(!canPresent()){render();return;}
    if(controller.getState().visible){hide('Manual preview hidden. Choose Play once again after the repeat-action lock.');return;}
    if(document.fullscreenElement===root){say('Exit fullscreen to play once. Fullscreen supports manual step previews only.',true);return;}
    if(motionReduced){say('Reduced motion is on. Use Previous or Next, then Show step.',true);return;}
    if(!offscreenContext||typeof window.requestAnimationFrame!=='function'){say('Timed playback is unavailable in this browser. Use manual step previews.',true);return;}
    cancelPlacement();cancelPlayback();const result=controller.show();if(gateClockFault){hide('The display clock failed. The field is hidden; reload before viewing.');return;}if(!result.ok){render();say(result.error,true);return;}
    try{const started=timeline.start(compiledSequence);displayKind='timed';paintPlayback(started.frame);render();scheduleFrame();$('sequence-pause').focus();}
    catch(e){hide('Playback stopped. '+e.message);}
  });
  $('sequence-pause').addEventListener('click',()=>{
    if(timeline.getState().status!=='running'||!controller.getState().visible)return;
    generation++;if(rafId!==null){window.cancelAnimationFrame(rafId);rafId=null;}
    try{timeline.pause();render();say('Paused at the last displayed frame. It remains visible. Resume continues; Stop / Hide conceals.');$('sequence-resume').focus();}
    catch(e){hide('Playback stopped. '+e.message);}
  });
  $('sequence-resume').addEventListener('click',()=>{
    if(timeline.getState().status!=='paused'||!controller.getState().visible||motionReduced||document.fullscreenElement===root)return;
    try{generation++;timeline.resume();render();scheduleFrame();say('Sequence resumed from the paused frame.');$('sequence-pause').focus();}
    catch(e){hide('Playback stopped. '+e.message);}
  });
  $('sequence-stop').addEventListener('click',()=>hide('Sequence stopped. Field hidden; playback reset.'));
  if(reducedMotion){
    const changed=event=>{motionReduced=!!event.matches;hide(motionReduced?'Reduced motion is on. Playback stopped; use manual Previous / Next and Show step.':'Motion preference changed. Playback stopped and will not resume automatically.');};
    if(typeof reducedMotion.addEventListener==='function')reducedMotion.addEventListener('change',changed);
    else if(typeof reducedMotion.addListener==='function')reducedMotion.addListener(changed);
  }
  $('sequence-export').addEventListener('click',()=>{
    conceal();cancelPlacement();render();if(!sequencePrecondition()||!sequence)return;
    try{download(S.canonicalSequence(sequence),'imagery-field-sequence-v1.json');}catch(e){say(e.message,true);}
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

  fillFields(controller.getState().current);fillSequenceFields();render();
  if(!context)say('Canvas is unavailable in this browser. No scene is displayed. JSON editing and downloads remain available.',true);
}());
