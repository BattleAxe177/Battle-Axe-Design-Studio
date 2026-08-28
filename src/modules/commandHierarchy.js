/**
 * Generic command hierarchy utilities shared by all periods.
 * The engine does not care whether an echelon is called army/corps/division/brigade,
 * battle/wing/vanguard, or a scenario-specific label. Parent/child relationships are authoritative.
 */
export function allScenarioCommands(scenario){
  return Object.entries(scenario?.commands||{}).flatMap(([side,commands])=>(commands||[]).map(command=>({side,...command})));
}

export function commandIndex(scenario){
  return new Map(allScenarioCommands(scenario).map(c=>[c.id,c]));
}

export function commandAncestors(commandId,parentById){
  const out=[];let id=commandId,guard=0;
  while(id&&guard++<64){out.push(id);id=parentById?.get?.(id)||parentById?.[id]||null;}
  return out;
}

export function commandHasAuthority(commanderCommandId,unitCommandId,parentById){
  if(!commanderCommandId||!unitCommandId)return false;
  return commandAncestors(unitCommandId,parentById).includes(commanderCommandId);
}

export function parentMapFromScenario(scenario){
  const map=new Map();
  for(const c of allScenarioCommands(scenario))map.set(c.id,c.parentCommandId||null);
  return map;
}

export function commandDepth(commandId,parentById){
  return Math.max(0,commandAncestors(commandId,parentById).length-1);
}

export function wouldCreateCommandCycle(scenario,commandId,parentCommandId){
  if(!commandId||!parentCommandId)return false;
  if(commandId===parentCommandId)return true;
  const parents=parentMapFromScenario(scenario);
  let id=parentCommandId,guard=0;
  while(id&&guard++<128){
    if(id===commandId)return true;
    id=parents.get(id)||null;
  }
  return guard>=128;
}

export function validateCommandHierarchy(scenario){
  const issues=[],idx=commandIndex(scenario),seenIds=new Set();
  for(const [side,commands] of Object.entries(scenario?.commands||{})){
    for(const c of commands||[]){
      if(!c?.id){issues.push({type:'missing-id',side,commandId:null,message:`${c?.name||'Unnamed command'} has no command ID.`});continue;}
      if(seenIds.has(c.id))issues.push({type:'duplicate-id',side,commandId:c.id,message:`Command ID ${c.id} is duplicated.`});
      seenIds.add(c.id);
      if(c.parentCommandId){
        const parent=idx.get(c.parentCommandId);
        if(!parent)issues.push({type:'orphan-parent',side,commandId:c.id,message:`${c.name||c.id} refers to missing parent command ${c.parentCommandId}.`});
        else if(parent.side!==side)issues.push({type:'cross-side-parent',side,commandId:c.id,message:`${c.name||c.id} cannot be subordinate to a command on the other side.`});
        else if(wouldCreateCommandCycle(scenario,c.id,c.parentCommandId))issues.push({type:'cycle',side,commandId:c.id,message:`${c.name||c.id} creates a circular command hierarchy.`});
      }
    }
  }
  return issues;
}

export function normalizeCommandHierarchy(scenario){
  if(!scenario?.commands)return scenario;
  const idx=commandIndex(scenario);
  for(const [side,commands] of Object.entries(scenario.commands)){
    for(const c of commands||[]){
      c.units=Array.isArray(c.units)?c.units:[];
      const type=c.commandType||c.echelon||c.hierarchyLevel||'command';
      c.commandType=type;
      c.echelon=type; // legacy alias retained for older exports/readers.
      if(c.parentCommandId&&!idx.has(c.parentCommandId))delete c.parentCommandId;
      if(c.parentCommandId&&idx.get(c.parentCommandId)?.side!==side)delete c.parentCommandId;
      if(c.parentCommandId&&wouldCreateCommandCycle(scenario,c.id,c.parentCommandId))delete c.parentCommandId;
    }
  }
  return scenario;
}

export function reparentCommand(scenario,side,commandId,parentCommandId=null){
  const commands=scenario?.commands?.[side]||[],command=commands.find(c=>c.id===commandId);
  if(!command)throw new Error('Command not found.');
  if(parentCommandId){
    const parent=commands.find(c=>c.id===parentCommandId);
    if(!parent)throw new Error('Parent command must be on the same side.');
    if(wouldCreateCommandCycle(scenario,commandId,parentCommandId))throw new Error('A command cannot be dropped onto itself or one of its descendants.');
  }
  command.parentCommandId=parentCommandId||null;
  normalizeCommandHierarchy(scenario);
  return command;
}

export function descendantsOf(commandId,scenario,{includeSelf=true}={}){
  const idx=commandIndex(scenario),out=[],parents=parentMapFromScenario(scenario);
  for(const c of idx.values())if((includeSelf&&c.id===commandId)||commandHasAuthority(commandId,c.id,parents))out.push(c);
  return out;
}

/**
 * Removes a command. `promote` keeps subordinate commands by moving them to the removed
 * command's parent. `subtree` removes all descendant commands. Direct units of removed commands
 * are removed with their command; callers should explicitly confirm destructive use in the UI.
 */
export function removeCommand(scenario,side,commandId,{mode='promote'}={}){
  const commands=scenario?.commands?.[side]||[],target=commands.find(c=>c.id===commandId);
  if(!target)return{removedCommandIds:[],removedUnitIds:[]};
  const removeIds=new Set([commandId]);
  if(mode==='subtree')for(const c of descendantsOf(commandId,scenario,{includeSelf:false}))if(c.side===side)removeIds.add(c.id);
  const removedUnitIds=[];
  for(const c of commands)if(removeIds.has(c.id))for(const u of c.units||[])removedUnitIds.push(u.id);
  if(mode!=='subtree')for(const c of commands)if(c.parentCommandId===commandId)c.parentCommandId=target.parentCommandId||null;
  scenario.commands[side]=commands.filter(c=>!removeIds.has(c.id));
  normalizeCommandHierarchy(scenario);
  return{removedCommandIds:[...removeIds],removedUnitIds};
}
