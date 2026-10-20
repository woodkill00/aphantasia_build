'use strict';
// Minimal event/Canvas test doubles for executing the delivered scripts in Node.
// This is NOT a browser, DOM conformance, rendered-output, CSS, accessibility, or download test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function createHarness(options={}){
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const nodes=new Map(),paint=[],downloads=[],timers=[],urls=new Map(),revoked=[],events=new Map(),canvasContexts=new Map(),createdCanvases=[],rafPending=new Map(),cancelledFrames=[];let time=0,urlSequence=0,rafSequence=0,maxRafPending=0;
 const mediaListeners=new Set(),media={matches:!!options.reducedMotion,media:'(prefers-reduced-motion: reduce)',addEventListener(type,fn){if(type==='change')mediaListeners.add(fn)},removeEventListener(type,fn){if(type==='change')mediaListeners.delete(fn)},addListener(fn){mediaListeners.add(fn)},removeListener(fn){mediaListeners.delete(fn)}};
 class Element{
  constructor(tag,id,attrs=''){this.tagName=tag.toUpperCase();this.id=id;this.attrs=Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));this.listeners=new Map();this.value=attrs.match(/\bvalue="([^"]*)"/)?.[1]||'';this.hidden=/\bhidden\b/.test(attrs);this.disabled=/\bdisabled\b/.test(attrs);this.checked=/\bchecked\b/.test(attrs);for(const key of ['min','max','step','type'])if(this.attrs[key]!==undefined)this[key]=this.attrs[key];this.textContent='';this.className='';this.files=[];this.width=360;this.height=360;this.children=[];this.style={};this.dataset={};this.classList={add:(...keys)=>{this.className=[...new Set([...this.className.split(' ').filter(Boolean),...keys])].join(' ')},remove:(...keys)=>{this.className=this.className.split(' ').filter(k=>!keys.includes(k)).join(' ')},contains:key=>this.className.split(' ').includes(key),toggle:(key,force)=>{const on=force===undefined?!this.classList.contains(key):!!force;on?this.classList.add(key):this.classList.remove(key);return on}};}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
  setAttribute(key,value){this.attrs[key]=String(value);if(key==='class')this.className=String(value);}
  removeAttribute(key){delete this.attrs[key];}
  getAttribute(key){return this.attrs[key]??null;}
  getBoundingClientRect(){const width=options.width??1366,height=options.height??900;return {x:0,y:0,left:0,top:0,right:width,bottom:height,width,height};}
  getContext(){if(options.canvasThrows||(options.offscreenCanvasThrows&&this.id!=='scene-canvas'))throw Error('Canvas unavailable');if(options.noCanvas)return null;if(this.id==='scene-canvas')return ctx;if(!canvasContexts.has(this))canvasContexts.set(this,makeContext([],this.id||'offscreen'));return canvasContexts.get(this);}
  focus(){document.activeElement=this;}
  closest(selector){return selector==='button'&&this.tagName==='BUTTON'?this:null;}
  appendChild(child){child.parent=this;this.children.push(child);if(this.tagName==='SELECT'&&(this.children.length===1||child.selected))this.value=child.value;return child;}
  replaceChildren(...children){this.children=[];this.value='';for(const child of children)this.appendChild(child);}
  get options(){return this.children;}
  append(...children){for(const child of children)this.appendChild(child);}
  contains(other){return other===this||this.children.some(child=>child.contains(other));}
  scrollIntoView(){}
  remove(){}
  click(){if(this.tagName==='A'){if(options.downloadThrows)throw Error('download blocked');downloads.push({filename:this.download,href:this.href,blob:urls.get(this.href)});}else return fire(this,'click');}
 }
 function makeContext(log,canvasId){
  const context={log,globalAlpha:1,globalCompositeOperation:'source-over',lineWidth:1,shadowColor:'rgba(0, 0, 0, 0)',shadowBlur:0,shadowOffsetX:0,shadowOffsetY:0},stack=[];
  const keys=['fillStyle','strokeStyle','globalAlpha','globalCompositeOperation','lineWidth','shadowColor','shadowBlur','shadowOffsetX','shadowOffsetY'];
  const snapshot=()=>Object.fromEntries(keys.map(key=>[key,context[key]]));
  for(const name of ['clearRect','strokeRect','translate','scale','setTransform','fillRect','beginPath','arc','fill','stroke','moveTo','lineTo','closePath'])context[name]=(...args)=>log.push({method:name,args,...snapshot(),canvasId});
  context.drawImage=(...args)=>{const source=canvasContexts.get(args[0]),sourceLog=source?.log||[],lastClear=sourceLog.findLastIndex(row=>row.method==='clearRect');log.push({method:'drawImage',args,...snapshot(),sourcePaint:sourceLog.slice(lastClear+1).map(row=>({...row})),canvasId})};
  context.save=(...args)=>{log.push({method:'save',args,...snapshot(),canvasId});stack.push(snapshot())};
  context.restore=(...args)=>{log.push({method:'restore',args,...snapshot(),canvasId});if(stack.length)Object.assign(context,stack.pop())};
  return context;
 }
 const ctx=makeContext(paint,'scene-canvas');
 for(const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)){nodes.set(match[3],new Element(match[1],match[3],match[2]));}
 for(const match of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/gi)){nodes.get(match[1]).value=match[2].match(/<option[^>]*value="([^"]*)"/)?.[1]||'';}
 const document={hidden:false,activeElement:null,fullscreenElement:null,fullscreenEnabled:options.fullscreenSupported!==false,getElementById(id){if(!nodes.has(id))throw Error(`Missing DOM id ${id}`);return nodes.get(id)},createElement(tag){const element=new Element(tag);if(tag.toLowerCase()==='canvas')createdCanvases.push(element);return element},addEventListener(type,fn){if(!events.has('document:'+type))events.set('document:'+type,[]);events.get('document:'+type).push(fn)},body:new Element('body'),documentElement:new Element('html')};
 document.documentElement.clientWidth=options.width??1366;document.documentElement.clientHeight=options.height??900;
 if(options.fullscreenSupported!==false){nodes.get('stage-root').requestFullscreen=options.requestFullscreen||async function(){document.fullscreenElement=this;await globalEvent('document','fullscreenchange')};document.exitFullscreen=options.exitFullscreen||(async()=>{document.fullscreenElement=null;await globalEvent('document','fullscreenchange')})};
 const sandbox={document,console,innerWidth:options.width??1366,innerHeight:options.height??900,performance:{now:()=>time},devicePixelRatio:options.dpr??1,Blob:options.noBlob?undefined:Blob,TextEncoder,URL:{createObjectURL(blob){if(options.objectURLThrows)throw Error('Blob URL denied');const url='blob:synthetic-'+(++urlSequence);urls.set(url,blob);return url},revokeObjectURL(url){urls.delete(url);revoked.push(url)}},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},requestAnimationFrame(fn){const id=++rafSequence;rafPending.set(id,fn);maxRafPending=Math.max(maxRafPending,rafPending.size);return id},cancelAnimationFrame(id){if(rafPending.has(id))cancelledFrames.push({id,fn:rafPending.get(id)});rafPending.delete(id)},matchMedia(){return media},addEventListener(type,fn){if(!events.has('window:'+type))events.set('window:'+type,[]);events.get('window:'+type).push(fn)}};
 sandbox.window=sandbox;vm.createContext(sandbox);
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]);
 scripts.forEach((code,i)=>vm.runInContext(code,sandbox,{filename:path.join(ROOT,'src',i===0?'model.js':'app.js')}));
 async function fire(target,type,props={}){const el=typeof target==='string'?nodes.get(target):target;const e={target:el,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...props};for(const fn of el.listeners.get(type)||[])await fn(e);return e;}
 async function globalEvent(scope,type,props={}){const e={defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...props};for(const fn of events.get(scope+':'+type)||[])await fn(e);return e;}
 return {nodes,paint,downloads,timers,urls,revoked,sandbox,document,ctx,canvasContexts,createdCanvases,rafPending,cancelledFrames,get maxRafPending(){return maxRafPending},runFrame(ms=16){time+=ms;const pending=[...rafPending.values()];rafPending.clear();for(const fn of pending)fn(time);return pending.length},async setReducedMotion(value){media.matches=!!value;for(const fn of mediaListeners)await fn({matches:media.matches,media:media.media})},get:id=>nodes.get(id),fire,globalEvent,advance(ms=3000){time+=ms},async input(id,value){nodes.get(id).value=String(value);await fire(id,'input')},async select(id,value){nodes.get(id).value=String(value);await fire(id,['preset','note-category','object-select','add-shape','sequence-step-select'].includes(id)?'change':'input')},submit(){return fire('scene-form','submit')},async import(text,name='synthetic.json',size=Buffer.byteLength(text)){nodes.get('scene-import').files=[{name,size,text:async()=>text}];return fire('scene-import','change')},async exportScene(){const before=downloads.length;await fire('export-scene','click');if(downloads.length===before)return null;return JSON.parse(await downloads.at(-1).blob.text())},visible(){return nodes.get('visibility-label').textContent==='Visible'},status(){return nodes.get('status').textContent},runTimers(){for(const t of timers.splice(0))t.fn()}};
}
module.exports={createHarness};
