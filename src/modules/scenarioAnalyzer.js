import { UNIT_LIBRARY } from '../data/scenarioData.js?v=0.4.0-alpha.1';

const clean=s=>(s||'').replace(/\r/g,'').replace(/[ \t]+/g,' ').trim();
const lines=t=>t.replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
const idify=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);

function section(text, heads, stops){
  const lower=text.toLowerCase(); let start=-1;
  for(const h of heads){const i=lower.indexOf(h.toLowerCase()); if(i>=0 && (start<0||i<start)) start=i+h.length;}
  if(start<0)return '';
  let end=text.length;
  for(const stop of stops){const i=lower.indexOf(stop.toLowerCase(),start); if(i>=0&&i<end)end=i;}
  return clean(text.slice(start,end));
}

function detectMetadata(text){
  const ls=lines(text); const joined=ls.join(' ');
  const title=ls.find(l=>/^battle of\b/i.test(l)) || ls.find(l=>/battle of/i.test(l)) || '';
  const date=(joined.match(/\b(?:\d{1,2}\s+[A-Z][a-z]+\s+\d{4}|[A-Z][a-z]+\s+\d{1,2},\s*\d{4})\b/)||[])[0]||'';
  const location=(joined.match(/Location:\s*([^\n]+?)(?=\s+(?:Table|Game Length|Status):|$)/i)||[])[1]||'';
  const turns=(joined.match(/(?:Game Length|Battle Length)\s*:\s*(\d+)\s*(?:Battle Axe\s*)?Turns?/i)||[])[1]||'';
  const table=(joined.match(/(?:Table(?: Size)?\s*:\s*)?([2468]'\s*[×xX]\s*[2468]'|\d{2}\s*[”"]?\s*[×xX]\s*\d{2}\s*[”"]?)/)||[])[1]||'';
  const status=(joined.match(/Status:\s*([^\n]+?)(?=\s+[A-Z][A-Za-z ]+:|$)/i)||[])[1]||'';
  return {title:clean(title),date,location:clean(location),gameLength:turns,status:clean(status),tableSize:table};
}

const PROFILE_PATTERNS = [
  ['Swiss Pikemen',/swiss/i],['Arquebusiers',/arquebus/i],['Landsknechts',/landsknecht/i],['Gendarmes',/gendar/i],
  ['Stradiots',/stradiot/i],['Cannon',/artillery|cannon|guns?\b/i],['Heavy Cavalry',/heavy cavalry|men-at-arms|men at arms/i],['Pikemen',/pike|pikemen/i]
];
function profileFor(text){for(const [p,re] of PROFILE_PATTERNS)if(re.test(text))return p; return null;}
function factionFor(text,current='Unknown'){
  if(/french|francis|alençon|black band|swiss/i.test(text))return 'French';
  if(/imperial|pescara|frundsberg|bourbon|lannoy|spanish|stradiot/i.test(text))return 'Imperial';
  if(/leyva|garrison|pavia garrison/i.test(text))return 'Garrison';
  return current;
}
function forceName(line, profile){
  const before=line.split(/[—–|-]{1,2}/)[0].trim();
  if(before.length>2 && before.length<80)return before.replace(/^[-•*\d.)\s]+/,'');
  return profile;
}
function detectForces(text){
  const out=[]; let current='Unknown';
  for(const raw of lines(text)){
    if(/^french(?: army)?$/i.test(raw)){current='French';continue}
    if(/^imperial(?: army)?$/i.test(raw)){current='Imperial';continue}
    if(/^(?:pavia )?garrison$/i.test(raw)){current='Garrison';continue}
    const profile=profileFor(raw); if(!profile)continue;
    const faction=factionFor(raw,current);
    if(faction==='Unknown' && raw.length>110) continue;
    const name=forceName(raw,profile);
    const key=`${faction}|${name}|${profile}`;
    if(!out.some(x=>x.key===key)) out.push({key,id:`src-${idify(key)}`,faction,name,profile,sourceText:raw,confidence:/—| - /.test(raw)?94:72});
  }
  return out.slice(0,40);
}

