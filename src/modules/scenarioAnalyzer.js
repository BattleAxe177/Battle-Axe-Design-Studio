import { getEffectiveRuleset, profileForText } from '../rules/ruleset.js?v=0.6.5.0';

const cleanInline=s=>(s||'').replace(/\r/g,'').replace(/[ \t]+/g,' ').trim();
const cleanBlock=s=>(s||'').replace(/\r/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
const lines=t=>t.replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
const idify=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,72);
const hash32=s=>{let h=2166136261;for(const ch of String(s||'')){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
const stableId=(prefix,s)=>`${prefix}-${idify(s).slice(0,48)}-${hash32(s)}`;
const stripMarkup=s=>cleanInline(s).replace(/^#{1,6}\s*/,'').replace(/^[-*•]\s+/,'').replace(/^\*\*(.*?)\*\*$/,'$1').replace(/\*\*/g,'').replace(/[:.]+$/,'').trim();
const headingDepth=s=>(String(s||'').match(/^\s*(#{1,6})\s+/)||[])[1]?.length||0;
const isListLike=line=>/^\s*(?:[-*•]|\d+[.)])\s+/.test(String(line||''));
const isBoldOnly=line=>/^\s*\*\*.+\*\*\s*$/.test(String(line||''));
const deList=line=>cleanInline(String(line||'').replace(/^\s*(?:[-*•]|\d+[.)])\s+/,''));

const HEADING_ALIASES={
  historical:['historical situation','historical overview','overview','background'],
  battlefield:['battlefield','terrain','the battlefield'],
  forces:['forces engaged','battle axe forces','forces'],
  french:['french army','france','french forces'],
  imperial:['imperial army','imperialist','imperial forces'],
  union:['union army','union forces','federal forces','federals'],
  confederate:['confederate army','confederate forces','confederacy'],
  deployment:['deployment','deploy forces'],
  rules:['scenario rules','special rules','scenario notes','historical events / special-rule candidates','historical events','special-rule candidates'],
  victory:['victory conditions','victory'],
  designer:['designer notes','designer\'s notes'],
  sources:['sources','source notes','appendix'],
  objectives:['scenario objectives','objectives','aims'],
  character:['scenario character','scenario design','scenario concept']
};

function headingKey(line){
  const normalized=stripMarkup(line).toLowerCase();
  for(const [key,aliases] of Object.entries(HEADING_ALIASES)) if(aliases.some(a=>normalized===a)) return key;
  return null;
}
function armyHeadingLabel(line){
  const normalized=stripMarkup(line);
  if(/^(?:battle axe )?forces?$/i.test(normalized))return null;
  const explicit=normalized.match(/^(Union|Federal|Confederate|French|Spanish|Imperial)\s+(?:army|forces?)$/i);
  if(explicit){const x=explicit[1].toLowerCase();return x==='federal'?'Union':x[0].toUpperCase()+x.slice(1);}
  const m=normalized.match(/^(.+?)\s+(?:army|forces?|host|contingent)$/i);
  if(!m)return null;
  const label=cleanInline(m[1]).replace(/^(?:the)\s+/i,'');return label&&label.length<=48?label:null;
}
function splitSections(text){
  const raw=text.replace(/\r/g,'').split('\n'),out={preamble:[]};let current='preamble';
  for(const line of raw){
    const trimmed=line.trim(),key=headingKey(trimmed),army=key?null:armyHeadingLabel(trimmed);
    if(key||army){current=key||`army:${army}`;if(!out[current])out[current]=[];continue;}
    if(!out[current])out[current]=[];out[current].push(line);
  }
  return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,cleanBlock(v.join('\n'))]));
}
function detectMetadata(text){
  const ls=lines(text),joined=ls.join(' '),title=ls.find(l=>/^battle of\b/i.test(stripMarkup(l)))||ls.find(l=>/battle of/i.test(l))||'',date=(joined.match(/\b(?:\d{1,2}\s+[A-Z][a-z]+\s+\d{4}|[A-Z][a-z]+\s+\d{1,2},\s*\d{4})\b/)||[])[0]||'',location=(joined.match(/Location:\s*(.+?)(?=\s+(?:Table|Game Length|Status|Map):|$)/i)||[])[1]||'',turns=(joined.match(/(?:Game Length|Battle Length)\s*:\s*(\d+)\s*(?:Battle Axe\s*)?Turns?/i)||[])[1]||'',table=(joined.match(/(?:Table(?: Size)?\s*:\s*)?([2468]'\s*[×xX]\s*[2468]'|\d{2}\s*[”\"]?\s*[×xX]\s*\d{2}\s*[”\"]?)/)||[])[1]||'',status=(joined.match(/Status:\s*(.+?)(?=\s+[A-Z][A-Za-z ]+:|$)/i)||[])[1]||'';
  return{title:stripMarkup(title),date,location:cleanInline(location),gameLength:turns,status:cleanInline(status),tableSize:table};
}
function factionFor(text,current='Unknown'){
  const m=String(text||'').match(/\b(Union|Federal|Confederate|French|Spanish|Imperial|English|Scottish|Venetian|Milanese|Papal|Swiss|Ottoman|Burgundian|Florentine|Neapolitan|Aragonese)\b/i);
  if(!m)return current;const x=m[1].toLowerCase();if(x==='federal')return'Union';return x[0].toUpperCase()+x.slice(1);
}
function strengthFrom(text){const m=String(text||'').match(/\b(?:approximately|about|roughly|c\.?|circa)?\s*(\d{1,3}(?:,\d{3})+|\d{3,5})\b/i);return m?m[1]:'';}
function explicitCommander(line){const m=stripMarkup(line).match(/^Commander\s*:\s*(.+)$/i);return m?cleanInline(m[1]).trim():'';}
function armyCommander(line){const m=stripMarkup(line).match(/^(?:Commander[- ]in[- ]Chief|Commander in Chief|Army Commander|Overall Commander)\s*:\s*(.+)$/i);return m?cleanInline(m[1]).trim():'';}
function associatedCommander(line){const m=stripMarkup(line).match(/^(?:Associated Commander|Attached Commander)\s*:\s*(.+)$/i);return m?cleanInline(m[1]).trim():'';}
const RANK_RE=/(?:(?:Maj\.?|Brig\.?)\s+Gen\.|Gen\.|Col\.|Lt\.?\s+Col\.|Maj\.|Capt\.)/i;
function rankName(text){
  const s=stripMarkup(deList(text));
  const m=s.match(new RegExp(`^(${RANK_RE.source})\\s+([^—–-]+?)(?:\\s*[—–-]\\s*(.+))?$`,'i'));
  if(!m)return null;return{rank:cleanInline(m[1]),name:cleanInline(m[2]),tail:cleanInline(m[3]||'')};
}
function splitNameCommander(text){
  const s=stripMarkup(deList(text)),parts=s.split(/\s+[—–]\s+|\s+-\s+/).map(cleanInline).filter(Boolean);
  if(parts.length<2)return null;
  const rankIdx=parts.findIndex(p=>RANK_RE.test(p));
  if(rankIdx===1)return{name:parts[0],commander:parts[1],tail:parts.slice(2).join(' — ')};
  if(rankIdx===0)return{name:parts[1]||'',commander:parts[0],tail:parts.slice(2).join(' — ')};
  return null;
}
function evidenceName(line,profile){const x=deList(line).replace(/\*\*/g,'');const first=x.split(/[.;]/)[0].replace(/\s*→.*$/,'').trim();return first.length<=130?first:profile;}
function confidenceContext(line,current=86){const s=stripMarkup(line).toLowerCase();if(/higher[- ]confidence|high confidence|well attested|secure assignment/.test(s))return 95;if(/reasonably supported|probable|likely assignment/.test(s))return 82;if(/provisional|tentative|uncertain assignment|possible assignment/.test(s))return 62;return current;}
function isConfidenceHeading(line){return /confidence|reasonably supported|provisional|tentative|assignment/i.test(stripMarkup(line))&&!/commander/i.test(stripMarkup(line));}
function isGenericHeading(line){const s=stripMarkup(line).toLowerCase();return !!headingKey(line)||!!armyHeadingLabel(line)||/^(?:command structure|order of battle|higher[- ]confidence command assignments|reasonably supported assignments|provisional command assignments|command assignments|formations|troops|composition|notes?|initial assault|later assault|additional brigade engaged earlier|supporting .* commands?)$/i.test(s);}
function commandKind(s){
  s=stripMarkup(s);
  if(/\bdivision\b/i.test(s))return'division';if(/\bbrigade\b/i.test(s))return'brigade';if(/\b(command|reserve|centre|center|wing|vanguard|rearguard|rear guard|garrison|battle|column|contingent|guard)\b/i.test(s))return'command';if(/^artillery$/i.test(s))return'artillery';return'';
}
function looksNarrative(s){
  const raw=cleanInline(deList(s)).replace(/\*\*/g,''),x=stripMarkup(raw);
  if(x.length>170)return true;
  if(/[.!?]$/.test(raw)&&/\b(?:was|were|had|made|moved|attacked|identified|fielded|begins|supports|included|therefore|does|should|may)\b/i.test(x))return true;
  return false;
}
function likelyFormationProfile(raw,ruleset){
  const s=stripMarkup(deList(raw));
  if(!s||RANK_RE.test(s)||/\b(?:brigade|division)\b/i.test(s))return null;
  if(/\bbattery\b/i.test(s))return ruleset.unitLibrary.some(x=>x.profile==='Cannons')?'Cannons':(ruleset.unitLibrary.some(x=>x.profile==='Cannon')?'Cannon':profileForText('artillery cannon',ruleset));
  if(/\b(?:\d+(?:st|nd|rd|th)\s+)?Pennsylvania Reserves?\b/i.test(s)||/\b\d+(?:st|nd|rd|th)\s+(?:[A-Z][a-z]+\s+){0,3}(?:Infantry|Regiment|Volunteers?)\b/i.test(s))return ruleset.unitLibrary.some(x=>x.profile==='Infantry')?'Infantry':profileForText('infantry',ruleset);
  if(looksNarrative(raw)&&!isListLike(raw))return null;
  return profileForText(s,ruleset)||null;
}

/**
 * Parse source hierarchy without converting prose into units. ACW headings/bullets are treated
 * structurally: division/brigade commanders are commands; explicitly listed regiments/batteries
 * are formations. Incomplete brigades remain empty source commands rather than fabricated units.
 */
export function detectForceHierarchy(text,ruleset=getEffectiveRuleset(null)){
  const raw=text.replace(/\r/g,'').split('\n'),forces=[],commands=[],armyCommanders=new Map();
  let faction='Unknown',currentCommand=null,currentDivision=null,currentHigherCommand=null,assignmentConfidence=88,inForces=false;
  const addCommand=({name,commander='',sourceText,parent=null,kind=''})=>{
    const cleanName=stripMarkup(name)||'Command',key=`${faction}|${parent?.id||'root'}|${cleanName}|${commander}`;
    let c=commands.find(x=>x._key===key);if(c)return c;
    c={_key:key,id:stableId('cmd-evidence',`${key}-${commands.length}`),faction,name:cleanName,commander:cleanInline(commander),armyCommander:armyCommanders.get(faction)||'',associatedCommander:'',formations:[],parentCommandId:parent?.id||null,parentCommandName:parent?.name||'',hierarchyLevel:kind||commandKind(cleanName)||'command',provenance:'SOURCE',confidence:assignmentConfidence,sourceText:stripMarkup(sourceText||name)};
    commands.push(c);return c;
  };
  const addFormation=(original,profile,command=currentCommand)=>{
    const clean=stripMarkup(deList(original)),lineFaction=factionFor(clean,faction),name=evidenceName(clean,profile),key=`${lineFaction}|${command?.id||'unassigned'}|${name}|${profile}`;
    if(forces.some(x=>x.key===key))return;
    const id=stableId('src',key),force={key,id,faction:lineFaction,name,profileHint:profile,strength:strengthFrom(clean),sourceText:clean,section:`army:${lineFaction}`,confidence:isListLike(original)?Math.min(98,assignmentConfidence+5):Math.min(84,assignmentConfidence),provenance:'SOURCE',translationStatus:'unresolved',forceRole:/\bgarrison\b|\bdefenders? of\b/i.test(clean)?'garrison':(/\bbattery\b/i.test(clean)?'artillery':null),commandId:command?.id||null,commandName:command?.name||'',commander:command?.commander||'',armyCommander:armyCommanders.get(lineFaction)||command?.armyCommander||''};
    forces.push(force);if(command)command.formations.push(id);
  };

  for(let i=0;i<raw.length;i++){
    const original=raw[i],trimmed=original.trim();if(!trimmed)continue;
    const key=headingKey(trimmed),army=armyHeadingLabel(trimmed);
    if(key==='forces'){inForces=true;currentCommand=currentDivision=currentHigherCommand=null;continue;}
    if(key==='union'){faction='Union';inForces=true;currentCommand=currentDivision=currentHigherCommand=null;continue;}
    if(key==='confederate'){faction='Confederate';inForces=true;currentCommand=currentDivision=currentHigherCommand=null;continue;}
    if(key==='french'){faction='French';inForces=true;currentCommand=currentDivision=currentHigherCommand=null;continue;}
    if(key==='imperial'){faction='Imperial';inForces=true;currentCommand=currentDivision=currentHigherCommand=null;continue;}
    if(army){faction=army;inForces=true;currentCommand=currentDivision=currentHigherCommand=null;continue;}
    if(key&&key!=='forces'){if(key==='deployment'||key==='rules'||key==='victory'||key==='designer'||key==='sources'||key==='objectives'){inForces=false;currentCommand=currentDivision=currentHigherCommand=null;}continue;}
    if(!inForces)continue;

    assignmentConfidence=confidenceContext(trimmed,assignmentConfidence);if(isConfidenceHeading(trimmed)){currentCommand=null;continue;}
    const chief=armyCommander(trimmed);if(chief){armyCommanders.set(faction,chief);for(const c of commands.filter(x=>x.faction===faction&&!x.armyCommander))c.armyCommander=chief;continue;}
    const explicit=explicitCommander(trimmed);if(explicit){if(!currentCommand)currentCommand=addCommand({name:`${faction} command`,sourceText:trimmed});currentCommand.commander=explicit;continue;}
    const assoc=associatedCommander(trimmed);if(assoc){if(!currentCommand)currentCommand=addCommand({name:`${faction} attached command`,sourceText:trimmed});currentCommand.associatedCommander=assoc;continue;}

    const depth=headingDepth(original),plain=stripMarkup(trimmed),kind=commandKind(plain),pair=splitNameCommander(trimmed),rank=rankName(trimmed);
    if(isGenericHeading(trimmed)&&/^supporting .* commands?$/i.test(plain)){currentCommand=currentDivision=currentHigherCommand=null;continue;}
    if(isGenericHeading(trimmed)&&/^(?:initial assault|later assault|additional brigade engaged earlier)$/i.test(plain)){currentCommand=currentDivision||currentHigherCommand||currentCommand;continue;}

    // Markdown command headings such as "### McCall's Division — Pennsylvania Reserves".
    if(depth>=3&&kind){
      let name=plain,commander='';if(pair){name=pair.name;commander=pair.commander;}
      const parent=(kind==='brigade'||kind==='artillery')?(currentDivision||currentHigherCommand):null;
      currentCommand=addCommand({name,commander,sourceText:trimmed,parent,kind});if(kind==='division'){currentDivision=currentCommand;currentHigherCommand=currentCommand;}else if(kind==='command'){currentDivision=null;currentHigherCommand=currentCommand;}continue;
    }

    // Bold command headings, including "First Brigade — Col. ..." and "Kearny's Division — Brig. Gen. ...".
    if(isBoldOnly(trimmed)&&kind){
      let name=plain,commander='';if(pair){name=pair.name;commander=pair.commander;}
      const parent=(kind==='brigade'||kind==='artillery')?(currentDivision||currentHigherCommand):null;
      currentCommand=addCommand({name,commander,sourceText:trimmed,parent,kind});if(kind==='division'){currentDivision=currentCommand;currentHigherCommand=currentCommand;}else if(kind==='command'){currentDivision=null;currentHigherCommand=currentCommand;}continue;
    }

    // A bold rank-only line immediately following a command heading is that command's commander.
    if(isBoldOnly(trimmed)&&rank&&!rank.tail){if(currentCommand){currentCommand.commander=`${rank.rank} ${rank.name}`;currentCommand.sourceText=`${currentCommand.sourceText}\n${plain}`;}continue;}

    // ACW subordinate brigade bullets are commands, never troop profiles. This specifically prevents
    // surnames such as Archer from being misread as the canonical "Archers" profile.
    if(isListLike(original)&&rank){
      let brigadeName='';
      if(rank.tail&&/\bbrigade\b/i.test(rank.tail))brigadeName=rank.tail;
      else if(currentDivision||/\bdivision\b/i.test(currentCommand?.name||''))brigadeName=`${rank.name.split(/\s+/).at(-1)}'s Brigade`;
      if(brigadeName){const parent=currentDivision||currentHigherCommand||currentCommand;currentCommand=addCommand({name:brigadeName,commander:`${rank.rank} ${rank.name}`,sourceText:trimmed,parent,kind:'brigade'});continue;}
      continue;
    }
    if(isListLike(original)&&/\bbrigade\b/i.test(plain)){
      const name=plain.split(/\s+[—–-]\s+/)[0],parent=currentDivision||currentHigherCommand||(/\bdivision\b/i.test(currentCommand?.name||'')?currentCommand:null);
      currentCommand=addCommand({name,sourceText:trimmed,parent,kind:'brigade'});continue;
    }

    // Generic old-style command headings are retained for Italian Wars material.
    if(!isListLike(original)&&!isGenericHeading(original)&&kind&&(isBoldOnly(trimmed)||depth>=3)){
      const parent=(kind==='brigade'||kind==='artillery')?(currentDivision||currentHigherCommand):null;currentCommand=addCommand({name:plain,sourceText:trimmed,parent,kind});if(kind==='division'){currentDivision=currentCommand;currentHigherCommand=currentCommand;}else if(kind==='command'){currentDivision=null;currentHigherCommand=currentCommand;}continue;
    }

    const profile=likelyFormationProfile(original,ruleset);if(profile&&(isListLike(original)||(!looksNarrative(original)&&faction!=='Unknown')))addFormation(original,profile,currentCommand);
  }

  for(const c of commands){if(!c.armyCommander)c.armyCommander=armyCommanders.get(c.faction)||'';c.formations=[...new Set(c.formations)];delete c._key;}
  return{forces:forces.slice(0,180),commands:commands.slice(0,100),armyCommanders:Object.fromEntries(armyCommanders)};
}

function detectHistoricalFormations(text,sections={},ruleset=getEffectiveRuleset(null)){
  const h=detectForceHierarchy(text,ruleset);if(h.forces.length)return h.forces;
  const out=[];for(const [section,block] of Object.entries(sections)){if(!block)continue;let current=section==='french'?'French':section==='imperial'?'Imperial':section==='union'?'Union':section==='confederate'?'Confederate':section.startsWith('army:')?section.slice(5):'Unknown';for(const raw of lines(block)){if(explicitCommander(raw)||armyCommander(raw)||raw.length>240||!isListLike(raw))continue;const profile=likelyFormationProfile(raw,ruleset);if(!profile)continue;const faction=factionFor(raw,current),name=evidenceName(raw,profile),key=`${section}|${faction}|${name}|${profile}`;if(!out.some(x=>x.key===key))out.push({key,id:`src-${idify(key)}`,faction,name,profileHint:profile,strength:strengthFrom(raw),sourceText:stripMarkup(deList(raw)),section,confidence:92,provenance:'SOURCE',translationStatus:'unresolved',forceRole:/\bbattery\b/i.test(raw)?'artillery':null,commandId:null,commandName:'',commander:'',armyCommander:''});}}
  return out.slice(0,120);
}
function makeSuggestion(type,title,proposal,evidence,confidence=70){return{id:`sug-${idify(type+'-'+title)}`,type,title,proposal,evidence,confidence,status:'pending',provenance:'STUDIO PROPOSAL'};}

/** Parse explicit source-authored rules as accepted source objects, separate from optional Studio suggestions. */
export function detectSourceRules(text,sections=splitSections(text)){
  const block=sections.rules||'';if(!block)return[];
  const raw=block.replace(/\r/g,'').split('\n'),out=[];let current=null;
  const push=()=>{if(!current)return;current.proposal=cleanBlock(current.proposal);if(current.title&&current.proposal)out.push(current);current=null;};
  for(const line0 of raw){const line=line0.trim();if(!line)continue;const unlisted=line.replace(/^[-*•]\s+/,''),plain=unlisted.replace(/\*\*/g,'').trim();
    const m=plain.match(/^([^:]{2,100}):\s*(.+)$/);
    if(m){push();const title=cleanInline(m[1]),body=cleanInline(m[2]);current={id:`rule-source-${idify(title)}`,type:'SCENARIO RULE · SOURCE',title,proposal:body,evidence:`Source-authored scenario rule: ${title}: ${body}`,confidence:99,status:'accepted',provenance:'SOURCE',engineStatus:'tabletop',engineText:'',overrides:''};continue;}
    if(current)current.proposal+=`\n${plain}`;
  }
  push();const seen=new Set();return out.filter(x=>{const k=x.title.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
}
function detectSuggestions(text,sections={}){
  let paras=[];for(const k of ['rules','designer'])if(sections[k])paras.push(...sections[k].split(/\n+/));
  if(!paras.length)paras=text.split(/\n+/).filter(x=>/rule|candidate|special|event|objective|prepared|delayed|arrival|counterattack|explosion|death|visibility|screen/i.test(x));
  const s=[];for(const raw of paras.map(cleanInline).filter(Boolean)){const p=raw.replace(/\*\*/g,''),colon=p.indexOf(':'),title=cleanInline(colon>0?p.slice(0,colon):p).replace(/^[-*•]+/,'').slice(0,80),body=cleanInline(colon>0?p.slice(colon+1):p);if(title.length<3)continue;if(/candidate|consider|may|could|should|optional|event|prepared|delayed|arrival|counterattack|explosion|death/i.test(p))s.push(makeSuggestion('Scenario Rule Candidate',title,body||`Consider whether ${title} requires a scenario-specific mechanism.`,`Source presents this as a possible scenario mechanism/event: ${p}`,86));}
  if(/\bfog\b|\bmist\b|\bvisibility\b/i.test(text))s.push(makeSuggestion('Scenario Rule Candidate','Opening visibility','Consider whether opening visibility should be restricted and then improve as conditions change.','Source mentions fog, mist, or visibility conditions.',72));
  if(/\bsortie\b|\bgarrison\b.{0,80}\b(?:enter|attack|commit|emerge|conducts?)\b/i.test(text))s.push(makeSuggestion('Scenario Rule Candidate','Garrison sortie','Consider a scenario condition governing when the garrison may enter or become active.','Source mentions a garrison sortie or later garrison commitment.',78));
  const seen=new Set();return s.filter(x=>{const k=x.title.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;}).slice(0,24);
}

export function analyzeScenarioText(text,{sourceName='Pasted text',ruleset=getEffectiveRuleset(null)}={}){
  text=cleanBlock(text);const sections=splitSections(text),metadata=detectMetadata(text),historicalSituation=sections.historical||sections.preamble||'',deploymentNotes=sections.deployment||'',victoryText=sections.victory||sections.objectives||'',hierarchy=detectForceHierarchy(text,ruleset),forces=hierarchy.forces.length?hierarchy.forces:detectHistoricalFormations(text,sections,ruleset),sourceCommands=hierarchy.commands,sourceRules=detectSourceRules(text,sections),suggestions=detectSuggestions(text,sections),observations=[];
  for(const [field,value] of Object.entries(metadata))if(value)observations.push({field,value,sourceName,confidence:field==='title'||field==='date'?95:82,provenance:'SOURCE'});
  for(const [field,value,confidence] of [['Historical situation',historicalSituation,90],['Battlefield character',sections.battlefield||'',88],['Scenario character',sections.character||sections.designer||'',82],['Deployment',deploymentNotes,86],['Victory conditions',victoryText,86]])if(value)observations.push({field,value:value.slice(0,3500),sourceName,confidence,provenance:'SOURCE'});
  const unresolved=[];if(!metadata.gameLength)unresolved.push('Game length not found');if(!victoryText)unresolved.push('Victory conditions/objectives not found');if(!forces.length)unresolved.push('No historical formations confidently extracted');if(forces.length&&!sourceCommands.length)unresolved.push('Subordinate command organization is unresolved; no explicit command hierarchy was found in the intake source.');else if(forces.some(f=>!f.commandId))unresolved.push(`${forces.filter(f=>!f.commandId).length} historical formation(s) remain outside an explicit source command.`);
  return{metadata,historicalSituation,deploymentNotes,victoryText,forces,sourceCommands,sourceRules,suggestions,observations,unresolved};
}

export function proposedRosterUnits(sourceForces,ruleset=getEffectiveRuleset(null)){
  const byFaction={};for(const f of sourceForces){if(!byFaction[f.faction])byFaction[f.faction]=[];const profile=f.profileHint;if(!profile)continue;byFaction[f.faction].push({proposalId:`proposal-${f.id}`,sourceId:f.id,name:f.name||profile,profile,represents:f.name,commander:f.commander||'',commandName:f.commandName||`${f.faction} — command unresolved`,traits:[...(ruleset.unitLibrary.find(u=>u.profile===profile)?.traits||[])],notes:`STUDIO PROPOSAL from historical evidence: ${f.sourceText}${f.strength?` Strength recorded: ${f.strength}.`:''} Review profile and command allocation before acceptance.`,accepted:false,provenance:'STUDIO PROPOSAL',confidence:Math.max(45,f.confidence-8),forceRole:f.forceRole||null});}return byFaction;
}
