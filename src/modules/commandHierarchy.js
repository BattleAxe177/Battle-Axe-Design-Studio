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

export function normalizeCommandHierarchy(scenario){
  if(!scenario?.commands)return scenario;
  const idx=commandIndex(scenario);
  for(const [side,commands] of Object.entries(scenario.commands)){
    for(const c of commands||[]){
      c.units=Array.isArray(c.units)?c.units:[];
      c.echelon=c.echelon||c.hierarchyLevel||'command';
      if(c.parentCommandId&&!idx.has(c.parentCommandId))delete c.parentCommandId;
      if(c.parentCommandId&&idx.get(c.parentCommandId)?.side!==side)delete c.parentCommandId;
    }
  }
  return scenario;
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

export function descendantsOf(commandId,scenario,{includeSelf=true}={}){
  const idx=commandIndex(scenario),out=[];
  for(const c of idx.values()){
    const parents=parentMapFromScenario(scenario);
    if((includeSelf&&c.id===commandId)||commandHasAuthority(commandId,c.id,parents))out.push(c);
  }
  return out;
}

export function commandDepth(commandId,parentById){
  return Math.max(0,commandAncestors(commandId,parentById).length-1);
}
