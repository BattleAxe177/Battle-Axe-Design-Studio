import { SIDE_KEYS } from './scenarioSides.js?v=0.6.9.1';

export const SCENARIO_PROPOSAL_FORMAT='battle-axe-scenario-proposal';
export const SCENARIO_PROPOSAL_VERSION='1.0';

const arrays=['forces','ruleOpportunities','terrain','deployment','victory','unresolved','sources'];
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const text=x=>String(x??'').trim();
const id=(prefix,n)=>`${prefix}-${n+1}`;
const unresolvedValue=value=>/^(?:unresolved|unknown|not known|not determined|tbd|to be determined|n\/a|-)$/i.test(text(value));

function safeMetadata(metadata={}){
  const gameLength=Number(metadata.gameLength),table=metadata.tableSize,tableText=object(table)&&Number(table.width)>0&&Number(table.height)>0?`${table.width} × ${table.height}${table.units?` ${table.units}`:''}`:text(table);
  return{
    title:unresolvedValue(metadata.title)?'':text(metadata.title),
    date:unresolvedValue(metadata.date)?'':text(metadata.date),
    location:unresolvedValue(metadata.location)?'':text(metadata.location),
    status:unresolvedValue(metadata.status)?'':text(metadata.status),
    gameLength:Number.isFinite(gameLength)&&gameLength>0?String(Math.round(gameLength)):'',
    tableSize:unresolvedValue(tableText)?'':tableText
  };
}

export function createScenarioProposalTemplate(){return{format:SCENARIO_PROPOSAL_FORMAT,version:SCENARIO_PROPOSAL_VERSION,scenarioRevision:'current-local',metadata:{title:'',date:'',location:''},sideLabels:{sideA:'Side A',sideB:'Side B'},publication:{historical:{conciseSummary:'',narrative:''},battlefield:{conciseSummary:'',narrative:''},forceHistoryNotes:'',sourceDiscussion:'',designRationale:'',designerNotes:''},proposals:{forces:[],ruleOpportunities:[],terrain:[],deployment:[],victory:[],unresolved:[],sources:[]},notes:'',extensions:{}};}

export function validateScenarioProposal(input){
  const errors=[],warnings=[];
  if(!object(input))return{valid:false,errors:['Proposal must be a JSON object.'],warnings};
  if(input.format!==SCENARIO_PROPOSAL_FORMAT)errors.push(`format must be "${SCENARIO_PROPOSAL_FORMAT}".`);
  if(String(input.version||'')!==SCENARIO_PROPOSAL_VERSION)errors.push(`version must be "${SCENARIO_PROPOSAL_VERSION}".`);
  if(!object(input.proposals))errors.push('proposals must be an object.');
  for(const key of arrays)if(input.proposals?.[key]!=null&&!Array.isArray(input.proposals[key]))errors.push(`proposals.${key} must be an array.`);
  for(const [i,row] of (input.proposals?.forces||[]).entries()){
    if(!object(row))errors.push(`proposals.forces[${i}] must be an object.`);
    else if(row.side&&!SIDE_KEYS.includes(row.side))errors.push(`proposals.forces[${i}].side must be sideA or sideB.`);
  }
  for(const [i,row] of (input.proposals?.ruleOpportunities||[]).entries())if(!object(row)||!text(row.text||row.proposal))errors.push(`proposals.ruleOpportunities[${i}] needs text.`);
  const known=new Set(['format','version','scenarioRevision','metadata','sideLabels','publication','proposals','notes','extensions']);
  const unknown=Object.keys(input).filter(k=>!known.has(k));if(unknown.length)warnings.push(`Unrecognized top-level fields preserved in extensions: ${unknown.join(', ')}.`);
  return{valid:!errors.length,errors,warnings};
}

