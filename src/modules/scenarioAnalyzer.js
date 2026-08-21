import { getEffectiveRuleset, profileForText } from '../rules/ruleset.js?v=0.5.5.0';

const cleanInline=s=>(s||'').replace(/\r/g,'').replace(/[ \t]+/g,' ').trim();
const cleanBlock=s=>(s||'').replace(/\r/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
const lines=t=>t.replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
const idify=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,56);

const HEADING_ALIASES={
  historical:['historical situation','historical overview','overview','background'],
  battlefield:['battlefield','terrain','the battlefield'],
  forces:['forces engaged','battle axe forces','forces'],
  french:['french army','france'],
  imperial:['imperial army','imperialist'],
  deployment:['deployment','deploy forces'],
  rules:['scenario rules','special rules','scenario notes','historical events / special-rule candidates','historical events','special-rule candidates'],
  victory:['victory conditions','victory'],
  designer:['designer notes','designer\'s notes'],
  sources:['sources','source notes','appendix'],
  objectives:['scenario objectives','objectives','aims'],
  character:['scenario character','scenario design','scenario concept']
};

function headingKey(line){
  const normalized=line.toLowerCase().replace(/^#{1,6}\s*/,'').replace(/\*\*/g,'').replace(/[:.]+$/,'').trim();
  for(const [key,aliases] of Object.entries(HEADING_ALIASES)) if(aliases.some(a=>normalized===a)) return key;
  return null;
}

function armyHeadingLabel(line){
  const normalized=line.replace(/^#{1,6}\s*/,'').replace(/\*\*/g,'').replace(/[:.]+$/,'').trim();
  if(/^(?:battle axe )?forces?$/i.test(normalized))return null;
  const m=normalized.match(/^(.+?)\s+(?:army|forces?|host|contingent)$/i);
  if(!m)return null;
  const label=cleanInline(m[1]).replace(/^(?:the)\s+/i,'');
  return label&&label.length<=48?label:null;
}

function splitSections(text){
  const raw=text.replace(/\r/g,'').split('\n');
  const out={preamble:[]}; let current='preamble';
  for(const line of raw){
    const trimmed=line.trim(),key=headingKey(trimmed),army=key?null:armyHeadingLabel(trimmed);
    if(key||army){current=key||`army:${army}`;if(!out[current])out[current]=[];continue;}
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

function factionFor(text,current='Unknown'){
  const m=text.match(/\b(French|Spanish|Imperial|English|Scottish|Venetian|Milanese|Papal|Swiss|Ottoman|Burgundian)\b/i);
  return m?m[1][0].toUpperCase()+m[1].slice(1).toLowerCase():current;
}
function strengthFrom(text){const m=text.match(/\b(?:approximately|about|roughly|c\.?|circa)?\s*(\d{1,3}(?:,\d{3})+|\d{3,5})\b/i);return m?m[1]:'';}
function explicitCommander(line){const m=line.match(/^(?:\*\*)?Commander(?:\*\*)?\s*:\s*(.+)$/i);return m?cleanInline(m[1]).replace(/\*\*/g,'').trim():'';}
function evidenceName(line,profile){const x=cleanInline(line).replace(/^[-*•\d.)\s]+/,'').replace(/\*\*/g,'');const first=x.split(/[.;]/)[0];return first.length<=110?first:profile;}
function detectHistoricalFormations(text,sections={},ruleset=getEffectiveRuleset(null)){
  const out=[];for(const [section,block] of Object.entries(sections)){if(!block)continue;let current=section==='french'?'French':section==='imperial'?'Imperial':section.startsWith('army:')?section.slice(5):'Unknown';
    for(const raw of lines(block)){if(explicitCommander(raw)||raw.length>240)continue;const profile=profileForText(raw,ruleset);if(!profile)continue;
      const listLike=/^[-*•]|\d+[.)]\s/.test(raw),faction=factionFor(raw,current),name=evidenceName(raw,profile),key=`${section}|${faction}|${name}|${profile}`;
      if(!out.some(x=>x.key===key))out.push({key,id:`src-${idify(key)}`,faction,name,profileHint:profile,strength:strengthFrom(raw),sourceText:raw,section,confidence:listLike?92:(raw.length<125?76:58),provenance:'SOURCE',translationStatus:'unresolved',forceRole:/\bgarrison\b|\bdefenders? of\b/i.test(raw)?'garrison':null});
    }}
  return out.slice(0,80);
}
function detectCommandEvidence(sections={}){
  const out=[];for(const [section,block] of Object.entries(sections)){const faction=section==='french'?'French':section==='imperial'?'Imperial':section.startsWith('army:')?section.slice(5):'Unknown';for(const raw of lines(block||'')){const commander=explicitCommander(raw);if(commander)out.push({id:`cmd-evidence-${idify(faction+'-'+commander)}`,faction,commander,name:'Command organization unresolved',formations:[],provenance:'SOURCE',confidence:96,sourceText:raw});}}return out;
}
function makeSuggestion(type,title,proposal,evidence,confidence=70){return {id:`sug-${idify(type+'-'+title)}`,type,title,proposal,evidence,confidence,status:'pending',provenance:'STUDIO PROPOSAL'};}
function detectSuggestions(text,sections={}){
  let paras=[];for(const k of ['rules','designer'])if(sections[k])paras.push(...sections[k].split(/\n+/));
  if(!paras.length)paras=text.split(/\n+/).filter(x=>/rule|candidate|special|event|objective|prepared|delayed|arrival|counterattack|explosion|death|visibility|screen/i.test(x));
  const s=[];for(const raw of paras.map(cleanInline).filter(Boolean)){const p=raw.replace(/\*\*/g,''),colon=p.indexOf(':'),title=cleanInline(colon>0?p.slice(0,colon):p).replace(/^[-*•]+/,'').slice(0,80),body=cleanInline(colon>0?p.slice(colon+1):p);if(title.length<3)continue;if(/candidate|consider|may|could|should|optional|rule|event|position|attack|screen|artillery|counterattack|explosion|death|prepared/i.test(p))s.push(makeSuggestion('Scenario Rule Candidate',title,body||`Consider whether ${title} requires a scenario-specific mechanism.`,`Source presents this as a possible scenario mechanism/event: ${p}`,88));}
  if(/\bfog\b|\bmist\b|\bvisibility\b/i.test(text))s.push(makeSuggestion('Scenario Rule Candidate','Opening visibility','Consider whether opening visibility should be restricted and then improve as conditions change.','Source mentions fog, mist, or visibility conditions.',72));
  if(/\bsortie\b|\bgarrison\b.{0,80}\b(?:enter|attack|commit|emerge)\b/i.test(text))s.push(makeSuggestion('Scenario Rule Candidate','Garrison sortie','Consider a scenario condition governing when the garrison may enter or become active.','Source mentions a garrison sortie or later garrison commitment.',78));
  const seen=new Set();return s.filter(x=>{const k=x.title.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;}).slice(0,24);
}
export function analyzeScenarioText(text,{sourceName='Pasted text',ruleset=getEffectiveRuleset(null)}={}){
  text=cleanBlock(text);const sections=splitSections(text),metadata=detectMetadata(text),historicalSituation=sections.historical||sections.preamble||'',deploymentNotes=sections.deployment||'',victoryText=sections.victory||sections.objectives||'';
  const forces=detectHistoricalFormations(text,sections,ruleset),sourceCommands=detectCommandEvidence(sections),suggestions=detectSuggestions(text,sections),observations=[];
  for(const [field,value] of Object.entries(metadata))if(value)observations.push({field,value,sourceName,confidence:field==='title'||field==='date'?95:82,provenance:'SOURCE'});
  for(const [field,value,confidence] of [['Historical situation',historicalSituation,90],['Battlefield character',sections.battlefield||'',88],['Scenario character',sections.character||sections.designer||'',82],['Deployment',deploymentNotes,86],['Victory conditions',victoryText,86]])if(value)observations.push({field,value:value.slice(0,3500),sourceName,confidence,provenance:'SOURCE'});
  const unresolved=[];if(!metadata.gameLength)unresolved.push('Game length not found');if(!victoryText)unresolved.push('Victory conditions/objectives not found');if(!forces.length)unresolved.push('No historical formations confidently extracted');if(!sourceCommands.length&&forces.length)unresolved.push('Subordinate command organization is unresolved; Studio will not invent command assignments from troop-type keywords.');
  return {metadata,historicalSituation,deploymentNotes,victoryText,forces,sourceCommands,suggestions,observations,unresolved};
}
export function proposedRosterUnits(sourceForces,ruleset=getEffectiveRuleset(null)){
  const byFaction={};for(const f of sourceForces){if(!byFaction[f.faction])byFaction[f.faction]=[];const profile=f.profileHint;byFaction[f.faction].push({proposalId:`proposal-${f.id}`,sourceId:f.id,name:profile,profile,represents:f.name,commander:'',commandName:`${f.faction} — command unresolved`,traits:[...(ruleset.unitLibrary.find(u=>u.profile===profile)?.traits||[])],notes:`STUDIO PROPOSAL from historical evidence: ${f.sourceText}${f.strength?` Strength recorded: ${f.strength}.`:''} The source does not by itself determine how many Battle Axe units this formation should become. Review unit count, profile, and command allocation before acceptance.`,accepted:false,provenance:'STUDIO PROPOSAL',confidence:Math.max(45,f.confidence-12),forceRole:f.forceRole||null});}return byFaction;
}
