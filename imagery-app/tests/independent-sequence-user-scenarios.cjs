'use strict';
/* Independent sequence-user journeys. Native input drives edits/actions. Import
 * uses the actual HTML file input through CDP, not an OS dialog. No app clock,
 * engine state, controller, or RAF implementation is replaced by these tests.
 * Production validators are only used by the optional standalone fixture check.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {setTimeout:sleep}=require('node:timers/promises');
const clone=x=>JSON.parse(JSON.stringify(x));
const {styledObject,scene:makeScene}=require('./fixtures.cjs');
const referenceSequence={format:'imagery-field-sequence',version:1,sampler:'ordered-crossfade-1',sequence:{
  name:'Reference sequence: circle square triangle',background:{h:210,s:10,l:8},steps:[
    {id:'step-1',name:'Circle',holdMs:3000,transitionMs:1000,objects:[{id:'object-1',shape:'circle',x:30,y:50,size:10,color:{h:210,s:30,l:50}}]},
    {id:'step-2',name:'Square',holdMs:3000,transitionMs:1000,objects:[{id:'object-2',shape:'square',x:50,y:50,size:10,color:{h:130,s:30,l:50}}]},
    {id:'step-3',name:'Triangle',holdMs:3000,transitionMs:0,objects:[{id:'object-3',shape:'triangle',x:70,y:50,size:10,color:{h:40,s:35,l:50}}]},
]}};
referenceSequence.version=2;referenceSequence.sampler='ordered-crossfade-2';for(const step of referenceSequence.sequence.steps){step.pulsePeriodMs=4000;step.objects=step.objects.map(o=>styledObject(o));}
function referenceScene(index){const step=referenceSequence.sequence.steps[index];return makeScene({name:step.name,background:clone(referenceSequence.sequence.background),objects:clone(step.objects)});}
function rgb({h,s,l}){const S=s/100,L=l/100,C=(1-Math.abs(2*L-1))*S,H=h/60,X=C*(1-Math.abs(H%2-1)),m=L-C/2;return(H<1?[C,X,0]:H<2?[X,C,0]:H<3?[0,C,X]:H<4?[0,X,C]:H<5?[X,0,C]:[C,0,X]).map(v=>Math.round((v+m)*255));}
// Independent hard-coded reference intervals; deliberately does not call frameAt.
function referenceWeights(ms){if(ms<0||!Number.isFinite(ms))throw Error('Invalid test time');if(ms<3000)return[1,0,0];if(ms<4000)return[1-(ms-3000)/1000,(ms-3000)/1000,0];if(ms<7000)return[0,1,0];if(ms<8000)return[0,1-(ms-7000)/1000,(ms-7000)/1000];if(ms<11000)return[0,0,1];return null;}
async function runIndependentSequenceScenarios({page,runCase,out,captureLog=false}){
  const observations=[];
  async function until(check,label,timeout=8000){const end=Date.now()+timeout;do{if(await check())return;await sleep(30);}while(Date.now()<end);throw Error('Independent sequence timeout: '+label);}
  async function observe(label){const state=await page.evaluate(()=>({scroll:document.getElementById('editor-scroll').scrollTop,section:document.getElementById('workspace-sequence').getAttribute('aria-pressed')==='true'?'sequence':'scene',visibility:document.getElementById('visibility-label').textContent,progress:document.getElementById('sequence-progress').textContent,status:document.getElementById('status').textContent,selected:document.getElementById('sequence-step-select').value,focus:document.activeElement?.id,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio}}));observations.push({label,...state});return state;}
  async function act(label,fn){await fn();return observe(label);}
  async function download(){const result=await page.download('#sequence-export','imagery-field-sequence-v2.json');await page.hidden();return result;}
  async function imported(){await page.file('independent-canonical-sequence.json',referenceSequence,true,'#sequence-import');await page.hidden();assert.equal(await page.property('#sequence-name','value'),referenceSequence.sequence.name);}
  async function nativeHue(value){
    const current=Number(await page.property('#object-hue','value'));await page.focus('#object-hue');
    await page.evaluate(()=>{window.__independentHueEvents=[];document.getElementById('object-hue').addEventListener('input',e=>window.__independentHueEvents.push(e.isTrusted),{once:true});});
    for(let i=0;i<Math.abs(value-current);i++)await page.key(value>current?'ArrowRight':'ArrowLeft');
    assert.equal(Number(await page.property('#object-hue','value')),value);assert.equal(await page.evaluate(()=>window.__independentHueEvents.every(Boolean)),true);await page.hidden();
  }
  async function targetMetrics(ids){return page.evaluate(ids=>ids.map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{id,width:r.width,height:r.height,left:r.left,top:r.top,right:r.right,bottom:r.bottom,visible:r.width>0&&r.height>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,hit:hit===e||e.contains(hit)};}),ids);}
  async function reachable(ids){const metrics=await targetMetrics(ids);for(const m of metrics)assert.ok(m.visible&&m.hit&&m.width>=44&&m.height>=44,`Control not reachable: ${JSON.stringify(m)}`);return metrics;}
  async function captureContext(source,staged,target){
    const value=await page.evaluate(()=>{const e=document.getElementById('capture-source'),r=e.getBoundingClientRect(),a=document.getElementById('editor-actions').getBoundingClientRect();return{text:e.textContent,state:document.getElementById('capture-source-state').textContent,title:e.title,context:document.getElementById('capture-replace-context').textContent,label:document.getElementById('capture-replace').getAttribute('aria-label'),buttonText:document.getElementById('capture-replace').textContent,visible:r.width>0&&r.height>0&&r.top>=a.top&&r.bottom<=a.bottom&&r.left>=0&&r.right<=innerWidth}});
    assert.ok(value.text.includes(source),`Wrong capture source: ${JSON.stringify(value)}`);assert.match(value.state,staged?/staged/i:/applied/i);assert.ok(value.title.includes(source));assert.ok(value.visible,'Capture-source caption must remain in the fixed action strip');
    if(target){assert.ok(value.label.includes(value.buttonText),'Accessible Replace name must include its full visible label');for(const field of ['context','label']){assert.ok(value[field].includes(source),`Missing source in ${field}`);assert.ok(value[field].includes(target),`Missing selected target in ${field}`);}}
  }
  async function pixels(){return page.evaluate(()=>{
    const c=document.getElementById('scene-canvas'),ctx=c.getContext('2d'),r=c.getBoundingClientRect(),u=Math.min(r.width,r.height)/100;
    const at=(x,y)=>Array.from(ctx.getImageData(Math.floor(x*c.width/r.width),Math.floor(y*c.height/r.height),1,1).data).slice(0,3);
    return{background:at(r.width*.1,r.height*.1),objects:[at(r.width*.3,r.height*.5-5*u),at(r.width*.5,r.height*.5-5*u),at(r.width*.7,r.height*.5-5*u)]};
  });}
  function assertWeights(actual,weights,tolerance=3){const bg=rgb(referenceSequence.sequence.background);const close=(a,b,what)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<=tolerance,`${what}: actual ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`));if(!weights){close(actual.background,[0,0,0],'hidden background');actual.objects.forEach(p=>close(p,[0,0,0],'hidden object'));return;}close(actual.background,bg,'constant background');weights.forEach((w,i)=>{const color=rgb(referenceSequence.sequence.steps[i].objects[0].color);close(actual.objects[i],bg.map((b,k)=>Math.round((1-w)*b+w*color[k])),`step ${i+1} contribution`);});}
  async function checksum(){return page.evaluate(()=>{const c=document.getElementById('scene-canvas'),bytes=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261;for(const b of bytes)hash=Math.imul(hash^b,16777619)>>>0;return{hash,width:c.width,height:c.height,progress:document.getElementById('sequence-progress').textContent};});}
  async function capture(name){if(!captureLog&&process.env.BROWSER_SCREENSHOTS!=='1')return;const m=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio}));let data,scale=Math.min(1,800/(m.width*m.dpr),550/(m.height*m.dpr));
    for(const quality of[50,35,20]){({data}=await page.send('Page.captureScreenshot',{format:'jpeg',quality,fromSurface:true,captureBeyondViewport:false,clip:{x:0,y:0,width:m.width,height:m.height,scale}}));if(Buffer.from(data,'base64').length<=18000)break;}
    const bytes=Buffer.from(data,'base64'),id='independent-sequence-'+name,metadata={device:page.device.name,name:id,mime:'image/jpeg',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),viewport:m,captureScale:scale,mechanism:'Real native-CDP user journey; synthetic data'};
    if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,page.device.name+'-'+id+'.jpg'),bytes);}if(captureLog)console.log('IMAGERY_VISUAL_CAPTURE '+JSON.stringify({...metadata,base64:data}));
  }
  async function waitRevealGuard(){await sleep(3100);await page.hidden();}
  async function motion(value){await page.motionPreference(value);}
  async function installPlayObserver(){await page.evaluate(()=>{window.__independentPlayStarts=[];document.getElementById('sequence-play').addEventListener('click',e=>window.__independentPlayStarts.push({time:performance.now(),trusted:e.isTrusted}),{capture:true});});}
  async function play(){await page.click('#sequence-play');await page.visible();const event=await page.evaluate(()=>window.__independentPlayStarts.at(-1));assert.equal(event.trusted,true);return event.time;}
  async function elapsedAt(start,target){await until(()=>page.evaluate((s,t)=>performance.now()-s>=t,start,target),'real elapsed '+target,target+3000);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));return page.evaluate(s=>performance.now()-s,start);}

  await runCase('independent sequence user captures replaces reorders and saves snapshots',async()=>{
    await observe('Initial hidden scene');assert.equal(await page.evaluate(()=>document.querySelector('.quiet-mark')!==null),false,'Hidden view must not retain decorative ring');
    for(let i=0;i<3;i++){
      if(await page.property('#scene-panel','hidden'))await page.click('#workspace-scene');
      await page.file(`independent-step-${i+1}.json`,referenceScene(i));await page.hidden();
      // Create an actual scene draft through a native field before combined capture.
      await page.fill('#scene-name',referenceSequence.sequence.steps[i].name);
      assert.match(await page.property('#capture-add','textContent'),/Apply scene and add step/i);
      if(i===0){
        await nativeHue(211);await nativeHue(210);await captureContext('Circle',true);await observe('Hue focused with pinned actions');
        const metrics=await reachable(['apply-changes','discard','capture-add']);
        console.log('INDEPENDENT_SEQUENCE_PINNED '+JSON.stringify({device:page.device.name,metrics,observation:observations.at(-1)}));
        await capture('scene-hue-and-pinned-actions');
      }
      await act('Combined Apply scene and Add '+(i+1),()=>page.click('#capture-add'));await page.hidden();assert.equal(await page.property('#draft-label','textContent'),'Applied');
      if(i===0)await page.fill('#sequence-name',referenceSequence.sequence.name);
    }
    assert.deepEqual((await download()).json,referenceSequence,'Native capture sequence must exactly match independent canonical reference');
    await page.nativeSelect('#sequence-step-select','1');await captureContext('Triangle',false,'Square');await page.click('#sequence-load');await page.hidden();assert.equal(await page.property('#scene-panel','hidden'),false);
    await nativeHue(260);await page.click('#workspace-sequence');await captureContext('Square',true,'Square');
    assert.deepEqual((await download()).json,referenceSequence,'Static draft must not change captured snapshot');
    assert.match(await page.property('#capture-replace','textContent'),/Apply scene and replace step/i);
    await act('Combined Apply scene and Replace square',()=>page.click('#capture-replace'));
    const changed=clone(referenceSequence);changed.sequence.steps[1].objects[0].color.h=260;assert.deepEqual((await download()).json,changed);
    await page.click('#sequence-load');await nativeHue(130);await page.click('#capture-replace');assert.deepEqual((await download()).json,referenceSequence);
    await page.nativeSelect('#sequence-step-select','2');await act('Move Triangle before Square',()=>page.click('#sequence-move-up'));
    const reordered=clone(referenceSequence);reordered.sequence.steps=[reordered.sequence.steps[0],reordered.sequence.steps[2],reordered.sequence.steps[1]];reordered.sequence.steps[1].transitionMs=1000;reordered.sequence.steps[2].transitionMs=0;
    assert.deepEqual((await download()).json,reordered,'Reordering must normalize only final/former-final transitions');
    await page.click('#sequence-move-down');assert.deepEqual((await download()).json,referenceSequence);
    await page.nativeSelect('#sequence-step-select','1');await act('Set hold to 4.5 seconds',()=>page.fill('#sequence-hold','4.5'));
    const longer=clone(referenceSequence);longer.sequence.steps[1].holdMs=4500;assert.deepEqual((await download()).json,longer,'Valid duration edit must commit without another Apply');
    await page.fill('#sequence-hold','0.5');await page.hidden();assert.equal(await page.property('#sequence-error','hidden'),false);assert.equal(await page.property('#sequence-export','disabled'),true);assert.equal(await page.property('#sequence-play','disabled'),true);assert.equal(await page.property('#capture-add','disabled'),true);
    await page.click('#sequence-discard');assert.deepEqual((await download()).json,longer,'Discard invalid duration must recover last valid value');
    await page.fill('#sequence-hold','3');const saved=await download();assert.deepEqual(saved.json,referenceSequence);
    await page.fresh();await page.importPath(saved.filePath,true,'#sequence-import');await page.hidden();assert.deepEqual((await download()).json,referenceSequence,'Saved sequence must reload exactly');
    await page.nativeSelect('#sequence-step-select','1');await observe('Reloaded canonical square inspector');await capture('canonical-inspector-stopped');
    console.log('INDEPENDENT_SEQUENCE_AUTHORING '+JSON.stringify({device:page.device.name,observations}));
  });

  await runCase('independent sequence user manually previews with reduced motion and fullscreen',async()=>{
    await imported();await motion('reduce');assert.equal(await page.property('#sequence-play','disabled'),true);
    await page.nativeSelect('#sequence-step-select','1');await page.click('#editor-toggle');await waitRevealGuard();
    await page.click('#sequence-show');await page.visible();assertWeights(await pixels(),[0,1,0]);await reachable(['sequence-stop']);await capture('manual-square-visible');
    await page.click('#sequence-next');await page.hidden();assert.equal(await page.property('#sequence-step-select','value'),'2');assertWeights(await pixels(),null);
    await waitRevealGuard();await page.click('#sequence-show');await page.visible();assertWeights(await pixels(),[0,0,1]);
    await page.fullscreenAfter(()=>page.click('#fullscreen'),'stage-root','independent sequence manual entry');
    await waitRevealGuard();await page.click('#fullscreen-show');await page.visible();assertWeights(await pixels(),[0,0,1]);
    await page.fullscreenAfter(()=>page.click('#exit-fullscreen'),null,'independent sequence manual exit');await page.hidden();await capture('manual-exit-stopped');
    console.log('INDEPENDENT_SEQUENCE_MANUAL '+JSON.stringify({device:page.device.name,observation:await observe('Manual sequence ended hidden')}));
  });

  await runCase('independent sequence real-time Play Pause Resume Stop and full one-pass completion',async()=>{
    try{
      await imported();await motion('no-preference');await until(async()=>!(await page.property('#sequence-play','disabled')),'Play enabled without reduced motion');
      await page.click('#editor-toggle');await installPlayObserver();await waitRevealGuard();
      let start=await play();await reachable(['sequence-pause','sequence-stop']);
      await elapsedAt(start,3450);await page.click('#sequence-pause');await page.visible();
      assert.match(await page.property('#status','textContent'),/paused.*visible/i);assert.equal(await page.property('#sequence-resume','hidden'),false);
      const paused=await checksum(),sample=await pixels(),bg=rgb(referenceSequence.sequence.background),circle=rgb(referenceSequence.sequence.steps[0].objects[0].color);
      const weight=(sample.objects[0][2]-bg[2])/(circle[2]-bg[2]);assert.ok(weight>.15&&weight<.85,'Pause should capture a visible first transition, not a hold');assertWeights(sample,[weight,1-weight,0],5);
      await capture('paused-first-crossfade');await sleep(800);assert.deepEqual(await checksum(),paused,'Pause must freeze exact pixels and displayed elapsed time');
      await page.click('#sequence-resume');await page.visible();await until(()=>page.property('#status','textContent').then(s=>/Transition from Square to Triangle/i.test(s)),'second transition after explicit Resume',8000);
      await page.click('#sequence-stop');await page.hidden();assertWeights(await pixels(),null);await sleep(500);await page.hidden();assert.equal(await page.property('#sequence-progress','textContent'),'Stopped');await capture('stop-black-field');
      await waitRevealGuard();start=await play();
      for(const [time,weights,label]of[[1500,[1,0,0],'Circle'],[4500,[0,1,0],'Square'],[8500,[0,0,1],'Triangle']]){
        const elapsed=await elapsedAt(start,time);await page.visible();assertWeights(await pixels(),weights);assert.match(await page.property('#scene-canvas','ariaLabel'),new RegExp(label,'i'));
        console.log('INDEPENDENT_SEQUENCE_REAL_TIME '+JSON.stringify({device:page.device.name,targetMs:time,observedMs:elapsed,expectedWeights:weights,pixels:await pixels()}));
        if(time===1500)await capture('playing-circle-full-frame');
      }
      await elapsedAt(start,11200);await page.hidden();assertWeights(await pixels(),null);assert.equal(await page.property('#sequence-progress','textContent'),'Stopped');await sleep(350);await page.hidden();
      console.log('INDEPENDENT_SEQUENCE_PLAYBACK '+JSON.stringify({device:page.device.name,pausedChecksum:paused,pausedWeights:[weight,1-weight,0],completion:await observe('Full 11-second sequence completed hidden')}));
    }finally{await motion('reduce');}
  });
}
module.exports={referenceSequence,referenceScene,referenceWeights,rgb,runIndependentSequenceScenarios};
if(require.main===module){if(process.argv.includes('--check-fixture')){
  const root=process.env.IMAGERY_APP_ROOT||path.join(__dirname,'..');const S=require(path.join(root,'src/sequence-model.js'));
  assert.deepEqual(S.parseSequence(JSON.stringify(referenceSequence)),referenceSequence);
  for(const [t,w]of[[0,[1,0,0]],[2999,[1,0,0]],[3500,[.5,.5,0]],[4000,[0,1,0]],[7500,[0,.5,.5]],[8000,[0,0,1]],[11000,null]])assert.deepEqual(referenceWeights(t),w);
  console.log(JSON.stringify({status:'PASS',fixtureValid:true,independentBoundaryOracleCases:7,browserExecuted:false}));
}else{console.error('Import runIndependentSequenceScenarios with the real CDP Page; no browser launcher is included.');process.exitCode=2;}}
