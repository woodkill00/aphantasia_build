/* Pure atomic arrangement planning. No DOM, controller, rendering, clock or storage authority. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'),require('./editor-model.js'));else root.ImagerySelection=factory(root.ImageryModel,root.ImageryEditor);}(typeof globalThis!=='undefined'?globalThis:this,function(M,E){
  'use strict';
  const EPS=1e-9,HISTORY_LIMIT=40;
  const KINDS=Object.freeze(['move','nudge','translate','place','center','align','distribute','duplicate','delete','reorder']);
  const ALIGNMENTS=Object.freeze(['left','right','top','bottom','horizontal','vertical']);
  const transactions=new WeakSet();
  const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
  const bytes=value=>JSON.stringify(value);
  const q=value=>Math.round(value*100);
  function fail(message,code='INVALID_ARRANGEMENT'){const error=new Error(message);error.code=code;throw error;}
  function record(value,allowed,required,label){
    if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail(label+' must be an ordinary object.');
    const keys=Reflect.ownKeys(value);
    if(keys.some(key=>typeof key!=='string'||!allowed.includes(key))||required.some(key=>!keys.includes(key)))fail(label+' has missing or unsupported fields.');
    for(const key of keys)if(!own(Object.getOwnPropertyDescriptor(value,key),'value'))fail(label+' cannot contain accessors.');
  }
  function array(value,limit,label){
    if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>limit)fail(label+' must be a bounded ordinary array.');
    const keys=Reflect.ownKeys(value);
    if(keys.length!==value.length+1||keys.some(key=>key!=='length'&&(typeof key!=='string'||!/^(0|[1-9][0-9]*)$/.test(key)||Number(key)>=value.length)))fail(label+' has missing or unsupported fields.');
    for(let index=0;index<value.length;index++)if(!own(Object.getOwnPropertyDescriptor(value,String(index))||{},'value'))fail(label+' cannot contain holes or accessors.');
    return value;
  }
  function ids(value,label='Selected IDs'){
    array(value,M.MAX_OBJECTS,label);
    if(value.some(id=>typeof id!=='string'||!/^object-[1-9][0-9]{0,5}$/.test(id))||new Set(value).size!==value.length)fail(label+' must contain unique stable item IDs.');
    return value.slice();
  }
  function selectionFor(document,list,primaryId){
    const selected=new Set(list),ordered=document.scene.objects.filter(item=>selected.has(item.id)).map(item=>item.id);
    return {ids:ordered,primaryId:ordered.length?(ordered.includes(primaryId)?primaryId:ordered[ordered.length-1]):null};
  }
  function checkedSelection(document,value){
    record(value,['ids','primaryId'],['ids','primaryId'],'Selection');
    const selected=ids(value.ids),ordered=selectionFor(document,selected,value.primaryId);
    if(selected.length!==ordered.ids.length||selected.some((id,index)=>id!==ordered.ids[index]))fail('Selected IDs must exist in current layer order.');
    if(selected.length?!selected.includes(value.primaryId):value.primaryId!==null)fail('The move anchor must be a selected ID, or null for an empty selection.');
    return {ids:selected,primaryId:value.primaryId};
  }
  function canonicalSelection(value,selection){return checkedSelection(M.canonicalScene(value),selection);}
  function reduceSelection(value,selection,action){
    const document=M.canonicalScene(value),current=checkedSelection(document,selection);
    record(action,['type','id'],['type'],'Selection action');
    if(!['only','toggle','all','clear','primary'].includes(action.type))fail('Choose a supported selection action.');
    const needsId=['only','toggle','primary'].includes(action.type);
    if(needsId!==own(action,'id'))fail('This selection action has missing or unsupported arguments.');
    if(needsId&&!document.scene.objects.some(item=>item.id===action.id))fail('A valid item ID is required.');
    if(action.type==='clear')return {ids:[],primaryId:null};
    if(action.type==='all')return selectionFor(document,document.scene.objects.map(item=>item.id),current.primaryId);
    if(action.type==='only')return {ids:[action.id],primaryId:action.id};
    if(action.type==='primary'){
      if(!current.ids.includes(action.id))fail('The move anchor must already be selected.');
      return {ids:current.ids.slice(),primaryId:action.id};
    }
    const removing=current.ids.includes(action.id);
    return selectionFor(document,removing?current.ids.filter(id=>id!==action.id):current.ids.concat(action.id),removing?current.primaryId:action.id);
  }
  function checkCommand(command){
    record(command,['type','dx','dy','x','y','snapStep','axis','mode','direction'],['type'],'Arrangement command');
    if(!KINDS.includes(command.type))fail('Choose a supported arrangement command.');
    const required={move:['dx','dy'],nudge:['dx','dy'],translate:['dx','dy'],place:['x','y'],center:['axis'],align:['mode'],distribute:['axis'],duplicate:[],delete:[],reorder:['direction']}[command.type];
    const allowed=['type',...required,...(['translate','place'].includes(command.type)?['snapStep']:[])];
    record(command,allowed,['type',...required],'Arrangement command');
    if(['move','nudge'].includes(command.type))for(const key of ['dx','dy'])if(!Number.isFinite(command[key])||Math.abs(command[key])>100||Math.abs(command[key]*100-q(command[key]))>1e-8)fail('Movement deltas must be finite -100 to 100 values with at most two decimals.');
    if(['translate','place'].includes(command.type)){
      for(const key of required)if(!Number.isFinite(command[key]))fail('Pointer coordinates must be finite.');
      if(own(command,'snapStep')&&![0,1,5,10].includes(command.snapStep))fail('Snap must be Off, 1, 5 or 10.');
    }
    if(command.type==='center'&&!['x','y','both'].includes(command.axis))fail('Choose horizontal, vertical or both-axis centering.');
    if(command.type==='align'&&!ALIGNMENTS.includes(command.mode))fail('Choose a supported edge or center alignment.');
    if(command.type==='distribute'&&!['x','y'].includes(command.axis))fail('Choose horizontal or vertical equal gaps.');
    if(command.type==='reorder'&&!['forward','backward'].includes(command.direction))fail('Choose one layer forward or backward.');
  }
  function checkOptions(options,historyOnly=false){
    record(options,historyOnly?['locks']:['locks','viewport','history'],[],'Arrangement options');
  }
  function lockPolicy(document,locks){
    if(locks===undefined)return {ids:new Set(),allows:()=>true};
    if(!locks||typeof locks!=='object')fail('Session locks must provide their defensive snapshot policy.');
    // Read descriptors first, never execute an accessor supplied as a lock API.
    for(const key of ['ids','allows']){
      const descriptor=Object.getOwnPropertyDescriptor(locks,key);
      if(!descriptor||!own(descriptor,'value')||typeof descriptor.value!=='function')fail('Session locks must provide ids and allows methods.');
    }
    const locked=new Set(ids(locks.ids(),'Locked IDs'));
    if(!locks.allows(document))fail('Unlock protected items before changing their stored data.','LOCKED');
    return {ids:locked,allows:target=>locks.allows(target)};
  }
  function forbidLocked(policy,targetIds){
    if(targetIds.some(id=>policy.ids.has(id)))fail('Unlock every selected item before arranging the selection; no selected item is skipped.','LOCKED');
  }
  function content(document,viewport){
    record(viewport,['width','height'],['width','height'],'Arrangement viewport');
    if(![viewport.width,viewport.height].every(Number.isFinite)||viewport.width<=0||viewport.height<=0)fail('Arrangement requires finite positive field dimensions.');
    const rect=M.contentRect(document,viewport.width,viewport.height),scale=Math.min(rect.width,rect.height)/100;
    if(![rect.x,rect.y,rect.width,rect.height,scale].every(Number.isFinite)||rect.width<=0||rect.height<=0||scale<=0)fail('Derived arrangement geometry exceeds numeric bounds.');
    return rect;
  }
  function measured(document,viewport){
    const rect=content(document,viewport),geometry=M.geometry(document,viewport.width,viewport.height);
    return geometry.map((item,index)=>{
      let xs,ys;
      if(item.kind==='dot'||item.kind==='circle'){
        if(![item.x,item.y,item.radius].every(Number.isFinite)||item.radius<=0)fail('Derived circle geometry exceeds numeric bounds.');
        xs=[item.x-item.radius,item.x+item.radius];ys=[item.y-item.radius,item.y+item.radius];
      }else if(item.kind==='polygon'){
        if(!Array.isArray(item.points)||item.points.length<3||item.points.length>64||item.points.some(point=>!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)))fail('Derived polygon geometry exceeds numeric bounds.');
        xs=item.points.map(point=>point[0]);ys=item.points.map(point=>point[1]);
      }else fail('Unsupported arrangement geometry.');
      const stroke=(item.kind==='dot'||item.filled?0:(item.lineWidth||0)/2)+(item.outline.enabled?item.outline.width:0);
      const raw=[Math.min(...xs)-stroke,Math.max(...xs)+stroke,Math.min(...ys)-stroke,Math.max(...ys)+stroke];
      if(!Number.isFinite(stroke)||stroke<0||!raw.every(Number.isFinite))fail('Derived arrangement bounds exceed numeric bounds.');
      const x=raw.slice(0,2).map(edge=>(edge-rect.x)/rect.width*100),y=raw.slice(2).map(edge=>(edge-rect.y)/rect.height*100);
      if(!x.concat(y).every(Number.isFinite)||x[1]<=x[0]||y[1]<=y[0])fail('Normalized arrangement bounds exceed numeric bounds.');
      return {id:item.id,index,x,y};
    });
  }
  function arrangementBounds(value,viewport){return measured(M.canonicalScene(value),viewport);}
  function limits(item){
    const extent=M.objectExtent(item);
    let min=Math.ceil((1+extent)*100),max=Math.floor((99-extent)*100);
    if(min/100-extent<1)min++;
    if(max/100+extent>99)max--;
    return {min,max};
  }
  function deltaRange(items,axis){
    let min=-Infinity,max=Infinity;
    for(const item of items){const bound=limits(item),center=q(item[axis]);min=Math.max(min,bound.min-center);max=Math.min(max,bound.max-center);}
    return {min,max};
  }
  function exactDelta(items,axis,delta){
    if(delta===0)return 0; // The unchanged accepted payload is independently feasible.
    const range=deltaRange(items,axis);
    if(delta<range.min||delta>range.max)fail('All selected items must fit the complete requested movement.');
    return delta;
  }
  function nearestDelta(items,primary,axis,desired,snapStep){
    if(!Number.isFinite(desired))fail('Derived movement exceeds numeric bounds.');
    const range=deltaRange(items,axis),origin=q(primary[axis]);
    if(snapStep){
      const step=snapStep*100,desiredIndex=Math.round((primary[axis]+desired)/snapStep),zeroIndex=origin/step;
      if(!Number.isFinite(desiredIndex))fail('Derived snapped movement exceeds numeric bounds.');
      const first=Math.ceil((origin+range.min)/step),last=Math.floor((origin+range.max)/step);
      const ordinary=first<=last?Math.max(first,Math.min(last,desiredIndex)):null;
      const zero=Number.isInteger(zeroIndex)?zeroIndex:null;
      if(ordinary===null&&zero===null)fail('No common snapped position fits every selected item.');
      // Compare grid indices after the existing Math.round half-step rule.
      const index=ordinary===null?zero:zero===null?ordinary:Math.abs(desiredIndex-zero)<Math.abs(desiredIndex-ordinary)?zero:ordinary;
      return index===zero?0:index*step-origin;
    }
    const requested=q(desired);
    if(!Number.isFinite(requested))fail('Derived movement exceeds numeric bounds.');
    if(requested===0||range.min>range.max)return 0;
    const ordinary=Math.max(range.min,Math.min(range.max,requested));
    return Math.abs(requested)<Math.abs(requested-ordinary)?0:ordinary;
  }
  function writeDelta(items,axis,delta){if(delta!==0)for(const item of items)item[axis]=(q(item[axis])+delta)/100;}
  function writeTarget(item,axis,target){
    const targetQ=q(target);
    if(!Number.isFinite(targetQ))fail('Derived position exceeds numeric bounds.');
    if(targetQ!==q(item[axis]))item[axis]=targetQ/100;
  }
  function union(bounds,axis){return [Math.min(...bounds.map(bound=>bound[axis][0])),Math.max(...bounds.map(bound=>bound[axis][1]))];}
  const midpoint=interval=>(interval[0]+interval[1])/2;
  const spread=values=>Math.max(...values)-Math.min(...values);
  function selectedBounds(document,selection,viewport){const selected=new Set(selection.ids);return measured(document,viewport).filter(bound=>selected.has(bound.id));}
  function finish(before,selection,document,nextSelection,kind,policy){
    const candidate=M.canonicalScene(document),selected=checkedSelection(candidate,nextSelection);
    if(!policy.allows(candidate))fail('Unlock protected items before changing their stored data.','LOCKED');
    return {document:candidate,selection:selected,changed:bytes(before)!==bytes(candidate),kind,targetIds:selection.ids.slice()};
  }
  function plan(value,selection,command,options={}){
    const before=M.canonicalScene(value),selected=checkedSelection(before,selection);
    checkCommand(command);checkOptions(options);
    if(selected.ids.length===0)fail('Select at least one item to arrange.');
    if(command.type==='align'&&selected.ids.length<2)fail('Select at least two items to align.');
    if(command.type==='distribute'&&selected.ids.length<3)fail('Select at least three items for equal gaps.');
    const policy=lockPolicy(before,options.locks);
    if(command.type!=='duplicate')forbidLocked(policy,selected.ids);
    const document=M.canonicalScene(before),set=new Set(selected.ids),items=document.scene.objects.filter(item=>set.has(item.id));
    let nextSelection=selected;
    if(['move','nudge','translate','place'].includes(command.type)){
      const pointer=command.type==='translate'||command.type==='place',primary=items.find(item=>item.id===selected.primaryId);
      let dx=pointer?command.dx:q(command.dx)/100,dy=pointer?command.dy:q(command.dy)/100,snapStep=pointer?(command.snapStep||0):0;
      if(pointer){
        const rect=content(before,options.viewport);
        // Geometry validation is required even if a zero pointer result would
        // otherwise be a no-op; finite viewport inputs alone do not suffice.
        measured(before,options.viewport);
        if(command.type==='translate'){
          // The singleton helper's multiplication order is observable at
          // hundredth ties; do not replace it with algebraically equal math.
          dx=items.length===1?command.dx*100/rect.width:command.dx/rect.width*100;
          dy=items.length===1?command.dy*100/rect.height:command.dy/rect.height*100;
        }
        else{dx=command.x-primary.x;dy=command.y-primary.y;}
        if(![dx,dy].every(Number.isFinite))fail('Derived pointer movement exceeds numeric bounds.');
      }
      if(items.length===1){
        const exactZero=command.type==='translate'?command.dx===0&&command.dy===0:command.type==='place'?command.x===primary.x&&command.y===primary.y:dx===0&&dy===0;
        // Only an explicitly unchanged unsnapped request bypasses the old
        // singleton helper. A rounded delta guard would misclassify 25→25.005
        // because subtraction falls below .005 while E.place rounds to 25.01.
        if(!exactZero||snapStep){
          const candidate=command.type==='translate'
            ?E.translate(before,primary.id,command.dx,command.dy,options.viewport.width,options.viewport.height,snapStep)
            :E.place(before,primary.id,command.type==='place'?command.x:primary.x+dx,command.type==='place'?command.y:primary.y+dy,snapStep);
          const result=candidate.scene.objects.find(item=>item.id===primary.id);
          // An active singleton action retains the established helper's complete
          // X/Y output, including its orthogonal-axis rounding. Multi-selection
          // alone uses affected-axis lattice preservation. The app separately
          // restores exact gesture-origin payloads at a zero-lattice release.
          primary.x=result.x;primary.y=result.y;
        }
      }else for(const [axis,desired] of [['x',dx],['y',dy]])writeDelta(items,axis,pointer?nearestDelta(items,primary,axis,desired,snapStep):exactDelta(items,axis,q(desired)));
    }else if(command.type==='center'){
      if(items.length===1){
        const centered=E.align(before,items[0].id,command.axis).scene.objects.find(item=>item.id===items[0].id);
        for(const axis of ['x','y'])if(command.axis==='both'||command.axis===axis)items[0][axis]=centered[axis];
      }else{
        const bounds=selectedBounds(before,selected,options.viewport);
        for(const axis of ['x','y'])if(command.axis==='both'||command.axis===axis){
          const center=midpoint(union(bounds,axis));
          if(Math.abs(center-50)>0.005+EPS)writeDelta(items,axis,exactDelta(items,axis,q(50-center)));
        }
        const final=selectedBounds(M.canonicalScene(document),selected,options.viewport);
        for(const axis of ['x','y'])if((command.axis==='both'||command.axis===axis)&&Math.abs(midpoint(union(final,axis))-50)>0.005+EPS)fail('Selection bounds cannot be centered at the current coordinate precision.');
      }
    }else if(command.type==='align'){
      const bounds=selectedBounds(before,selected,options.viewport),axis=['left','right','horizontal'].includes(command.mode)?'x':'y';
      const center=['horizontal','vertical'].includes(command.mode),leading=['left','top'].includes(command.mode);
      const pick=interval=>center?midpoint(interval):interval[leading?0:1],edges=bounds.map(bound=>pick(bound[axis]));
      if(spread(edges)>0.01+EPS){
        const target=pick(union(bounds,axis));
        items.forEach((item,index)=>writeTarget(item,axis,item[axis]+target-edges[index]));
        const final=selectedBounds(M.canonicalScene(document),selected,options.viewport).map(bound=>pick(bound[axis]));
        if(spread(final)>0.01+EPS||final.some(edge=>Math.abs(edge-target)>0.005+EPS))fail('Alignment does not fit at the current coordinate precision.');
      }
    }else if(command.type==='distribute'){
      const axis=command.axis,bounds=selectedBounds(before,selected,options.viewport),ordered=bounds.slice().sort((a,b)=>a[axis][0]-b[axis][0]||a.index-b.index);
      const gaps=list=>list.slice(1).map((bound,index)=>bound[axis][0]-list[index][axis][1]),oldGaps=gaps(ordered);
      if(!(oldGaps.every(gap=>gap>=-EPS)&&spread(oldGaps)<=0.02+EPS)){
        const [low,high]=union(bounds,axis),widths=ordered.map(bound=>bound[axis][1]-bound[axis][0]);
        let gap=(high-low-widths.reduce((sum,width)=>sum+width,0))/(items.length-1);
        if(gap<-EPS)fail('Equal gaps do not fit inside the selected outer span.');
        if(Math.abs(gap)<=EPS)gap=0;
        let edge=low;
        ordered.forEach((bound,index)=>{const item=items.find(item=>item.id===bound.id);writeTarget(item,axis,item[axis]+edge-bound[axis][0]);edge+=widths[index]+gap;});
        const final=selectedBounds(M.canonicalScene(document),selected,options.viewport),lookup=new Map(final.map(bound=>[bound.id,bound])),finalOrdered=ordered.map(bound=>lookup.get(bound.id)),finalGaps=gaps(finalOrdered),span=union(final,axis);
        if(finalGaps.some(value=>value<-EPS)||spread(finalGaps)>0.02+EPS||Math.abs(span[0]-low)>0.005+EPS||Math.abs(span[1]-high)>0.005+EPS)fail('Equal gaps do not fit at the current coordinate precision.');
      }
    }else if(command.type==='duplicate'){
      if(document.scene.objects.length+items.length>M.MAX_OBJECTS)fail('Duplicating the entire selection would exceed the 12-item limit.');
      const history=canonicalHistory(options.history===undefined?emptyHistory():options.history),reserved=new Set(document.scene.objects.map(item=>item.id));
      for(const entry of history.undo.concat(history.redo))for(const endpoint of [entry.before,entry.after])for(const item of endpoint.scene.objects)reserved.add(item.id);
      const copies=[],mapping=new Map();let suffix=1;
      for(const item of items){
        // At most 984 reservations: no unbounded suffix search or persistent ID ledger.
        while(reserved.has('object-'+suffix))suffix++;
        if(suffix>985)fail('Retained arrangement identities exceed the bounded allocation budget.');
        const id='object-'+suffix;reserved.add(id);mapping.set(item.id,id);copies.push({...item,id});suffix++;
      }
      document.scene.objects.push(...copies);nextSelection={ids:copies.map(item=>item.id),primaryId:mapping.get(selected.primaryId)};
    }else if(command.type==='delete'){
      const first=document.scene.objects.findIndex(item=>set.has(item.id));
      document.scene.objects=document.scene.objects.filter(item=>!set.has(item.id));
      const survivor=document.scene.objects[Math.min(first,document.scene.objects.length-1)];
      nextSelection=survivor?{ids:[survivor.id],primaryId:survivor.id}:{ids:[],primaryId:null};
    }else{
      const objects=document.scene.objects;
      if(command.direction==='forward'){
        for(let index=objects.length-2;index>=0;index--)if(set.has(objects[index].id)&&!set.has(objects[index+1].id))[objects[index],objects[index+1]]=[objects[index+1],objects[index]];
      }else for(let index=1;index<objects.length;index++)if(set.has(objects[index].id)&&!set.has(objects[index-1].id))[objects[index],objects[index-1]]=[objects[index-1],objects[index]];
      nextSelection=selectionFor(document,selected.ids,selected.primaryId);
    }
    return finish(before,selected,document,nextSelection,command.type,policy);
  }
  function deepFreeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(deepFreeze);Object.freeze(value);}return value;}
  function generation(value){if(!Number.isSafeInteger(value)||value<0)fail('Scene generation must be a nonnegative safe integer.');return value;}
  function checkedTransaction(value){
    if(value&&typeof value==='object'&&transactions.has(value))return value;
    record(value,['before','after','beforeSelection','afterSelection','generation','kind','targetIds'],['before','after','beforeSelection','afterSelection','generation','kind','targetIds'],'Arrangement transaction');
    const before=M.canonicalScene(value.before),after=M.canonicalScene(value.after),beforeSelection=checkedSelection(before,value.beforeSelection),afterSelection=checkedSelection(after,value.afterSelection),targetIds=ids(value.targetIds,'Transaction target IDs');
    if(!KINDS.includes(value.kind)||bytes(before)===bytes(after)||targetIds.length===0||bytes(targetIds)!==bytes(beforeSelection.ids))fail('Arrangement transaction must describe a changed scene and its exact selected original targets.');
    const entry=deepFreeze({before,after,beforeSelection,afterSelection,generation:generation(value.generation),kind:value.kind,targetIds});
    transactions.add(entry);return entry;
  }
  function emptyHistory(){return Object.freeze({undo:Object.freeze([]),redo:Object.freeze([])});}
  function canonicalHistory(value){
    record(value,['undo','redo'],['undo','redo'],'Arrangement history');
    array(value.undo,HISTORY_LIMIT,'Undo history');array(value.redo,HISTORY_LIMIT,'Redo history');
    if(value.undo.length+value.redo.length>HISTORY_LIMIT)fail('Arrangement history is limited to 40 total transactions.');
    return Object.freeze({undo:Object.freeze(value.undo.map(checkedTransaction)),redo:Object.freeze(value.redo.map(checkedTransaction))});
  }
  function makeTransaction(before,beforeSelection,result,sceneGeneration){
    generation(sceneGeneration);
    record(result,['document','selection','changed','kind','targetIds'],['document','selection','changed','kind','targetIds'],'Arrangement plan');
    const original=M.canonicalScene(before),candidate=M.canonicalScene(result.document);
    checkedSelection(original,beforeSelection);checkedSelection(candidate,result.selection);
    if(typeof result.changed!=='boolean'||result.changed!==(bytes(original)!==bytes(candidate))||!KINDS.includes(result.kind))fail('Arrangement plan change status is inconsistent.');
    if(bytes(ids(result.targetIds,'Transaction target IDs'))!==bytes(beforeSelection.ids))fail('Arrangement plan targets must match the original selection.');
    if(!result.changed)return null;
    return checkedTransaction({before:original,after:candidate,beforeSelection,afterSelection:result.selection,generation:sceneGeneration,kind:result.kind,targetIds:result.targetIds});
  }
  function recordHistory(value,entry){
    const history=canonicalHistory(value);
    if(entry===null)return history;
    const next=checkedTransaction(entry);
    if(history.undo.length&&bytes(history.undo[history.undo.length-1].after)!==bytes(next.before))fail('The new arrangement does not match the retained history endpoint.','HISTORY_ENDPOINT_MISMATCH');
    if(history.redo.length&&bytes(history.redo[history.redo.length-1].before)!==bytes(next.before))fail('The new arrangement does not match the retained history endpoint.','HISTORY_ENDPOINT_MISMATCH');
    if(history.undo.concat(history.redo).some(item=>item.generation!==next.generation))fail('The scene generation has changed.','HISTORY_ENDPOINT_MISMATCH');
    return Object.freeze({undo:Object.freeze(history.undo.concat(next).slice(-HISTORY_LIMIT)),redo:Object.freeze([])});
  }
  function planHistory(value,selection,history,direction,sceneGeneration,options={}){
    const document=M.canonicalScene(value),current=checkedSelection(document,selection),stacks=canonicalHistory(history);
    generation(sceneGeneration);checkOptions(options,true);
    if(!['undo','redo'].includes(direction))fail('Choose Undo arrangement or Redo arrangement.');
    const policy=lockPolicy(document,options.locks),source=stacks[direction],entry=source[source.length-1];
    if(!entry)return {document,selection:current,changed:false,kind:direction,targetIds:[],history:stacks};
    const expected=direction==='undo'?entry.after:entry.before,target=direction==='undo'?entry.before:entry.after,targetSelection=direction==='undo'?entry.beforeSelection:entry.afterSelection;
    if(entry.generation!==sceneGeneration||bytes(document)!==bytes(expected))fail('The draft no longer matches this arrangement history; discard the incompatible draft history.','HISTORY_ENDPOINT_MISMATCH');
    if(entry.kind==='reorder')forbidLocked(policy,entry.targetIds);
    const candidate=M.canonicalScene(target),selected=checkedSelection(candidate,targetSelection);
    if(!policy.allows(candidate))fail('Unlock protected items before restoring this arrangement.','LOCKED');
    const undo=direction==='undo'?stacks.undo.slice(0,-1):stacks.undo.concat(entry),redo=direction==='redo'?stacks.redo.slice(0,-1):stacks.redo.concat(entry);
    return {document:candidate,selection:selected,changed:true,kind:direction,targetIds:entry.targetIds.slice(),history:Object.freeze({undo:Object.freeze(undo),redo:Object.freeze(redo)})};
  }
  return Object.freeze({EPS,HISTORY_LIMIT,KINDS,ALIGNMENTS,canonicalSelection,reduceSelection,arrangementBounds,plan,emptyHistory,makeTransaction,recordHistory,planHistory});
}));
