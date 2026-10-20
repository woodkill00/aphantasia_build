'use strict';
// Dedicated synthetic DOM/Canvas/decoder doubles, NOT native image-decoder,
// browser, rendered-layout, file-picker, accessibility, or usefulness evidence.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sourceDir=path.join(__dirname,'../src');
function png(width=32,height=24,{animated=false}={}){
 const chunks=[['IHDR',Buffer.alloc(13)],...(animated?[['acTL',Buffer.alloc(8)]]:[]),['IDAT',Buffer.from([0])],['IEND',Buffer.alloc(0)]];
 chunks[0][1].writeUInt32BE(width,0);chunks[0][1].writeUInt32BE(height,4);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),...chunks.map(([name,data])=>{const out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);out.write(name,4);data.copy(out,8);return out;})]);
}
function jpeg(width=32,height=24){
 const b=Buffer.alloc(24);b[0]=255;b[1]=216;b[2]=255;b[3]=192;b.writeUInt16BE(17,4);b[6]=8;b.writeUInt16BE(height,7);b.writeUInt16BE(width,9);b[11]=3;b[21]=255;b[22]=217;return b;
}
const bufferOf=bytes=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
function file(bytes=png(),extra={}){return {size:bytes.length,type:'image/png',name:'PRIVATE-FILENAME.png',arrayBuffer:async()=>bufferOf(bytes),...extra};}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
function harness(config={}){
 const globals=new Map(),timers=new Map(),cancelled=[],created=[],paint=[],trace=[],drafts=[],steps=[],jobs=[];let timerID=0,edits=0,instance;
 const globalListener=(scope,type,fn)=>{const key=scope+':'+type;if(!globals.has(key))globals.set(key,new Set());globals.get(key).add(fn);};
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.listeners=new Map();this.attrs={};this.value='';this.hidden=false;this.disabled=false;this.textContent='';this.files=[];this.width=1;this.height=1;this.ownerDocument=doc;this.parent=null;}
  set innerHTML(value){throw Error('Executable markup is forbidden in these controls.');}
  setAttribute(k,v){this.attrs[k]=String(v);}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
  appendChild(n){n.parent=this;this.children.push(n);return n;}
  append(...nodes){nodes.forEach(n=>this.appendChild(n));}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
  getContext(){
   if(config.canvasThrows)throw Error('Synthetic canvas refusal.');
   if(config.noCanvas)return null;
   const canvas=this;
   return {
    drawImage(bitmap,x,y,width,height){paint.push({method:'drawImage',bitmap,width,height,canvas});},
    getImageData(x,y,width,height){
     if(config.pixelReadThrows)throw Error('Synthetic pixel read failed.');
     const data=new Uint8ClampedArray(width*height*4);for(let i=0;i<data.length;i+=4){data[i]=128;data[i+1]=140;data[i+2]=110;data[i+3]=255;}
     return {data};
    },
    createImageData(width,height){return {data:new Uint8ClampedArray(width*height*4)};},
    putImageData(data){paint.push({method:'putImageData',data,canvas});}
   };
  }
 }
 const doc={hidden:false,createElement(tag){const e=new Element(tag);created.push(e);return e;},addEventListener(type,fn){globalListener('document',type,fn);},removeEventListener(type,fn){globals.get('document:'+type)?.delete(fn);}};
 const bitmap=()=>({width:config.width??32,height:config.height??24,closed:false,close(){this.closed=true;trace.push('close');}});
 const sandbox={document:doc,console,Uint8Array,Uint8ClampedArray,ArrayBuffer,DataView,
  setTimeout(fn,delay){assert.equal(delay,0);timers.set(++timerID,fn);return timerID;},
  clearTimeout(id){if(timers.has(id))cancelled.push(timers.get(id));timers.delete(id);},
  addEventListener(type,fn){globalListener('window',type,fn);},
  removeEventListener(type,fn){globals.get('window:'+type)?.delete(fn);},
  createImageBitmap:config.noDecoder?undefined:async(blob,options)=>{trace.push('decode');assert.equal(options.imageOrientation,'from-image');if(config.decoder)return config.decoder(blob,options);const b=bitmap();sandbox.bitmaps.push(b);return b;},
  bitmaps:[],
  fetch(){throw Error('Network access is forbidden.');},XMLHttpRequest:function(){throw Error('Network access is forbidden.');},
  localStorage:{setItem(){throw Error('Storage is forbidden.');}},sessionStorage:{setItem(){throw Error('Storage is forbidden.');}},
  URL:{createObjectURL(){throw Error('No source object URL should be created.');},revokeObjectURL(){throw Error('No source object URL should exist.');}}
 };
 sandbox.window=sandbox;vm.createContext(sandbox);
 for(const name of ['geometry-model.js','model.js','image-model.js','image-file.js'])vm.runInContext(fs.readFileSync(path.join(sourceDir,name),'utf8'),sandbox,{filename:name});
 const model=sandbox.ImageryImage,preflight=sandbox.ImageryImageFile;
 sandbox.ImageryImageFile={...preflight,inspect(bytes){trace.push('inspect');return preflight.inspect(bytes);}};
 sandbox.ImageryImage={...model,createJob(pixels,options){
  const actual=model.createJob(pixels,options);jobs.push({pixels,options,actual});
  return {getState:actual.getState,cancel(){trace.push('cancel');return actual.cancel();},step(n){steps.push(n);return actual.step(n);}};
 }};
 vm.runInContext(fs.readFileSync(path.join(sourceDir,'image-ui.js'),'utf8'),sandbox,{filename:'image-ui.js'});
 const host=doc.createElement('div');
 instance=sandbox.ImageryImageUI.mount(host,{
  onEdit(){edits++;trace.push('edit');if(config.invalidateInEdit&&instance)instance.invalidate();if(config.onEdit)config.onEdit();},
  onUseDraft(scene){trace.push('use');if(config.useThrows)throw Error('Synthetic draft rejected.');drafts.push(scene);}
 });
 const walk=node=>[node,...node.children.flatMap(walk)];
 const node=id=>walk(host).find(n=>n.id===id);
 async function fire(target,type){if(typeof target==='string')target=node(target);for(const fn of target.listeners.get(type)||[])await fn({target});}
 async function event(scope,type){for(const fn of globals.get(scope+':'+type)||[])await fn({});}
 function tick(){const next=timers.entries().next();if(next.done)return false;const [id,fn]=next.value;timers.delete(id);fn();return true;}
 function finish(){let n=0;while(tick()){if(++n>400)throw Error('Unbounded conversion.');}return n;}
 return {sandbox,host,doc,node,walk,fire,event,paint,created,trace,timers,cancelled,drafts,steps,jobs,bitmap,instance,get edits(){return edits;},tick,finish,status:()=>node('image-status').textContent,
  async choose(value=file()){node('image-file').files=value?[value]:[];return fire('image-file','change');},
  async input(id,value){node(id).value=String(value);return fire(id,node(id).tagName==='SELECT'?'change':'input');},
  generate(){return fire('image-generate','click');}
 };
}

