import { UNIT_LIBRARY } from '../data/scenarioData.js?v=0.4.0-alpha.5';

const cleanInline=s=>(s||'').replace(/\r/g,'').replace(/[ \t]+/g,' ').trim();
const cleanBlock=s=>(s||'').replace(/\r/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
const lines=t=>t.replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
const idify=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,56);

const HEADING_ALIASES={
  historical:['historical situation','historical overview','overview','background'],
  battlefield:['battlefield','terrain','the battlefield'],
  forces:['forces engaged','battle axe forces','forces'],
  french:['french army','france - king francis i'],
  imperial:['imperial army','imperialist'],
  deployment:['deployment','deploy forces'],
  rules:['scenario rules','special rules','scenario notes'],
  victory:['victory conditions','victory'],
  designer:['designer notes','designer\'s notes'],
  sources:['sources','source notes','appendix']
};

function headingKey(line){
  const normalized=line.toLowerCase().replace(/[:.]+$/,'').trim();
  for(const [key,aliases] of Object.entries(HEADING_ALIASES)) if(aliases.some(a=>normalized===a)) return key;
  return null;
}

function splitSections(text){
  const raw=text.replace(/\r/g,'').split('\n');
  const out={preamble:[]}; let current='preamble';
  for(const line of raw){
    const key=headingKey(line.trim());
    if(key){current=key;if(!out[current])out[current]=[];continue;}
    if(!out[current])out[current]=[];out[current].push(line);
  }
  return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,cleanBlock(v.join('\n'))]));
}

function detectMetadata(text){
  const ls=lines(text),joined=ls.join(' ');
  const title=ls.find(l=>/^battle of\b/i.test(l))||ls.find(l=>/battle of/i.test(l))||'';
  const date=(joined.match(/\b(?:\d{1,2}\s+[A-Z][a-z]+\s+\d{4}|[A-Z][a-z]+\s+\d{1,2},\s*\d{4})\b/)||[])[0]||'';
  const location=(joined.match(/Location:\s*(.+?)(?=\s+(?:Table|Game Length|Status|Map):|$)/i)||[])[1]||'';
  const turns=(joined.match(/(?:Game Length|Battle Length)\s*:\s*(\d+)\s*(?:Battle Axe\s*)?Turns?/i)||[])[1]||'';
  const table=(joined.match(/(?:Table(?: Size)?\s*:\s*)?([2468]'\s*[×xX]\s*[2468]'|\d{2}\s*[”"]?\s*[×xX]\s*\d{2}\s*[”"]?)/)||[])[1]||'';
  const status=(joined.match(/Status:\s*(.+?)(?=\s+[A-Z][A-Za-z ]+:|$)/i)||[])[1]||'';
  return {title:cleanInline(title),date,location:cleanInline(location),gameLength:turns,status:cleanInline(status),tableSize:table};
}

