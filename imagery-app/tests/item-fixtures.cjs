'use strict';
// Synthetic item-timeline data and arithmetic oracles independent of runtime code.
const {scene,styledObject,copy}=require('./fixtures.cjs');
function itemScene(){return scene({name:'Synthetic overlapping items',background:{h:210,s:20,l:8},pulsePeriodMs:4000,objects:[
 styledObject({id:'object-1',shape:'pixel',x:35,y:50,size:6,color:{h:120,s:40,l:50},timing:{startMs:0,fadeInMs:1000,holdMs:1000,fadeOutMs:1000,pulse:{enabled:false,minOpacity:0.8}}}),
 styledObject({id:'object-2',shape:'pixel',x:65,y:50,size:6,color:{h:270,s:40,l:50},timing:{startMs:1000,fadeInMs:1000,holdMs:1000,fadeOutMs:1000,pulse:{enabled:false,minOpacity:0.8}}}),
]});}
function pulseScene(){const value=itemScene();for(const o of value.scene.objects){o.timing={startMs:o.id==='object-1'?0:1000,fadeInMs:0,holdMs:4000,fadeOutMs:0,pulse:{enabled:true,minOpacity:o.id==='object-1'?0.5:0.8}};}return value;}
function styleScene(){return scene({name:'Synthetic separate style colors',background:{h:210,s:20,l:8},objects:[styledObject({id:'object-1',shape:'pixel',x:40,y:50,size:6,color:{h:120,s:40,l:50},outline:{enabled:true,width:2,color:{h:300,s:50,l:50}},shadow:{enabled:true,offsetX:10,offsetY:0,blur:0,color:{h:210,s:60,l:50}}})]});}
function envelope(timing,time){const local=time-timing.startMs,total=timing.fadeInMs+timing.holdMs+timing.fadeOutMs;if(local<0||local>=total)return 0;if(timing.fadeInMs>0&&local<timing.fadeInMs)return local/timing.fadeInMs;if(local<timing.fadeInMs+timing.holdMs)return 1;return timing.fadeOutMs>0?1-(local-timing.fadeInMs-timing.holdMs)/timing.fadeOutMs:0;}
function alphas(value,time){return value.scene.objects.map(o=>{const base=envelope(o.timing,time),p=o.timing.pulse;return base*(p.enabled?p.minOpacity+(1-p.minOpacity)*(1+Math.cos(2*Math.PI*time/value.scene.pulsePeriodMs))/2:1)});}
module.exports={itemScene,pulseScene,styleScene,envelope,alphas,copy};
