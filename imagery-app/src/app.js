/* Static full-window editor. All data-changing actions conceal before render.
   No scene animation, network access, persistence or delayed reveal. */
(function () {
  'use strict';
  const M=window.ImageryModel;
  const $=id=>document.getElementById(id);
  const controller=M.createController(()=>performance.now());
  const canvas=$('scene-canvas'),root=$('stage-root');
  let context=null;
  try {context=canvas.getContext('2d',{alpha:false});}catch(e){/* Data controls remain available. */}
  let formDirty=false,notePreview=null,selectedId=null,placing=false,editorOpen=true;
  let working=controller.getState().current;
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
    const ratio=Math.min(dpr,M.MAX_CANVAS_DIMENSION/width,M.MAX_CANVAS_DIMENSION/height,Math.sqrt(M.MAX_CANVAS_PIXELS/(width*height)));
    return {width,height,bufferWidth:Math.max(1,Math.floor(width*ratio)),bufferHeight:Math.max(1,Math.floor(height*ratio))};
  }
  function draw(state){
    const d=dimensions();
    if(canvas.width!==d.bufferWidth||canvas.height!==d.bufferHeight){canvas.width=d.bufferWidth;canvas.height=d.bufferHeight;}
    if(!context)return;
    context.setTransform(1,0,0,1,0,0);context.fillStyle='#000';context.fillRect(0,0,canvas.width,canvas.height);
    if(!state.visible)return;
    const accepted=M.canonicalScene(state.current);
    context.fillStyle=M.colorCSS(accepted.scene.background);context.fillRect(0,0,canvas.width,canvas.height);
    // Geometry uses CSS-pixel dimensions. The two backing-store factors exactly
    // cancel the CSS stretching even when the capped buffer is rounded down.
    context.setTransform(canvas.width/d.width,0,0,canvas.height/d.height,0,0);context.lineJoin='round';
    M.geometry(accepted,d.width,d.height).forEach(item=>{
      context.fillStyle=item.color;context.strokeStyle=item.color;context.beginPath();
      if(item.kind==='dot'){context.arc(item.x,item.y,item.radius,0,Math.PI*2);context.fill();}
      else if(item.kind==='circle'){context.lineWidth=item.lineWidth;context.arc(item.x,item.y,item.radius,0,Math.PI*2);context.stroke();}
      else{context.lineWidth=item.lineWidth;item.points.forEach((p,i)=>i?context.lineTo(p[0],p[1]):context.moveTo(p[0],p[1]));context.closePath();if(item.filled)context.fill();else context.stroke();}
    });
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
    const state=controller.getState();draw(state);
    $('visibility-label').textContent=state.visible?'Visible':'Hidden';
    $('show-scene').setAttribute('aria-pressed',String(state.visible));
    canvas.setAttribute('aria-label',placing?'Placement active. Click or tap a position for the selected object. The scene is hidden. Escape cancels.':state.visible?M.describe(state.current):'Scene hidden. No design is displayed.');
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
    updateOutputs();
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
  function hide(message){cancelPlacement();controller.hide();render();say(message||'Scene hidden. Showing it again requires a fresh action after the repeat-action lock.');}
  function stageWorking(message){
    formDirty=true;const result=controller.stage(working);render();say(result.ok?message:result.error+' Your applied scene is unchanged.',!result.ok);return result.ok;
  }
  function edited(event){
    controller.hide();cancelPlacement();
    if(event.target.id==='shape'){
      const max=$('shape').value==='dot'||$('shape').value==='pixel'?8:28;$('size').max=String(max);if(number('size')>max)$('size').value=String(max);
    }
    working=readFields();updateObjectList();stageWorking('Changes staged. Apply them before showing the scene.');
  }
  fieldIDs.forEach(id=>$(id).addEventListener('input',edited));
  $('object-select').addEventListener('change',()=>{
    const nextId=$('object-select').value;controller.hide();cancelPlacement();working=readFields();
    if(working.scene.objects.some(o=>o.id===nextId))selectedId=nextId;
    fillSelected();render();say('Selected '+(selectedId||'background only')+'. Existing staged changes are kept; the field is hidden.');
  });
  $('add-object').addEventListener('click',()=>{
    controller.hide();cancelPlacement();working=readFields();
    const checked=M.validateScene(working);
    if(!checked.ok){render();say('Fix the staged fields before adding an object. '+checked.error,true);return;}
    if(working.scene.objects.length>=M.MAX_OBJECTS){render();say('This prototype supports up to 12 objects.',true);return;}
    const shape=$('add-shape').value;if(!M.SHAPES.includes(shape)){render();say('Choose one of the listed object shapes.',true);return;}
    let n=1;while(working.scene.objects.some(o=>o.id==='object-'+n))n++;
    const o={id:'object-'+n,shape,x:50,y:50,size:shape==='dot'||shape==='pixel'?2:18,color:{h:126,s:8,l:49}};
    working.scene.objects.push(o);selectedId=o.id;fillSelected();stageWorking('New '+shape+' staged at the center. Set its position or choose Place on field.');
  });
  $('delete-object').addEventListener('click',()=>{
    controller.hide();cancelPlacement();working=readFields();
    const index=working.scene.objects.findIndex(o=>o.id===selectedId);if(index<0){render();return;}
    working.scene.objects.splice(index,1);selectedId=working.scene.objects[Math.min(index,working.scene.objects.length-1)]?.id||null;
    fillSelected();stageWorking('Object removed from the draft. Apply changes to keep this composition.');
  });
  $('place-object').addEventListener('click',()=>{
    const wasPlacing=placing;controller.hide();cancelPlacement();working=readFields();
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
    event.preventDefault();controller.hide();cancelPlacement();editorOpen=true;render();$('controls').focus();say('Scene controls focused. The field is hidden.');
  });
  $('viewing-guidance').addEventListener('click',()=>{
    controller.hide();cancelPlacement();editorOpen=true;render();$('guidance-title').setAttribute('tabindex','-1');$('guidance-title').focus();say('Viewing guidance focused. The field is hidden.');
  });
  $('editor-toggle').addEventListener('click',()=>{
    controller.hide();cancelPlacement();editorOpen=!editorOpen;render();
    say(editorOpen?'Editor open. The field is hidden.':'Editor closed. Choose Show to use the whole field.');
    if(editorOpen)$('controls').focus();else $('editor-toggle').focus();
  });
  $('preset').addEventListener('change',()=>{
    const index=Number($('preset').value);if($('preset').value===''||!Number.isInteger(index)||!M.presets()[index])return;
    cancelPlacement();controller.hide();const next=M.presets()[index];controller.stage(next);fillFields(next);formDirty=true;render();say('Preset staged. Choose Apply changes, then Show scene when you choose.');
  });
  $('scene-form').addEventListener('submit',event=>{
    event.preventDefault();cancelPlacement();controller.hide();
    const result=controller.apply(readFields());
    if(!result.ok){render();say(result.error,true);return;}
    formDirty=false;fillFields(result.state.current);render();say('Changes applied. The scene is hidden; choose Show scene to display it.');
  });
  $('discard').addEventListener('click',()=>{
    cancelPlacement();controller.hide();controller.discard();formDirty=false;fillFields(controller.getState().current);$('preset').value='';render();say('Staged changes discarded. Your applied scene is hidden.');
  });
  function showScene(){
    cancelPlacement();controller.invalidateImport();
    if(!context){render();say('Canvas is unavailable in this browser. The scene stays hidden; JSON editing and downloads remain available.',true);return;}
    if(formDirty){render();say((document.fullscreenElement===root?'Apply or discard staged changes before showing the scene. Exit fullscreen to return to the editor.':'Apply or discard staged changes before showing the scene.'),true);return;}
    const result=controller.show();render();say(result.ok?'Scene visible. Hide or press Escape at any time.':result.error,!result.ok);
    if(result.ok&&document.fullscreenElement===root)$('exit-fullscreen').focus();
  }
  $('show-scene').addEventListener('click',showScene);
  $('fullscreen-show').addEventListener('click',showScene);
  $('hide-scene').addEventListener('click',()=>hide());
  $('end-viewing').addEventListener('click',()=>{
    cancelPlacement();controller.end();editorOpen=true;render();say('Viewing ended. Your scene and optional note remain in this open page.');
    $('guidance-title').setAttribute('tabindex','-1');$('guidance-title').focus();
  });
  ['undo','redo'].forEach(action=>$(action).addEventListener('click',()=>{
    cancelPlacement();controller.hide();const result=controller[action]();
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
    try{await owner[method]();if(operation===fullscreenOperation){controller.hide();cancelPlacement();render();say('Display mode changed. The field is hidden; choose Show when you choose.');}}
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
  window.addEventListener('pagehide',()=>{cancelPlacement();controller.hide();render();objectURLs.forEach(url=>URL.revokeObjectURL(url));objectURLs.clear();});
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
    cancelPlacement();const token=controller.beginImport();render();
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
  $('notes').addEventListener('input',clearPreview);$('note-category').addEventListener('change',clearPreview);
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
  fillFields(controller.getState().current);render();
  if(!context)say('Canvas is unavailable in this browser. No scene is displayed. JSON editing and downloads remain available.',true);
}());
