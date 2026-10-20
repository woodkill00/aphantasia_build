/* Original preset browser. MIT, copyright (c) 2026 woodkill00.
   Static opt-in thumbnails only; no main-scene, playback or saving authority. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(root);
  else root.ImageryGalleryUI=factory(root);
}(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const THUMB_WIDTH=64,THUMB_HEIGHT=48,MAX_PREVIEWS=12;
  function mount(container,callbacks){
    const doc=container.ownerDocument||root.document,P=root.ImageryPresets,M=root.ImageryModel;
    if(!doc||!P||!M)throw Error('The preset gallery requires the preset and scene models.');
    const onEdit=callbacks&&callbacks.onEdit,onUseDraft=callbacks&&callbacks.onUseDraft;
    if(typeof onEdit!=='function'||typeof onUseDraft!=='function')throw Error('The preset gallery needs edit and draft callbacks.');
    const entries=P.list();
    if(entries.length<1||entries.length>MAX_PREVIEWS)throw Error('The gallery supports one to twelve original examples.');
    const rows=[],listeners=[],filters=[];let disposed=false,previewsVisible=false;
    const el=(tag,id,text)=>{const node=doc.createElement(tag);if(id)node.id=id;if(text!==undefined)node.textContent=text;return node;};
    const listen=(node,type,handler)=>{node.addEventListener(type,handler);listeners.push([node,type,handler]);};
    const panel=el('fieldset','gallery-panel');panel.className='group preset-gallery';
    panel.appendChild(el('legend',null,'Original preset gallery'));
    const intro=el('p',null,'Original editable examples, not a recommended sequence or evidence of efficacy. Browse text first. Static thumbnails appear only when requested and never run fades or pulse.');intro.className='hint';panel.appendChild(intro);
    const filterGrid=el('div');filterGrid.className='control-grid gallery-filters';panel.appendChild(filterGrid);
    function filter(id,label,values){
      const wrap=el('div'),lab=el('label',null,label),select=el('select',id);lab.htmlFor=id;
      for(const [value,text]of [['all','Any'],...values]){const option=el('option',null,text);option.value=value;select.appendChild(option);}
      select.value='all';wrap.append(lab,select);filterGrid.appendChild(wrap);filters.push(select);return select;
    }
    const counts=key=>[...new Set(entries.map(entry=>entry[key]))].sort((a,b)=>a-b).map(value=>[String(value),String(value)]);
    const itemFilter=filter('gallery-filter-items','Item count',counts('itemCount'));
    const colorFilter=filter('gallery-filter-colors','Item color count',counts('colorCount'));
    const symmetryFilter=filter('gallery-filter-symmetry','Vertical symmetry',[['vertical','Vertically mirrored'],['not-vertical','Not vertically mirrored']]);
    const overlapFilter=filter('gallery-filter-overlap','Geometric overlap',[['yes','Overlapping regions'],['no','Separate regions']]);
    const timingFilter=filter('gallery-filter-timing','Authored timing',[['steady','Steady, no pulse'],['sequential-fades','Sequential fades'],['mixed-steady-pulse','Steady + optional pulse']]);
    const help=el('p',null,'Color count excludes the shared background and disabled effects. Symmetry includes colors. Overlap includes contained shapes, not only crossing outlines. Filters describe geometry and timing, not clinical outcomes.');help.className='hint';panel.appendChild(help);
    const actions=el('div');actions.className='small-actions';
    const toggle=el('button','gallery-toggle-thumbnails','Show static thumbnails');toggle.type='button';toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-controls','gallery-list');
    const reset=el('button','gallery-reset-filters','Reset filters');reset.type='button';actions.append(toggle,reset);panel.appendChild(actions);
    const status=el('p','gallery-status');status.className='hint';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');panel.appendChild(status);
    const list=el('ul','gallery-list');list.className='gallery-list';panel.appendChild(list);
    const timingLabels={'steady':'Steady, no pulse','sequential-fades':'Sequential fades','mixed-steady-pulse':'Steady + optional pulse'};
    for(const entry of entries){
      const row=el('li','gallery-entry-'+entry.id);row.className='gallery-entry';
      const details=el('details','gallery-details-'+entry.id),summary=el('summary',null,entry.title+' · '+entry.itemCount+' items · '+entry.colorCount+' item colors');
      const description=el('p','gallery-description-'+entry.id,entry.description);description.className='hint';
      const metadata=el('p',null,(entry.symmetry==='vertical'?'Vertically mirrored':'Not vertically mirrored')+'; '+(entry.overlap?'overlapping geometric regions':'separate geometric regions')+'; '+timingLabels[entry.timingKind]+'. ID '+entry.id+', revision '+entry.revision+'. '+entry.license+' license. Scene-v'+entry.validation.version+' validator passed.');metadata.className='hint';
      const provenance=el('p',null,entry.provenance);provenance.className='hint';details.append(summary,description,metadata,provenance);
      const use=el('button','gallery-use-'+entry.id,'Use draft: '+entry.title);use.type='button';use.setAttribute('aria-describedby',description.id);
      row.append(details,use);list.appendChild(row);rows.push({entry,row,use,canvas:null});
      listen(use,'click',()=>useDraft(entry));
    }
    const hint=el('p',null,'Use draft replaces the editable draft only and keeps it hidden. Live preview and Apply remain separate choices. Editing does not retain an unchanged preset identity. Hide, End, Escape and page interruptions also conceal every gallery thumbnail.');hint.className='hint';panel.appendChild(hint);container.appendChild(panel);
    function say(text,error){status.textContent=String(text).slice(0,300);status.className=error?'hint error':'hint';}
    function hidePreviews(){
      previewsVisible=false;toggle.textContent='Show static thumbnails';toggle.setAttribute('aria-pressed','false');
      for(const row of rows)if(row.canvas){row.canvas.hidden=true;row.canvas.width=1;row.canvas.height=1;}
    }
    function invalidate(reason){hidePreviews();if(!disposed)say(reason||'Static thumbnails hidden. Use Show static thumbnails only when wanted.');}
    function beginChange(){
      hidePreviews();
      try{onEdit();return !disposed;}catch(error){say(error&&error.message||'The gallery action could not begin. No draft was staged.',true);return false;}
    }
    function match(value,actual){return value==='all'||value===String(actual);}
    function applyFilters(){
      hidePreviews();let count=0;
      for(const row of rows){const entry=row.entry;row.row.hidden=!(match(itemFilter.value,entry.itemCount)&&match(colorFilter.value,entry.colorCount)&&match(symmetryFilter.value,entry.symmetry)&&match(overlapFilter.value,entry.overlap?'yes':'no')&&match(timingFilter.value,entry.timingKind));if(!row.row.hidden)count++;}
      toggle.disabled=disposed||count===0;
      say(count+' of '+entries.length+' examples match. Thumbnails hidden; use Show static thumbnails if wanted.');
    }
    function drawThumbnail(row){
      const value=M.canonicalScene(P.create(row.entry.id));
      if(value.version!==M.AUTHORED_VERSION||value.scene.canvas.ratio!=='4:3'||value.scene.objects.length>M.MAX_OBJECTS||value.scene.objects.some(o=>o.outline.enabled||o.shadow.enabled))throw Error('This example is not supported by the bounded static thumbnail renderer.');
      if(!row.canvas){
        row.canvas=el('canvas','gallery-thumbnail-'+row.entry.id);row.canvas.className='gallery-thumbnail';row.canvas.hidden=true;
        row.canvas.setAttribute('role','img');row.canvas.setAttribute('aria-label',row.entry.title+'. Static composition only; all items shown without timing. '+row.entry.description);
        row.row.appendChild(row.canvas);
      }
      const canvas=row.canvas;canvas.width=THUMB_WIDTH;canvas.height=THUMB_HEIGHT;
      const ctx=canvas.getContext('2d');if(!ctx)throw Error('Static thumbnails need a working Canvas 2D context. Text browsing remains available.');
      ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
      ctx.fillStyle=M.colorCSS(value.scene.background);ctx.fillRect(0,0,THUMB_WIDTH,THUMB_HEIGHT);
      for(const shape of M.geometry(value,THUMB_WIDTH,THUMB_HEIGHT)){
        if(shape.kind!=='polygon'||!shape.points.length||shape.points.length>64||shape.points.some(point=>point.length!==2||!point.every(Number.isFinite)))throw Error('Unsupported static thumbnail geometry.');
        ctx.beginPath();shape.points.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
        ctx.fillStyle=shape.color;ctx.strokeStyle=shape.color;ctx.lineWidth=shape.lineWidth;
        if(shape.filled)ctx.fill();else ctx.stroke();
      }
    }
    function togglePreviews(){
      if(disposed)return;
      const wasVisible=previewsVisible;
      if(!beginChange())return;
      if(wasVisible){say('All static thumbnails hidden. No scene was changed.');return;}
      if(doc.hidden){say('Thumbnails stay hidden while the page is not visible.');return;}
      const visibleRows=rows.filter(row=>!row.row.hidden);
      if(!visibleRows.length){say('No examples match these filters. Thumbnails remain hidden.');return;}
      try{
        // Every canvas stays concealed until the complete bounded draw succeeds.
        // No timers, asynchronous decode or offscreen full-size buffers are used.
        for(const row of visibleRows)drawThumbnail(row);
        if(disposed||doc.hidden){hidePreviews();return;}
        for(const row of visibleRows)row.canvas.hidden=false;
        previewsVisible=true;toggle.textContent='Hide static thumbnails';toggle.setAttribute('aria-pressed','true');
        say(visibleRows.length+' static thumbnails shown by request. No timing or playback is running.');
      }catch(error){hidePreviews();say(error&&error.message||'Thumbnails could not be drawn. Text browsing remains available.',true);}
    }
    function useDraft(entry){
      if(disposed||!beginChange())return;
      try{
        const value=M.canonicalScene(P.create(entry.id));
        onUseDraft(value);
        if(!disposed)say(entry.title+' staged as an editable draft, still hidden. Use Live preview explicitly to review; Apply accepts it for download.');
      }catch(error){say(error&&error.message||'This example could not be staged. Check the current draft before retrying.',true);}
    }
    for(const control of filters)listen(control,'change',()=>{if(!disposed&&beginChange())applyFilters();});
    listen(toggle,'click',togglePreviews);
    listen(reset,'click',()=>{if(!disposed&&beginChange()){for(const control of filters)control.value='all';applyFilters();}});
    const interrupted=()=>{if(!disposed)invalidate('Static thumbnails hidden after an interruption. Show them again only when wanted.');};
    listen(doc,'keydown',event=>{if(event.key==='Escape')interrupted();});
    for(const event of ['visibilitychange','freeze','fullscreenchange'])listen(doc,event,interrupted);
    for(const event of ['pagehide','pageshow','blur','resize'])listen(root,event,interrupted);
    applyFilters();
    return Object.freeze({invalidate,disablePreviews:invalidate,destroy(){
      if(disposed)return;hidePreviews();disposed=true;
      for(const control of [...filters,toggle,reset,...rows.map(row=>row.use)])control.disabled=true;
      for(const [node,type,handler]of listeners)if(typeof node.removeEventListener==='function')node.removeEventListener(type,handler);
      panel.remove();
    }});
  }
  return Object.freeze({mount});
}));
