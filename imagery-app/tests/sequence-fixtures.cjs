'use strict';
// Independent synthetic styled sequence fixtures and explicit legacy input.
const clone=value=>JSON.parse(JSON.stringify(value));
const {styledObject}=require('./fixtures.cjs');
const background={h:210,s:10,l:8};
const objects=[
 {id:'object-1',shape:'circle',x:30,y:50,size:10,color:{h:210,s:30,l:50}},
 {id:'object-2',shape:'square',x:50,y:50,size:10,color:{h:130,s:30,l:50}},
 {id:'object-3',shape:'triangle',x:70,y:50,size:10,color:{h:40,s:35,l:50}},
];
function sequence(changes={}){return {format:'imagery-field-sequence',version:2,sampler:'ordered-crossfade-2',sequence:{name:'Synthetic one-pass reference',background:clone(background),steps:objects.map((object,i)=>({id:'step-'+(i+1),name:['Circle','Square','Triangle'][i],holdMs:3000,transitionMs:i<2?1000:0,pulsePeriodMs:4000,objects:[styledObject(clone(object))]})),...changes}};}
function shortSequence(){const value=sequence();value.sequence.steps=value.sequence.steps.slice(0,2);value.sequence.steps.forEach((step,i)=>{step.holdMs=1000;step.transitionMs=i?0:500});return value;}
function legacySequence(){const q=sequence();q.version=1;q.sampler='ordered-crossfade-1';for(const step of q.sequence.steps){delete step.pulsePeriodMs;for(const o of step.objects){delete o.outline;delete o.shadow;delete o.timing;}}return q;}
module.exports={clone,sequence,shortSequence,legacySequence,background,objects};
