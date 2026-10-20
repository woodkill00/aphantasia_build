/* Flat session-only groups and atomic arrangement/history planning.
   No DOM, renderer, controller, clocks, persistence or scene-schema authority. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'),require('./selection-model.js'));else root.ImageryGroups=factory(root.ImageryModel,root.ImagerySelection);}(typeof globalThis!=='undefined'?globalThis:this,function(M,S){
  'use strict';
  const EPS=S.EPS,HISTORY_LIMIT=S.HISTORY_LIMIT,MAX_GROUPS=6;
  // Current + both retained endpoints + planned IDs have bounded reservations.
  const ITEM_SEARCH_LIMIT=985,GROUP_SEARCH_LIMIT=493;
  const KINDS=Object.freeze(S.KINDS.concat('group','ungroup')),ALIGNMENTS=S.ALIGNMENTS;
  const transactions=new WeakSet(),own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key),bytes=JSON.stringify,q=value=>Math.round(value*100);
  const suffix=id=>Number(id.slice(id.indexOf('-')+1)),natural=(a,b)=>suffix(a)-suffix(b);
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
  function ids(value,kind='object',limit=M.MAX_OBJECTS){
    array(value,limit,'Session IDs');const pattern=kind==='object'?/^object-[1-9][0-9]{0,5}$/:/^group-[1-9][0-9]{0,5}$/;
    if(value.some(id=>typeof id!=='string'||!pattern.test(id))||new Set(value).size!==value.length)fail('Session IDs must contain unique bounded '+kind+' identifiers.');
    return value.slice();
  }
  function checkedGroups(document,value){
    array(value,MAX_GROUPS,'Session groups');const existing=new Set(document.scene.objects.map(item=>item.id)),seen=new Set(),groupIds=new Set();
    return value.map(group=>{
      record(group,['id','memberIds'],['id','memberIds'],'Session group');
      const id=ids([group.id],'group',1)[0],members=ids(group.memberIds);
      if(groupIds.has(id)||members.length<2)fail('Groups need unique IDs and 2–12 members.');
      groupIds.add(id);
      for(const member of members){if(!existing.has(member)||seen.has(member))fail('Groups must contain disjoint current items, never groups or missing items.');seen.add(member);}
      return {id,memberIds:members.sort(natural)};
    }).sort((a,b)=>natural(a.id,b.id));
  }
  function canonicalGroups(value,groups){return checkedGroups(M.canonicalScene(value),groups);}
  function checkedSelection(document,selection,groups){
    const selected=S.canonicalSelection(document,selection),set=new Set(selected.ids);
    for(const group of groups)if(group.memberIds.some(id=>set.has(id))&&!group.memberIds.every(id=>set.has(id)))fail('Select every member of a group together.');
    return selected;
  }
  function canonicalSelection(value,selection,groups){const document=M.canonicalScene(value);return checkedSelection(document,selection,checkedGroups(document,groups));}
  function session(document,value){record(value,['groups','selection'],['groups','selection'],'Arrangement session');const groups=checkedGroups(document,value.groups);return {groups,selection:checkedSelection(document,value.selection,groups)};}
  function selectionFor(document,list,primaryId){const set=new Set(list),ordered=document.scene.objects.filter(item=>set.has(item.id)).map(item=>item.id);return {ids:ordered,primaryId:ordered.length?(ordered.includes(primaryId)?primaryId:ordered[ordered.length-1]):null};}
  function unitMembers(groups,id){const group=groups.find(entry=>entry.memberIds.includes(id));return group?group.memberIds:[id];}
  function reduceSelection(value,selection,groups,action){
    const document=M.canonicalScene(value),metadata=checkedGroups(document,groups),current=checkedSelection(document,selection,metadata);
    record(action,['type','id'],['type'],'Selection action');
    if(!['only','toggle','all','clear','primary','pointer'].includes(action.type))fail('Choose a supported selection action.');
    const needsId=['only','toggle','primary','pointer'].includes(action.type);
    if(needsId!==own(action,'id'))fail('This selection action has missing or unsupported arguments.');
    if(needsId&&!document.scene.objects.some(item=>item.id===action.id))fail('A valid item ID is required.');
    if(action.type==='clear')return {ids:[],primaryId:null};
    if(action.type==='all')return selectionFor(document,document.scene.objects.map(item=>item.id),current.primaryId);
    if(action.type==='primary'||action.type==='pointer'&&current.ids.includes(action.id)){
      if(!current.ids.includes(action.id))fail('The move anchor must already be selected.');
      return {ids:current.ids.slice(),primaryId:action.id};
    }
    const members=unitMembers(metadata,action.id);
    if(action.type==='only'||action.type==='pointer')return selectionFor(document,members,action.id);
    const removing=current.ids.includes(action.id),unit=new Set(members);
    return selectionFor(document,removing?current.ids.filter(id=>!unit.has(id)):current.ids.concat(members),removing?current.primaryId:action.id);
  }
  function unitsFor(document,selection,groups){
    const selected=new Set(selection.ids),done=new Set(),units=[];
    document.scene.objects.forEach((item,index)=>{
      if(!selected.has(item.id)||done.has(item.id))return;
      const group=groups.find(entry=>entry.memberIds.includes(item.id)),members=group?group.memberIds.slice():[item.id];
      members.forEach(id=>done.add(id));units.push({id:group?group.id:item.id,groupId:group?group.id:null,memberIds:members,index});
    });return units;
  }
  function selectionUnits(value,selection,groups){const document=M.canonicalScene(value),metadata=checkedGroups(document,groups);return unitsFor(document,checkedSelection(document,selection,metadata),metadata);}
  function checkedUnits(document,value){
    array(value,M.MAX_OBJECTS,'Arrangement units');const current=new Map(document.scene.objects.map((item,index)=>[item.id,index])),seen=new Set(),unitIds=new Set();let previous=-1;
    return value.map(unit=>{
      record(unit,['id','groupId','memberIds','index'],['id','groupId','memberIds','index'],'Arrangement unit');const members=ids(unit.memberIds);
      if(!members.length||unitIds.has(unit.id))fail('Arrangement units must be nonempty and unique.');unitIds.add(unit.id);
      if(unit.groupId===null){if(members.length!==1||unit.id!==members[0])fail('An ungrouped unit must contain exactly its item.');}
      else if(ids([unit.groupId],'group',1)[0]!==unit.id||members.length<2)fail('A grouped unit must contain its complete group.');
      for(const id of members){if(!current.has(id)||seen.has(id))fail('Arrangement units must contain disjoint current items.');seen.add(id);}
      const index=Math.min(...members.map(id=>current.get(id)));
      if(unit.index!==index||index<=previous)fail('Arrangement units must follow earliest member layer order.');previous=index;
      return {id:unit.id,groupId:unit.groupId,memberIds:members,index};
    });
  }
  function union(bounds,axis){return [Math.min(...bounds.map(bound=>bound[axis][0])),Math.max(...bounds.map(bound=>bound[axis][1]))];}
  const midpoint=interval=>(interval[0]+interval[1])/2,spread=values=>Math.max(...values)-Math.min(...values);
  function measuredUnits(document,units,viewport){const bounds=new Map(S.arrangementBounds(document,viewport).map(bound=>[bound.id,bound]));return units.map(unit=>{const members=unit.memberIds.map(id=>bounds.get(id));return {...unit,memberIds:unit.memberIds.slice(),x:union(members,'x'),y:union(members,'y')};});}
  function arrangementUnitBounds(value,units,viewport){const document=M.canonicalScene(value);return measuredUnits(document,checkedUnits(document,units),viewport);}
  function lockPolicy(document,locks){
    if(locks===undefined)return {ids:new Set(),allows:()=>true};
    if(!locks||typeof locks!=='object')fail('Session locks must provide their defensive snapshot policy.');
    for(const key of ['ids','allows']){const descriptor=Object.getOwnPropertyDescriptor(locks,key);if(!descriptor||!own(descriptor,'value')||typeof descriptor.value!=='function')fail('Session locks must provide ids and allows methods.');}
    const locked=new Set(ids(locks.ids()));if(!locks.allows(document))fail('Unlock protected items before changing their stored data.','LOCKED');
    return {ids:locked,allows:target=>locks.allows(target)};
  }
  function forbidLocked(policy,targets){if(targets.some(id=>policy.ids.has(id)))fail('Unlock every selected item before arranging the selection; no selected item is skipped.','LOCKED');}
  function checkCommand(command){
    record(command,['type','dx','dy','x','y','snapStep','axis','mode','direction'],['type'],'Arrangement command');
    if(!KINDS.includes(command.type))fail('Choose a supported arrangement command.');
    const required={move:['dx','dy'],nudge:['dx','dy'],translate:['dx','dy'],place:['x','y'],center:['axis'],align:['mode'],distribute:['axis'],duplicate:[],delete:[],reorder:['direction'],group:[],ungroup:[]}[command.type];
    record(command,['type',...required,...(['translate','place'].includes(command.type)?['snapStep']:[])],['type',...required],'Arrangement command');
    if(['move','nudge'].includes(command.type))for(const key of ['dx','dy'])if(!Number.isFinite(command[key])||Math.abs(command[key])>100||Math.abs(command[key]*100-q(command[key]))>1e-8)fail('Movement deltas must be finite -100 to 100 values with at most two decimals.');
    if(['translate','place'].includes(command.type)){for(const key of required)if(!Number.isFinite(command[key]))fail('Pointer coordinates must be finite.');if(own(command,'snapStep')&&![0,1,5,10].includes(command.snapStep))fail('Snap must be Off, 1, 5 or 10.');}
    if(command.type==='center'&&!['x','y','both'].includes(command.axis))fail('Choose horizontal, vertical or both-axis centering.');
    if(command.type==='align'&&!ALIGNMENTS.includes(command.mode))fail('Choose a supported edge or center alignment.');
    if(command.type==='distribute'&&!['x','y'].includes(command.axis))fail('Choose horizontal or vertical equal gaps.');
    if(command.type==='reorder'&&!['forward','backward'].includes(command.direction))fail('Choose one layer forward or backward.');
  }
  function exactDelta(items,axis,delta){
    if(!Number.isFinite(delta))fail('Derived movement exceeds numeric bounds.');if(delta===0)return 0;
    let min=-Infinity,max=Infinity;
    for(const item of items){const extent=M.objectExtent(item);let low=Math.ceil((1+extent)*100),high=Math.floor((99-extent)*100);if(low/100-extent<1)low++;if(high/100+extent>99)high--;min=Math.max(min,low-q(item[axis]));max=Math.min(max,high-q(item[axis]));}
    if(delta<min||delta>max)fail('All members of every arrangement unit must fit the complete requested movement.');return delta;
  }
  function writeUnit(document,unit,axis,desired){const set=new Set(unit.memberIds),items=document.scene.objects.filter(item=>set.has(item.id)),delta=exactDelta(items,axis,q(desired));if(delta!==0)for(const item of items)item[axis]=(q(item[axis])+delta)/100;}
  function arrangeUnits(before,units,command,viewport){
    const document=M.canonicalScene(before),bounds=measuredUnits(before,units,viewport);
    if(command.type==='align'){
      const axis=['left','right','horizontal'].includes(command.mode)?'x':'y',center=['horizontal','vertical'].includes(command.mode),leading=['left','top'].includes(command.mode),pick=interval=>center?midpoint(interval):interval[leading?0:1],edges=bounds.map(bound=>pick(bound[axis]));
      if(spread(edges)>0.01+EPS){
        const target=pick(union(bounds,axis));bounds.forEach((bound,index)=>writeUnit(document,bound,axis,target-edges[index]));
        const final=measuredUnits(M.canonicalScene(document),units,viewport).map(bound=>pick(bound[axis]));
        if(spread(final)>0.01+EPS||final.some(edge=>Math.abs(edge-target)>0.005+EPS))fail('Arrangement-unit alignment does not fit at the current coordinate precision.');
      }
    }else{
      const axis=command.axis,ordered=bounds.slice().sort((a,b)=>a[axis][0]-b[axis][0]||a.index-b.index),gaps=list=>list.slice(1).map((bound,index)=>bound[axis][0]-list[index][axis][1]),oldGaps=gaps(ordered);
      if(!(oldGaps.every(gap=>gap>=-EPS)&&spread(oldGaps)<=0.02+EPS)){
        const [low,high]=union(bounds,axis),widths=ordered.map(bound=>bound[axis][1]-bound[axis][0]);let gap=(high-low-widths.reduce((sum,width)=>sum+width,0))/(units.length-1);
        if(gap<-EPS)fail('Equal group bounds gaps do not fit inside the selected outer span; internal empty space counts.');if(Math.abs(gap)<=EPS)gap=0;
        let edge=low;ordered.forEach((bound,index)=>{writeUnit(document,bound,axis,edge-bound[axis][0]);edge+=widths[index]+gap;});
        const final=measuredUnits(M.canonicalScene(document),units,viewport),lookup=new Map(final.map(bound=>[bound.id,bound])),finalGaps=gaps(ordered.map(bound=>lookup.get(bound.id))),span=union(final,axis);
        if(finalGaps.some(gap=>gap<-EPS)||spread(finalGaps)>0.02+EPS||Math.abs(span[0]-low)>0.005+EPS||Math.abs(span[1]-high)>0.005+EPS)fail('Equal arrangement-unit gaps do not fit at the current coordinate precision.');
      }
    }return document;
  }
  function reservationSets(document,groups,history){
    const retained=canonicalHistory(history===undefined?emptyHistory():history),items=new Set(document.scene.objects.map(item=>item.id)),metadata=new Set(groups.map(group=>group.id));
    for(const entry of retained.undo.concat(retained.redo))for(const side of ['before','after']){for(const item of entry[side].scene.objects)items.add(item.id);for(const group of entry[side+'Groups'])metadata.add(group.id);}
    return {items,groups:metadata};
  }
  function allocate(reserved,count,kind){
    const result=[],limit=kind==='object'?ITEM_SEARCH_LIMIT:GROUP_SEARCH_LIMIT;let candidate=1;
    for(let index=0;index<count;index++){
      while(candidate<=limit&&reserved.has(kind+'-'+candidate))candidate++;
      if(candidate>limit)fail('Retained arrangement identities exceed the bounded allocation budget.','ID_ALLOCATION_FAILED');
      const id=kind+'-'+candidate;reserved.add(id);result.push(id);candidate++;
    }return result;
  }
  function finish(before,state,document,groups,selection,kind,policy){
    const candidate=M.canonicalScene(document),metadata=checkedGroups(candidate,groups),selected=checkedSelection(candidate,selection,metadata);
    if(!policy.allows(candidate))fail('Unlock protected items before changing their stored data.','LOCKED');
    const changedScene=bytes(before)!==bytes(candidate),changedGroups=bytes(state.groups)!==bytes(metadata);
    return {document:candidate,groups:metadata,selection:selected,changed:changedScene||changedGroups,changedScene,changedGroups,kind,targetIds:state.selection.ids.slice(),targetGroupIds:unitsFor(before,state.selection,state.groups).filter(unit=>unit.groupId!==null).map(unit=>unit.groupId)};
  }
  function plan(value,current,command,options={}){
    const before=M.canonicalScene(value),state=session(before,current);checkCommand(command);record(options,['locks','viewport','history'],[],'Arrangement options');
    const selected=state.selection,units=unitsFor(before,selected,state.groups),selectedGroups=units.filter(unit=>unit.groupId!==null),policy=lockPolicy(before,options.locks);
    if(command.type!=='ungroup'&&!selected.ids.length)fail('Select at least one item to arrange.');
    if(command.type==='align'&&units.length<2)fail('Select at least two arrangement units to align.');
    if(command.type==='distribute'&&units.length<3)fail('Select at least three arrangement units for equal gaps.');
    if(!['group','ungroup','duplicate'].includes(command.type))forbidLocked(policy,selected.ids);
    let document=before,groups=state.groups,nextSelection=selected;
    if(command.type==='group'){
      if(selectedGroups.length){if(units.length!==1)fail('Ungroup selected groups before combining them.');}
      else{
        if(selected.ids.length<2)fail('Select at least two ungrouped items to group.');
        if(groups.length>=MAX_GROUPS)fail('The session is limited to six disjoint groups.');
        const reserved=reservationSets(before,groups,options.history),id=allocate(reserved.groups,1,'group')[0];groups=groups.concat({id,memberIds:selected.ids.slice()});
      }
    }else if(command.type==='ungroup'){
      const targets=new Set(selectedGroups.map(unit=>unit.groupId));groups=groups.filter(group=>!targets.has(group.id));
    }else if(command.type==='duplicate'){
      if(before.scene.objects.length+selected.ids.length>M.MAX_OBJECTS)fail('Duplicating the entire selection would exceed the 12-item limit.');
      if(groups.length+selectedGroups.length>MAX_GROUPS)fail('Duplicating the selected groups would exceed the six-group limit.');
      const reserved=reservationSets(before,groups,options.history),newIds=allocate(reserved.items,selected.ids.length,'object'),newGroupIds=allocate(reserved.groups,selectedGroups.length,'group'),mapping=new Map(selected.ids.map((id,index)=>[id,newIds[index]])),set=new Set(selected.ids);
      document=M.canonicalScene(before);document.scene.objects.push(...before.scene.objects.filter(item=>set.has(item.id)).map(item=>({...item,id:mapping.get(item.id)})));
      groups=groups.concat(selectedGroups.map((unit,index)=>({id:newGroupIds[index],memberIds:unit.memberIds.map(id=>mapping.get(id))})));
      nextSelection={ids:newIds,primaryId:mapping.get(selected.primaryId)};
    }else if((command.type==='align'||command.type==='distribute')&&selectedGroups.length){document=arrangeUnits(before,units,command,options.viewport);}
    else{
      const result=S.plan(before,selected,command,{locks:options.locks,viewport:options.viewport});document=result.document;nextSelection=result.selection;
      if(command.type==='delete'){
        const targets=new Set(selectedGroups.map(unit=>unit.groupId));groups=groups.filter(group=>!targets.has(group.id));
        if(nextSelection.primaryId!==null)nextSelection=selectionFor(document,unitMembers(groups,nextSelection.primaryId),nextSelection.primaryId);
      }
    }
    return finish(before,state,document,groups,nextSelection,command.type,policy);
  }
  function deepFreeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(deepFreeze);Object.freeze(value);}return value;}
  function generation(value){if(!Number.isSafeInteger(value)||value<0)fail('Scene generation must be a nonnegative safe integer.');return value;}
  const endpoint=(document,groups)=>bytes([document,groups]);
  function checkedTransaction(value){
    if(value&&typeof value==='object'&&transactions.has(value))return value;
    const fields=['before','after','beforeGroups','afterGroups','beforeSelection','afterSelection','generation','kind','targetIds','targetGroupIds'];record(value,fields,fields,'Arrangement transaction');
    const before=M.canonicalScene(value.before),after=M.canonicalScene(value.after),beforeGroups=checkedGroups(before,value.beforeGroups),afterGroups=checkedGroups(after,value.afterGroups),beforeSelection=checkedSelection(before,value.beforeSelection,beforeGroups),afterSelection=checkedSelection(after,value.afterSelection,afterGroups),targetIds=ids(value.targetIds),targetGroupIds=ids(value.targetGroupIds,'group',MAX_GROUPS);
    const changedScene=bytes(before)!==bytes(after),changedGroups=bytes(beforeGroups)!==bytes(afterGroups),expectedGroups=unitsFor(before,beforeSelection,beforeGroups).filter(unit=>unit.groupId!==null).map(unit=>unit.groupId);
    if(!KINDS.includes(value.kind)||!targetIds.length||!(changedScene||changedGroups)||bytes(targetIds)!==bytes(beforeSelection.ids)||bytes(targetGroupIds)!==bytes(expectedGroups))fail('Arrangement transaction must describe changed whole-state endpoints and its exact selected original targets.');
    if(['group','ungroup'].includes(value.kind)?changedScene||!changedGroups:!changedScene)fail('Metadata-only and document-changing transactions must retain their command semantics.');
    if(!['group','ungroup','duplicate','delete'].includes(value.kind)&&changedGroups)fail('This arrangement cannot change group membership.');
    if(['group','ungroup'].includes(value.kind)){
      if(bytes(beforeSelection)!==bytes(afterSelection))fail('Metadata-only grouping must preserve the exact selection and primary.');
      if(value.kind==='group'){
        const added=afterGroups.filter(group=>!beforeGroups.some(prior=>prior.id===group.id));
        if(expectedGroups.length||targetIds.length<2||added.length!==1||bytes(added[0].memberIds)!==bytes(targetIds.slice().sort(natural))||bytes(afterGroups.filter(group=>group.id!==added[0].id))!==bytes(beforeGroups))fail('Group history must add exactly one new group containing the selected ungrouped items.');
      }else if(!expectedGroups.length||bytes(afterGroups)!==bytes(beforeGroups.filter(group=>!expectedGroups.includes(group.id))))fail('Ungroup history must remove exactly the selected groups.');
    }
    const entry=deepFreeze({before,after,beforeGroups,afterGroups,beforeSelection,afterSelection,generation:generation(value.generation),kind:value.kind,targetIds,targetGroupIds});transactions.add(entry);return entry;
  }
  function emptyHistory(){return Object.freeze({undo:Object.freeze([]),redo:Object.freeze([])});}
  function canonicalHistory(value){
    record(value,['undo','redo'],['undo','redo'],'Arrangement history');array(value.undo,HISTORY_LIMIT,'Undo history');array(value.redo,HISTORY_LIMIT,'Redo history');
    if(value.undo.length+value.redo.length>HISTORY_LIMIT)fail('Arrangement history is limited to 40 total transactions.');
    return Object.freeze({undo:Object.freeze(value.undo.map(checkedTransaction)),redo:Object.freeze(value.redo.map(checkedTransaction))});
  }
  function makeTransaction(value,current,result,sceneGeneration){
    generation(sceneGeneration);const before=M.canonicalScene(value),state=session(before,current),fields=['document','groups','selection','changed','changedScene','changedGroups','kind','targetIds','targetGroupIds'];record(result,fields,fields,'Arrangement plan');
    const after=M.canonicalScene(result.document),afterGroups=checkedGroups(after,result.groups);checkedSelection(after,result.selection,afterGroups);
    const changedScene=bytes(before)!==bytes(after),changedGroups=bytes(state.groups)!==bytes(afterGroups);
    if(typeof result.changed!=='boolean'||result.changed!==Boolean(changedScene||changedGroups)||result.changedScene!==changedScene||result.changedGroups!==changedGroups||!KINDS.includes(result.kind))fail('Arrangement plan change status is inconsistent.');
    const expectedGroups=unitsFor(before,state.selection,state.groups).filter(unit=>unit.groupId!==null).map(unit=>unit.groupId);
    if(bytes(ids(result.targetIds))!==bytes(state.selection.ids)||bytes(ids(result.targetGroupIds,'group',MAX_GROUPS))!==bytes(expectedGroups))fail('Arrangement plan targets must match the original selection.');
    if(!result.changed)return null;
    return checkedTransaction({before,after,beforeGroups:state.groups,afterGroups,beforeSelection:state.selection,afterSelection:result.selection,generation:sceneGeneration,kind:result.kind,targetIds:result.targetIds,targetGroupIds:result.targetGroupIds});
  }
  function recordHistory(value,entry){
    const history=canonicalHistory(value);if(entry===null)return history;const next=checkedTransaction(entry),expected=endpoint(next.before,next.beforeGroups);
    if(history.undo.length){const prior=history.undo[history.undo.length-1];if(endpoint(prior.after,prior.afterGroups)!==expected)fail('The new arrangement does not match the retained document and groups.','HISTORY_ENDPOINT_MISMATCH');}
    if(history.redo.length){const prior=history.redo[history.redo.length-1];if(endpoint(prior.before,prior.beforeGroups)!==expected)fail('The new arrangement does not match the retained document and groups.','HISTORY_ENDPOINT_MISMATCH');}
    if(history.undo.concat(history.redo).some(item=>item.generation!==next.generation))fail('The scene generation has changed.','HISTORY_ENDPOINT_MISMATCH');
    return Object.freeze({undo:Object.freeze(history.undo.concat(next).slice(-HISTORY_LIMIT)),redo:Object.freeze([])});
  }
  function planHistory(value,current,history,direction,sceneGeneration,options={}){
    const document=M.canonicalScene(value),state=session(document,current),stacks=canonicalHistory(history);generation(sceneGeneration);record(options,['locks'],[],'Arrangement history options');
    if(!['undo','redo'].includes(direction))fail('Choose Undo arrangement or Redo arrangement.');
    const policy=lockPolicy(document,options.locks),source=stacks[direction],entry=source[source.length-1];
    if(!entry)return {document,groups:state.groups,selection:state.selection,changed:false,changedScene:false,changedGroups:false,kind:direction,targetIds:[],targetGroupIds:[],history:stacks};
    const from=direction==='undo'?'after':'before',to=direction==='undo'?'before':'after';
    if(entry.generation!==sceneGeneration||endpoint(document,state.groups)!==endpoint(entry[from],entry[from+'Groups']))fail('The draft document or groups no longer match this arrangement history; discard the incompatible draft history.','HISTORY_ENDPOINT_MISMATCH');
    if(entry.kind==='reorder')forbidLocked(policy,entry.targetIds);
    const candidate=M.canonicalScene(entry[to]),groups=checkedGroups(candidate,entry[to+'Groups']),selection=checkedSelection(candidate,entry[to+'Selection'],groups);
    if(!policy.allows(candidate))fail('Unlock protected items before restoring this arrangement.','LOCKED');
    const undo=direction==='undo'?stacks.undo.slice(0,-1):stacks.undo.concat(entry),redo=direction==='redo'?stacks.redo.slice(0,-1):stacks.redo.concat(entry);
    return {document:candidate,groups,selection,changed:true,changedScene:bytes(document)!==bytes(candidate),changedGroups:bytes(state.groups)!==bytes(groups),kind:direction,targetIds:entry.targetIds.slice(),targetGroupIds:entry.targetGroupIds.slice(),history:Object.freeze({undo:Object.freeze(undo),redo:Object.freeze(redo)})};
  }
  return Object.freeze({EPS,HISTORY_LIMIT,MAX_GROUPS,KINDS,ALIGNMENTS,canonicalGroups,canonicalSelection,reduceSelection,selectionUnits,arrangementUnitBounds,plan,planArrangement:plan,emptyHistory,canonicalHistory,makeTransaction,recordHistory,planHistory});
}));
