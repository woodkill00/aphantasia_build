/* Original authored composition examples. MIT, copyright (c) 2026 woodkill00.
   Pure scene data only: no presentation, scheduling, persistence or network. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'));
  else root.ImageryPresets=factory(root.ImageryModel);
}(typeof globalThis!=='undefined'?globalThis:this,function(M){
  'use strict';
  const catalog=Object.freeze([
    Object.freeze({id:'balanced-contours',revision:1,title:'Balanced contours',description:'A circle and rounded rectangle balanced around a small central diamond. Three steady contour items; static preview does not run timing.',timingKind:'steady'}),
    Object.freeze({id:'symmetric-points',revision:1,title:'Sparse symmetric points',description:'Five small filled points arranged symmetrically around the center. Five steady items; static preview does not run timing.',timingKind:'steady'}),
    Object.freeze({id:'sequential-shapes',revision:1,title:'Sequential shapes',description:'Three muted shapes with staggered, finite fades and steady holds. Static preview shows all three; Play items once runs the authored timing.',timingKind:'sequential-fades'}),
    Object.freeze({id:'mixed-steady-pulse',revision:1,title:'Mixed steady and pulse',description:'A steady circle beside a star with optional slow opacity pulse. Static preview shows both steadily; explicit item playback ends after eight seconds.',timingKind:'mixed-steady-pulse'})
  ]);
  function list(){return catalog.map(value=>({...value,provenance:'Original repository-authored geometric composition; no external image or questionnaire.',license:'MIT'}));}
  function item(id,shape,x,y,size,color,geometry={},timing={}){
    const value=M.defaultAuthoredObject(id,shape);
    return {...value,x,y,size,color,geometry:{...value.geometry,height:size,...geometry},timing:{...value.timing,...timing}};
  }
  function create(id){
    const entry=catalog.find(value=>value.id===id);
    if(!entry)throw Error('Choose a supported preset identifier.');
    const blue={h:208,s:18,l:44},green={h:145,s:18,l:44},sand={h:40,s:22,l:46};
    let objects;
    if(id==='balanced-contours')objects=[
      item('object-1','circle',30,50,16,blue),
      item('object-2','rounded-rectangle',70,50,18,green,{height:14,cornerRadius:0.25}),
      item('object-3','square',50,50,6,sand,{rotation:45})
    ];
    else if(id==='symmetric-points')objects=[[50,50],[35,35],[65,35],[35,65],[65,65]].map(([x,y],i)=>item('object-'+(i+1),'dot',x,y,3,i===0?sand:blue));
    else if(id==='sequential-shapes')objects=[
      item('object-1','circle',28,50,16,blue,{}, {startMs:0,fadeInMs:1000,holdMs:2000,fadeOutMs:1000}),
      item('object-2','triangle',50,50,16,sand,{}, {startMs:3000,fadeInMs:1000,holdMs:2000,fadeOutMs:1000}),
      item('object-3','rectangle',72,50,16,green,{height:12},{startMs:6000,fadeInMs:1000,holdMs:2000,fadeOutMs:1000})
    ];
    else objects=[
      item('object-1','circle',35,50,18,blue,{}, {holdMs:8000}),
      item('object-2','star',65,50,20,sand,{sides:5,innerRatio:0.5},{holdMs:8000,pulse:{enabled:true,minOpacity:0.8}})
    ];
    // No catalog identity is embedded in editable scene data. Altered derivatives
    // therefore cannot accidentally claim an unchanged experimental stimulus ID.
    return M.canonicalScene({format:M.FORMAT,version:M.AUTHORED_VERSION,sampler:M.AUTHORED_SAMPLER,scene:{name:entry.title,background:{...M.DEFAULT_BACKGROUND},pulsePeriodMs:4000,canvas:{mode:'fixed',ratio:'4:3'},objects}});
  }
  return Object.freeze({list,create});
}));
