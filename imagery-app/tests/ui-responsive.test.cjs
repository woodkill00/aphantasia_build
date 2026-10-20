'use strict';
// Actual startup and v7 controls. Unlike legacy stopped-state regressions these
// execute delivered startup without first activating Hide or modifying clocks.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHarness}=require('./dom-harness.cjs');
const {itemScene}=require('./item-fixtures.cjs');
const scenePaint=h=>h.paint.some(p=>['arc','stroke','fill','lineTo'].includes(p.method));
const alphaFor=(h,color)=>{const matches=p=>['fillRect','fill'].includes(p.method)&&p.fillStyle===`hsl(${color.h} ${color.s}% ${color.l}%)`;return h.paint.filter(p=>p.method==='drawImage'&&p.sourcePaint?.some(matches)).at(-1)?.globalAlpha??h.paint.filter(matches).at(-1)?.globalAlpha??0;};

test('UI V7: actual startup paints default static scene with no timed autoplay or commit',async()=>{
 const h=createHarness();assert.equal(h.visible(),true);assert.ok(scenePaint(h));assert.equal(h.rafPending.size,0);assert.equal(h.maxRafPending,0);assert.equal(h.timers.length,0);assert.equal(h.get('show-scene').disabled,true);assert.match(h.get('show-scene').textContent,/live preview on/i);assert.equal(h.get('undo').disabled,true);assert.equal(h.get('redo').disabled,true);
 assert.ok(h.paint.some(p=>p.method==='fillRect'&&p.fillStyle==='hsl(4 60% 4%)'));
 h.paint.length=0;h.advance(600000);h.runFrame();h.runTimers();assert.equal(h.visible(),true);assert.equal(h.paint.length,0);assert.equal(h.rafPending.size,0);assert.deepEqual((await h.exportScene()).scene.background,{h:4,s:60,l:4});
});
test('UI V7: startup live colors and shape edits repaint immediately, without Apply or Show',async()=>{
 const h=createHarness();for(const [id,value]of [['background-saturation-value',100],['background-hue-value',100],['object-hue-value',200],['position-x',60],['shape','square']]){h.paint.length=0;await h.input(id,value);assert.equal(h.visible(),true,id);assert.ok(scenePaint(h),id);assert.equal(h.rafPending.size,0)}assert.equal(await h.exportScene(),null);assert.equal(h.get('undo').disabled,true);
});
for(const reducedMotion of [false,true])test(`UI V7: fresh startup is static with reduced motion ${reducedMotion}`,()=>{const h=createHarness({reducedMotion});assert.equal(h.visible(),true);assert.equal(h.rafPending.size,0);assert.equal(h.timers.length,0)});
for(const options of [{hidden:true},{noCanvas:true},{canvasThrows:true}])test(`UI V7: unavailable initial display remains concealed ${JSON.stringify(options)}`,async()=>{const h=createHarness(options);assert.equal(h.visible(),false);h.document.hidden=false;await h.globalEvent('document','visibilitychange');await h.globalEvent('window','pageshow',{persisted:false});h.advance(60000);h.runFrame();h.runTimers();assert.equal(h.visible(),false);assert.equal(h.rafPending.size,0)});
for(const action of ['Hide','Escape','pagehide','restoration','resize','blur'])test(`UI V7: initial preview ${action} cannot resurrect via edits or events`,async()=>{
 const h=createHarness();assert.equal(h.visible(),true);if(action==='Hide')await h.fire('hide-scene','click');else if(action==='Escape')await h.globalEvent('document','keydown',{key:'Escape'});else if(action==='restoration')await h.globalEvent('window','pageshow',{persisted:true});else if(action==='resize')await h.resize();else await h.globalEvent('window',action);
 assert.equal(h.visible(),false);assert.equal(h.get('show-scene').disabled,false);assert.match(h.get('show-scene').textContent,/resume live preview/i);h.advance(60000);h.runFrame();h.runTimers();await h.input('object-hue-value',120);await h.globalEvent('window','pageshow',{persisted:false});await h.globalEvent('window','resize');assert.equal(h.visible(),false);assert.equal(h.rafPending.size,0);
});
test('UI V7: redundant resize notification preserves initial static frame but true resize conceals',async()=>{const h=createHarness();const paint=JSON.stringify(h.paint);await h.globalEvent('window','resize');assert.equal(h.visible(),true);assert.equal(JSON.stringify(h.paint),paint);await h.resize();assert.equal(h.visible(),false)});
test('UI V7: background saturation full range synchronizes numeric/slider/buttons and snapshots',async()=>{
 const h=createHarness();for(const id of ['background-saturation','background-saturation-value']){assert.equal(h.get(id).value,'60');assert.equal(h.get(id).max,'100')}
 assert.match(h.get('background-saturation').style.backgroundImage,/100%/);await h.input('background-saturation-value',99);await h.fire('background-saturation-increase','click');assert.equal(h.get('background-saturation').value,'100');await h.fire('background-saturation-increase','click');assert.equal(h.get('background-saturation-value').value,'100');assert.equal(h.visible(),true);await h.fire('capture-add','click');assert.equal(h.visible(),false);await h.fire('sequence-export','click');const sequence=JSON.parse(await h.downloads.at(-1).blob.text());assert.equal(sequence.sequence.background.s,100);
 await h.input('background-saturation-value',0);await h.fire('background-saturation-decrease','click');assert.equal(h.get('background-saturation').value,'0');await h.submit();assert.equal((await h.exportScene()).scene.background.s,0);await h.fire('sequence-load','click');assert.equal((await h.exportScene()).scene.background.s,100);assert.equal(h.get('background-saturation-value').value,'100');await h.input('background-saturation-value',101);assert.equal(h.get('background-saturation-value').getAttribute('aria-invalid'),'true');assert.equal(await h.exportScene(),null);
});
test('UI V7: explicit Steady/Pulse selection maps per-item modes and never starts a clock',async()=>{
 const h=createHarness();assert.equal(h.get('pulse-enabled').tagName,'SELECT');assert.equal(h.get('pulse-enabled').value,'steady');await h.select('pulse-enabled','pulse');assert.equal(h.visible(),true);assert.equal(h.rafPending.size,0);await h.select('object-select','object-2');assert.equal(h.get('pulse-enabled').value,'steady');await h.select('object-select','object-1');assert.equal(h.get('pulse-enabled').value,'pulse');await h.submit();const value=await h.exportScene();assert.equal(value.scene.objects[0].timing.pulse.enabled,true);assert.equal(value.scene.objects[1].timing.pulse.enabled,false);await h.select('pulse-enabled','steady');await h.submit();assert.equal((await h.exportScene()).scene.objects[0].timing.pulse.enabled,false);
});
test('UI V7: steady and pulse items overlap, steady holds unchanged and both end finitely',async()=>{
 const h=createHarness(),value=itemScene();for(const [index,o]of value.scene.objects.entries())o.timing={startMs:0,fadeInMs:0,holdMs:4000,fadeOutMs:0,pulse:{enabled:!!index,minOpacity:.5}};
 await h.import(JSON.stringify(value));h.advance();await h.fire('item-play','click');let elapsed=0;for(const time of [500,1000,2000,3000,3999]){h.paint.length=0;h.runFrame(time-elapsed);elapsed=time;assert.equal(alphaFor(h,value.scene.objects[0].color),1);const expected=.75+.25*Math.cos(2*Math.PI*time/4000);assert.ok(Math.abs(alphaFor(h,value.scene.objects[1].color)-expected)<1e-10);assert.equal(h.rafPending.size,1)}h.runFrame(1);assert.equal(h.visible(),false);assert.equal(h.rafPending.size,0);h.runFrame(60000);assert.equal(h.visible(),false);
});

