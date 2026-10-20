'use strict';
// Explicit synthetic schema fixtures, independent of production constructors.
const copy=value=>JSON.parse(JSON.stringify(value));
function legacy(changes={}) {return {format:'imagery-static-scene',version:1,sampler:'sparse-fixed-1',scene:{name:'Synthetic legacy scene',shape:'dots',x:50,y:50,size:22,dotCount:3,dotRadius:1,palette:'slate',...changes}};}
function styledObject(changes={}) {return {id:'object-1',shape:'circle',x:50,y:50,size:20,color:{h:200,s:20,l:45},outline:{enabled:false,width:1,color:{h:0,s:0,l:30}},shadow:{enabled:false,offsetX:1,offsetY:1,blur:2,color:{h:0,s:0,l:0}},timing:{startMs:0,fadeInMs:0,holdMs:3000,fadeOutMs:0,pulse:{enabled:false,minOpacity:0.8}},...changes};}
function scene(changes={}) {const value={format:'imagery-static-scene',version:3,sampler:'styled-objects-3',scene:{name:'Synthetic scene',background:{h:0,s:0,l:0},pulsePeriodMs:4000,objects:[styledObject()],...changes}};if(Array.isArray(value.scene.objects))value.scene.objects=value.scene.objects.map(o=>o&&Object.getPrototypeOf(o)===Object.prototype?styledObject(o):o);return value;}
function legacyObjects(changes={}) {return {format:'imagery-static-scene',version:2,sampler:'static-objects-2',scene:{name:'Synthetic scene',background:{h:0,s:0,l:0},objects:[{id:'object-1',shape:'circle',x:50,y:50,size:20,color:{h:200,s:20,l:45}}],...changes}};}
function object(changes={}) {return scene({objects:[styledObject(changes)]});}
module.exports={copy,legacy,legacyObjects,styledObject,scene,object};
