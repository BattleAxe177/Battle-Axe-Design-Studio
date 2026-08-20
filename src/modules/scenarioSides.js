export const SIDE_KEYS=['French','Imperial'];
const GENERIC_LABELS={French:'Side A',Imperial:'Side B'};

function ensureAliasShell(scenario){
  if(!scenario.sideLabels)scenario.sideLabels={...GENERIC_LABELS};
  else scenario.sideLabels={...GENERIC_LABELS,...scenario.sideLabels};
  if(!scenario.sideAliases)scenario.sideAliases={};
}

export function sideLabel(scenario,side){
  return scenario?.sideLabels?.[side]||GENERIC_LABELS[side]||side;
}

export function sideForFaction(scenario,faction,{assign=false}={}){
  ensureAliasShell(scenario);
  const raw=String(faction||'').trim();
  if(!raw||/^unknown$/i.test(raw)||/^garrison(?:\s*\/\s*other)?$/i.test(raw))return null;
  if(/^french$/i.test(raw)){
    scenario.sideAliases[raw]=scenario.sideAliases[raw.toLowerCase()]='French';
    if(!scenario.sideLabels.French||scenario.sideLabels.French==='Side A')scenario.sideLabels.French='French';
    return 'French';
  }
  if(/^imperial(?:ist)?$/i.test(raw)){
    scenario.sideAliases[raw]=scenario.sideAliases[raw.toLowerCase()]='Imperial';
    if(!scenario.sideLabels.Imperial||scenario.sideLabels.Imperial==='Side B')scenario.sideLabels.Imperial='Imperial';
    return 'Imperial';
  }
  const existing=scenario.sideAliases[raw]||scenario.sideAliases[raw.toLowerCase()];
  if(existing&&SIDE_KEYS.includes(existing))return existing;
  for(const side of SIDE_KEYS)if(String(scenario.sideLabels?.[side]||'').toLowerCase()===raw.toLowerCase())return side;
  if(/^side\s*a$/i.test(raw))return 'French';
  if(/^side\s*b$/i.test(raw))return 'Imperial';
  if(!assign)return null;
  const assigned=new Set(Object.values(scenario.sideAliases||{}));
  let side;
  if(scenario.sideLabels.French==='French'&&scenario.sideLabels.Imperial==='Side B')side='Imperial';
  else if(scenario.sideLabels.Imperial==='Imperial'&&scenario.sideLabels.French==='Side A')side='French';
  else if(!assigned.has('French')&&scenario.sideLabels.French==='Side A')side='French';
  else if(!assigned.has('Imperial')&&scenario.sideLabels.Imperial==='Side B')side='Imperial';
  else side=scenario.sideLabels.French==='Side A'?'French':'Imperial';
  scenario.sideAliases[raw]=side;scenario.sideAliases[raw.toLowerCase()]=side;
  if(scenario.sideLabels[side]===GENERIC_LABELS[side])scenario.sideLabels[side]=raw;
  return side;
}

export function registerEvidenceSides(scenario,forces=[],commands=[]){
  ensureAliasShell(scenario);
  const factions=[];
  for(const x of [...forces,...commands]){
    const f=String(x?.faction||'').trim();
    if(!f||/^unknown$/i.test(f)||/^garrison(?:\s*\/\s*other)?$/i.test(f)||factions.some(v=>v.toLowerCase()===f.toLowerCase()))continue;
    factions.push(f);
  }
  // Reserve explicit canonical armies first so source order cannot reverse them.
  for(const f of factions.filter(x=>/^french$/i.test(x)))sideForFaction(scenario,f,{assign:true});
  for(const f of factions.filter(x=>/^imperial(?:ist)?$/i.test(x)))sideForFaction(scenario,f,{assign:true});
  for(const f of factions.filter(x=>!/^french$|^imperial(?:ist)?$/i.test(x)))sideForFaction(scenario,f,{assign:true});
  return scenario.sideLabels;
}

export function ensureTwoSideModel(scenario){
  if(!scenario)return scenario;
  ensureAliasShell(scenario);
  const raw=scenario.commands||{};
  // Existing canonical command buckets reserve their side before arbitrary army labels are migrated.
  if((raw.French||[]).length)sideForFaction(scenario,'French',{assign:true});
  if((raw.Imperial||[]).length)sideForFaction(scenario,'Imperial',{assign:true});
  const next={French:[...(raw.French||[])],Imperial:[...(raw.Imperial||[])]};
  const extra=Object.keys(raw).filter(k=>!['French','Imperial','Garrison'].includes(k));
  for(const faction of extra){
    const side=sideForFaction(scenario,faction,{assign:true})||'French';
    next[side].push(...(raw[faction]||[]));
  }
  // Pre-v0.5.3 projects could store a third pseudo-side called Garrison. The old data did
  // not record which belligerent owned that column, so migrate it to Side B for backwards
  // compatibility and mark the assignment for designer review rather than treating it as a third side.
  if(raw.Garrison?.length){
    next.Imperial.push(...raw.Garrison.map(c=>({...c,forceRole:c.forceRole||'garrison',legacySide:'Garrison',sideAssignmentUnresolved:true})));
    scenario.unresolved=[...new Set([...(scenario.unresolved||[]),'Legacy Garrison / Other command migrated to Side B; verify its side assignment.'])];
  }
  scenario.commands=next;
  return scenario;
}
