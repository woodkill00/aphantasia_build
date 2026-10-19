'use strict';
// Minimal event/Canvas test doubles for executing the delivered scripts in Node.
// This is NOT a browser, DOM conformance, rendered-output, CSS, accessibility, or download test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function createHarness(options={}){
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const nodes=new Map(),paint=[],downloads=[],timers=[],urls=new Map(),revoked=[],events=new Map();let time=0,urlSequence=0;
 class Element{
  constructor(tag,id,attrs=''){this.tagName=tag.toUpperCase();this.id=id;this.attrs={};this.listeners=new Map();this.value=attrs.match(/\bvalue="([^"]*)"/)?.[1]||'';this.hidden=/\bhidden\b/.test(attrs);this.disabled=/\bdisabled\b/.test(attrs);this.checked=false;this.textContent='';this.className='';this.files=[];this.width=360;this.height=360;}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
  setAttribute(key,value){this.attrs[key]=String(value);}
  getAttribute(key){return this.attrs[key]??null;}
  getBoundingClientRect(){return {width:options.width??360,height:options.width??360};}
  getContext(){if(options.canvasThrows)throw Error('Canvas unavailable');return options.noCanvas?null:ctx;}
  focus(){document.activeElement=this;}
  closest(selector){return selector==='button'&&this.tagName==='BUTTON'?this:null;}
  appendChild(child){child.parent=this;return child;}
  remove(){}
  click(){if(this.tagName==='A'){if(options.downloadThrows)throw Error('download blocked');downloads.push({filename:this.download,href:this.href,blob:urls.get(this.href)});}else return fire(this,'click');}
 }
 const ctx={};for(const name of ['setTransform','fillRect','beginPath','arc','fill','stroke','moveTo','lineTo','closePath'])ctx[name]=(...args)=>paint.push({method:name,args,fillStyle:ctx.fillStyle,strokeStyle:ctx.strokeStyle});
 for(const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)){nodes.set(match[3],new Element(match[1],match[3],match[2]));}
 for(const match of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/gi)){nodes.get(match[1]).value=match[2].match(/<option[^>]*value="([^"]*)"/)?.[1]||'';}
 const document={hidden:false,activeElement:null,getElementById(id){if(!nodes.has(id))throw Error(`Missing DOM id ${id}`);return nodes.get(id)},createElement(tag){return new Element(tag)},addEventListener(type,fn){if(!events.has('document:'+type))events.set('document:'+type,[]);events.get('document:'+type).push(fn)},body:new Element('body')};
 const sandbox={document,console,performance:{now:()=>time},devicePixelRatio:options.dpr??1,Blob:options.noBlob?undefined:Blob,TextEncoder,URL:{createObjectURL(blob){if(options.objectURLThrows)throw Error('Blob URL denied');const url='blob:synthetic-'+(++urlSequence);urls.set(url,blob);return url},revokeObjectURL(url){urls.delete(url);revoked.push(url)}},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},addEventListener(type,fn){if(!events.has('window:'+type))events.set('window:'+type,[]);events.get('window:'+type).push(fn)}};
 sandbox.window=sandbox;vm.createContext(sandbox);
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]);
 scripts.forEach((code,i)=>vm.runInContext(code,sandbox,{filename:path.join(ROOT,'src',i===0?'model.js':'app.js')}));
 async function fire(target,type,props={}){const el=typeof target==='string'?nodes.get(target):target;const e={target:el,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...props};for(const fn of el.listeners.get(type)||[])await fn(e);return e;}
 async function globalEvent(scope,type,props={}){const e={defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...props};for(const fn of events.get(scope+':'+type)||[])await fn(e);return e;}
 return {nodes,paint,downloads,timers,urls,revoked,sandbox,document,ctx,get:id=>nodes.get(id),fire,globalEvent,advance(ms=3000){time+=ms},async input(id,value){nodes.get(id).value=String(value);await fire(id,'input')},async select(id,value){nodes.get(id).value=String(value);await fire(id,id==='preset'||id==='note-category'?'change':'input')},submit(){return fire('scene-form','submit')},async import(text,name='synthetic.json',size=Buffer.byteLength(text)){nodes.get('scene-import').files=[{name,size,text:async()=>text}];return fire('scene-import','change')},async exportScene(){const before=downloads.length;await fire('export-scene','click');if(downloads.length===before)return null;return JSON.parse(await downloads.at(-1).blob.text())},visible(){return nodes.get('visibility-label').textContent==='Visible'},status(){return nodes.get('status').textContent},runTimers(){for(const t of timers.splice(0))t.fn()}};
}
module.exports={createHarness};