const PROFILE_PATTERNS=[
  ['Swiss Pikemen',/swiss\s+(?:pike|pikemen)|swiss main|swiss vanguard|swiss rear/i],
  ['Arquebusiers',/arquebus/i],['Landsknechts',/landsknecht/i],['Gendarmes',/gendar/i],
  ['Stradiots',/stradiot/i],['Cannon',/artillery|cannon|guns?\b/i],['Heavy Cavalry',/heavy cavalry|men-at-arms|men at arms/i],
  ['Light Cavalry',/light cavalry/i],['Crossbowmen',/crossbow/i],['Archers',/\barchers?\b/i],['Pikemen',/\bpike(?:men)?\b/i]
];
function profileFor(text){for(const [p,re] of PROFILE_PATTERNS)if(re.test(text))return p;return null;}
function factionFor(text,current='Unknown'){
  if(/french|francis|alençon|black band|swiss/i.test(text))return 'French';
  if(/leyva|garrison|defenders of pavia/i.test(text))return 'Garrison';
  if(/imperial|pescara|frundsberg|bourbon|lannoy|spanish|neapolitan|stradiot/i.test(text))return 'Imperial';
  return current;
}
function forceName(line,profile){
  const before=line.split(/[—–]|\s-\s/)[0].trim();
  if(before.length>2&&before.length<90)return before.replace(/^[-•*\d.)\s]+/,'');
  return profile;
}
function commanderHint(line,name,faction){
  const lower=`${line} ${name}`.toLowerCase();
  if(/francis/.test(lower)||/king'?s gendarmes/.test(lower))return 'Francis I';
  if(/alençon/.test(lower))return "Charles IV d'Alençon";
  if(/black band/.test(lower))return 'Robert de la Marck';
  if(/artillery/.test(lower)&&faction==='French')return 'Pedrino Navarro';
  if(/swiss/.test(lower))return 'Swiss captains';
  if(/pescara|spanish arquebus/.test(lower))return 'Marquis of Pescara';
  if(/frundsberg/.test(lower))return 'Georg von Frundsberg';
  if(/bourbon/.test(lower))return 'Charles de Bourbon';
  if(/lannoy|men-at-arms/.test(lower)&&faction==='Imperial')return 'Charles de Lannoy';
  if(/leyva|defenders of pavia|garrison/.test(lower))return 'Antonio de Leyva';
  return '';
}
function commandHint(line,name,faction,commander){
  const lower=`${line} ${name}`.toLowerCase();
  if(faction==='French'){
    if(/swiss/.test(lower))return 'Swiss Command';
    if(/alençon/.test(lower))return "Alençon's Command";
    if(/black band|landsknecht/.test(lower))return 'Black Band Command';
    if(/artillery/.test(lower))return 'French Artillery Command';
    if(/gendar|francis/.test(lower))return 'Royal Command';
    return 'French Main Command';
  }
  if(faction==='Imperial'){
    if(/pescara|arquebus/.test(lower))return "Pescara's Vanguard";
    if(/frundsberg/.test(lower))return "Frundsberg's Command";
    if(/bourbon/.test(lower))return "Bourbon's Command";
    if(/lannoy|men-at-arms|cavalry/.test(lower))return "Lannoy's Cavalry Command";
    if(/artillery/.test(lower))return 'Imperial Artillery Command';
    return 'Imperial Main Command';
  }
  if(faction==='Garrison')return 'Pavia Garrison';
  return 'Unassigned Command';
}
function historicalNoteFor(raw,name,profile,faction,commander){
  const parts=raw.split(/[—–]|\s-\s/).map(x=>cleanInline(x)).filter(Boolean);
  const detail=parts.slice(2).join(' — ');
  if(detail && detail.length<180){
    if(commander && detail.toLowerCase()===commander.toLowerCase()) return `${name} is identified in the source under ${commander}.`;
    return `${name}: ${detail}.`;
  }
  const roleHints=[];
  if(commander)roleHints.push(`under ${commander}`);
  if(profile==='Cannon')roleHints.push('artillery component');
  else if(profile==='Gendarmes')roleHints.push('heavy household or noble cavalry');
  else if(profile==='Swiss Pikemen')roleHints.push('Swiss pike formation');
  else if(profile==='Landsknechts')roleHints.push('German Landsknecht infantry');
  else if(profile==='Arquebusiers')roleHints.push('firearm-armed infantry');
  else if(profile==='Crossbowmen')roleHints.push('crossbow-armed infantry');
  else if(profile==='Heavy Cavalry')roleHints.push('heavy mounted formation');
  else if(profile==='Light Cavalry'||profile==='Stradiots')roleHints.push('light cavalry formation');
  else if(profile==='Pikemen')roleHints.push('pike infantry formation');
  return roleHints.length?`${name} is a ${roleHints.join(' ')} identified in the imported source.`:`${name} is identified as a distinct ${faction} formation in the imported source.`;
}
function detectForcesBlock(text,startingFaction='Unknown'){
  const out=[];let current=startingFaction;
  for(const raw of lines(text)){
    if(/^french(?: army)?$/i.test(raw)){current='French';continue;}
    if(/^imperial(?: army)?$/i.test(raw)||/^imperialist/i.test(raw)){current='Imperial';continue;}
    if(/^(?:pavia )?garrison$/i.test(raw)){current='Garrison';continue;}
    // Long narrative paragraphs frequently contain words such as artillery or pike. They are evidence, not force-list rows.
    if(raw.length>190)continue;
    const profile=profileFor(raw);if(!profile)continue;
    const faction=factionFor(raw,current);if(faction==='Unknown')continue;
    const name=forceName(raw,profile),commander=commanderHint(raw,name,faction),command=commandHint(raw,name,faction,commander);
    const key=`${faction}|${name}|${profile}`;
    if(!out.some(x=>x.key===key))out.push({key,id:`src-${idify(key)}`,faction,name,profile,sourceText:raw,confidence:/—|\s-\s/.test(raw)?94:74,commander,command,historicalNote:historicalNoteFor(raw,name,profile,faction,commander)});
  }
  return out;
}
function detectForces(text,sections={}){
  // Prefer explicit army/forces sections. Fall back to the whole document only when the source has no recognizable force headings.
  let out=[];
  if(sections.french)out.push(...detectForcesBlock(sections.french,'French'));
  if(sections.imperial)out.push(...detectForcesBlock(sections.imperial,'Imperial'));
  if(sections.forces)out.push(...detectForcesBlock(sections.forces,'Unknown'));
  if(!out.length)out=detectForcesBlock(text,'Unknown');
  const seen=new Set();return out.filter(x=>{const k=x.key;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,60);
}
function buildCommands(forces){
  const map=new Map();
  for(const f of forces){
    const key=`${f.faction}|${f.command}`;
    if(!map.has(key))map.set(key,{id:`src-command-${idify(key)}`,faction:f.faction,name:f.command,commander:f.commander||'',armyCommander:f.faction==='French'?'Francis I':f.faction==='Imperial'?'Charles de Lannoy':f.faction==='Garrison'?'Antonio de Leyva':'',formations:[]});
    const c=map.get(key);if(!c.commander&&f.commander)c.commander=f.commander;c.formations.push(f.id);
  }
  return [...map.values()];
}
function makeSuggestion(type,title,proposal,evidence,confidence=70){return {id:`sug-${idify(type+'-'+title)}`,type,title,proposal,evidence,confidence,status:'pending'};}
function detectSuggestions(text){
  const s=[];
  if(/fog|mist/i.test(text))s.push(makeSuggestion('Scenario Rule','Early-morning visibility','Consider a temporary visibility rule for the opening turn(s). Example starting point: limit visibility during Turn 1, then remove the restriction.','Source mentions fog or mist. This is a Studio design suggestion, not source fact.',58));
  if(/surpris|unexpected|unalerted|respond quickly/i.test(text))s.push(makeSuggestion('Scenario Rule','Surprise / readiness','All French units more than 18" from an enemy unit must take a Command Test before performing their first Action.','Source emphasizes surprise, reaction delay, or unprepared formations.',82));
  if(/breach/i.test(text))s.push(makeSuggestion('Terrain / Scenario Rule','Wall breach','Treat the mapped breach as a passable wall opening, with Difficult movement through rubble unless the designer chooses otherwise.','Source mentions a breach; placement still comes from approved map geometry.',78));
  if(/sortie|garrison.*enter|commit.*garrison/i.test(text))s.push(makeSuggestion('Scenario Rule','Garrison sortie','Represent the garrison as off-table or inactive until a scenario-defined commitment condition or player decision.','Source mentions a sortie or later commitment of the garrison.',84));
  if(/first turn|initiative/i.test(text))s.push(makeSuggestion('Scenario Parameter','First initiative','Set the named side as first player only if the source wording explicitly establishes initiative rather than merely deployment order.','Source contains first-turn or initiative language.',86));
  return s;
}

export function analyzeScenarioText(text,{sourceName='Pasted text'}={}){
  text=cleanBlock(text);const sections=splitSections(text);const metadata=detectMetadata(text);
  const historicalSituation=sections.historical||'';
  const deploymentNotes=sections.deployment||'';
  const victoryText=sections.victory||'';
  const forces=detectForces(text,sections),sourceCommands=buildCommands(forces),suggestions=detectSuggestions(text),observations=[];
  for(const [field,value] of Object.entries(metadata))if(value)observations.push({field,value,sourceName,confidence:field==='title'||field==='date'?95:82});
  if(historicalSituation)observations.push({field:'Historical situation',value:historicalSituation.slice(0,3000),sourceName,confidence:90});
  if(deploymentNotes)observations.push({field:'Deployment',value:deploymentNotes.slice(0,2500),sourceName,confidence:86});
  if(victoryText)observations.push({field:'Victory conditions',value:victoryText.slice(0,2500),sourceName,confidence:86});
  return {metadata,historicalSituation,deploymentNotes,victoryText,forces,sourceCommands,suggestions,observations,unresolved:[...(!metadata.gameLength?['Game length not found']:[]),...(!victoryText?['Victory conditions not found']:[]),...(forces.length?[]:['No force list confidently extracted'])]};
}

export function proposedRosterUnits(sourceForces){
  const byFaction={French:[],Imperial:[],Garrison:[]};
  for(const f of sourceForces){if(!byFaction[f.faction])continue;byFaction[f.faction].push({proposalId:`proposal-${f.id}`,sourceId:f.id,name:f.name,profile:f.profile,represents:f.sourceText,commander:f.commander||'',commandName:f.command||`${f.faction} Main Command`,traits:[...(UNIT_LIBRARY.find(u=>u.profile===f.profile)?.traits||[])],notes:`Generated because the imported source identifies ${f.name} as a ${f.faction} formation. Intended to represent ${f.historicalNote||f.sourceText}. Studio selected the ${f.profile} Battle Axe profile from the canonical unit library because it best matches the troop type named in the source. Review this translation, especially where the historical command contains mixed troop types.`,accepted:false});}
  return byFaction;
}
