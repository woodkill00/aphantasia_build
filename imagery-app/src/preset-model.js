/* Original authored composition examples. MIT, copyright (c) 2026 woodkill00.
   Pure scene data only: no presentation, scheduling, persistence or network. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'));
  else root.ImageryPresets=factory(root.ImageryModel);
}(typeof globalThis!=='undefined'?globalThis:this,function(M){
  'use strict';
  // Catalog order is editorial, not a ranking. Symmetry describes vertical
  // reflection of the full static composition, including item colors. Overlap
  // describes intersecting or contained geometric regions, not clinical effects.
  const catalog=Object.freeze([
    {id:'balanced-contours',revision:1,title:'Balanced contours',description:'A circle and rounded rectangle balanced around a small central diamond. Three steady contour items; static preview does not run timing.',timingKind:'steady',symmetry:'not-vertical',overlap:false},
    {id:'symmetric-points',revision:1,title:'Sparse symmetric points',description:'A sparse constellation of five small filled points arranged symmetrically around the center. Five steady items; static preview does not run timing.',timingKind:'steady',symmetry:'vertical',overlap:false},
    {id:'sequential-shapes',revision:1,title:'Sequential shapes',description:'Three muted shapes with staggered, finite fades and steady holds. Static preview shows all three; Play items once runs the authored timing.',timingKind:'sequential-fades',symmetry:'not-vertical',overlap:false},
    {id:'mixed-steady-pulse',revision:1,title:'Mixed steady and pulse',description:'A steady circle beside a star with optional slow opacity pulse. Static preview shows both steadily; explicit item playback ends after eight seconds.',timingKind:'mixed-steady-pulse',symmetry:'not-vertical',overlap:false},
    {id:'spatial-triplet',revision:1,title:'Spatial triplet',description:'A circle above a lower square and triangle forms an off-center spatial triplet. Three separate steady contours in three muted colors.',timingKind:'steady',symmetry:'not-vertical',overlap:false},
    {id:'symmetric-pair',revision:1,title:'Symmetric pair',description:'Two equal blue circles mirror each other across the vertical center. Two separate steady contours using one item color.',timingKind:'steady',symmetry:'vertical',overlap:false},
    {id:'displaced-pair',revision:1,title:'Displaced pair',description:'Two equal blue circles sit at different heights. The displaced pair is not vertically mirrored; both contours remain steady.',timingKind:'steady',symmetry:'not-vertical',overlap:false},
    {id:'overlapping-contours',revision:1,title:'Overlapping contours',description:'A blue circle and green square overlap near the center. Both steady contours remain visible; item order can be edited.',timingKind:'steady',symmetry:'not-vertical',overlap:true},
    {id:'simple-house',revision:1,title:'Simple house',description:'A muted filled house made from a rectangular wall, triangular roof, door and two windows. Five steady shapes overlap; the composition is vertically mirrored.',timingKind:'steady',symmetry:'vertical',overlap:true},
    {id:'simple-tree',revision:1,title:'Simple tree',description:'A sand-colored trunk and two overlapping green elliptical canopies make a simple tree. Three filled steady shapes are vertically mirrored.',timingKind:'steady',symmetry:'vertical',overlap:true},
    {id:'simple-boat',revision:1,title:'Simple boat',description:'A rounded hull, narrow mast and triangular sail make an offset boat sketch. Three filled steady shapes overlap.',timingKind:'steady',symmetry:'not-vertical',overlap:true},
    {id:'still-life',revision:1,title:'Small still life',description:'Three round fruits sit above a shallow bowl beside a bottle assembled from two shapes. Six filled steady shapes use three muted item colors.',timingKind:'steady',symmetry:'not-vertical',overlap:true}
  ].map(Object.freeze));
  function list(){
    return catalog.map(entry=>{
      const value=create(entry.id),objects=value.scene.objects;
      return {...entry,itemCount:objects.length,colorCount:new Set(objects.map(o=>[o.color.h,o.color.s,o.color.l].join('/'))).size,
        provenance:'Original repository-authored geometric composition; no external image or questionnaire.',license:'MIT',
        validation:{ok:true,format:value.format,version:value.version}};
    });
  }
  function item(id,shape,x,y,size,color,geometry={},timing={}){
    const value=M.defaultAuthoredObject(id,shape);
    return {...value,x,y,size,color,geometry:{...value.geometry,height:size,...geometry},timing:{...value.timing,...timing}};
  }
  function create(id){
    const entry=catalog.find(value=>value.id===id);
    if(!entry)throw Error('Choose a supported preset identifier.');
    const blue={h:208,s:18,l:44},green={h:145,s:18,l:44},sand={h:40,s:22,l:46};
    let objects;
    switch(id){
      case 'balanced-contours': objects=[
        item('object-1','circle',30,50,16,blue),
        item('object-2','rounded-rectangle',70,50,18,green,{height:14,cornerRadius:0.25}),
        item('object-3','square',50,50,6,sand,{rotation:45})
      ];break;
      case 'symmetric-points': objects=[[50,50],[35,35],[65,35],[35,65],[65,65]].map(([x,y],i)=>item('object-'+(i+1),'dot',x,y,3,i===0?sand:blue));break;
      case 'sequential-shapes': objects=[
        item('object-1','circle',28,50,16,blue,{}, {startMs:0,fadeInMs:1000,holdMs:2000,fadeOutMs:1000}),
        item('object-2','triangle',50,50,16,sand,{}, {startMs:3000,fadeInMs:1000,holdMs:2000,fadeOutMs:1000}),
        item('object-3','rectangle',72,50,16,green,{height:12},{startMs:6000,fadeInMs:1000,holdMs:2000,fadeOutMs:1000})
      ];break;
      case 'mixed-steady-pulse': objects=[
        item('object-1','circle',35,50,18,blue,{}, {holdMs:8000}),
        item('object-2','star',65,50,20,sand,{sides:5,innerRatio:0.5},{holdMs:8000,pulse:{enabled:true,minOpacity:0.8}})
      ];break;
      case 'spatial-triplet': objects=[
        item('object-1','circle',44,32,14,blue),
        item('object-2','square',30,65,14,green),
        item('object-3','triangle',68,60,16,sand)
      ];break;
      case 'symmetric-pair': objects=[item('object-1','circle',34,50,18,blue),item('object-2','circle',66,50,18,blue)];break;
      case 'displaced-pair': objects=[item('object-1','circle',34,39,18,blue),item('object-2','circle',66,61,18,blue)];break;
      case 'overlapping-contours': objects=[item('object-1','circle',45,48,24,blue),item('object-2','square',55,54,24,green)];break;
      case 'simple-house': objects=[
        item('object-1','rectangle',50,58,26,sand,{height:20,fill:true}),
        item('object-2','triangle',50,42,28,blue,{height:18,fill:true}),
        item('object-3','rectangle',50,62,6,green,{height:12,fill:true}),
        item('object-4','square',45,55,5,blue,{fill:true}),
        item('object-5','square',55,55,5,blue,{fill:true})
      ];break;
      case 'simple-tree': objects=[
        item('object-1','rectangle',50,63,6,sand,{height:18,fill:true}),
        item('object-2','ellipse',50,50,28,green,{height:18,fill:true}),
        item('object-3','ellipse',50,41,22,green,{height:20,fill:true})
      ];break;
      case 'simple-boat': objects=[
        item('object-1','rounded-rectangle',50,65,28,blue,{height:8,cornerRadius:0.4,fill:true}),
        item('object-2','rectangle',50,48,2,sand,{height:28,fill:true}),
        item('object-3','triangle',46,45,20,green,{height:24,fill:true})
      ];break;
      case 'still-life': objects=[
        item('object-1','ellipse',47,65,24,blue,{height:10,fill:true}),
        item('object-2','circle',41,58,8,sand,{fill:true}),
        item('object-3','circle',47,56,8,sand,{fill:true}),
        item('object-4','circle',53,59,8,sand,{fill:true}),
        item('object-5','rounded-rectangle',65,51,8,green,{height:22,cornerRadius:0.3,fill:true}),
        item('object-6','rectangle',65,38,4,green,{height:6,fill:true})
      ];break;
    }
    // No catalog identity is embedded in editable scene data. Altered derivatives
    // therefore cannot accidentally claim an unchanged experimental stimulus ID.
    return M.canonicalScene({format:M.FORMAT,version:M.AUTHORED_VERSION,sampler:M.AUTHORED_SAMPLER,scene:{name:entry.title,background:{...M.DEFAULT_BACKGROUND},pulsePeriodMs:4000,canvas:{mode:'fixed',ratio:'4:3'},objects}});
  }
  return Object.freeze({list,create});
}));