test('IMAGE UI DOUBLE: semantic labelled controls, explicit actions and hidden source/candidate at startup',()=>{
 const h=harness();
 assert.equal(h.node('image-file').accept,'image/png,image/jpeg,.png,.jpg,.jpeg');
 assert.equal(h.node('image-source-thumbnail').hidden,true);
 assert.equal(h.node('image-result').hidden,true);
 for(const id of ['image-generate','image-use','image-cancel','image-clear','image-toggle-source'])assert.equal(h.node(id).disabled,true);
 for(const control of h.walk(h.host).filter(x=>['INPUT','SELECT'].includes(x.tagName)))assert.ok(h.walk(h.host).some(x=>x.tagName==='LABEL'&&x.htmlFor===control.id),'label for '+control.id);
 assert.equal(h.node('image-status').attrs.role,'status');assert.equal(h.node('image-progress').attrs['aria-label'],'Approximation work completed');
 assert.equal(h.edits,0);assert.equal(h.timers.size,0);assert.equal(h.drafts.length,0);
});
test('IMAGE UI DOUBLE: preflight precedes oriented local decode, thumbnails are bounded and decoder/scratch buffers released',async()=>{
 const h=harness({width:4096,height:2048});await h.choose(file(png(4096,2048)));
 assert.deepEqual(h.trace,['edit','inspect','decode','close']);
 assert.equal(h.sandbox.bitmaps[0].closed,true);
 const draw=h.paint.find(x=>x.method==='drawImage');assert.equal(draw.width,128);assert.equal(draw.height,64);
 assert.equal(draw.canvas.width,1);assert.equal(draw.canvas.height,1);
 assert.equal(h.node('image-source-thumbnail').hidden,true);assert.equal(h.node('image-file').value,'');
 assert.match(h.node('image-source-summary').textContent,/4096 × 2048.*128 × 64/);
 assert.equal(h.node('image-generate').disabled,false);assert.equal(h.timers.size,0);assert.equal(h.drafts.length,0);
 assert.ok(!h.walk(h.host).some(n=>n.textContent.includes('PRIVATE-FILENAME')));
});
test('IMAGE UI DOUBLE: JPEG and empty browser MIME are accepted only by verified supported headers',async()=>{
 for(const [bytes,type]of [[jpeg(),'image/jpeg'],[png(),'']]){
  const h=harness();await h.choose(file(bytes,{type}));assert.ok(h.trace.includes('decode'));assert.equal(h.node('image-generate').disabled,false);
 }
});
for(const [name,selected,pattern]of [
 ['oversized file',file(png(),{size:8388609}),/8 MiB/],
 ['unsupported MIME',file(png(),{type:'image/svg+xml'}),/Only PNG/],
 ['mismatched MIME',file(png(),{type:'image/jpeg'}),/does not match/],
 ['invalid signature',file(Buffer.alloc(40)),/Only PNG/],
 ['oversized header side',file(png(4097,1)),/4096/],
 ['oversized header area',file(png(4096,2049)),/8,388,608/],
 ['animated PNG',file(png(10,10,{animated:true})),/Animated PNG/],
 ['wrong declared size',file(png(),{size:1}),/byte count changed/]
])test('IMAGE UI DOUBLE: '+name+' rejected before decode',async()=>{
 const h=harness();await h.choose(selected);assert.equal(h.trace.includes('decode'),false);assert.equal(h.node('image-generate').disabled,true);assert.match(h.status(),pattern);assert.equal(h.drafts.length,0);
});
test('IMAGE UI DOUBLE: encoded bound rejects before reading any bytes',async()=>{
 let read=false;const h=harness();await h.choose(file(png(),{size:8388609,arrayBuffer(){read=true;throw Error('not permitted');}}));assert.equal(read,false);
});
for(const [width,height]of [[4097,1],[4096,2049],[0,2],[1,NaN]])test('IMAGE UI DOUBLE: post-orientation decoded bound '+width+' × '+height+' closes bitmap without canvas work',async()=>{
 const h=harness({width,height});await h.choose();assert.equal(h.sandbox.bitmaps[0].closed,true);assert.equal(h.paint.length,0);assert.equal(h.node('image-generate').disabled,true);assert.match(h.status(),/Decoded image dimensions/);
});
for(const config of [{noDecoder:true},{noCanvas:true},{canvasThrows:true},{pixelReadThrows:true}])test('IMAGE UI DOUBLE: local decoder/canvas failure is honest '+JSON.stringify(config),async()=>{
 const h=harness(config);await h.choose();assert.equal(h.node('image-generate').disabled,true);assert.equal(h.node('image-use').disabled,true);assert.equal(h.drafts.length,0);
 for(const b of h.sandbox.bitmaps)assert.equal(b.closed,true);
 assert.match(h.status(),/unavailable|Canvas|Synthetic/);
});
test('IMAGE UI DOUBLE: Generate yields every at-most-16 candidate slice, complete result never stages/reveals a scene',async()=>{
 const h=harness();await h.choose();await h.generate();
 assert.equal(h.steps.length,0);assert.equal(h.timers.size,1);assert.equal(h.node('image-progress').hidden,false);assert.equal(h.node('image-cancel').disabled,false);
 h.tick();assert.equal(h.steps.length,1);assert.equal(h.timers.size,1);assert.equal(h.node('image-use').disabled,true);
 assert.ok(h.finish()>1);assert.ok(h.steps.every(n=>n<=16));assert.equal(h.drafts.length,0);
 assert.equal(h.node('image-use').disabled,false);assert.equal(h.node('image-result').hidden,false);assert.equal(h.node('image-source-thumbnail').hidden,true);
 assert.match(h.node('image-result-summary').textContent,/seeded-region-primitives v1.*Normalized RGB pixel error.*not semantic recognition.*evidence of efficacy/);
 assert.ok(h.node('image-result-objects').children.length);assert.equal(h.node('image-progress').value,1);
});
test('IMAGE UI DOUBLE: explicit Use stages exactly a canonical v4 draft without photo/filename/metadata and consumes candidate',async()=>{
 const h=harness({invalidateInEdit:true});await h.choose();await h.generate();h.finish();
 await h.fire('image-use','click');assert.equal(h.drafts.length,1);
 const draft=h.drafts[0];assert.equal(draft.version,4);assert.equal(draft.sampler,'authored-objects-4');assert.equal(draft.scene.canvas.mode,'fixed');
 assert.ok(draft.scene.objects.every(x=>x.timing.pulse.enabled===false));
 const serialized=JSON.stringify(draft);assert.doesNotMatch(serialized,/PRIVATE-FILENAME|data:image|source|crop|pixels|algorithm|normalized-rgb/);
 assert.deepEqual(JSON.parse(serialized),JSON.parse(JSON.stringify(h.sandbox.ImageryModel.canonicalScene(draft))));
 assert.equal(h.trace.at(-2),'edit');assert.equal(h.trace.at(-1),'use');assert.equal(h.node('image-use').disabled,true);
 await h.fire('image-use','click');assert.equal(h.drafts.length,1);
});
test('IMAGE UI DOUBLE: Use callback rejection remains concealed, candidate is consumed and error is shown',async()=>{
 const h=harness({useThrows:true});await h.choose();await h.generate();h.finish();await h.fire('image-use','click');
 assert.equal(h.drafts.length,0);assert.equal(h.node('image-use').disabled,true);assert.match(h.status(),/draft rejected/);
});
for(const [id,value]of [['image-budget','12'],['image-seed','4294967295'],['image-ratio','9:16'],['image-palette','muted'],['image-crop-x','5'],['image-crop-y','5'],['image-crop-width','90'],['image-crop-height','90']])test('IMAGE UI DOUBLE: editing '+id+' invalidates old result without applying',async()=>{
 const h=harness();await h.choose();await h.generate();h.finish();const edits=h.edits;await h.input(id,value);
 assert.equal(h.edits,edits+1);assert.equal(h.node('image-use').disabled,true);assert.equal(h.node('image-result').hidden,true);await h.fire('image-use','click');assert.equal(h.drafts.length,0);
});
test('IMAGE UI DOUBLE: crop/seed/palette/budget/ratio reach the closed model with normalized percentages',async()=>{
 const h=harness();await h.choose();for(const [id,value]of [['image-budget',3],['image-seed',4294967295],['image-ratio','3:4'],['image-palette','muted'],['image-crop-x',12.34],['image-crop-y',0],['image-crop-width',50],['image-crop-height',100]])await h.input(id,value);
 await h.generate();const opts=JSON.parse(JSON.stringify(h.jobs[0].options));
 assert.equal(opts.maxObjects,3);assert.equal(opts.seed,4294967295);assert.equal(opts.canvasRatio,'3:4');assert.equal(opts.palette,'muted');
 assert.deepEqual(opts.crop,{x:0.1234,y:0,width:0.5,height:1});h.finish();await h.fire('image-use','click');
 assert.equal(h.drafts[0].scene.canvas.ratio,'3:4');assert.ok(h.drafts[0].scene.objects.length<=3);
});
for(const [id,value,pattern]of [['image-seed','',/Seed/],['image-seed','-1',/Seed/],['image-seed','4294967296',/Seed/],['image-seed','1.5',/Seed/],['image-budget','4',/budget/],['image-palette','remote',/palette/],['image-ratio','2:1',/ratio/],['image-crop-width','0',/Crop width/],['image-crop-x','0.001',/Crop X/],['image-crop-width','101',/Crop width/],['image-crop-x','5',/inside/]])test('IMAGE UI DOUBLE: invalid raw option '+id+'='+value+' preserves scene',async()=>{
 const h=harness();await h.choose();await h.input(id,value);await h.generate();assert.equal(h.jobs.length,0);assert.equal(h.timers.size,0);assert.equal(h.drafts.length,0);assert.match(h.status(),pattern);
});
test('IMAGE UI DOUBLE: changing options without an event blocks stale Use and stale completion',async()=>{
 const h=harness();await h.choose();await h.generate();h.finish();h.node('image-seed').value='2';await h.fire('image-use','click');
 assert.equal(h.drafts.length,0);assert.equal(h.node('image-use').disabled,true);assert.match(h.status(),/Options changed/);
 await h.generate();h.node('image-seed').value='3';h.finish();assert.equal(h.node('image-use').disabled,true);assert.match(h.status(),/Options changed/);
});
test('IMAGE UI DOUBLE: cancellation is terminal even if a cleared callback is invoked directly',async()=>{
 const h=harness();await h.choose();await h.generate();h.tick();const callback=[...h.timers.values()][0];const old=h.jobs[0].actual;
 await h.fire('image-cancel','click');const status=h.status();assert.equal(old.getState().status,'cancelled');assert.equal(h.timers.size,0);
 callback();assert.equal(h.status(),status);assert.equal(h.node('image-use').disabled,true);assert.equal(h.drafts.length,0);
});
test('IMAGE UI DOUBLE: regenerate invalidates old work; an old callback cannot finish the newer job',async()=>{
 const h=harness();await h.choose();await h.generate();const oldCallback=[...h.timers.values()][0];await h.generate();
 assert.equal(h.jobs[0].actual.getState().status,'cancelled');oldCallback();assert.equal(h.jobs[1].actual.getState().evaluatedCandidates,0);
 h.finish();assert.equal(h.drafts.length,0);assert.equal(h.node('image-use').disabled,false);
});
for(const action of ['cancel','external','visibilitychange','pagehide','clear','destroy','new-file'])test('IMAGE UI DOUBLE RACE: delayed bytes cannot override '+action,async()=>{
 const read=deferred(),h=harness(),pending=h.choose(file(png(),{arrayBuffer:()=>read.promise}));
 if(action==='cancel')await h.fire('image-cancel','click');
 if(action==='external')h.instance.invalidate('External scene edit.');
 if(action==='visibilitychange'||action==='pagehide')await h.event(action==='pagehide'?'window':'document',action);
 if(action==='clear')await h.fire('image-clear','click');
 if(action==='destroy')h.instance.destroy();
 if(action==='new-file')await h.choose(file(jpeg(),{type:'image/jpeg'}));
 const before=h.node('image-status')?.textContent,decodes=h.trace.filter(x=>x==='decode').length;
 read.resolve(bufferOf(png()));await pending;
 assert.equal(h.trace.filter(x=>x==='decode').length,decodes);assert.equal(h.node('image-status')?.textContent,before);assert.equal(h.drafts.length,0);
});
test('IMAGE UI DOUBLE RACE: late decoded bitmap closes after external invalidation without committing source',async()=>{
 const decode=deferred(),h=harness({decoder:()=>decode.promise});const pending=h.choose();
 await new Promise(resolve=>setImmediate(resolve));assert.ok(h.trace.includes('decode'));
 h.instance.invalidate('Hidden by owner.');const b=h.bitmap();decode.resolve(b);await pending;
 assert.equal(b.closed,true);assert.equal(h.node('image-generate').disabled,true);assert.equal(h.paint.length,0);assert.equal(h.status(),'Hidden by owner.');
});
test('IMAGE UI DOUBLE RACE: stale rejection cannot replace newer status, and its released lease allows a fresh selection',async()=>{
 const read=deferred(),h=harness(),pending=h.choose(file(png(),{arrayBuffer:()=>read.promise}));
 await h.choose();const before=h.status();read.reject(Error('Late failure.'));await pending;assert.equal(h.status(),before);assert.equal(h.node('image-generate').disabled,true);
 assert.equal(h.node('image-file').disabled,false);await h.choose();assert.equal(h.node('image-generate').disabled,false);
});
test('IMAGE UI DOUBLE RESOURCE: a cancelled pending read keeps a single intake lease until it settles',async()=>{
 const read=deferred(),h=harness();let reads=0,outstanding=0,maxOutstanding=0;
 const selected=file(png(),{arrayBuffer(){reads++;outstanding++;maxOutstanding=Math.max(maxOutstanding,outstanding);return read.promise.finally(()=>outstanding--);}});
 const pending=h.choose(selected);assert.equal(reads,1);assert.equal(h.node('image-file').disabled,true);
 await h.fire('image-cancel','click');assert.equal(h.node('image-file').disabled,true);
 await h.choose(selected);await h.choose(selected);
 assert.equal(reads,1);assert.equal(maxOutstanding,1);assert.equal(h.trace.includes('decode'),false);
 assert.match(h.status(),/still finishing.*choose the new file again/);
 const status=h.status();read.resolve(bufferOf(png()));await pending;
 assert.equal(h.node('image-file').disabled,false);assert.equal(h.status(),status);assert.equal(h.trace.includes('decode'),false);
 await h.choose();assert.equal(h.node('image-generate').disabled,false);assert.equal(h.node('image-file').disabled,false);
});
test('IMAGE UI DOUBLE RESOURCE: three delayed selections cannot create concurrent decoders after cancellation or external invalidation',async()=>{
 const decode=deferred();let decodes=0,outstanding=0,maxOutstanding=0;
 const h=harness({decoder(){decodes++;outstanding++;maxOutstanding=Math.max(maxOutstanding,outstanding);return decode.promise.finally(()=>outstanding--);}});
 const pending=h.choose();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(decodes,1);assert.equal(h.node('image-file').disabled,true);
 await h.fire('image-cancel','click');h.instance.invalidate('Main scene hidden.');
 assert.equal(h.node('image-file').disabled,true);
 await h.choose();await h.choose();assert.equal(decodes,1);assert.equal(maxOutstanding,1);assert.equal(h.node('image-file').disabled,true);
 const before=h.status(),b=h.bitmap();decode.resolve(b);await pending;
 assert.equal(b.closed,true);assert.equal(outstanding,0);assert.equal(h.node('image-file').disabled,false);assert.equal(h.status(),before);assert.equal(h.paint.length,0);
 await h.choose();assert.equal(decodes,2);assert.equal(maxOutstanding,1);assert.equal(h.node('image-generate').disabled,false);
});
test('IMAGE UI DOUBLE RESOURCE: option edits, lifecycle, and Clear cannot release an outstanding intake lease early',async()=>{
 for(const action of ['edit','visibilitychange','pagehide','clear']){
  const read=deferred(),h=harness();let reads=0;
  const selected=file(png(),{arrayBuffer(){reads++;return read.promise;}});
  const pending=h.choose(selected);
  if(action==='edit')await h.input('image-seed',2);
  else if(action==='clear')await h.fire('image-clear','click');
  else await h.event(action==='pagehide'?'window':'document',action);
  assert.equal(h.node('image-file').disabled,true,action);
  await h.choose(selected);assert.equal(reads,1,action);
  read.resolve(bufferOf(png()));await pending;assert.equal(h.node('image-file').disabled,false,action);assert.equal(h.trace.includes('decode'),false,action);
 }
});
for(const [scope,event]of [['document','visibilitychange'],['window','pagehide']])test('IMAGE UI DOUBLE: '+event+' cancels running work and hides requested source without auto-resume',async()=>{
 const h=harness();await h.choose();await h.fire('image-toggle-source','click');assert.equal(h.node('image-source-thumbnail').hidden,false);await h.event(scope,event);
 assert.equal(h.node('image-source-thumbnail').hidden,true);assert.equal(h.node('image-toggle-source').attrs['aria-expanded'],'false');
 await h.generate();const callback=[...h.timers.values()][0];await h.event(scope,event);callback();
 assert.equal(h.timers.size,0);assert.equal(h.node('image-use').disabled,true);assert.equal(h.drafts.length,0);await h.event(scope,event);assert.equal(h.timers.size,0);
});
test('IMAGE UI DOUBLE: explicit source toggle shows only small thumbnail and always invalidates candidate',async()=>{
 const h=harness();await h.choose();await h.generate();h.finish();assert.equal(h.node('image-use').disabled,false);
 await h.fire('image-toggle-source','click');assert.equal(h.node('image-source-thumbnail').hidden,false);assert.equal(h.node('image-source-thumbnail').width,32);assert.equal(h.node('image-use').disabled,true);assert.equal(h.node('image-result').hidden,true);assert.equal(h.drafts.length,0);
 await h.generate();assert.equal(h.node('image-source-thumbnail').hidden,true);h.finish();await h.fire('image-toggle-source','click');await h.fire('image-toggle-source','click');assert.equal(h.node('image-source-thumbnail').hidden,true);
});
test('IMAGE UI DOUBLE: Clear wipes retained pixels, resets controls, cancels jobs and cannot alter existing scene',async()=>{
 const h=harness();await h.choose();await h.input('image-budget',3);await h.input('image-seed',99);await h.generate();
 const held=h.jobs[0].pixels.data;assert.ok(held.some(x=>x));await h.fire('image-clear','click');
 assert.ok(held.every(x=>x===0));assert.equal(h.jobs[0].actual.getState().status,'cancelled');assert.equal(h.timers.size,0);
 assert.equal(h.node('image-budget').value,'6');assert.equal(h.node('image-seed').value,'1');assert.equal(h.node('image-generate').disabled,true);assert.equal(h.node('image-clear').disabled,true);assert.equal(h.node('image-use').disabled,true);assert.equal(h.drafts.length,0);
});
test('IMAGE UI DOUBLE: replacing or cancelling source selection clears prior source/candidate',async()=>{
 const h=harness();await h.choose();await h.generate();h.finish();const held=h.jobs[0].pixels.data;await h.choose(null);
 assert.ok(held.every(x=>x===0));assert.equal(h.node('image-generate').disabled,true);assert.equal(h.node('image-use').disabled,true);assert.equal(h.drafts.length,0);
});
test('IMAGE UI DOUBLE: destroy removes handlers/panel, wipes retained pixels and rejects late callbacks',async()=>{
 const h=harness();await h.choose();await h.generate();const callback=[...h.timers.values()][0],pixels=h.jobs[0].pixels.data,generate=h.node('image-generate');
 h.instance.destroy();callback();await h.event('window','pagehide');await h.fire(generate,'click');
 assert.ok(pixels.every(x=>x===0));assert.equal(h.host.children.length,0);assert.equal(h.timers.size,0);assert.equal(h.drafts.length,0);
});
test('IMAGE UI STATIC: no persistence, network, object URLs, image export or executable markup APIs',()=>{
 const source=fs.readFileSync(path.join(sourceDir,'image-ui.js'),'utf8');
 for(const pattern of [/\bfetch\s*\(/,/\bXMLHttpRequest\b/,/\b(?:localStorage|sessionStorage|indexedDB)\b/,/\bcreateObjectURL\s*\(/,/\.innerHTML\s*=/,/\btoDataURL\s*\(/,/\btoBlob\s*\(/])assert.doesNotMatch(source,pattern);
 assert.match(source,/job\.step\(16\)/);assert.match(source,/bitmap\.close\(\)/);
});
