/* Pure, bounded editor-guide layout. No DOM, pixels, clock or visibility authority. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'));else root.ImageryEditorAids=factory(root.ImageryModel);}(typeof globalThis!=='undefined'?globalThis:this,function(M){
  'use strict';
  const GRID_STEPS=Object.freeze([1,5,10]),MIN_GRID_CSS_PX=8,MAX_GRID_LINES=198,MAX_CENTER_LINES=2;
  function record(value,keys,required,label){
    if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw Error(label+' must be an ordinary object.');
    const own=Reflect.ownKeys(value);
    if(own.some(key=>typeof key!=='string'||!keys.includes(key))||required.some(key=>!own.includes(key)))throw Error(label+' has missing or unsupported fields.');
    for(const key of own)if(!Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(value,key),'value'))throw Error(label+' cannot contain accessors.');
  }
  function axis(length,gridStep){
    // Multiply by a fraction first: length * gridStep can overflow at finite
    // CSS dimensions. Reject unrepresentable spacing rather than return a
    // misleading interval, an infinite coordinate, or an unbounded loop.
    const baseSpacing=length*(gridStep/100);
    const multiplier=Math.max(1,Math.ceil(MIN_GRID_CSS_PX/baseSpacing)),interval=gridStep*multiplier;
    if(!Number.isFinite(baseSpacing)||baseSpacing<=0||!Number.isFinite(interval)||interval<=0)throw Error('Editor guide spacing exceeds numeric layout bounds.');
    const positions=[];
    // There can never be more than 99 interior lines on either axis. Use an
    // index instead of accumulated floating-point additions or pixel loops.
    for(let index=1;index<100;index++){
      const normalized=index*interval;
      if(normalized>=100)break;
      const position=length*(normalized/100);
      if(!Number.isFinite(position)||position<=0||position>=length)throw Error('Editor guide position exceeds numeric layout bounds.');
      positions.push(position);
    }
    return {positions,interval};
  }
  function guideLayout(scene,viewport,options={}){
    record(viewport,['width','height'],['width','height'],'Editor guide viewport');
    if(![viewport.width,viewport.height].every(Number.isFinite)||viewport.width<=0||viewport.height<=0)throw Error('Editor guide dimensions must be finite and positive.');
    record(options,['gridStep','centerGuides'],[],'Editor guide options');
    const gridStep=Object.prototype.hasOwnProperty.call(options,'gridStep')?options.gridStep:5;
    const centerGuides=Object.prototype.hasOwnProperty.call(options,'centerGuides')?options.centerGuides:false;
    if(!GRID_STEPS.includes(gridStep))throw Error('Editor grid spacing must be 1, 5 or 10.');
    if(typeof centerGuides!=='boolean')throw Error('Center guides must be true or false.');
    // contentRect is the authoritative mapping and validates the complete
    // closed scene first, including descriptors, without invoking getters.
    const rect=M.contentRect(scene,viewport.width,viewport.height);
    if(![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite)||rect.width<=0||rect.height<=0)throw Error('Editor content rectangle exceeds numeric layout bounds.');
    const x=axis(rect.width,gridStep),y=axis(rect.height,gridStep);
    const grid={x:x.positions,y:y.positions},center={x:centerGuides?[rect.width/2]:[],y:centerGuides?[rect.height/2]:[]};
    const gridCount=grid.x.length+grid.y.length,centerCount=center.x.length+center.y.length;
    // All returned records and arrays are fresh. No source scene, preference,
    // selection, snap or render-authority reference escapes through this API.
    return {contentRect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},grid,center,effectiveInterval:{x:x.interval,y:y.interval},count:{grid:gridCount,center:centerCount,total:gridCount+centerCount}};
  }
  return Object.freeze({GRID_STEPS,MIN_GRID_CSS_PX,MAX_GRID_LINES,MAX_CENTER_LINES,guideLayout});
}));