function makeSuggestion(type,title,proposal,evidence,confidence=70){return {id:`sug-${idify(type+'-'+title)}`,type,title,proposal,evidence,confidence,status:'pending'};}
function detectSuggestions(text){
  const s=[];
  if(/fog|mist/i.test(text)) s.push(makeSuggestion('Scenario Rule','Early-morning visibility','Consider a temporary visibility rule for the opening turn(s). Example starting point: limit visibility during Turn 1, then remove the restriction.','Source mentions fog or mist. This is a Studio design suggestion, not source fact.',58));
  if(/surpris|unexpected|unalerted/i.test(text)) s.push(makeSuggestion('Scenario Rule','Surprise / readiness','Consider an Unalerted state or Command Test requirement for formations caught by surprise.','Source explicitly emphasizes surprise or unprepared formations.',82));
  if(/breach/i.test(text)) s.push(makeSuggestion('Terrain / Scenario Rule','Wall breach','Treat the mapped breach as a passable wall opening, with Difficult movement through rubble unless the designer chooses otherwise.','Source mentions a breach; the actual opening must still come from approved map geometry.',78));
  if(/sortie|garrison.*enter|commit.*garrison/i.test(text)) s.push(makeSuggestion('Scenario Rule','Garrison sortie','Represent the garrison as off-table or inactive until a scenario-defined commitment condition or player decision.','Source mentions a sortie or later commitment of the garrison.',84));
  if(/first turn|initiative/i.test(text)) s.push(makeSuggestion('Scenario Parameter','First initiative','Set the named side as first player only if the source wording explicitly establishes initiative rather than merely deployment order.','Source contains first-turn or initiative language.',86));
  if(/bridge/i.test(text)) s.push(makeSuggestion('Terrain Rule','Bridge crossing','Approved bridges may override stream terrain with an Open movement corridor across the water feature.','Source mentions bridges. Map geometry remains authoritative for placement.',76));
  return s;
}

export function analyzeScenarioText(text,{sourceName='Pasted text'}={}){
  text=clean(text.replace(/\n{3,}/g,'\n\n'));
  const metadata=detectMetadata(text);
  const historicalSituation=section(text,['Historical Situation','Historical Overview'],['Battlefield','Terrain','Forces','French Army','Scenario Details']);
  const deploymentNotes=section(text,['Deployment'],['Scenario Rules','Special Rules','Victory Conditions','Designer']);
  const victoryText=section(text,['Victory Conditions'],['Designer','Sources','Appendix']);
  const forces=detectForces(text);
  const suggestions=detectSuggestions(text);
  const observations=[];
  for(const [field,value] of Object.entries(metadata))if(value)observations.push({field,value,sourceName,confidence:field==='title'||field==='date'?95:82});
  if(historicalSituation)observations.push({field:'Historical situation',value:historicalSituation.slice(0,700),sourceName,confidence:88});
  if(deploymentNotes)observations.push({field:'Deployment',value:deploymentNotes.slice(0,700),sourceName,confidence:86});
  if(victoryText)observations.push({field:'Victory conditions',value:victoryText.slice(0,700),sourceName,confidence:86});
  return {metadata,historicalSituation,deploymentNotes,victoryText,forces,suggestions,observations,unresolved:[
    ...(!metadata.gameLength?['Game length not found']:[]), ...(!victoryText?['Victory conditions not found']:[]), ...(forces.length?[]:['No force list confidently extracted'])
  ]};
}

export function proposedRosterUnits(sourceForces){
  const byFaction={French:[],Imperial:[],Garrison:[]};
  for(const f of sourceForces){
    if(!byFaction[f.faction])continue;
    let quantity=1;
    if(f.profile==='Swiss Pikemen' && /main|swiss/i.test(f.name)) quantity= /vanguard|rear/i.test(f.name)?1:1;
    for(let i=0;i<quantity;i++) byFaction[f.faction].push({
      proposalId:`proposal-${f.id}-${i+1}`,sourceId:f.id,name:f.name,profile:f.profile,represents:f.sourceText,commander:'',traits:[...(UNIT_LIBRARY.find(u=>u.profile===f.profile)?.traits||[])],notes:'Studio-proposed translation from imported source. Review before accepting.',accepted:false
    });
  }
  return byFaction;
}
