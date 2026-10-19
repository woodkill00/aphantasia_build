'use strict';
// Explicit, synthetic schema fixtures. Independent of production preset contents.
const copy = value => JSON.parse(JSON.stringify(value));
function legacy(changes={}) { return {format:'imagery-static-scene',version:1,sampler:'sparse-fixed-1',scene:{name:'Synthetic legacy scene',shape:'dots',x:50,y:50,size:22,dotCount:3,dotRadius:1,palette:'slate',...changes}}; }
function scene(changes={}) {return {format:'imagery-static-scene',version:2,sampler:'static-objects-2',scene:{name:'Synthetic scene',background:{h:0,s:0,l:0},objects:[{id:'object-1',shape:'circle',x:50,y:50,size:20,color:{h:200,s:20,l:45}}],...changes}};}
function object(changes={}) {const s=scene();Object.assign(s.scene.objects[0],changes);return s;}
module.exports={copy,legacy,scene,object};
