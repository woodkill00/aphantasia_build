'use strict';
/* Independent user-flow scenarios for the existing dependency-free CDP runner.
 * This module does not launch Chrome, change source, or publish data. The caller
 * must provide its real Page and runCase(name, fn) wrapper; no test doubles count.
 * Native controls produce all scene edits. DOM evaluation only observes/focuses/
 * scrolls controls and records events. File input uses the runner's CDP helper,
 * not an operating-system chooser. All fixture content is synthetic.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {setTimeout: sleep} = require('node:timers/promises');
const referenceScene = {
  format:'imagery-static-scene',version:2,sampler:'static-objects-2',
  scene:{name:'Reference: circle square triangle',background:{h:210,s:10,l:8},objects:[
    {id:'object-1',shape:'circle',x:30,y:50,size:10,color:{h:210,s:30,l:50}},
    {id:'object-2',shape:'square',x:50,y:50,size:10,color:{h:130,s:30,l:50}},
    {id:'object-3',shape:'triangle',x:70,y:50,size:10,color:{h:40,s:35,l:50}},
  ]},
};
const clone = value => JSON.parse(JSON.stringify(value));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function rgb({h,s,l}) {
  const S=s/100,L=l/100,C=(1-Math.abs(2*L-1))*S,H=h/60,X=C*(1-Math.abs(H%2-1)),m=L-C/2;
  const channels=H<1?[C,X,0]:H<2?[X,C,0]:H<3?[0,C,X]:H<4?[0,X,C]:H<5?[X,0,C]:[C,0,X];
  return channels.map(x=>Math.round((x+m)*255));
}
async function runIndependentScenarios({page,runCase,out,captureLog=false}) {
  assert.ok(page&&typeof page.send==='function','A real CDP Page is required');
  assert.equal(typeof runCase,'function');
  const events=[];
  async function observe(label) {
    const state=await page.evaluate(()=>({
      editorScroll:document.getElementById('editor-panel').scrollTop,
      visibility:document.getElementById('visibility-label').textContent,
      draft:document.getElementById('draft-label').textContent,
      focus:document.activeElement?.id||null,
      viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},
    }));
    events.push({label,...state});return state;
  }
  async function act(label,fn) { await fn();return observe(label); }
  async function rangeTo(selector,value) {
    // All value changes are actual trusted input: click/tap near the intended
    // thumb center, then exact keyboard adjustment for browser rounding.
    const point=await page.evaluate((s,v)=>{
      const e=document.querySelector(s);if(!e||e.disabled)throw Error('Range unavailable '+s);
      e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();
      if(r.width<=20||r.height<=0)throw Error('Range has no usable geometry '+s);
      window.__independentRangeEvents=[];
      for(const type of ['input','change'])e.addEventListener(type,event=>window.__independentRangeEvents.push({type,trusted:event.isTrusted}),{once:true});
      const x=r.left+10+(r.width-20)*(v-Number(e.min))/(Number(e.max)-Number(e.min));
      const y=r.top+r.height/2,hit=document.elementFromPoint(x,y);
      if(hit!==e)throw Error('Range pointer target occluded '+s);
      return {x,y};
    },selector,value);
    if(page.device.touch){
      await page.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,radiusX:1,radiusY:1,force:1,id:1}]});
      await page.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    } else {
      await page.send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
      await page.send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
    }
    await page.focus(selector);
    let actual=Number(await page.property(selector,'value'));
    // Fallback keyboard navigation is a real control action, not DOM value assignment.
    // It also covers mobile browsers which treat the first tap as focus only.
    const difference=value-actual;
    for(let i=0;i<Math.abs(difference);i++)await page.key(difference>0?'ArrowRight':'ArrowLeft');
    actual=Number(await page.property(selector,'value'));
    assert.equal(actual,value,`${selector} native input did not reach requested value`);
    const inputEvents=await page.evaluate(()=>window.__independentRangeEvents);
    assert.ok(inputEvents.every(e=>e.trusted),'Range events must be browser-trusted');
    await page.hidden();await observe(`Set ${selector} to ${value}`);
  }
  async function swatch(prefix,expected) {
    const sample=await page.evaluate(p=>{
      const e=document.getElementById(p+'-color-swatch'),r=e.getBoundingClientRect();
      return {rgb:getComputedStyle(e).backgroundColor,text:document.getElementById(p+'-color-text').textContent,
        width:r.width,height:r.height,hidden:e.hidden};
    },prefix);
    assert.equal(sample.hidden,false);assert.ok(sample.width>0&&sample.width<=120&&sample.height>0&&sample.height<=120);
    const actual=sample.rgb.match(/[\d.]+/g).slice(0,3).map(Number),expectedRgb=rgb(expected);
    actual.forEach((c,i)=>assert.ok(Math.abs(c-expectedRgb[i])<=1,`${prefix} swatch differs from independent RGB oracle`));
    assert.equal(sample.text,`HSL ${expected.h}° / ${expected.s}% / ${expected.l}%`);
    return sample;
  }
  async function scenePixels(expected) {
    // Read genuinely painted pixels, not source geometry, with a separate oracle.
    const sample=await page.evaluate(()=>{
      const c=document.getElementById('scene-canvas'),ctx=c.getContext('2d'),r=c.getBoundingClientRect(),u=Math.min(r.width,r.height)/100;
      const at=(x,y)=>Array.from(ctx.getImageData(Math.floor(x*c.width/r.width),Math.floor(y*c.height/r.height),1,1).data).slice(0,3);
      return {background:at(r.width*.1,r.height*.1),circle:at(r.width*.3,r.height*.5-5*u),square:at(r.width*.5,r.height*.5-5*u),triangle:at(r.width*.7,r.height*.5-5*u)};
    });
    for(const [key,color]of [['background',expected.scene.background],...expected.scene.objects.map(o=>[o.shape,o.color])]){
      rgb(color).forEach((channel,i)=>assert.ok(Math.abs(sample[key][i]-channel)<=2,`${key} actual painted color differs: ${JSON.stringify(sample)}`));
    }
    return sample;
  }
  async function capture(name,{editor=false}={}) {
    if(!captureLog&&process.env.BROWSER_SCREENSHOTS!=='1'&&process.env.BROWSER_SCREENSHOT_LOG!=='1')return;
    const metrics=await page.evaluate(editor=>{
      const panel=document.getElementById('editor-panel').getBoundingClientRect();
      const swatch=document.getElementById('object-color-swatch').getBoundingClientRect(),last=document.getElementById('object-lightness').getBoundingClientRect();
      const top=Math.max(panel.top,swatch.top-12),bottom=Math.min(panel.bottom,last.bottom+12);
      const r=editor?{left:panel.left,top,width:panel.width,height:bottom-top}:{left:0,top:0,width:innerWidth,height:innerHeight};
      return {x:Math.max(0,r.left),y:Math.max(0,r.top),width:Math.min(r.width,innerWidth),height:Math.min(r.height,innerHeight),scale:Math.min(1,800/(r.width*devicePixelRatio),550/(r.height*devicePixelRatio))};
    },editor);
    let data;for(const quality of [50,35,20]){({data}=await page.send('Page.captureScreenshot',{format:'jpeg',quality,fromSurface:true,captureBeyondViewport:false,clip:metrics}));if(Buffer.from(data,'base64').length<=15000)break;}
    const bytes=Buffer.from(data,'base64'),id=`independent-${page.device.name}-${name}`;
    if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,id+'.jpg'),bytes);}
    const metadata={id,format:'jpeg',bytes:bytes.length,sha256:digest(bytes),clip:metrics,scene:'Synthetic reference only',mechanism:'Real browser CDP screenshot'};
    console.log('INDEPENDENT_SCREENSHOT '+JSON.stringify(metadata));
    if(captureLog||process.env.BROWSER_SCREENSHOT_LOG==='1')console.log('IMAGERY_VISUAL_CAPTURE '+JSON.stringify({...metadata,device:page.device.name,name:id,mime:'image/jpeg',base64:data}));
  }
  await runCase('independent user constructs common reference with native controls',async()=>{
    await observe('Fresh hidden editor');
    await act('Name scene',()=>page.fill('#scene-name',referenceScene.scene.name));
    // Build from an empty object list instead of silently importing the result.
    for(let i=0;i<3;i++)await act('Remove initial object',()=>page.click('#delete-object'));
    assert.equal(await page.property('#object-select','disabled'),true);
    for(const o of referenceScene.scene.objects){
      await page.nativeSelect('#add-shape',o.shape);await act('Add '+o.shape,()=>page.click('#add-object'));
      for(const [selector,value]of [['#size',o.size],['#position-x',o.x],['#position-y',o.y]])await act('Edit '+selector,()=>page.fill(selector,value));
      for(const [channel,value]of [['hue',o.color.h],['saturation',o.color.s],['lightness',o.color.l]])await rangeTo('#object-'+channel,value);
      await swatch('object',o.color);
    }
    for(const [channel,value]of [['hue',210],['saturation',10],['lightness',8]])await rangeTo('#background-'+channel,value);
    await swatch('background',referenceScene.scene.background);await page.hidden();
    await act('Apply reference',()=>page.click('#apply-changes'));await page.hidden();
    const downloaded=await page.download('#export-scene','imagery-field-scene-v2.json');
    assert.deepEqual(downloaded.json,referenceScene,'Constructed native-control scene must exactly match the common fixture');
    await page.file('independent-reference-crosscheck.json',referenceScene);await page.hidden();
    const imported=await page.download('#export-scene','imagery-field-scene-v2.json');assert.deepEqual(imported.json,referenceScene);
    console.log('INDEPENDENT_CONSTRUCTION '+JSON.stringify({device:page.device.name,fixtureSha256:digest(Buffer.from(JSON.stringify(referenceScene))),nativeControlSteps:events.length,observations:events}));
  });
  await runCase('independent user edits square, discards, applies and views fullscreen',async()=>{
    await page.file('independent-reference.json',referenceScene);await page.hidden();
    await page.nativeSelect('#object-select','object-2');
    await swatch('object',referenceScene.scene.objects[1].color);
    await rangeTo('#object-hue',260);await swatch('object',{h:260,s:30,l:50});
    await page.hidden();assert.equal(await page.property('#draft-label','textContent'),'Changes staged');
    await capture('purple-draft-swatch-hidden',{editor:true});
    await act('Discard square color',()=>page.click('#discard'));await swatch('object',{h:130,s:30,l:50});
    await rangeTo('#object-hue',260);await act('Apply square color',()=>page.click('#apply-changes'));await page.hidden();
    const after=clone(referenceScene);after.scene.objects[1].color.h=260;
    const exported=await page.download('#export-scene','imagery-field-scene-v2.json');assert.deepEqual(exported.json,after,'Only the square hue may change');
    await act('Close editor',()=>page.click('#editor-toggle'));await sleep(3100);await page.hidden();
    await act('Explicitly show edited reference',()=>page.click('#show-scene'));await page.visible();await scenePixels(after);
    await page.click('#editor-toggle');await page.hidden();await rangeTo('#background-hue',30);await swatch('background',{h:30,s:10,l:8});
    await page.click('#discard');await swatch('background',referenceScene.scene.background);await page.hidden();
    await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','independent entry');
    const hiddenControls=await page.evaluate(()=>({
      show:!document.getElementById('fullscreen-start').hidden,
      exit:!document.getElementById('exit-fullscreen').hidden,
      normal:['masthead','stage-body','viewing-bar','skip-controls'].map(id=>document.getElementById(id).hidden),
    }));
    assert.deepEqual(hiddenControls,{show:true,exit:true,normal:[true,true,true,true]});
    await sleep(3100);await page.hidden();await page.click('#fullscreen-show');await page.visible();await scenePixels(after);
    const full=await page.evaluate(()=>{
      const exit=document.getElementById('exit-fullscreen'),r=exit.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      return {focus:document.activeElement?.id,showHidden:document.getElementById('fullscreen-start').hidden,
        target:{width:r.width,height:r.height,left:r.left,top:r.top,right:r.right,bottom:r.bottom,hit:hit===exit},viewport:{width:innerWidth,height:innerHeight}};
    });
    assert.equal(full.focus,'exit-fullscreen');assert.equal(full.showHidden,true);
    assert.ok(full.target.width>=44&&full.target.height>=44&&full.target.left>=0&&full.target.top>=0&&full.target.right<=full.viewport.width&&full.target.bottom<=full.viewport.height&&full.target.hit,'Exit must be visible and hit-testable');
    await capture('purple-square-fullscreen');
    await page.fullscreenAfter(()=>page.click('#exit-fullscreen'),null,'independent explicit exit');
    await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','independent Escape entry');
    await sleep(3100);await page.click('#fullscreen-show');await page.visible();
    await page.fullscreenAfter(()=>page.key('Escape'),null,'independent native Escape');await page.hidden();
    console.log('INDEPENDENT_USER_FLOW '+JSON.stringify({device:page.device.name,exitMetrics:full,observations:events}));
  });
}
module.exports={referenceScene,rgb,runIndependentScenarios};
if(require.main===module){
  if(process.argv.includes('--check-fixture')){
    const root=process.env.IMAGERY_APP_ROOT||path.join(__dirname,'..');
    const model=require(path.join(root,'src/model.js'));assert.deepEqual(model.parseScene(JSON.stringify(referenceScene)),referenceScene);
    for(const [value,expected]of [[{h:0,s:0,l:0},[0,0,0]],[{h:0,s:0,l:50},[128,128,128]],[{h:260,s:30,l:50},[115,89,166]]])assert.deepEqual(rgb(value),expected);
    console.log(JSON.stringify({status:'PASS',fixtureValid:true,oracleChecks:3,browserExecuted:false}));
  }else{console.error('Import runIndependentScenarios({page, runCase, out}) from the real CDP runner; this module is not a standalone browser launcher.');process.exitCode=2;}
}
