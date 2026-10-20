/* Pure direct-editing geometry and session lock snapshots. No DOM, visibility or storage authority. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'));else root.ImageryEditor=factory(root.ImageryModel);}(typeof globalThis!=='undefined'?globalThis:this,function(M){
  'use strict';
  const DRAG_THRESHOLD=4,HISTORY_LIMIT=40;
  function point(rect,clientX,clientY){
    if(!rect||![rect.left,rect.top,rect.width,rect.height,clientX,clientY].every(Number.isFinite)||rect.width<=0||rect.height<=0)return null;
    return {x:clientX-rect.left,y:clientY-rect.top};
  }
  function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/length)):0;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
  function hit(item,x,y,tolerance){
    if(item.kind==='dot'||item.kind==='circle')return Math.hypot(x-item.x,y-item.y)<=item.radius+tolerance+(item.lineWidth||0)/2+(item.outline.enabled?item.outline.width:0);
    const points=item.points;if(!Array.isArray(points)||points.length<3)return false;
    let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
      const a=points[i],b=points[j];if(segmentDistance(x,y,a,b)<=tolerance+(item.lineWidth||0)/2+(item.outline.enabled?item.outline.width:0))return true;
      if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    }return inside;
  }
  function hits(scene,width,height,x,y,tolerance=6){
    if(![width,height,x,y,tolerance].every(Number.isFinite)||width<=0||height<=0||tolerance<0||tolerance>24)return [];
    const rect=M.contentRect(scene,width,height);if(x<rect.x||y<rect.y||x>rect.x+rect.width||y>rect.y+rect.height)return [];
    return M.geometry(scene,width,height).filter(item=>hit(item,x,y,tolerance)).map(item=>item.id).reverse();
  }
  function position(value,min,max,snapStep){
    if(!Number.isFinite(value))throw new Error('Item positions must be finite.');
    // Clamp the grid index, not a snapped coordinate: an inset edge may be off-grid.
    if(snapStep){const first=Math.ceil(min/snapStep),last=Math.floor(max/snapStep);return Math.max(first,Math.min(last,Math.round(value/snapStep)))*snapStep;}
    return Math.round(Math.max(min,Math.min(max,value))*100)/100;
  }
  function place(scene,id,xPercent,yPercent,snapStep=0){
    const result=M.canonicalScene(scene),o=result.scene.objects.find(item=>item.id===id);
    if(!o)throw new Error('A valid selected object is required.');
    if(![0,1,5,10].includes(snapStep))throw new Error('Snap must be Off, 1, 5 or 10.');
    const extent=M.objectExtent(o);let min=Math.ceil((1+extent)*100),max=Math.floor((99-extent)*100);
    // Match the validator's arithmetic even when subtraction at a nominal
    // hundredth boundary loses an ulp (for example, 2.8 - 1.8 is below 1).
    if(min/100-extent<1)min++;
    if(max/100+extent>99)max--;
    o.x=position(xPercent,min/100,max/100,snapStep);o.y=position(yPercent,min/100,max/100,snapStep);return M.canonicalScene(result);
  }
  function translate(scene,id,dx,dy,width,height,snapStep=0){
    const result=M.canonicalScene(scene),o=result.scene.objects.find(item=>item.id===id);
    if(!o||![dx,dy,width,height].every(Number.isFinite)||width<=0||height<=0)throw new Error('A valid selected object and field are required.');
    const rect=M.contentRect(result,width,height);
    return place(result,id,o.x+dx*100/rect.width,o.y+dy*100/rect.height,snapStep);
  }
  function align(scene,id,axis){
    if(!['x','y','both'].includes(axis))throw new Error('Choose horizontal, vertical or both-axis centering.');
    const result=M.canonicalScene(scene),o=result.scene.objects.find(item=>item.id===id);
    if(!o)throw new Error('A valid selected object is required.');
    if(axis==='x'||axis==='both')o.x=50;
    if(axis==='y'||axis==='both')o.y=50;
    return M.canonicalScene(result);
  }
  function createLocks(){
    const snapshots=new Map();
    function matches(candidate){
      return [...snapshots].every(([id,record])=>{const item=candidate.scene.objects.find(o=>o.id===id);return item!==undefined&&JSON.stringify(item)===JSON.stringify(record);});
    }
    return Object.freeze({
      lock(scene,id){
        const candidate=M.canonicalScene(scene),item=candidate.scene.objects.find(o=>o.id===id);
        if(!item)throw new Error('A valid selected object is required.');
        if(!matches(candidate))throw new Error('Unlock protected items before changing or replacing their stored data.');
        // Never refresh a baseline through a second lock call or another scene.
        if(snapshots.has(id))return false;
        if(snapshots.size>=M.MAX_OBJECTS)throw new Error('The session lock limit has been reached.');
        snapshots.set(id,item);return true;
      },
      unlock(id){return snapshots.delete(id);},
      clear(){const changed=snapshots.size>0;snapshots.clear();return changed;},
      has(id){return snapshots.has(id);},
      ids(){return [...snapshots.keys()];},
      allows(candidate){try{return matches(M.canonicalScene(candidate));}catch(e){return false;}}
    });
  }
  return Object.freeze({DRAG_THRESHOLD,HISTORY_LIMIT,point,hits,translate,place,align,createLocks});
}));