test('UI V7: one explicit Play click transitions default live preview to one finite item clock',async()=>{
 const h=createHarness();assert.equal(h.visible(),true);await h.fire('item-play','click');assert.equal(h.visible(),true);assert.equal(h.rafPending.size,1);assert.match(h.get('item-progress').textContent,/Playing.*0\.0.*3/);const first=[...h.rafPending.keys()];h.runFrame(500);await h.fire('item-play','click');assert.equal(h.rafPending.size,1);assert.equal(h.maxRafPending,1);assert.match(h.get('item-progress').textContent,/0\.5/);assert.notDeepEqual([...h.rafPending.keys()],first);h.runFrame(2500);assert.equal(h.visible(),false);assert.equal(h.rafPending.size,0);
});
for(const action of ['Hide','Escape','Stop'])test(`UI V7: ${action} after direct live-to-items blocks early Play and stale callbacks`,async()=>{
 const h=createHarness();await h.fire('item-play','click');const stale=[...h.rafPending.values()][0];h.runFrame(500);if(action==='Escape')await h.globalEvent('document','keydown',{key:'Escape'});else await h.fire(action==='Hide'?'hide-scene':'item-stop','click');await h.fire('item-play','click');assert.equal(h.visible(),false);assert.equal(h.rafPending.size,0);h.paint.length=0;stale(99999);assert.equal(h.paint.length,0);h.advance(60000);h.runFrame();assert.equal(h.visible(),false);await h.fire('item-play','click');assert.equal(h.visible(),true);assert.equal(h.rafPending.size,1);
});
for(const mode of ['reduced-motion','noCanvas','invalid-fields','fullscreen'])test(`UI V7: direct live-to-items still rejects ${mode}`,async()=>{
 const h=createHarness({reducedMotion:mode==='reduced-motion',noCanvas:mode==='noCanvas'});if(mode==='invalid-fields')await h.input('position-x',0);if(mode==='fullscreen')await h.fire('fullscreen','click');await h.fire('item-play','click');assert.equal(h.rafPending.size,0);assert.doesNotMatch(h.get('item-progress').textContent,/Playing/);
});
