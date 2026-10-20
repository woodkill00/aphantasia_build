/* Local, bounded geometric approximation. Repository-authored, MIT licensed.
   This is a deterministic raster-error experiment, not semantic recognition,
   imagery assessment, a medical score, or evidence of useful correction effort.
   The caller decodes only an explicitly selected raster and supplies a thumbnail.
   This module has no DOM, timers, network, storage, or display authority. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ImageryImage = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMAT = 'imagery-raster-approximation', VERSION = 1;
  const ALGORITHM = 'seeded-region-primitives', ALGORITHM_VERSION = 1;
  const LIMITS = Object.freeze({maxFileBytes:8388608,maxDecodedDimension:4096,maxDecodedPixels:8388608,maxInputDimension:128,maxInputPixels:16384,workingDimension:48,maxObjects:12,candidatesPerObject:384,maxStepCandidates:32,maxModelTypedArrayBytes:86272});
  const RATIOS = Object.freeze({'1:1':1,'4:3':4/3,'3:4':3/4,'16:9':16/9,'9:16':9/16});
  const SHAPES = Object.freeze(['rectangle','ellipse','triangle']);
  const MUTED = Object.freeze([{h:208,s:11,l:48},{h:126,s:8,l:49},{h:40,s:13,l:48}].map(Object.freeze));
  const DEFAULTS = Object.freeze({maxObjects:6,seed:1,palette:'source',canvasRatio:'1:1',background:Object.freeze({h:4,s:60,l:4}),crop:Object.freeze({x:0,y:0,width:1,height:1})});
  const typedLength=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),'length').get;
  const bufferLength=Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get;
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (n,lo,hi) => Math.max(lo,Math.min(hi,n));
  const round = (n,scale=100) => Math.round(n*scale)/scale;
  function record(value, keys, label, optional=false) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) throw Error(label+' must be an ordinary object.');
    const own=Reflect.ownKeys(value);
    if ((!optional && own.length!==keys.length) || own.some(k=>typeof k!=='string'||!keys.includes(k))) throw Error(label+' has missing or unsupported fields.');
    for (const k of own) {const descriptor=Object.getOwnPropertyDescriptor(value,k);if (!Object.prototype.hasOwnProperty.call(descriptor,'value')||!descriptor.enumerable) throw Error(label+' requires enumerable data fields without accessors.');}
  }
  function integer(value,min,max,label) {if(!Number.isInteger(value)||value<min||value>max)throw Error(label+' must be a whole number from '+min+' to '+max+'.');return value;}
  function number(value,min,max,label,scale) {if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||(scale&&Math.abs(value*scale-Math.round(value*scale))>1e-8))throw Error(label+' is outside its supported range or precision.');return value===0?0:value;}
  function color(value,background) {record(value,['h','s','l'],'Color');return {h:integer(value.h,0,359,'Hue'),s:integer(value.s,0,background?100:70,'Saturation'),l:integer(value.l,background?0:10,background?40:70,'Lightness')};}
  function crop(value) {
    record(value,['x','y','width','height'],'Crop');
    const c={x:number(value.x,0,1,'Crop X',10000),y:number(value.y,0,1,'Crop Y',10000),width:number(value.width,0.0001,1,'Crop width',10000),height:number(value.height,0.0001,1,'Crop height',10000)};
    if(c.x+c.width>1+1e-12||c.y+c.height>1+1e-12)throw Error('Keep the crop inside the selected image.');
    return c;
  }
  function canonicalOptions(value={}) {
    record(value,Object.keys(DEFAULTS),'Conversion options',true);
    const o={...DEFAULTS,...value};
    if(![3,6,12].includes(o.maxObjects))throw Error('Choose a 3, 6, or 12 item budget.');
    integer(o.seed,0,4294967295,'Seed');
    if(!['source','muted'].includes(o.palette))throw Error('Choose the source or muted palette.');
    if(typeof o.canvasRatio!=='string'||!Object.prototype.hasOwnProperty.call(RATIOS,o.canvasRatio))throw Error('Choose a supported authored aspect ratio.');
    return {maxObjects:o.maxObjects,seed:o.seed,palette:o.palette,canvasRatio:o.canvasRatio,background:color(o.background,true),crop:crop(o.crop)};
  }
  function validatePixels(input) {
    record(input,['width','height','data'],'Pixel input');
    const width=integer(input.width,1,LIMITS.maxInputDimension,'Thumbnail width'),height=integer(input.height,1,LIMITS.maxInputDimension,'Thumbnail height');
    if(width*height>LIMITS.maxInputPixels)throw Error('Thumbnail exceeds its pixel budget.');
    const data=input.data;
    if(!data||![Uint8Array.prototype,Uint8ClampedArray.prototype].includes(Object.getPrototypeOf(data)))throw Error('Pixels must be an ordinary Uint8Array or Uint8ClampedArray.');
    const expected=width*height*4;
    // Check the intrinsic length before enumerating keys: an oversized array
    // must not cause an unbounded Reflect.ownKeys allocation.
    if(typedLength.call(data)!==expected)throw Error('RGBA pixels have an unexpected length.');
    const keys=Reflect.ownKeys(data);
    if(keys.length!==expected||keys.some(k=>typeof k!=='string'||!/^\d+$/.test(k)||Number(k)>=expected)||data.length!==expected)throw Error('RGBA pixels have an unexpected length or unsupported fields.');
    if(Object.getPrototypeOf(data.buffer)!==ArrayBuffer.prototype)throw Error('Shared or custom pixel buffers are not supported.');
    if(bufferLength.call(data.buffer)>LIMITS.maxInputPixels*4)throw Error('Pixel backing buffer exceeds the thumbnail budget.');
    return {width,height,data};
  }
  function rgb(hsl) {
    const h=hsl.h/60,s=hsl.s/100,l=hsl.l/100,c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h%2-1)),m=l-c/2;
    const p=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];
    return p.map(v=>Math.round((v+m)*255));
  }
  function allowedColor(r,g,b,palette) {
    if(palette==='muted') {
      let best=MUTED[0],error=Infinity;
      for(const candidate of MUTED){const p=rgb(candidate),e=(p[0]-r)**2+(p[1]-g)**2+(p[2]-b)**2;if(e<error){best=candidate;error=e;}}
      return {color:{...best},clipped:false};
    }
    r/=255;g/=255;b/=255;
    const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo,l=(hi+lo)/2;
    let h=0,s=0;
    if(d){s=d/(1-Math.abs(2*l-1));h=60*(hi===r?((g-b)/d)%6:hi===g?(b-r)/d+2:(r-g)/d+4);}
    const rawS=Math.round(s*100),rawL=Math.round(l*100);
    return {color:{h:(Math.round(h)+360)%360,s:clamp(rawS,0,70),l:clamp(rawL,10,70)},clipped:rawS>70||rawL<10||rawL>70};
  }
  function dimensions(ratio) {const r=RATIOS[ratio],n=LIMITS.workingDimension;return r>=1?{width:n,height:Math.round(n/r)}:{width:Math.round(n*r),height:n};}
  function prepare(input,options) {
    const source=validatePixels(input),d=dimensions(options.canvasRatio),background=rgb(options.background),target=new Uint8ClampedArray(d.width*d.height*3),current=new Uint8ClampedArray(target.length);
    const c=options.crop,sw=source.width*c.width,sh=source.height*c.height,scale=Math.min(d.width/sw,d.height/sh),left=(d.width-sw*scale)/2,top=(d.height-sh*scale)/2;
    let transparentPixels=0;
    for(let i=3;i<source.data.length;i+=4)if(source.data[i]<255)transparentPixels++;
    // Area sampling in premultiplied form: hidden RGB in transparent pixels
    // never contributes, and a rectangular crop is contained without stretching.
    for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++) {
      const i=(y*d.width+x)*3;
      for(let k=0;k<3;k++)target[i+k]=current[i+k]=background[k];
      const ax=Math.max(x,left),ay=Math.max(y,top),bx=Math.min(x+1,left+sw*scale),by=Math.min(y+1,top+sh*scale);
      if(bx<=ax||by<=ay)continue;
      const sx0=c.x*source.width+(ax-left)/scale,sy0=c.y*source.height+(ay-top)/scale,sx1=c.x*source.width+(bx-left)/scale,sy1=c.y*source.height+(by-top)/scale;
      const sum=[0,0,0];let weight=0;
      for(let py=Math.max(0,Math.floor(sy0));py<Math.min(source.height,Math.ceil(sy1));py++)for(let px=Math.max(0,Math.floor(sx0));px<Math.min(source.width,Math.ceil(sx1));px++) {
        const w=Math.max(0,Math.min(px+1,sx1)-Math.max(px,sx0))*Math.max(0,Math.min(py+1,sy1)-Math.max(py,sy0)),p=(py*source.width+px)*4,a=source.data[p+3]/255;
        weight+=w;for(let k=0;k<3;k++)sum[k]+=(source.data[p+k]*a+background[k]*(1-a))*w;
      }
      const coverage=(bx-ax)*(by-ay);
      if(weight)for(let k=0;k<3;k++)target[i+k]=Math.round(sum[k]/weight*coverage+background[k]*(1-coverage));
    }
    return {...d,target,current,source:{width:source.width,height:source.height,crop:{...c},fit:'contain',transparentPixels}};
  }
  function errorAt(target,current,p) {const i=p*3;return (target[i]-current[i])**2+(target[i+1]-current[i+1])**2+(target[i+2]-current[i+2])**2;}
  function errorTotal(target,current) {let total=0;for(let p=0;p<target.length/3;p++)total+=errorAt(target,current,p);return total;}
  function seedRegion(work) {
    const {target,current,width,height}=work,n=width*height;
    let peak=0,peakError=0;
    for(let p=0;p<n;p++){const e=errorAt(target,current,p);if(e>peakError){peak=p;peakError=e;}}
    if(peakError===0)return null;
    const visited=new Uint8Array(n),queue=new Uint16Array(n),anchor=peak*3;let head=0,tail=1;
    queue[0]=peak;visited[peak]=1;
    let minX=peak%width,maxX=minX,minY=Math.floor(peak/width),maxY=minY;
    while(head<tail) {
      const p=queue[head++],x=p%width,y=Math.floor(p/width);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(const q of [x>0?p-1:-1,x+1<width?p+1:-1,y>0?p-width:-1,y+1<height?p+width:-1]) {
        if(q<0||visited[q])continue;visited[q]=1;const i=q*3;
        if(errorAt(target,current,q)<peakError*0.2||(target[i]-target[anchor])**2+(target[i+1]-target[anchor+1])**2+(target[i+2]-target[anchor+2])**2>12288)continue;
        queue[tail++]=q;
      }
    }
    const unit=Math.min(width,height)/100;
    return {x:(minX+maxX+1)/2/width*100,y:(minY+maxY+1)/2/height*100,size:clamp(Math.round((maxX-minX+1)/unit),1,28),height:clamp(Math.round((maxY-minY+1)/unit),1,28)};
  }
  function shapeCandidate(shape,x,y,size,height) {
    size=clamp(Math.round(size),1,28);height=clamp(Math.round(height),1,28);
    const extent=Math.max(size,height)/2;
    return {shape,x:round(clamp(x,extent+1,99-extent)),y:round(clamp(y,extent+1,99-extent)),size,geometry:{height,rotation:0,fill:true}};
  }
  function eachPixel(candidate,work,visit) {
    const u=Math.min(work.width,work.height)/100,rx=candidate.size*u/2,ry=candidate.geometry.height*u/2,cx=candidate.x*work.width/100,cy=candidate.y*work.height/100;
    const left=Math.max(0,Math.ceil(cx-rx-0.5)),right=Math.min(work.width-1,Math.floor(cx+rx-0.5)),top=Math.max(0,Math.ceil(cy-ry-0.5)),bottom=Math.min(work.height-1,Math.floor(cy+ry-0.5));
    for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++) {
      const dx=(x+0.5-cx)/rx,dy=(y+0.5-cy)/ry;
      if(candidate.shape==='ellipse'&&dx*dx+dy*dy>1)continue;
      if(candidate.shape==='triangle'&&Math.abs(dx)>(dy+1)/2)continue;
      visit((y*work.width+x)*3);
    }
  }
  function score(candidate,work,palette) {
    const sum=[0,0,0];let count=0;
    eachPixel(candidate,work,i=>{count++;for(let k=0;k<3;k++)sum[k]+=work.target[i+k];});
    if(!count)return null;
    const chosen=allowedColor(sum[0]/count,sum[1]/count,sum[2]/count,palette),paint=rgb(chosen.color);let gain=0;
    eachPixel(candidate,work,i=>{for(let k=0;k<3;k++)gain+=(work.target[i+k]-work.current[i+k])**2-(work.target[i+k]-paint[k])**2;});
    return {object:{...candidate,color:chosen.color},paint,gain,clipped:chosen.clipped};
  }
  function canonicalPlan(value) {
    record(value,['format','version','algorithm','canvas','background','objects','quality','source'],'Approximation plan');
    if(value.format!==FORMAT||value.version!==VERSION)throw Error('Unsupported approximation plan.');
    const a=value.algorithm;
    record(a,['id','version','seed','maxObjects','palette','candidatesPerObject','workingDimension','colorPolicy','complete'],'Algorithm');
    if(a.id!==ALGORITHM||a.version!==ALGORITHM_VERSION||a.complete!==true||a.candidatesPerObject!==LIMITS.candidatesPerObject||a.workingDimension!==LIMITS.workingDimension||a.colorPolicy!=='bounded-hsl')throw Error('Unsupported algorithm contract.');
    record(value.canvas,['mode','ratio'],'Canvas');if(value.canvas.mode!=='fixed')throw Error('Approximation canvas must have a fixed ratio.');
    const s=value.source;record(s,['width','height','crop','fit','transparentPixels'],'Source summary');
    const o=canonicalOptions({maxObjects:a.maxObjects,seed:a.seed,palette:a.palette,background:value.background,canvasRatio:value.canvas.ratio,crop:s.crop});
    const list=value.objects;
    if(!Array.isArray(list)||Object.getPrototypeOf(list)!==Array.prototype||list.length>o.maxObjects)throw Error('Approximation objects exceed their budget.');
    const keys=Reflect.ownKeys(list);
    if(keys.length!==list.length+1||keys.some(k=>k!=='length'&&(typeof k!=='string'||!/^\d+$/.test(k)||Number(k)>=list.length)))throw Error('Approximation objects cannot have holes or extra fields.');
    const objects=[];
    for(let i=0;i<list.length;i++) {
      const desc=Object.getOwnPropertyDescriptor(list,String(i));if(!desc||!Object.prototype.hasOwnProperty.call(desc,'value'))throw Error('Approximation objects cannot contain accessors.');
      const p=desc.value;record(p,['id','shape','x','y','size','geometry','color'],'Approximation item');
      if(p.id!=='object-'+(i+1)||!SHAPES.includes(p.shape))throw Error('Unsupported approximation item identifier or family.');
      record(p.geometry,['height','rotation','fill'],'Approximation geometry');
      if(p.geometry.rotation!==0||p.geometry.fill!==true)throw Error('Approximation geometry must be a steady filled unrotated primitive.');
      const size=integer(p.size,1,28,'Width'),height=integer(p.geometry.height,1,28,'Height'),extent=Math.max(size,height)/2;
      const x=number(p.x,extent+1,99-extent,'X',100),y=number(p.y,extent+1,99-extent,'Y',100);
      objects.push({id:p.id,shape:p.shape,x,y,size,geometry:{height,rotation:0,fill:true},color:color(p.color,false)});
    }
    integer(s.width,1,LIMITS.maxInputDimension,'Source width');integer(s.height,1,LIMITS.maxInputDimension,'Source height');
    if(s.width*s.height>LIMITS.maxInputPixels||s.fit!=='contain')throw Error('Unsupported source summary.');
    integer(s.transparentPixels,0,s.width*s.height,'Transparent pixel count');
    const q=value.quality;record(q,['metric','initialError','finalError','relativeReduction','evaluatedCandidates','constrainedCandidates','objects','workingWidth','workingHeight'],'Approximation quality');
    if(q.metric!=='normalized-rgb-mse')throw Error('Unsupported error metric.');
    number(q.initialError,0,1,'Initial error');number(q.finalError,0,q.initialError+1e-12,'Final error');number(q.relativeReduction,0,1,'Relative error reduction');
    const reduction=q.initialError?round((q.initialError-q.finalError)/q.initialError,1e12):0;
    if(Math.abs(q.relativeReduction-reduction)>1e-8)throw Error('Inconsistent relative error reduction.');
    integer(q.evaluatedCandidates,0,o.maxObjects*LIMITS.candidatesPerObject,'Evaluated candidates');integer(q.constrainedCandidates,0,q.evaluatedCandidates,'Constrained candidates');
    const d=dimensions(o.canvasRatio);
    if(q.objects!==objects.length||q.workingWidth!==d.width||q.workingHeight!==d.height)throw Error('Inconsistent approximation summary.');
    return {format:FORMAT,version:VERSION,algorithm:{...a},canvas:{mode:'fixed',ratio:o.canvasRatio},background:o.background,objects,quality:{...q},source:{width:s.width,height:s.height,crop:o.crop,fit:'contain',transparentPixels:s.transparentPixels}};
  }
  function createJob(input,options) {
    const o=canonicalOptions(options);let work=prepare(input,o);input=null;options=null;
    const initialTotal=errorTotal(work.target,work.current),objects=[];
    let state='running',result=null,randomState=o.seed>>>0,evaluated=0,constrained=0,roundCandidates=0,best=null,region=null;
    function random(){randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;}
    function finish() {
      const denominator=work.width*work.height*3*255*255,initial=round(initialTotal/denominator,1e12),final=round(errorTotal(work.target,work.current)/denominator,1e12);
      result=canonicalPlan({format:FORMAT,version:VERSION,algorithm:{id:ALGORITHM,version:ALGORITHM_VERSION,seed:o.seed,maxObjects:o.maxObjects,palette:o.palette,candidatesPerObject:LIMITS.candidatesPerObject,workingDimension:LIMITS.workingDimension,colorPolicy:'bounded-hsl',complete:true},canvas:{mode:'fixed',ratio:o.canvasRatio},background:{...o.background},objects,quality:{metric:'normalized-rgb-mse',initialError:initial,finalError:final,relativeReduction:initial?round((initial-final)/initial,1e12):0,evaluatedCandidates:evaluated,constrainedCandidates:constrained,objects:objects.length,workingWidth:work.width,workingHeight:work.height},source:work.source});
      state='complete';work=null;best=null;region=null;
    }
    function getState(){return {status:state,progress:state==='complete'?1:state==='cancelled'?0:Math.min(0.999,(objects.length+roundCandidates/LIMITS.candidatesPerObject)/o.maxObjects),evaluatedCandidates:evaluated,maxCandidates:o.maxObjects*LIMITS.candidatesPerObject,result:result?clone(result):null};}
    function nextCandidate() {
      if(roundCandidates<75) {
        const k=roundCandidates,shape=SHAPES[k%3],dw=Math.floor(k/3)%5-2,dh=Math.floor(k/15)-2;
        return shapeCandidate(shape,region.x,region.y,region.size+dw,region.height+dh);
      }
      const local=best&&roundCandidates%4!==0,base=local?{...best.object,height:best.object.geometry.height}:region,span=roundCandidates<192?8:roundCandidates<288?4:2;
      return shapeCandidate(local&&random()<0.7?base.shape:SHAPES[Math.floor(random()*SHAPES.length)],base.x+(random()*2-1)*span,base.y+(random()*2-1)*span,base.size+(random()*2-1)*span,base.height+(random()*2-1)*span);
    }
    return Object.freeze({
      getState,
      step(candidateBudget=16) {
        integer(candidateBudget,1,LIMITS.maxStepCandidates,'Step candidate budget');
        if(state!=='running')return getState();
        for(let i=0;i<candidateBudget&&state==='running';i++) {
          if(!region){region=seedRegion(work);if(!region){finish();break;}}
          const scored=score(nextCandidate(),work,o.palette);evaluated++;roundCandidates++;
          if(scored&&scored.clipped)constrained++;
          const distance=c=>Math.abs(c.x-region.x)+Math.abs(c.y-region.y)+Math.abs(c.size-region.size)+Math.abs(c.geometry.height-region.height);
          if(scored&&scored.gain>0&&(!best||scored.gain>best.gain||(scored.gain===best.gain&&distance(scored.object)<distance(best.object))))best=scored;
          if(roundCandidates===LIMITS.candidatesPerObject) {
            if(!best){finish();break;}
            eachPixel(best.object,work,p=>{for(let k=0;k<3;k++)work.current[p+k]=best.paint[k];});
            objects.push({id:'object-'+(objects.length+1),...best.object});
            best=null;region=null;roundCandidates=0;
            if(objects.length===o.maxObjects)finish();
          }
        }
        return getState();
      },
      cancel(){state='cancelled';result=null;work=null;best=null;region=null;objects.length=0;return getState();}
    });
  }
  function approximate(input,options) {const job=createJob(input,options);let state=job.getState();while(state.status==='running')state=job.step(LIMITS.maxStepCandidates);return state.result;}
  function toScene(plan,model,name='Local image approximation') {
    const p=canonicalPlan(plan);
    if(!model||typeof model.canonicalScene!=='function'||typeof model.defaultAuthoredObject!=='function')throw Error('A scene-v4 model is required to map this candidate.');
    return model.canonicalScene({format:model.FORMAT,version:4,sampler:'authored-objects-4',scene:{name,background:p.background,pulsePeriodMs:model.DEFAULT_PULSE_PERIOD_MS,canvas:p.canvas,objects:p.objects.map(o=>({...model.defaultAuthoredObject(o.id,o.shape),...o}))}});
  }
  return Object.freeze({FORMAT,VERSION,ALGORITHM,ALGORITHM_VERSION,LIMITS,RATIOS,SHAPES,DEFAULTS,canonicalOptions,validatePixels,canonicalPlan,createJob,approximate,toScene});
}));
