/* Pure pointer geometry for direct editing. No DOM, visibility or storage authority. */
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
  function translate(scene,id,dx,dy,width,height){
    const result=M.canonicalScene(scene),o=result.scene.objects.find(item=>item.id===id);
    if(!o||![dx,dy,width,height].every(Number.isFinite)||width<=0||height<=0)throw new Error('A valid selected object and field are required.');
    const extent=M.objectExtent(o),min=Math.ceil((1+extent)*100)/100,max=Math.floor((99-extent)*100)/100,clamp=value=>Math.round(Math.max(min,Math.min(max,value))*100)/100;
    const rect=M.contentRect(result,width,height);o.x=clamp(o.x+dx*100/rect.width);o.y=clamp(o.y+dy*100/rect.height);return M.canonicalScene(result);
  }
  return Object.freeze({DRAG_THRESHOLD,HISTORY_LIMIT,point,hits,translate});
}));
