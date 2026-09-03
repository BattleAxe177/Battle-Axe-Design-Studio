export const SIDE_KEYS=['sideA','sideB'];
export const LEGACY_SIDE_MAP={French:'sideA',Imperial:'sideB'};
const GENERIC_LABELS={sideA:'Side A',sideB:'Side B'};

export function canonicalSideId(value){
  const raw=String(value||'').trim();
  if(SIDE_KEYS.includes(raw))return raw;
  if(/^side\s*a$/i.test(raw)||/^french$/i.test(raw))return'sideA';
  if(/^side\s*b$/i.test(raw)||/^imperial(?:ist)?$/i.test(raw))return'sideB';
  return null;
}

function migrateSideRecord(record={}){
  const out={};
  for(const [key,value] of Object.entries(record||{})){const side=canonicalSideId(key)||key;if(SIDE_KEYS.includes(side)&&out[side]==null)out[side]=value;else if(!SIDE_KEYS.includes(side))out[key]=value;}
  return out;
}

function ensureAliasShell(scenario){
  const labels=migrateSideRecord(scenario.sideLabels||{});
  scenario.sideLabels={...GENERIC_LABELS,...labels};
  scenario.sides={
    sideA:{color:'#2376BD',...(scenario.sides?.sideA||scenario.sides?.French||{}),id:'sideA',label:scenario.sideLabels.sideA},
    sideB:{color:'#A93A32',...(scenario.sides?.sideB||scenario.sides?.Imperial||{}),id:'sideB',label:scenario.sideLabels.sideB}
  };
  scenario.sideLabels.sideA=scenario.sides.sideA.label||scenario.sideLabels.sideA;
  scenario.sideLabels.sideB=scenario.sides.sideB.label||scenario.sideLabels.sideB;
  const aliases={};for(const [key,value] of Object.entries(scenario.sideAliases||{})){const side=canonicalSideId(value);if(side)aliases[key]=side;}scenario.sideAliases=aliases;
}

export function sideLabel(scenario,side){const id=canonicalSideId(side)||side;return scenario?.sides?.[id]?.label||scenario?.sideLabels?.[id]||GENERIC_LABELS[id]||side;}

export function sideForFaction(scenario,faction,{assign=false}={}){
  ensureAliasShell(scenario);const raw=String(faction||'').trim(),lower=raw.toLowerCase();
  if(!raw||/^unknown$/i.test(raw)||/^garrison(?:\s*\/\s*other)?$/i.test(raw))return null;
  if(SIDE_KEYS.includes(raw))return raw;
  const existing=scenario.sideAliases[raw]||scenario.sideAliases[lower];if(SIDE_KEYS.includes(existing))return existing;
  for(const side of SIDE_KEYS)if(String(sideLabel(scenario,side)).toLowerCase()===lower)return side;
  if(/^side\s*a$/i.test(raw))return'sideA';if(/^side\s*b$/i.test(raw))return'sideB';
  if(/^french$/i.test(raw)){scenario.sideAliases[raw]=scenario.sideAliases[lower]='sideA';if(sideLabel(scenario,'sideA')==='Side A')scenario.sides.sideA.label=scenario.sideLabels.sideA='French';return'sideA';}
  if(/^imperial(?:ist)?$/i.test(raw)){scenario.sideAliases[raw]=scenario.sideAliases[lower]='sideB';if(sideLabel(scenario,'sideB')==='Side B')scenario.sides.sideB.label=scenario.sideLabels.sideB='Imperial';return'sideB';}
  if(!assign)return null;
  const assigned=new Set(Object.values(scenario.sideAliases));const side=SIDE_KEYS.find(x=>!assigned.has(x)&&sideLabel(scenario,x)===GENERIC_LABELS[x])||SIDE_KEYS.find(x=>!assigned.has(x))||'sideA';
  scenario.sideAliases[raw]=scenario.sideAliases[lower]=side;if(sideLabel(scenario,side)===GENERIC_LABELS[side])scenario.sides[side].label=scenario.sideLabels[side]=raw;return side;
}

export function registerEvidenceSides(scenario,forces=[],commands=[]){
  ensureAliasShell(scenario);const factions=[];for(const x of [...forces,...commands]){const f=String(x?.faction||'').trim();if(!f||/^unknown$/i.test(f)||/^garrison(?:\s*\/\s*other)?$/i.test(f)||factions.some(v=>v.toLowerCase()===f.toLowerCase()))continue;factions.push(f);}for(const f of factions)sideForFaction(scenario,f,{assign:true});return scenario.sideLabels;
}

export function ensureTwoSideModel(scenario){
  if(!scenario)return scenario;ensureAliasShell(scenario);const raw=scenario.commands||{},next={sideA:[...(raw.sideA||[]),...(raw.French||[])],sideB:[...(raw.sideB||[]),...(raw.Imperial||[])]};
  if((raw.French||[]).length){scenario.sideAliases.French=scenario.sideAliases.french='sideA';if(sideLabel(scenario,'sideA')==='Side A')scenario.sides.sideA.label=scenario.sideLabels.sideA='French';}
  if((raw.Imperial||[]).length){scenario.sideAliases.Imperial=scenario.sideAliases.imperial='sideB';if(sideLabel(scenario,'sideB')==='Side B')scenario.sides.sideB.label=scenario.sideLabels.sideB='Imperial';}
  for(const faction of Object.keys(raw).filter(k=>!['sideA','sideB','French','Imperial','Garrison'].includes(k))){const side=sideForFaction(scenario,faction,{assign:true})||'sideA';next[side].push(...(raw[faction]||[]));}
  if(raw.Garrison?.length){next.sideB.push(...raw.Garrison.map(c=>({...c,forceRole:c.forceRole||'garrison',legacySide:'Garrison',sideAssignmentUnresolved:true})));scenario.unresolved=[...new Set([...(scenario.unresolved||[]),'Legacy Garrison / Other command migrated to Side B; verify its side assignment.'])];}
  for(const side of SIDE_KEYS)for(const command of next[side]){command.side=side;for(const unit of command.units||[])unit.side=side;}
  scenario.commands=next;scenario.sideLabels={sideA:sideLabel(scenario,'sideA'),sideB:sideLabel(scenario,'sideB')};scenario.sides.sideA.label=scenario.sideLabels.sideA;scenario.sides.sideB.label=scenario.sideLabels.sideB;return scenario;
}
