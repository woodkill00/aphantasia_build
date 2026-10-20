/* Local photo approximation controls. Repository-authored, MIT licensed.
   This panel has no scene visibility, network, storage, or export authority. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(root);
  else root.ImageryImageUI=factory(root);
}(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  function mount(container,callbacks){
    const doc=container.ownerDocument||root.document,I=root.ImageryImage,F=root.ImageryImageFile,M=root.ImageryModel;
    if(!doc||!I||!F||!M)throw Error('Local image controls require the image, file, and scene models.');
    const onEdit=callbacks&&callbacks.onEdit,onUseDraft=callbacks&&callbacks.onUseDraft;
    if(typeof onEdit!=='function'||typeof onUseDraft!=='function')throw Error('Local image controls need edit and draft callbacks.');
    let generation=0,job=null,timer=null,source=null,candidate=null,candidateOptions=null,busy=false,disposed=false,intakeActive=false;
    const listeners=[],optionControls=[];
    const el=(tag,id,text)=>{const n=doc.createElement(tag);if(id)n.id=id;if(text!==undefined)n.textContent=text;return n;};
    const listen=(node,type,handler)=>{node.addEventListener(type,handler);listeners.push([node,type,handler]);};
    const panel=el('fieldset','image-panel');panel.className='group';
    panel.appendChild(el('legend',null,'Local image approximation'));
    const intro=el('p',null,'Experimental shape sketch, not image recognition or an imagery assessment. Processing stays on this page: no image upload or storage. A derived sketch can still disclose image content.');
    intro.className='hint';panel.appendChild(intro);
    const fileLabel=el('label',null,'Choose a still PNG or JPEG');fileLabel.htmlFor='image-file';
    const fileInput=el('input','image-file');fileInput.type='file';fileInput.accept='image/png,image/jpeg,.png,.jpg,.jpeg';
    const fileHint=el('p','image-file-hint','At most 8 MiB, 4096 pixels per side and 8,388,608 decoded pixels. Only a thumbnail of at most 128 pixels per side is kept in memory.');fileHint.className='hint';
    fileInput.setAttribute('aria-describedby','image-file-hint');
    panel.append(fileLabel,fileInput,fileHint);
    const sourceSummary=el('p','image-source-summary','No image selected.');sourceSummary.className='hint';panel.appendChild(sourceSummary);
    const grid=el('div');grid.className='control-grid';panel.appendChild(grid);
    function field(parent,id,label,choices,initial,attrs){
      const wrap=el('div'),lab=el('label',null,label);lab.htmlFor=id;
      const input=el(choices?'select':'input',id);
      if(choices)for(const [value,text]of choices){const option=el('option',null,text);option.value=value;input.appendChild(option);}
      else{input.type='number';for(const [k,v]of Object.entries(attrs||{}))input[k]=String(v);}
      input.value=String(initial);wrap.append(lab,input);parent.appendChild(wrap);
      optionControls.push([input,String(initial)]);return input;
    }
    const budget=field(grid,'image-budget','Maximum items',[['3','3 items'],['6','6 items'],['12','12 items']],6);
    const seed=field(grid,'image-seed','Reproducible seed',null,1,{min:0,max:4294967295,step:1});
    const ratio=field(grid,'image-ratio','Authored canvas ratio',Object.keys(I.RATIOS).map(x=>[x,x]),'1:1');
    const palette=field(grid,'image-palette','Color palette',[['source','Source colors (bounded)'],['muted','Muted slate, sage, sand']],'source');
    const cropGroup=el('fieldset');cropGroup.className='group';cropGroup.appendChild(el('legend',null,'Crop / focus area'));
    const cropHint=el('p',null,'Percentages of the oriented thumbnail. The crop is fitted inside the chosen canvas without stretching; unused space keeps the dark background.');cropHint.className='hint';cropGroup.appendChild(cropHint);
    const cropGrid=el('div');cropGrid.className='control-grid';cropGroup.appendChild(cropGrid);panel.appendChild(cropGroup);
    const cropX=field(cropGrid,'image-crop-x','Left (%)',null,0,{min:0,max:99.99,step:0.01});
    const cropY=field(cropGrid,'image-crop-y','Top (%)',null,0,{min:0,max:99.99,step:0.01});
    const cropWidth=field(cropGrid,'image-crop-width','Width (%)',null,100,{min:0.01,max:100,step:0.01});
    const cropHeight=field(cropGrid,'image-crop-height','Height (%)',null,100,{min:0.01,max:100,step:0.01});
    const actions=el('div');actions.className='small-actions';
    function button(id,text){const n=el('button',id,text);n.type='button';actions.appendChild(n);return n;}
    const generate=button('image-generate','Generate candidate'),cancel=button('image-cancel','Cancel / discard candidate'),use=button('image-use','Use editable draft'),clear=button('image-clear','Clear source');
    panel.appendChild(actions);
    const progress=el('progress','image-progress');progress.max=1;progress.value=0;progress.hidden=true;progress.setAttribute('aria-label','Approximation work completed');panel.appendChild(progress);
    const status=el('p','image-status','Choose an image, adjust options, then Generate. Nothing is applied or displayed automatically.');
    status.className='hint';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');panel.appendChild(status);
    const resultArea=el('div','image-result');resultArea.hidden=true;
    const resultSummary=el('p','image-result-summary');resultSummary.className='hint';
    const resultObjects=el('ol','image-result-objects');resultObjects.className='hint';resultArea.append(resultSummary,resultObjects);panel.appendChild(resultArea);
    const sourceToggle=el('button','image-toggle-source','Show source thumbnail');sourceToggle.type='button';sourceToggle.setAttribute('aria-expanded','false');sourceToggle.setAttribute('aria-controls','image-source-thumbnail');panel.appendChild(sourceToggle);
    const sourceCanvas=el('canvas','image-source-thumbnail');sourceCanvas.width=1;sourceCanvas.height=1;sourceCanvas.hidden=true;sourceCanvas.setAttribute('role','img');sourceCanvas.setAttribute('aria-label','Small local source thumbnail; this is the original image, not a generated scene.');panel.appendChild(sourceCanvas);
    const comparisonHint=el('p',null,'The source stays hidden unless you choose Show source thumbnail. This cancels any candidate; Generate again after viewing. The candidate description lists its shapes and pixel error, not what the picture means. Use editable draft stages shapes only, still hidden; review with Live preview, then Apply if wanted. Clear source removes the thumbnail from this page.');
    comparisonHint.className='hint';panel.appendChild(comparisonHint);container.appendChild(panel);

    function say(text,error){status.textContent=String(text).slice(0,300);status.className=error?'hint error':'hint';}
    function refresh(){
      fileInput.disabled=disposed||intakeActive;
      generate.disabled=disposed||busy||intakeActive||!source;
      cancel.disabled=disposed||(!busy&&!intakeActive&&!candidate);
      use.disabled=disposed||busy||!candidate;
      clear.disabled=disposed||(!busy&&!intakeActive&&!source&&!candidate);
      sourceToggle.disabled=disposed||!source;
    }
    function hideSource(){
      sourceCanvas.hidden=true;sourceCanvas.width=1;sourceCanvas.height=1;
      sourceToggle.textContent='Show source thumbnail';sourceToggle.setAttribute('aria-expanded','false');
    }
    function forgetSource(){
      if(source)source.data.fill(0);
      source=null;hideSource();sourceSummary.textContent='No image selected.';
    }
    function invalidate(reason){
      generation++;
      if(timer!==null){root.clearTimeout(timer);timer=null;}
      if(job){job.cancel();job=null;}
      busy=false;candidate=null;candidateOptions=null;progress.hidden=true;progress.value=0;
      resultArea.hidden=true;resultSummary.textContent='';resultObjects.replaceChildren();
      hideSource();fileInput.value='';refresh();
      if(reason&&!disposed)say(reason);
    }
    function beginChange(reason){onEdit();invalidate(reason);}
    function readNumber(input){const raw=input.value.trim();return raw===''?NaN:Number(raw);}
    function options(){
      return I.canonicalOptions({maxObjects:readNumber(budget),seed:readNumber(seed),palette:palette.value,canvasRatio:ratio.value,crop:{x:readNumber(cropX)/100,y:readNumber(cropY)/100,width:readNumber(cropWidth)/100,height:readNumber(cropHeight)/100}});
    }
    function current(token){return !disposed&&token===generation;}
    function validDimensions(width,height){
      if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>F.MAX_DIMENSION||height>F.MAX_DIMENSION||width*height>F.MAX_PIXELS)throw Error('Decoded image dimensions must be at most 4096 per side and 8,388,608 pixels total.');
    }
    async function selectFile(){
      if(disposed)return;
      let file=fileInput.files&&fileInput.files[0],bytes=null,bitmap=null,scratch=null;
      // Reading and decoding cannot be aborted by a generation token. Keep one
      // resource lease until the original read/decode has actually settled and
      // its bitmap is closed. Disabled controls alone do not guard synthetic or
      // programmatic change events, so reject those while the lease is held.
      if(intakeActive){
        beginChange('Previous image intake is still finishing. Its result was cancelled. Wait, then choose the new file again.');
        file=null;fileInput.value='';return;
      }
      beginChange();forgetSource();refresh();const token=generation;
      if(!file){say('No image selected. Previous source and candidate were cleared.');return;}
      intakeActive=true;busy=true;refresh();say('Checking the local image before decoding…');
      try{
        if(!Number.isInteger(file.size)||file.size<1||file.size>F.MAX_BYTES)throw Error('Choose a PNG or JPEG image no larger than 8 MiB.');
        if(file.type&&!['image/png','image/jpeg'].includes(file.type))throw Error('Only PNG and JPEG still images are supported.');
        if(typeof file.arrayBuffer!=='function'||typeof root.createImageBitmap!=='function')throw Error('Local image decoding is unavailable in this browser. No image was converted.');
        bytes=new Uint8Array(await file.arrayBuffer());
        if(!current(token))return;
        if(bytes.byteLength!==file.size)throw Error('Image byte count changed while reading.');
        const header=F.inspect(bytes);validDimensions(header.width,header.height);
        if(file.type&&file.type!==header.type)throw Error('The image type does not match its file header.');
        bytes=null;
        bitmap=await root.createImageBitmap(file,{imageOrientation:'from-image'});file=null;
        if(!current(token))return;
        validDimensions(bitmap.width,bitmap.height);
        const scale=Math.min(1,128/bitmap.width,128/bitmap.height),width=Math.max(1,Math.floor(bitmap.width*scale)),height=Math.max(1,Math.floor(bitmap.height*scale));
        if(width>128||height>128||width*height>16384)throw Error('Thumbnail exceeds its processing budget.');
        scratch=doc.createElement('canvas');scratch.width=width;scratch.height=height;
        const ctx=scratch.getContext('2d',{willReadFrequently:true});
        if(!ctx)throw Error('Local image conversion needs a working Canvas 2D context.');
        ctx.drawImage(bitmap,0,0,width,height);
        const data=ctx.getImageData(0,0,width,height).data;
        source=I.validatePixels({width,height,data});
        sourceSummary.textContent='Local source: '+bitmap.width+' × '+bitmap.height+' oriented pixels; retained thumbnail '+width+' × '+height+'. Source hidden.';
        say('Local thumbnail ready. Choose Generate to create a candidate; the scene remains unchanged.');
      }catch(error){
        if(current(token)){forgetSource();say(error&&error.message||'The local image could not be decoded.',true);}
      }finally{
        // No object URL is created. Release the File/raw bytes and decoder buffer.
        bytes=null;file=null;
        if(bitmap&&typeof bitmap.close==='function')bitmap.close();
        bitmap=null;if(scratch){scratch.width=1;scratch.height=1;}scratch=null;
        // A cancellation can clear busy/results, never this lease. Even a stale
        // completion must release it here, without replacing the newer status.
        intakeActive=false;fileInput.value='';
        if(current(token))busy=false;
        refresh();
      }
    }
    function describe(plan){
      const q=plan.quality,a=plan.algorithm;
      resultSummary.textContent='Approximate candidate: '+plan.objects.length+' of '+a.maxObjects+' items; canvas '+plan.canvas.ratio+'. Algorithm '+a.id+' v'+a.version+', seed '+a.seed+'. Normalized RGB pixel error '+q.finalError.toFixed(6)+' (baseline '+q.initialError.toFixed(6)+'). This is not semantic recognition, a usefulness measure, or evidence of efficacy.';
      resultObjects.replaceChildren();
      for(const object of plan.objects)resultObjects.appendChild(el('li',null,object.id+': filled '+object.shape+', center '+object.x+'% / '+object.y+'%, width '+object.size+'%, height '+object.geometry.height+'%, HSL '+object.color.h+'° / '+object.color.s+'% / '+object.color.l+'%.'));
      if(!plan.objects.length)resultObjects.appendChild(el('li',null,'No shape improves this bounded pixel-error fit. The candidate contains only the dark background.'));
      resultArea.hidden=false;
    }
    function run(){
      if(disposed)return;
      beginChange();
      if(!source){say('Choose a supported image first.',true);return;}
      let chosen;
      try{chosen=options();job=I.createJob(source,chosen);}
      catch(error){say(error.message,true);refresh();return;}
      const token=generation,fingerprint=JSON.stringify(chosen);
      busy=true;progress.hidden=false;progress.value=0;refresh();say('Generating a bounded local candidate…');
      function step(){
        if(!current(token)||!job)return;
        timer=null;
        try{
          const state=job.step(16);
          if(!current(token))return;
          progress.value=state.progress;
          if(state.status==='complete'){
            if(JSON.stringify(options())!==fingerprint){invalidate('Options changed. Generate again to review a current candidate.');return;}
            candidate=I.canonicalPlan(state.result);candidateOptions=fingerprint;job=null;busy=false;
            describe(candidate);progress.value=1;refresh();
            say('Candidate complete, not applied. Review its description, then choose Use editable draft if wanted.');
          }else if(state.status==='running'){
            say('Generating candidate: '+Math.floor(state.progress*100)+'% of the bounded search budget.');
            timer=root.setTimeout(step,0);
          }else invalidate('Conversion cancelled. No candidate was applied.');
        }catch(error){invalidate();say(error.message||'Conversion could not finish.',true);}
      }
      // Even the first search slice yields; no timer has reveal authority.
      timer=root.setTimeout(step,0);
    }
    function useCandidate(){
      if(disposed||!candidate||busy)return;
      let scene;
      try{
        if(JSON.stringify(options())!==candidateOptions)throw Error('Options changed. Generate again before using this candidate.');
        scene=I.toScene(candidate,M);
      }catch(error){beginChange();say(error.message,true);return;}
      beginChange();
      try{onUseDraft(scene);say('Editable shapes staged, not applied. The source image is not part of the scene. Use Live preview explicitly to review.');}
      catch(error){say(error.message||'The candidate could not be staged; the prior scene is unchanged.',true);}
    }
    function clearSource(){
      if(disposed)return;
      beginChange();forgetSource();
      for(const [input,value]of optionControls)input.value=value;
      refresh();say('Source and candidate cleared from this page. Options reset. Existing scene work is unchanged.');
    }
    function toggleSource(){
      if(disposed||!source)return;
      const wasVisible=!sourceCanvas.hidden;
      beginChange();
      if(wasVisible){say('Source thumbnail hidden. Generate again if you want a candidate.');return;}
      try{
        sourceCanvas.width=source.width;sourceCanvas.height=source.height;
        const ctx=sourceCanvas.getContext('2d');
        if(!ctx)throw Error('Source thumbnail display is unavailable.');
        const data=ctx.createImageData(source.width,source.height);data.data.set(source.data);ctx.putImageData(data,0,0);
        sourceCanvas.hidden=false;sourceToggle.textContent='Hide source thumbnail';sourceToggle.setAttribute('aria-expanded','true');
        say('Source thumbnail shown by request; prior candidate discarded. Generate creates a new candidate and hides this thumbnail.');
      }catch(error){hideSource();say(error.message,true);}
    }
    listen(fileInput,'change',selectFile);
    for(const [input]of optionControls)listen(input,input.tagName.toLowerCase()==='select'?'change':'input',()=>{if(!disposed)beginChange('Options changed. Generate again; no candidate is applied.');});
    listen(generate,'click',run);listen(cancel,'click',()=>{if(!disposed)beginChange('Conversion cancelled and candidate discarded. Existing scene work is unchanged.');});
    listen(use,'click',useCandidate);listen(clear,'click',clearSource);listen(sourceToggle,'click',toggleSource);
    const lifecycle=()=>{if(!disposed)invalidate('Image work cancelled after a page interruption. Source thumbnail hidden; Generate again when ready.');};
    listen(doc,'visibilitychange',lifecycle);listen(root,'pagehide',lifecycle);
    refresh();
    return Object.freeze({
      invalidate,
      clear:clearSource,
      destroy(){
        if(disposed)return;
        invalidate();forgetSource();disposed=true;refresh();
        for(const [node,type,handler]of listeners)if(typeof node.removeEventListener==='function')node.removeEventListener(type,handler);
        panel.remove();
      }
    });
  }
  return Object.freeze({mount});
}));
