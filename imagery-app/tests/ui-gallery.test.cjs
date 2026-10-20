'use strict';
// Isolated synthetic DOM/Canvas doubles. These verify control/state contracts,
// not native rendering, browser behavior, visual quality or accessibility conformance.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sourceDir=path.join(__dirname,'../src');
function harness(config={}){
 const created=[],paint=[],trace=[],drafts=[],events=new Map();let instance,edits=0,contextCount=0;
 const key=(scope,type)=>scope+':'+type;
 function listen(scope,type,fn){const k=key(scope,type);if(!events.has(k))events.set(k,new Set());events.get(k).add(fn);}
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.listeners=new Map();this.attrs={};this.value='';this.hidden=false;this.disabled=false;this.textContent='';this.width=1;this.height=1;this.ownerDocument=doc;this.parent=null;}
  set innerHTML(value){throw Error('Raw markup is forbidden.');}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k]??null;}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
  appendChild(n){n.parent=this;this.children.push(n);return n;}
  append(...nodes){nodes.forEach(n=>this.appendChild(n));}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
  getContext(type){
   assert.equal(type,'2d');contextCount++;if(config.canvasThrows||config.failCanvasAt===contextCount)throw Error('Synthetic Canvas refusal.');if(config.noCanvas)return null;
   const canvas=this,ctx={};for(const method of ['setTransform','fillRect','beginPath','moveTo','lineTo','closePath','fill','stroke'])ctx[method]=(...args)=>paint.push({canvas,method,args,alpha:ctx.globalAlpha,color:ctx.fillStyle,stroke:ctx.strokeStyle,lineWidth:ctx.lineWidth});return ctx;
  }
 }
 const doc={hidden:!!config.hidden,createElement(tag){const e=new Element(tag);created.push(e);return e;},addEventListener(type,fn){listen('document',type,fn);},removeEventListener(type,fn){events.get(key('document',type))?.delete(fn);}};
 const forbidden=()=>{throw Error('Gallery has no scheduling, network or storage authority.');};
 const sandbox={document:doc,console,addEventListener(type,fn){listen('window',type,fn);},removeEventListener(type,fn){events.get(key('window',type))?.delete(fn);},setTimeout:forbidden,setInterval:forbidden,requestAnimationFrame:forbidden,fetch:forbidden,XMLHttpRequest:forbidden,WebSocket:forbidden,localStorage:{setItem:forbidden},sessionStorage:{setItem:forbidden}};
 sandbox.window=sandbox;vm.createContext(sandbox);
 for(const file of ['geometry-model.js','model.js','preset-model.js','gallery-ui.js'])vm.runInContext(fs.readFileSync(path.join(sourceDir,file),'utf8'),sandbox,{filename:file});
 if(config.models)config.models(sandbox);
 const container=doc.createElement('div');
 instance=sandbox.ImageryGalleryUI.mount(container,{onEdit(){edits++;trace.push('edit');if(config.invalidateInEdit&&instance)instance.invalidate('Parent concealed the scene.');if(config.onEdit)config.onEdit();},onUseDraft(value){trace.push('draft');if(config.onUseDraft)config.onUseDraft(value);drafts.push(value);}});
 function find(id){return created.find(node=>node.id===id);}
 function fire(id,type='click',extra={}){const node=typeof id==='string'?find(id):id,e={target:node,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra};assert.ok(node,'Missing node '+id);for(const fn of [...node.listeners.get(type)||[]])fn(e);return e;}
 function globalEvent(scope,type,extra={}){const e={defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra};for(const fn of [...events.get(key(scope,type))||[]])fn(e);return e;}
 return {instance,container,find,fire,globalEvent,created,paint,trace,drafts,doc,sandbox,events,get edits(){return edits;},canvases(){return created.filter(node=>node.tagName==='CANVAS');},rows(){return find('gallery-list').children;},visibleRows(){return this.rows().filter(node=>!node.hidden);},select(id,value){find(id).value=value;fire(id,'change');},status(){return find('gallery-status').textContent;}};
}
const plain=value=>JSON.parse(JSON.stringify(value));
const show=h=>h.fire('gallery-toggle-thumbnails');
function hidden(h){assert.ok(h.canvases().every(c=>c.hidden&&c.width===1&&c.height===1));assert.equal(h.find('gallery-toggle-thumbnails').getAttribute('aria-pressed'),'false');}
test('gallery starts as a twelve-entry text list with no canvases, painting or callbacks',()=>{const h=harness();assert.equal(h.rows().length,12);assert.equal(h.visibleRows().length,12);assert.equal(h.canvases().length,0);assert.equal(h.paint.length,0);assert.equal(h.edits,0);assert.equal(h.drafts.length,0);assert.match(h.status(),/12 of 12/);assert.match(h.status(),/hidden/);assert.equal(h.find('gallery-toggle-thumbnails').textContent,'Show static thumbnails');});
test('static thumbnails require one explicit action and draw all shapes steadily through model geometry',()=>{
 const h=harness({invalidateInEdit:true});show(h);assert.equal(h.edits,1);assert.equal(h.drafts.length,0);assert.equal(h.canvases().length,12);assert.equal(h.find('gallery-toggle-thumbnails').getAttribute('aria-pressed'),'true');
 for(const canvas of h.canvases()){assert.equal(canvas.width,64);assert.equal(canvas.height,48);assert.equal(canvas.hidden,false);assert.equal(canvas.getAttribute('role'),'img');assert.match(canvas.getAttribute('aria-label'),/Static composition only/);const draws=h.paint.filter(row=>row.canvas===canvas);assert.equal(draws[0].method,'setTransform');assert.equal(draws[1].method,'fillRect');assert.deepEqual(draws[1].args,[0,0,64,48]);assert.equal(draws[1].color,'hsl(4 60% 4%)');assert.ok(draws.every(row=>row.method==='setTransform'||row.alpha===1));}
 const canvas=h.find('gallery-thumbnail-mixed-steady-pulse'),draws=h.paint.filter(row=>row.canvas===canvas);assert.equal(draws.filter(row=>row.method==='stroke').length,2);assert.equal(h.trace.join(','),'edit');
});
test('thumbnail paths match validated authored geometry, not markup or downloaded assets',()=>{
 const h=harness();show(h);for(const entry of h.sandbox.ImageryPresets.list()){
  const expected=plain(h.sandbox.ImageryModel.geometry(h.sandbox.ImageryPresets.create(entry.id),64,48)).flatMap(shape=>shape.points);
  const actual=h.paint.filter(row=>row.canvas.id==='gallery-thumbnail-'+entry.id&&['moveTo','lineTo'].includes(row.method)).map(row=>row.args);assert.deepEqual(actual,expected,entry.id);
 }
});
test('repeated show/hide reuses at most twelve small canvases and clears all hidden backing stores',()=>{const h=harness();for(let i=0;i<4;i++){show(h);assert.equal(h.canvases().length,12);assert.ok(h.canvases().reduce((n,c)=>n+c.width*c.height,0)<=36864);show(h);hidden(h);}assert.equal(h.drafts.length,0);});
test('every filter hides existing thumbnails and does not repaint or reveal on change',()=>{
 for(const [id,value,count]of [['items','2',4],['colors','1',2],['symmetry','vertical',4],['overlap','yes',5],['timing','sequential-fades',1]]){
  const h=harness();show(h);const before=h.paint.length;h.select('gallery-filter-'+id,value);hidden(h);assert.equal(h.paint.length,before);assert.equal(h.visibleRows().length,count,id);assert.equal(h.drafts.length,0);show(h);assert.equal(h.canvases().filter(c=>!c.hidden).length,count,id);
 }
});
test('filters combine, empty results disable thumbnails, and reset stays hidden',()=>{const h=harness();h.select('gallery-filter-colors','1');h.select('gallery-filter-symmetry','vertical');assert.deepEqual(h.visibleRows().map(n=>n.id),['gallery-entry-symmetric-pair']);h.select('gallery-filter-overlap','yes');assert.equal(h.visibleRows().length,0);assert.equal(h.find('gallery-toggle-thumbnails').disabled,true);show(h);assert.equal(h.paint.length,0);h.fire('gallery-reset-filters');assert.equal(h.visibleRows().length,12);hidden(h);assert.equal(h.find('gallery-toggle-thumbnails').disabled,false);});
test('a forged unsupported filter value cannot inject content or reveal another example',()=>{const h=harness();show(h);h.select('gallery-filter-items','<script>unexpected</script>');hidden(h);assert.equal(h.visibleRows().length,0);assert.match(h.status(),/0 of 12/);assert.doesNotMatch(h.status(),/script/);});
test('Use draft first conceals, then stages a fresh validated copy without catalog identity or autoplay',()=>{
 const h=harness({invalidateInEdit:true});show(h);h.trace.length=0;h.fire('gallery-use-mixed-steady-pulse');hidden(h);assert.deepEqual(h.trace,['edit','draft']);assert.equal(h.drafts.length,1);assert.equal(h.sandbox.ImageryModel.validateScene(h.drafts[0]).ok,true);assert.equal(h.drafts[0].scene.name,'Mixed steady and pulse');assert.doesNotMatch(JSON.stringify(h.drafts[0]),/"(?:presetId|revision|provenance)"/);assert.match(h.status(),/still hidden/);h.drafts[0].scene.objects[0].x=1;h.fire('gallery-use-mixed-steady-pulse');assert.equal(h.drafts[1].scene.objects[0].x,35);assert.equal(h.sandbox.ImageryModel.validateScene(h.drafts[1]).ok,true);
});
test('all twelve Use draft buttons produce the expected canonical scene',()=>{const h=harness();for(const entry of h.sandbox.ImageryPresets.list()){h.fire('gallery-use-'+entry.id);assert.deepEqual(plain(h.drafts.at(-1)),plain(h.sandbox.ImageryPresets.create(entry.id)));}assert.equal(h.edits,12);assert.equal(h.paint.length,0);});
test('invalid model output fails closed before stage or thumbnail reveal',()=>{const h=harness({models(s){const p=s.ImageryPresets;s.ImageryPresets={...p,create(){const value=p.create('simple-house');value.scene.objects[0].color.l=999;return value;}};}});h.fire('gallery-use-simple-house');assert.equal(h.drafts.length,0);assert.match(h.status(),/Lightness/);show(h);hidden(h);assert.equal(h.canvases().length,0);});
test('edit callback failure conceals and prevents subsequent draw or stage',()=>{const h=harness({onEdit(){throw Error('Synthetic concealment failure.');}});show(h);assert.equal(h.paint.length,0);h.fire('gallery-use-simple-house');assert.equal(h.drafts.length,0);hidden(h);assert.equal(h.status(),'Synthetic concealment failure.');});
test('draft callback failure remains hidden and reports the specific failure',()=>{const h=harness({onUseDraft(){throw Error('Synthetic draft rejected.');}});show(h);h.fire('gallery-use-simple-tree');hidden(h);assert.equal(h.drafts.length,0);assert.equal(h.status(),'Synthetic draft rejected.');});
test('invalidate and disablePreviews release thumbnails and require fresh explicit consent',()=>{const h=harness();for(const name of ['invalidate','disablePreviews']){show(h);h.instance[name]('Hide was requested.');hidden(h);const before=h.paint.length;h.globalEvent('window','pageshow');assert.equal(h.paint.length,before);hidden(h);}assert.equal(h.drafts.length,0);});
test('invalidation without a supplied reason cannot leave a stale shown status',()=>{const h=harness();show(h);assert.match(h.status(),/shown by request/);h.instance.invalidate();hidden(h);assert.match(h.status(),/hidden/);assert.doesNotMatch(h.status(),/shown by request/);});
test('Escape and every lifecycle interruption conceal all thumbnails without blocking native Escape',()=>{
 for(const [scope,type,extra]of [['document','keydown',{key:'Escape'}],['document','visibilitychange',{}],['document','freeze',{}],['document','fullscreenchange',{}],['window','pagehide',{}],['window','pageshow',{}],['window','blur',{}],['window','resize',{}]]){
  const h=harness();show(h);const before=h.paint.length,event=h.globalEvent(scope,type,extra);hidden(h);assert.equal(h.paint.length,before);assert.equal(event.defaultPrevented,false,type);
 }
});
test('a hidden page cannot enable thumbnails and page restoration does not reveal them',()=>{const h=harness({hidden:true});show(h);assert.equal(h.paint.length,0);assert.match(h.status(),/page is not visible/);h.doc.hidden=false;h.globalEvent('document','visibilitychange');assert.equal(h.paint.length,0);show(h);assert.equal(h.canvases().length,12);});
test('missing, refused, and partially failed Canvas rendering leave every buffer hidden and bounded',()=>{for(const config of [{noCanvas:true},{canvasThrows:true},{failCanvasAt:4}]){const h=harness(config);show(h);hidden(h);assert.ok(h.canvases().length<=4);assert.match(h.status(),/Canvas|canvas/);h.fire('gallery-use-simple-house');assert.equal(h.drafts.length,1);}});
test('destroy removes controls/listeners and captured stale callbacks cannot redraw or stage',()=>{
 const h=harness();show(h);const oldShow=[...h.find('gallery-toggle-thumbnails').listeners.get('click')][0],oldUse=[...h.find('gallery-use-simple-house').listeners.get('click')][0];h.instance.destroy();h.instance.destroy();hidden(h);assert.equal(h.container.children.length,0);assert.ok([...h.events.values()].every(set=>set.size===0));const before=h.paint.length;oldShow();oldUse();assert.equal(h.paint.length,before);assert.equal(h.drafts.length,0);assert.ok(h.created.filter(n=>['BUTTON','SELECT'].includes(n.tagName)).every(n=>n.disabled));
});
test('controls have unique IDs, semantic labels, details, status, and ordinary keyboard-operable buttons',()=>{
 const h=harness(),ids=h.created.filter(n=>n.id).map(n=>n.id);assert.equal(ids.length,new Set(ids).size);assert.equal(h.created.filter(n=>n.tagName==='SELECT').length,5);for(const control of h.created.filter(n=>n.tagName==='SELECT'))assert.ok(h.created.some(n=>n.tagName==='LABEL'&&n.htmlFor===control.id));for(const button of h.created.filter(n=>n.tagName==='BUTTON')){assert.equal(button.type,'button');assert.ok(button.textContent);if(button.attrs['aria-describedby'])assert.ok(h.find(button.attrs['aria-describedby']));}assert.equal(h.created.filter(n=>n.tagName==='DETAILS').length,12);assert.equal(h.created.filter(n=>n.tagName==='SUMMARY').length,12);assert.equal(h.find('gallery-status').getAttribute('role'),'status');assert.equal(h.find('gallery-status').getAttribute('aria-live'),'polite');
});
test('catalog metadata details disclose provenance, licensing, revision and validator status',()=>{const h=harness();for(const row of h.rows()){const details=row.children.find(n=>n.tagName==='DETAILS'),text=details.children.map(n=>n.textContent).join(' ');assert.match(text,/MIT license/);assert.match(text,/revision 1/);assert.match(text,/validator passed/);assert.match(text,/Original repository-authored/);}});
test('gallery refuses an unexpectedly expanded catalog rather than allocating unbounded previews',()=>{assert.throws(()=>harness({models(s){const p=s.ImageryPresets;s.ImageryPresets={...p,list:()=>[...p.list(),p.list()[0]]};}}),/one to twelve/);});
test('gallery source has no scheduler, network, storage, export, main-scene or raw-markup authority',()=>{const source=fs.readFileSync(path.join(sourceDir,'gallery-ui.js'),'utf8');assert.doesNotMatch(source,/\b(?:setTimeout|setInterval|requestAnimationFrame|fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|eval|createObjectURL)\s*(?:\(|\.)/);assert.doesNotMatch(source,/\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|\.play\s*\(|scene-canvas|\.download\s*=/);});
test('thumbnail renderer rejects a future unsupported aspect ratio instead of painting misleading margins',()=>{
 const h=harness({models(s){const p=s.ImageryPresets;s.ImageryPresets={...p,create:id=>{const value=p.create(id);value.scene.canvas.ratio='1:1';return value;}};}});show(h);hidden(h);assert.match(h.find('gallery-status').textContent,/not supported/);assert.equal(h.paint.length,0);
});
