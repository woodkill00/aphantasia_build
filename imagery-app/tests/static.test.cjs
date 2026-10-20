'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
const code=scripts.map(s=>s[2]).join('\n');
const css=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map(s=>s[1]).join('\n');

test('PORTABLE: HTML has doctype, UTF-8, language, viewport and JavaScript-disabled notice',()=>{
 assert.match(html,/<!doctype html>/i); assert.match(html,/<html[^>]+lang=["']en["']/i);
 assert.match(html,/<meta[^>]+charset=["']?utf-8/i); assert.match(html,/<meta[^>]+name=["']viewport["']/i);
 assert.match(html,/<noscript\b/i);
});
test('PORTABLE: executable scripts are inline classic JavaScript and parse',()=>{
 assert.ok(scripts.length>0);
 for(const [i,s] of scripts.entries()){ assert.doesNotMatch(s[1],/\bsrc\s*=|type\s*=\s*["']module/i); new vm.Script(s[2],{filename:`index-inline-${i}.js`}); }
});
test('PORTABLE: production model and UI sources are embedded verbatim in delivered file',()=>{
 for(const name of ['model.js','app.js']) {const source=fs.readFileSync(path.join(ROOT,'src',name),'utf8').trim(); assert.ok(html.includes(source),`${name} absent/mismatched in HTML`);}
});
test('PRIVACY: no network, dynamic code, service worker, storage dependency, or raw markup sink in runtime',()=>{
 for(const re of [/\bfetch\s*\(/,/\bXMLHttpRequest\b/,/\bWebSocket\b/,/\bsendBeacon\s*\(/,/serviceWorker\s*\./,/\beval\s*\(/,/new\s+Function\b/,/\bimport\s*\(/,/\bimportScripts\b/,/\.innerHTML\s*=/,/\.outerHTML\s*=/,/insertAdjacentHTML\s*\(/,/document\.write\s*\(/,/\blocalStorage\b/,/\bsessionStorage\b/,/\bindexedDB\b/]) assert.doesNotMatch(code,re);
});
test('STATIC: no repeating timers, animation loops, animated CSS, or media playback',()=>{
 for(const re of [/\bsetInterval\s*\(/,/\brequestAnimationFrame\s*\(/,/\.play\s*\(/]) assert.doesNotMatch(code,re);
 assert.doesNotMatch(css,/@keyframes\b|animation\s*:\s*(?!none\b)/i);
 assert.doesNotMatch(html,/<(?:video|audio|iframe|object|embed)\b/i);
});
test('PORTABLE: no external runtime assets or style fetches',()=>{
 assert.doesNotMatch(html,/<(?:script|img|iframe|source|video|audio)[^>]+src\s*=/i);
 assert.doesNotMatch(html,/<link[^>]+rel=["'](?:stylesheet|preload|prefetch|manifest)["']/i);
 assert.doesNotMatch(css,/@import\b|url\s*\(/i);
});
test('HTML: all id attributes unique, associated labels and aria references resolve',()=>{
 const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length,'duplicate IDs');
 for(const x of html.matchAll(/\b(?:for|aria-describedby|aria-labelledby)=["']([^"']+)["']/g))for(const id of x[1].split(/\s+/)) assert.ok(ids.includes(id),`missing reference ${id}`);
 for(const x of html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)){
  const id=x[0].match(/\bid=["']([^"']+)["']/)?.[1];
  if(/type=["'](?:hidden|button|submit)["']/.test(x[0]))continue;
  const prefix=html.slice(0,x.index);const implicitlyLabeled=prefix.lastIndexOf('<label')>prefix.lastIndexOf('</label>');
  assert.ok(implicitlyLabeled || /aria-label(?:ledby)?=/.test(x[0]) || (id && new RegExp(`<label[^>]+for=["']${id}["']`).test(html)),`unlabeled ${x[0]}`);
 }
});
test('HTML: canvas is complemented by semantic description and live status',()=>{
 assert.match(html,/<canvas[^>]+(?:aria-label|aria-describedby|aria-labelledby)=/i);
 assert.match(html,/\brole=["']status["']|aria-live=["']polite["']/i);
 assert.match(css,/:focus-visible|:focus/);
});
test('HTML: no autofocus or new browsing-context links; CSP blocks connections',()=>{
 assert.doesNotMatch(html,/\bautofocus\b/); assert.doesNotMatch(html,/target=["']_blank["']/);
 assert.match(html,/Content-Security-Policy/i); assert.match(html,/connect-src\s+'none'/);
});

// Fullscreen is explicitly allowed in v0.2; the old blanket prohibition was obsolete.
// Keep static presentation and the explicit in-stage controls as separate requirements.
test('FULLWINDOW: fullscreen stage owns Show, Hide, End and Exit controls',()=>{
 const shell=fs.readFileSync(path.join(ROOT,'src','shell.html'),'utf8');
 const start=shell.indexOf('id="stage-root"');assert.ok(start>=0);
 let depth=1,stop=-1;for(const match of shell.slice(start).matchAll(/<\/?div\b[^>]*>/gi)){depth+=match[0].startsWith('</')?-1:1;if(depth===0){stop=start+match.index;break;}}assert.ok(stop>start);
 const stage=shell.slice(start,stop);for(const id of ['scene-canvas','show-scene','hide-scene','end-viewing','fullscreen','exit-fullscreen'])assert.ok(stage.includes(`id="${id}"`),`${id} must be within fullscreen stage`);
 assert.match(code,/fullscreenchange/);assert.match(code,/fullscreenerror/);
});


test('V3 STATIC: color previews have text equivalents and both fullscreen controls belong to the stage',()=>{
 const shell=fs.readFileSync(path.join(ROOT,'src','shell.html'),'utf8');
 for(const prefix of ['object','background']){assert.match(shell,new RegExp('id="'+prefix+'-color-swatch"[^>]*role="img"[^>]*aria-label='));assert.ok(shell.includes('id="'+prefix+'-color-text"'));}
 for(const id of ['fullscreen-start','fullscreen-show','fullscreen-status','exit-fullscreen'])assert.ok(shell.includes('id="'+id+'"'));
 assert.equal((code.match(/\bsetTimeout\s*\(/g)||[]).length,1,'only the pre-existing one-shot download cleanup timer is allowed; fullscreen needs no timers');
 assert.match(css,/\.fullscreen-exit[^}]*min-width:44px[^}]*min-height:44px/);
 assert.match(css,/\.fullscreen-exit:(?:focus-visible|focus)/);
});