export function normalizeScenarioProposal(input){
  const check=validateScenarioProposal(input);if(!check.valid)throw new Error(check.errors.join(' '));
  const out=createScenarioProposalTemplate();
  out.scenarioRevision=text(input.scenarioRevision)||out.scenarioRevision;
  out.metadata=object(input.metadata)?structuredClone(input.metadata):{};
  out.sideLabels={...out.sideLabels,...(object(input.sideLabels)?input.sideLabels:{})};
  out.publication={...out.publication,...(object(input.publication)?structuredClone(input.publication):{}),historical:{...out.publication.historical,...(input.publication?.historical||{})},battlefield:{...out.publication.battlefield,...(input.publication?.battlefield||{})}};
  for(const key of arrays)out.proposals[key]=(input.proposals?.[key]||[]).map((row,n)=>object(row)?{id:row.id||id(key,n),status:row.status||'proposed',...structuredClone(row)}:{id:id(key,n),status:'proposed',text:String(row)});
  out.notes=text(input.notes);out.extensions={...(object(input.extensions)?structuredClone(input.extensions):{})};
  for(const [key,value] of Object.entries(input))if(!['format','version','scenarioRevision','metadata','sideLabels','publication','proposals','notes','extensions'].includes(key))out.extensions[key]=structuredClone(value);
  return{proposal:out,warnings:check.warnings};
}

export function importScenarioProposal(scenario,input,{sourceName='Scenario Proposal'}={}){
  const {proposal,warnings}=normalizeScenarioProposal(input);
  scenario.proposals||=createScenarioProposalTemplate().proposals;scenario.publication||=createScenarioProposalTemplate().publication;
  // Imported narrative is proposal material. The review form may prefill from it, but
  // canonical/publication state changes only when the designer saves reviewed fields.
  for(const key of arrays){scenario.proposals[key]||=[];for(const row of proposal.proposals[key]){const tagged={...row,sourceName,proposalVersion:proposal.version};const found=scenario.proposals[key].findIndex(x=>x.id===tagged.id);if(found>=0)scenario.proposals[key][found]=tagged;else scenario.proposals[key].push(tagged);}}
  scenario.proposalImports||=[];scenario.proposalImports.push({sourceName,format:proposal.format,version:proposal.version,scenarioRevision:proposal.scenarioRevision,importedAt:new Date().toISOString(),metadata:proposal.metadata,sideLabels:proposal.sideLabels,publication:proposal.publication,notes:proposal.notes,extensions:proposal.extensions});
  scenario.proposalReview={sourceName,metadata:safeMetadata(proposal.metadata),sideLabels:structuredClone(proposal.sideLabels||{}),publication:structuredClone(proposal.publication||{}),notes:proposal.notes};
  return{proposal,warnings,counts:Object.fromEntries(arrays.map(k=>[k,proposal.proposals[k].length]))};
}

export function proposalReviewDefaults(scenario){
  const imports=scenario?.proposalImports||[],latest=scenario?.proposalReview||imports[imports.length-1];
  if(!latest)return null;
  const labels={};for(const side of SIDE_KEYS){const value=text(latest.sideLabels?.[side]);labels[side]=/^side\s+[ab]$/i.test(value)?'':value;}
  return{sourceName:latest.sourceName||'Imported proposal',metadata:safeMetadata(latest.metadata),sideLabels:labels,publication:structuredClone(latest.publication||{}),notes:text(latest.notes)};
}

export function parseScenarioProposalText(raw){
  const value=text(raw);if(!value)return null;
  try{const parsed=JSON.parse(value);if(parsed?.format===SCENARIO_PROPOSAL_FORMAT)return parsed;}catch{}
  const marker=/---BEGIN BATTLE AXE SCENARIO PROPOSAL---([\s\S]*?)---END BATTLE AXE SCENARIO PROPOSAL---/i.exec(value);
  if(marker)return JSON.parse(marker[1].trim());
  return null;
}

export function classifyScenarioIntake(raw){
  const value=text(raw),proposal=parseScenarioProposalText(value);if(proposal)return{kind:'scenario-proposal',proposal};
  const explicit=/^(?:#{1,6}\s*)?(?:battle axe scenario draft|historical situation|battlefield|deployment|victory conditions?|scenario rules?|(?:.+\s+)?(?:army|forces|order of battle))\s*:?\s*$/im.test(value);
  return explicit?{kind:'structured-source',text:value}:{kind:'narrative-evidence',text:value};
}

export function acceptedScenarioRules(scenario){
  if(Array.isArray(scenario?.scenarioRules)&&scenario.scenarioRules.length)return scenario.scenarioRules.filter(x=>x.status!=='removed');
  return(scenario?.suggestions||[]).filter(x=>x.status==='accepted').map(x=>({id:x.id,title:x.title,text:x.proposal,engineStatus:x.engineStatus||'tabletop',engineText:x.engineText||'',overrides:x.overrides||'',provenance:x.provenance||'legacy'}));
}
