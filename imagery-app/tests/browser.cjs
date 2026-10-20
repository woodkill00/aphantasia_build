'use strict';
// Runnable real-browser suite. NOT RUN in the original cloud environment: see blocker record.
// Uses installed Playwright only. Never adds --no-sandbox or other security-bypass flags.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const m=require('../src/model.js');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'test-results','browser');fs.mkdirSync(out,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report={started:new Date().toISOString(),artifactSha256:sha(path.join(root,'index.html')),platform:process.platform,node:process.version,status:'RUNNING',results:[],limitations:['Phone-sized viewport emulation is not a physical phone.','No screen-reader, actual OS chooser, display calibration, medical/sensory clearance, or universal browser support is established.']};
const write=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
const {scene}=require('./fixtures.cjs');
const fixture=changes=>{const v=scene();const {shape,x,y,size,...rest}=changes||{};Object.assign(v.scene,rest);for(const [key,value]of Object.entries({shape,x,y,size}))if(value!==undefined)v.scene.objects[0][key]=value;return v};
const payload=(name,value)=>({name,mimeType:'application/json',buffer:Buffer.from(typeof value==='string'?value:JSON.stringify(value))});
async function hidden(page){assert.equal((await page.locator('#visibility-label').textContent()).trim(),'Hidden');}
async function visible(page){assert.equal((await page.locator('#visibility-label').textContent()).trim(),'Visible');}
async function download(page,id,name){const next=page.waitForEvent('download');await page.locator(id).click();const d=await next;assert.equal(await d.failure(),null);const target=path.join(out,name);await d.saveAs(target);return JSON.parse(fs.readFileSync(target,'utf8'));}
async function fresh(page){await page.goto(pathToFileURL(path.join(root,'index.html')).href);await visible(page);}
async function runCase(page,device,name,fn,{startupLive=false}={}){const started=Date.now();try{await fresh(page);if(!startupLive){await page.locator('#hide-scene').click();await hidden(page);await page.waitForTimeout(m.REVEAL_GAP_MS+100)}await fn();report.results.push({device,name,status:'PASS',durationMs:Date.now()-started})}catch(e){report.results.push({device,name,status:'FAIL',error:e.stack,durationMs:Date.now()-started});try{await page.screenshot({path:path.join(out,`${device}-${name.replace(/[^a-z0-9]+/gi,'-')}-failure.png`),fullPage:true})}catch{}}write();}
(async()=>{
 let browser;
 try {browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,chromiumSandbox:true});report.browser=await browser.version();}
 catch(e){report.status='BLOCKED';report.launchError=e.message;write();console.error(e.message);process.exitCode=2;return;}
 try{
 for(const cfg of [{name:'laptop',viewport:{width:1366,height:900},deviceScaleFactor:1,isMobile:false,hasTouch:false},{name:'phone-emulation',viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}]){
  const {name,...settings}=cfg;const context=await browser.newContext({...settings,offline:true,acceptDownloads:true,reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(7000);const errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:|^wss?:/.test(r.url()))external.push(r.url())});
  await runCase(page,name,'startup-live-static-and-no-overflow',async()=>{
   await visible(page);assert.match(await page.title(),/Imagery Field/);const canvas=await page.locator('#scene-canvas').evaluate(e=>({w:e.width,h:e.height,label:e.getAttribute('aria-label')}));assert.doesNotMatch(canvas.label,/scene hidden/i);assert.ok(canvas.w<=4096&&canvas.h<=4096&&canvas.w*canvas.h<=8388608);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal page overflow');await page.waitForTimeout(300);await visible(page);
   await page.screenshot({path:path.join(out,`${name}-startup.png`),fullPage:true});
  },{startupLive:true});
  await runCase(page,name,'show-hide-repeated-input-and-keyboard',async()=>{
   await page.locator('#show-scene').click();await visible(page);await page.keyboard.press('Escape');await hidden(page);for(let i=0;i<8;i++){await page.locator('#show-scene').click();await hidden(page);}
   await page.waitForTimeout(m.REVEAL_GAP_MS+100);await hidden(page);await page.locator('#show-scene').focus();await page.keyboard.press('Enter');await visible(page);await page.locator('#end-viewing').click();await hidden(page);
  });
  await runCase(page,name,'presets-edits-undo-redo-and-invalid-input',async()=>{
   for(let i=0;i<m.presets().length;i++){await page.locator('#preset').selectOption(String(i));await hidden(page);assert.equal(await page.locator('#shape').inputValue(),m.presets()[i].scene.objects[0]?.shape||'');}
   await page.locator('#scene-name').fill('Synthetic browser scene');await page.locator('#shape').selectOption('circle');await page.locator('#position-x').fill('25');await page.locator('#apply-changes').click();await hidden(page);
   const got=await download(page,'#export-scene',`${name}-scene.json`);assert.equal(got.scene.name,'Synthetic browser scene');assert.equal(got.scene.objects[0].x,25);assert.equal(got.scene.objects[0].shape,'circle');
   await page.locator('#undo').click();await hidden(page);await page.locator('#redo').click();assert.equal(await page.locator('#scene-name').inputValue(),'Synthetic browser scene');
   await page.locator('#position-x').fill('0');await page.locator('#apply-changes').click();assert.match(await page.locator('#status').textContent(),/inset|position|whole number|invalid/i);await page.locator('#discard').click();assert.equal(await page.locator('#position-x').inputValue(),'25');
  });
  await runCase(page,name,'actual-file-export-reload-import-roundtrip',async()=>{
   await page.locator('#scene-name').fill('Portable roundtrip');await page.locator('#apply-changes').click();const got=await download(page,'#export-scene',`${name}-roundtrip.json`);
   await page.reload();await visible(page);await page.locator('#scene-import').setInputFiles(path.join(out,`${name}-roundtrip.json`));await hidden(page);assert.equal(await page.locator('#scene-name').inputValue(),'Portable roundtrip');const again=await download(page,'#export-scene',`${name}-roundtrip-reexport.json`);assert.deepEqual(again,got);
  });
  await runCase(page,name,'invalid-and-malicious-imports-preserve-current',async()=>{
   const original=await page.locator('#scene-name').inputValue();const bad=['','{','null',JSON.stringify({...fixture({}),version:999}),JSON.stringify({...fixture({}),animation:true}),JSON.stringify(fixture({})).replace('"version":3','"version":99,"version":3'),' '.repeat(m.MAX_IMPORT_BYTES+1)];
   for(let i=0;i<bad.length;i++){await page.locator('#scene-import').setInputFiles(payload(`invalid-${i}.json`,bad[i]));await hidden(page);assert.equal(await page.locator('#scene-name').inputValue(),original);assert.ok((await page.locator('#status').textContent()).length>0);}
   const inert='<img src=x onerror=alert(1)>';await page.locator('#scene-import').setInputFiles(payload('inert.json',fixture({name:inert})));assert.equal(await page.locator('#scene-name').inputValue(),inert);assert.equal(await page.locator('img').count(),0);await hidden(page);
   await page.locator('#scene-import').setInputFiles([]);assert.equal(await page.locator('#scene-name').inputValue(),inert);
  });
  await runCase(page,name,'delayed-import-hide-and-newer-input-races',async()=>{
   await page.evaluate(()=>{window.__reads={};const original=File.prototype.text;File.prototype.text=function(){if(this.name.startsWith('delay-'))return new Promise((resolve,reject)=>{window.__reads[this.name]={resolve,reject}});return original.call(this)}});
   const original=await page.locator('#scene-name').inputValue();await page.locator('#scene-import').setInputFiles(payload('delay-hide.json',fixture({name:'stale'})));await page.locator('#hide-scene').click();await page.evaluate(text=>window.__reads['delay-hide.json'].resolve(text),JSON.stringify(fixture({name:'stale'})));await page.waitForTimeout(30);await hidden(page);assert.equal(await page.locator('#scene-name').inputValue(),original);
   await page.locator('#scene-import').setInputFiles(payload('delay-old.json',fixture({name:'old'})));await page.locator('#scene-import').setInputFiles(payload('new.json',fixture({name:'new'})));await page.evaluate(text=>window.__reads['delay-old.json'].resolve(text),JSON.stringify(fixture({name:'old'})));await page.waitForTimeout(30);assert.equal(await page.locator('#scene-name').inputValue(),'new');await hidden(page);
  });
  await runCase(page,name,'notes-separate-preview-consent-and-invalidation',async()=>{
   await page.locator('#notes-details > summary').click();await page.locator('#notes').fill('Synthetic private note');await page.locator('#note-category').selectOption('unsure');
   const sc=await download(page,'#export-scene',`${name}-without-notes.json`);assert.ok(!JSON.stringify(sc).includes('Synthetic private note'));
   await page.locator('#preview-notes').click();const preview=JSON.parse(await page.locator('#notes-preview').textContent());assert.equal(await page.locator('#export-notes').isDisabled(),true);await page.locator('#include-note').check();const note=await download(page,'#export-notes',`${name}-note.json`);assert.deepEqual(note,preview);
   await page.locator('#notes').fill('Changed synthetic note');assert.equal(await page.locator('#export-notes').isDisabled(),true);assert.equal(await page.locator('#include-note').isChecked(),false);await page.reload();assert.equal(await page.locator('#notes').inputValue(),'');await hidden(page);
  });
  await runCase(page,name,'viewport-resize-focus-touch-targets-and-end-control',async()=>{
   for(const width of [320,390,768,1366]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow at ${width}`);await page.locator('#end-viewing').scrollIntoViewIfNeeded();assert.ok(await page.locator('#hide-scene').isVisible());}
   for(const id of ['show-scene','hide-scene','end-viewing','apply-changes']){const b=await page.locator('#'+id).boundingBox();assert.ok(b&&b.height>=44&&b.width>=44,`${id} target smaller than 44 CSS px`);}
   await page.locator('#show-scene').focus();assert.equal(await page.evaluate(()=>document.activeElement.id),'show-scene');
  });
  await runCase(page,name,'repeated-actions-no-runtime-errors-or-network',async()=>{
   for(let i=0;i<30;i++){await page.locator('#preset').selectOption(String(i%m.presets().length));if(await page.locator('#undo').isEnabled())await page.locator('#undo').click();if(await page.locator('#redo').isEnabled())await page.locator('#redo').click();await page.locator('#hide-scene').click();await page.locator('#show-scene').click();await hidden(page);}
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  });
  report.results.push({device:name,name:'request-and-runtime-error-log',status:errors.length||external.length?'FAIL':'PASS',errors,externalRequests:external});await context.close();
 }
 report.status=report.results.some(r=>r.status==='FAIL')?'FAIL':'PASS';
 }finally{await browser.close();report.finished=new Date().toISOString();write();}
 console.log(JSON.stringify({status:report.status,passed:report.results.filter(r=>r.status==='PASS').length,failed:report.results.filter(r=>r.status==='FAIL').length,report:path.join(out,'results.json')},null,2));if(report.status==='FAIL')process.exitCode=1;
})().catch(e=>{report.status='ERROR';report.error=e.stack;write();console.error(e);process.exitCode=1});
