/* Browser shell: synchronous rendering, explicit hidden commits, no persistence. */
(function () {
  'use strict';
  const M=window.ImageryModel;
  const $=id=>document.getElementById(id);
  const controller=M.createController(()=>performance.now());
  const canvas=$('scene-canvas');
  let context=null;
  try {context=canvas.getContext('2d',{alpha:false});} catch(e) { /* Keep data controls available. */ }
  let formDirty=false, notePreview=null;
  const objectURLs=new Set();
  const fieldIDs=['scene-name','shape','position-x','position-y','size','dot-count','dot-radius','palette'];
  const categories=Object.freeze(['unsure','none','external-perception','residual-aftereffect','voluntary-imagery','conceptual-knowledge','mixed']);
  function say(message,error) {$('status').textContent=String(message).slice(0,300);$('status').className=error?'error':'';}
  function describeCurrent(state) {$('scene-description').textContent=M.describe(state.current);}
  function draw(state) {
    const rect=canvas.getBoundingClientRect();
    const cssSize=Math.min(360,Math.max(1,rect.width||360));
    const dpr=Math.min(2,Math.max(1,Number(window.devicePixelRatio)||1));
    const size=Math.min(720,Math.max(1,Math.round(cssSize*dpr)));
    if(canvas.width!==size || canvas.height!==size){canvas.width=size;canvas.height=size;}
    if(!context)return;
    context.setTransform(1,0,0,1,0,0);context.fillStyle='#000';context.fillRect(0,0,size,size);
    if(!state.visible)return;
    const accepted=M.canonicalScene(state.current);
    const scale=size/100;
    context.setTransform(scale,0,0,scale,0,0);
    context.fillStyle=M.PALETTES[accepted.scene.palette];context.strokeStyle=context.fillStyle;context.lineJoin='round';
    M.geometry(accepted).forEach(item=>{
      context.beginPath();
      if(item.kind==='dot'){context.arc(item.x,item.y,item.radius,0,Math.PI*2);context.fill();}
      else if(item.kind==='circle'){context.lineWidth=item.lineWidth;context.arc(item.x,item.y,item.radius,0,Math.PI*2);context.stroke();}
      else {context.lineWidth=item.lineWidth;item.points.forEach((p,i)=>i?context.lineTo(p[0],p[1]):context.moveTo(p[0],p[1]));context.closePath();context.stroke();}
    });
  }
  function render() {
    const state=controller.getState();
    draw(state);
    $('hidden-label').hidden=state.visible;
    $('visibility-label').textContent=state.visible?'Visible':'Hidden';
    $('show-scene').setAttribute('aria-pressed',String(state.visible));
    canvas.setAttribute('aria-label',state.visible?M.describe(state.current):'Scene hidden. No design is displayed.');
    $('undo').disabled=state.undoCount===0;$('redo').disabled=state.redoCount===0;
    $('draft-label').textContent=formDirty?'Changes staged':'Applied';
    describeCurrent(state);
  }
  function fillFields(scene) {
    const s=M.canonicalScene(scene).scene;
    $('scene-name').value=s.name;$('shape').value=s.shape;$('position-x').value=String(s.x);$('position-y').value=String(s.y);$('size').value=String(s.size);$('dot-count').value=String(s.dotCount);$('dot-radius').value=String(s.dotRadius);$('palette').value=s.palette;
    updateDotControls();
  }
  function updateDotControls() {const disabled=$('shape').value!=='dots';$('dot-count').disabled=disabled;$('dot-radius').disabled=disabled;}
  function readFields() {return {format:M.FORMAT,version:M.VERSION,sampler:M.SAMPLER,scene:{name:$('scene-name').value,shape:$('shape').value,x:Number($('position-x').value),y:Number($('position-y').value),size:Number($('size').value),dotCount:Number($('dot-count').value),dotRadius:Number($('dot-radius').value),palette:$('palette').value}};}
  function hide(message) {controller.hide();render();say(message||'Scene hidden. Pause briefly before choosing Show again.');}
  function edited() {
    controller.hide();formDirty=true;updateDotControls();
    controller.stage(readFields());
    render();say('Changes staged. Apply them before showing the scene.');
  }
  fieldIDs.forEach(id=>$(id).addEventListener('input',edited));
  $('preset').addEventListener('change',()=>{
    const index=Number($('preset').value);if($('preset').value==='' || !Number.isInteger(index) || !M.presets()[index])return;
    const next=M.presets()[index];controller.stage(next);fillFields(next);formDirty=true;render();say('Preset staged. Choose Apply changes, then Show scene when you choose.');
  });
  $('scene-form').addEventListener('submit',event=>{
    event.preventDefault();
    const result=controller.apply(readFields());
    if(!result.ok){render();say(result.error,true);return;}
    formDirty=false;fillFields(result.state.current);render();say('Changes applied. The scene is hidden; choose Show scene to display it.');
  });
  $('discard').addEventListener('click',()=>{
    controller.hide();controller.discard();formDirty=false;fillFields(controller.getState().current);$('preset').value='';render();say('Staged changes discarded. Your applied scene is hidden.');
  });
  $('show-scene').addEventListener('click',()=>{
    if(!context){say('Canvas is unavailable in this browser. The scene stays hidden; JSON editing and downloads are still available.',true);return;}
    if(formDirty){controller.invalidateImport();say('Apply or discard staged changes before showing the scene.',true);return;}
    const result=controller.show();render();say(result.ok?'Scene visible. Hide or press Escape at any time.':result.error,!result.ok);
  });
  $('hide-scene').addEventListener('click',()=>hide());
  $('end-viewing').addEventListener('click',()=>{
    controller.end();render();say('Viewing ended. Your scene and optional note remain in this open page.');
    $('guidance-title').setAttribute('tabindex','-1');$('guidance-title').focus();
  });
  ['undo','redo'].forEach(action=>$(action).addEventListener('click',()=>{
    const result=controller[action]();
    if(result.ok){formDirty=false;fillFields(result.state.current);$('preset').value='';}
    render();say(result.ok?(action==='undo'?'Previous':'Next')+' scene restored and hidden. Choose Show scene when you choose.':result.error,!result.ok);
  }));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();hide('Scene hidden with Escape. Pending file reads were canceled.');}
    if(event.repeat && (event.key==='Enter' || event.key===' ') && event.target && event.target.closest && event.target.closest('button'))event.preventDefault();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hide('Scene hidden while the page was away. It will not resume automatically.');});
  window.addEventListener('blur',()=>hide('Scene hidden because the window lost focus. Show it again when you choose.'));
  window.addEventListener('pagehide',()=>{controller.hide();render();objectURLs.forEach(url=>URL.revokeObjectURL(url));objectURLs.clear();});
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
    if(formDirty){say('Apply or discard staged changes before downloading the scene.',true);return;}
    hide('Scene hidden for download.');
    try {download(M.canonicalScene(controller.getState().current),'imagery-field-scene-v1.json');}catch(e){say(e.message,true);}
  });
  $('scene-import').addEventListener('change',async()=>{
    const file=$('scene-import').files && $('scene-import').files[0];$('scene-import').value='';
    if(!file)return;
    const token=controller.beginImport();render();
    if(file.size>M.MAX_IMPORT_BYTES){controller.invalidateImport();say('Scene file must be no larger than 1 MiB. Your applied scene is unchanged.',true);return;}
    say('Reading the local scene file. The field stays hidden.');
    try {
      const text=await file.text();
      const state=controller.getState();
      if(token!==state.epoch || !state.pendingImport)return;
      const result=controller.finishImport(token,text);
      if(result.ok){formDirty=false;fillFields(result.state.current);$('preset').value='';}
      render();say(result.ok?'Scene opened and hidden. Choose Show scene when you choose.':result.error+' Your applied scene is unchanged.',!result.ok);
    } catch(e) {
      const state=controller.getState();if(token!==state.epoch || !state.pendingImport)return;
      controller.invalidateImport();render();say('The file could not be read. Your applied scene is unchanged.',true);
    }
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
