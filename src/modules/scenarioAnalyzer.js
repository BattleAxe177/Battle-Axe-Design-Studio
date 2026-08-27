import { getEffectiveRuleset, profileForText } from '../rules/ruleset.js?v=0.6.7.0';

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
function explicitCommander(line){const m=stripMarkup(line).match(/^(?:Commander for scenario purposes|Commander for [^:]+|Division Commander|Brigade Commander|Commander)\s*:?\s+(.+)$/i);return m?cleanInline(m[1]).trim():'';}
function armyCommander(line){const m=stripMarkup(line).match(/^(?:Commander[- ]in[- ]Chief|Commander in Chief|Army Commander|Overall Commander|Overall (?:Union|Confederate|French|Imperial)?\s*Tactical Commander)\s*:?\s+(.+)$/i);return m?cleanInline(m[1]).trim():'';}
function associatedCommander(line){const m=stripMarkup(line).match(/^(?:Associated Commander|Attached Commander)\s*:\s*(.+)$/i);return m?cleanInline(m[1]).trim():'';}
function commandRatingField(line){const m=stripMarkup(line).match(/^(?:Command Rating|CR)\s*:?\s*(\d+)$/i);return m?Number(m[1]):null;}
function statusField(line){const m=stripMarkup(line).match(/^Status\s*:\s*(.+)$/i);return m?cleanInline(m[1]):'';}
function roleField(line){const m=stripMarkup(line).match(/^Role\s*:\s*(.+)$/i);return m?cleanInline(m[1]):'';}
function unitsField(line){return /^Units\s*:?\s*$/i.test(stripMarkup(line));}
function overallCommanderHeading(line){return /^(?:Overall (?:Union|Confederate|French|Imperial)?\s*Tactical Commander|Commander[- ]in[- ]Chief|Commander in Chief|Army Commander|Overall Commander)\s*:?$/i.test(stripMarkup(line));}
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
  // Classify the formation being named, not a parent formation mentioned after an em dash.
  // Example: "Robinson's Brigade — Kearny's Division" is a brigade whose parent is a division.
  s=stripMarkup(s).split(/\s+[—–]\s+|\s+-\s+/)[0];
  if(/\bdivision\b/i.test(s))return'division';if(/\bbrigade\b/i.test(s))return'brigade';if(/\bartillery\b/i.test(s))return'artillery';if(/\b(command|reserve|centre|center|wing|vanguard|rearguard|rear guard|garrison|battle|column|contingent|guard)\b/i.test(s))return'command';return'';
}
function looksNarrative(s){
  const raw=cleanInline(deList(s)).replace(/\*\*/g,''),x=stripMarkup(raw);
  if(x.length>170)return true;
  if(/^(?:note|historically|historical note|no explicit|no verified)\b/i.test(x))return true;
  if(/[.!?]$/.test(raw)&&/\b(?:was|were|had|made|moved|attacked|identified|fielded|begins|supports|included|therefore|does|should|may|represented|carried|commanded|wounded|held|directed|exercised)\b/i.test(x))return true;
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
function splitExplicitUnitLine(raw,ruleset){
  const text=stripMarkup(deList(raw));
  if(!text)return[];
  const dash=text.match(/^(.*?)\s+[—–-]\s+(Infantry|Cannons?|Cannon|Sharpshooters?|Cavalry)\s*$/i);
  let body=dash?cleanInline(dash[1]):text,explicitType=dash?dash[2]:'';
  const profile=explicitType?profileForText(explicitType,ruleset):likelyFormationProfile(raw,ruleset);
  if(!profile)return[];
  // Explicitly enumerated regiments/battalions may share the state/formation suffix on the final item.
  // Expand "1st, 2nd, 5th Pennsylvania Reserves" and "8th, 18th, 19th, 28th Virginia Infantry".
  if(body.includes(',')){
    const parts=body.split(',').map(cleanInline).filter(Boolean);
    const last=parts.at(-1)||'';
    const ordinalPrefix=/^\d+(?:st|nd|rd|th)\b/i;
    if(parts.length>1&&parts.every(x=>ordinalPrefix.test(x))){
      const lastMatch=last.match(/^(\d+(?:st|nd|rd|th))\s+(.+)$/i);
      if(lastMatch){
        const suffix=lastMatch[2];
        return parts.map((part,i)=>{
          const m=part.match(/^(\d+(?:st|nd|rd|th))(?:\s+(.+))?$/i);
          if(!m)return null;
          const ownSuffix=m[2]||suffix;
          return{name:`${m[1]} ${ownSuffix}`,profile};
        }).filter(Boolean);
      }
    }
  }
  // Semicolon-separated lists are always explicit unit lists when each member has a period formation marker.
  if(body.includes(';')){
    const parts=body.split(';').map(cleanInline).filter(Boolean);
    if(parts.length>1){const out=[];for(const part of parts){const nested=splitExplicitUnitLine(`${part} — ${profile}`,ruleset);if(nested.length)out.push(...nested);else out.push({name:part,profile:profileForText(part,ruleset)||profile});}return out;}
  }
  return[{name:body,profile}];
}

/**
 * Parse historical force evidence into a command tree before mapping leaf formations to Battle Axe profiles.
 * Heading depth is intentionally not authoritative: period vocabulary (Division, Brigade, Battle, Wing, etc.)
 * and explicit field labels determine the hierarchy. Narrative prose remains command notes and is never
 * promoted to a playable unit merely because it contains words such as battery, cannon, or infantry.
 */
export function detectForceHierarchy(text,ruleset=getEffectiveRuleset(null)){
  const raw=text.replace(/\r/g,'').split('\n'),forces=[],commands=[],armyCommanders=new Map();
  let faction='Unknown',currentCommand=null,currentDivision=null,currentHigherCommand=null,assignmentConfidence=88,inForces=false,unitListOpen=false,pendingOverall=false;
  const addCommand=({name,commander='',sourceText,parent=null,kind='',historicalCommander='',scenarioCommander=''})=>{
    const cleanName=stripMarkup(name)||'Command',key=`${faction}|${parent?.id||'root'}|${cleanName}`;
    let c=commands.find(x=>x._key===key);
    if(c){if(commander&&!c.commander)c.commander=cleanInline(commander);return c;}
    c={_key:key,id:stableId('cmd-evidence',`${key}-${commands.length}`),faction,name:cleanName,commander:cleanInline(commander),historicalCommander:cleanInline(historicalCommander),scenarioCommander:cleanInline(scenarioCommander),commandRating:null,status:'',role:'',notes:[],armyCommander:armyCommanders.get(faction)||'',associatedCommander:'',formations:[],parentCommandId:parent?.id||null,parentCommandName:parent?.name||'',hierarchyLevel:kind||commandKind(cleanName)||'command',provenance:'SOURCE',confidence:assignmentConfidence,sourceText:stripMarkup(sourceText||name)};
    commands.push(c);return c;
  };
  const ensureDivision=(name)=>{
    const clean=stripMarkup(name),existing=commands.find(c=>c.faction===faction&&c.hierarchyLevel==='division'&&c.name.toLowerCase()===clean.toLowerCase());
    return existing||addCommand({name:clean,sourceText:clean,kind:'division'});
  };
  const addFormation=(name,profile,original,command=currentCommand)=>{
    const clean=stripMarkup(name),lineFaction=factionFor(clean,faction),key=`${lineFaction}|${command?.id||'unassigned'}|${clean}|${profile}`;
    if(forces.some(x=>x.key===key))return;
    const id=stableId('src',key),force={key,id,faction:lineFaction,name:clean,profileHint:profile,strength:strengthFrom(clean),sourceText:stripMarkup(deList(original||clean)),section:`army:${lineFaction}`,confidence:isListLike(original)?Math.min(98,assignmentConfidence+5):Math.min(90,assignmentConfidence),provenance:'SOURCE',translationStatus:'unresolved',forceRole:/\bgarrison\b|\bdefenders? of\b/i.test(clean)?'garrison':(/\bbattery\b/i.test(clean)?'artillery':null),commandId:command?.id||null,commandName:command?.name||'',commander:command?.commander||'',armyCommander:armyCommanders.get(lineFaction)||command?.armyCommander||''};
    forces.push(force);if(command)command.formations.push(id);
  };
  const addNote=(line)=>{if(currentCommand){const note=stripMarkup(deList(line));if(note&&!currentCommand.notes.includes(note))currentCommand.notes.push(note);}};
  const setFaction=(value)=>{faction=value;inForces=true;currentCommand=currentDivision=currentHigherCommand=null;unitListOpen=false;pendingOverall=false;};

  for(let i=0;i<raw.length;i++){
    const original=raw[i],trimmed=original.trim();if(!trimmed)continue;
    const key=headingKey(trimmed),army=armyHeadingLabel(trimmed);
    if(key==='forces'){inForces=true;currentCommand=currentDivision=currentHigherCommand=null;unitListOpen=false;continue;}
    if(key==='union'){setFaction('Union');continue;}if(key==='confederate'){setFaction('Confederate');continue;}if(key==='french'){setFaction('French');continue;}if(key==='imperial'){setFaction('Imperial');continue;}if(army){setFaction(army);continue;}
    if(key&&key!=='forces'){if(['deployment','rules','victory','designer','sources','objectives'].includes(key)){inForces=false;currentCommand=currentDivision=currentHigherCommand=null;unitListOpen=false;}continue;}
    if(!inForces)continue;

    assignmentConfidence=confidenceContext(trimmed,assignmentConfidence);if(isConfidenceHeading(trimmed)){unitListOpen=false;continue;}
    const plain=stripMarkup(trimmed),kind=commandKind(plain),depth=headingDepth(original),pair=splitNameCommander(trimmed),rank=rankName(trimmed);

    if(overallCommanderHeading(trimmed)){
      currentDivision=currentHigherCommand=null;unitListOpen=false;pendingOverall=true;
      currentCommand=addCommand({name:`${faction} Army Command`,sourceText:trimmed,kind:'army'});continue;
    }
    const chief=armyCommander(trimmed);if(chief){
      armyCommanders.set(faction,chief);currentCommand=addCommand({name:`${faction} Army Command`,commander:chief,sourceText:trimmed,kind:'army'});currentHigherCommand=currentCommand;pendingOverall=false;
      for(const c of commands.filter(x=>x.faction===faction&&!x.armyCommander))c.armyCommander=chief;continue;
    }
    if(pendingOverall&&isListLike(original)&&rank){
      const commander=`${rank.rank} ${rank.name}`;currentCommand.commander=commander;armyCommanders.set(faction,commander);currentCommand.armyCommander=commander;pendingOverall=false;continue;
    }

    const explicit=explicitCommander(trimmed);if(explicit){
      if(!currentCommand)currentCommand=addCommand({name:`${faction} command`,sourceText:trimmed});
      const historical=currentCommand.commander;
      currentCommand.commander=explicit;
      if(/scenario purposes|for Glendale/i.test(plain)){currentCommand.scenarioCommander=explicit;if(historical&&historical!==explicit)currentCommand.historicalCommander=historical;}
      unitListOpen=false;continue;
    }
    const assoc=associatedCommander(trimmed);if(assoc){if(!currentCommand)currentCommand=addCommand({name:`${faction} attached command`,sourceText:trimmed});currentCommand.associatedCommander=assoc;continue;}
    const rating=commandRatingField(trimmed);if(rating!=null&&currentCommand){currentCommand.commandRating=rating;continue;}
    const status=statusField(trimmed);if(status&&currentCommand){currentCommand.status=status;continue;}
    const role=roleField(trimmed);if(role&&currentCommand){currentCommand.role=role;continue;}
    if(unitsField(trimmed)){unitListOpen=true;continue;}

    if(isGenericHeading(trimmed)&&/^supporting .* commands?$/i.test(plain)){currentCommand=currentDivision=currentHigherCommand=null;unitListOpen=false;continue;}
    if(isGenericHeading(trimmed)&&/^(?:initial assault|later assault|additional brigade engaged earlier)$/i.test(plain)){unitListOpen=false;continue;}

    // Compact force tables use "Formation — Profile — description". Recognize the explicit profile
    // before command vocabulary such as Battle, Vanguard, Reserve, or Garrison can misclassify the row.
    if(!isListLike(original)&&/\s+[—–]\s+|\s+-\s+/.test(plain)){
      const parts=plain.split(/\s+[—–]\s+|\s+-\s+/).map(cleanInline).filter(Boolean);
      if(parts.length>=2){const exact=ruleset.unitLibrary.find(u=>u.profile.toLowerCase()===parts[1].toLowerCase())?.profile||null,inferred=!exact&&!/\b(?:brigade|division|command)\b/i.test(parts[0])?profileForText(parts[0],ruleset):null,profile=exact||inferred;if(profile){addFormation(parts[0],profile,original,currentCommand);continue;}}
    }

    // Any clear period command heading is structural regardless of Markdown depth.
    if(kind&&(depth>0||isBoldOnly(trimmed)||(!isListLike(original)&&/\b(?:division|brigade|artillery|wing|battle|vanguard|reserve|garrison|command)\b/i.test(plain)))){
      let name=plain,commander='',parent=null;
      if(pair&&RANK_RE.test(pair.commander)){name=pair.name;commander=pair.commander;}
      else {
        // Formation headings such as "Robinson's Brigade — Kearny's Division" carry parent context, not a commander.
        const parts=plain.split(/\s+[—–]\s+|\s+-\s+/).map(cleanInline).filter(Boolean);
        if(parts.length>=2&&commandKind(parts[0])&&/\bdivision\b/i.test(parts[1])){name=parts[0];currentDivision=ensureDivision(parts[1]);currentHigherCommand=currentDivision;parent=currentDivision;}
      }
      if(!parent)parent=(kind==='brigade'||kind==='artillery')?(currentDivision||currentHigherCommand):kind==='division'?(commands.find(c=>c.faction===faction&&c.hierarchyLevel==='army')||null):null;
      currentCommand=addCommand({name,commander,sourceText:trimmed,parent,kind});unitListOpen=false;pendingOverall=false;
      if(kind==='division'){currentDivision=currentCommand;currentHigherCommand=currentCommand;}else if(kind==='army'){currentDivision=null;currentHigherCommand=currentCommand;}else if(kind==='command'&&!parent){currentDivision=null;currentHigherCommand=currentCommand;}
      continue;
    }

    // Bulleted compact force rows use the same "Formation — Profile — note" convention.
    if(isListLike(original)&&!unitListOpen&&/\s+[—–]\s+|\s+-\s+/.test(stripMarkup(deList(original)))){
      const compact=stripMarkup(deList(original)),parts=compact.split(/\s+[—–]\s+|\s+-\s+/).map(cleanInline).filter(Boolean);
      if(parts.length>=2){const exact=ruleset.unitLibrary.find(u=>u.profile.toLowerCase()===parts[1].toLowerCase())?.profile||null,inferred=!/\b(?:brigade|division|command)\b/i.test(parts[0])?profileForText(parts[0],ruleset):null,profile=exact||inferred;if(profile){addFormation(parts[0],profile,original,currentCommand);continue;}}
    }

    // List-like command headings are common in historical OOBs (for example "1. Simmons's First Brigade"
    // or "Robinson's Brigade — supports the right"). Treat the command name as structure and the tail as a note.
    const listPlain=isListLike(original)?stripMarkup(deList(original)):'';
    const listParts=listPlain?listPlain.split(/\s+[—–]\s+|\s+-\s+/).map(cleanInline).filter(Boolean):[];
    const listName=listParts[0]||listPlain;
    const listKind=listName?commandKind(listName):'';
    // A narrative tail does not make an otherwise explicit command label into prose.
    // Accept "Robinson's Brigade — supports the right", but require the first segment itself
    // to end with a recognized command-echelon label so ordinary prose mentioning a brigade
    // cannot silently become a command node.
    const explicitListCommandName=/\b(?:division|brigade|artillery|wing|battle|vanguard|reserve|garrison|command)\s*$/i.test(listName);
    if(isListLike(original)&&listKind&&explicitListCommandName&&!rank&&!/^(?:commands?|directs?|holds?|begins?|supports?|role)\b/i.test(listPlain)){unitListOpen=false;
      const parts=listParts,name=listName;
      let parent=(listKind==='brigade'||listKind==='artillery')?(currentDivision||currentHigherCommand||currentCommand):listKind==='division'?(commands.find(c=>c.faction===faction&&c.hierarchyLevel==='army')||null):null;
      if((listKind==='brigade'||listKind==='artillery')&&parts.length>1&&/\bdivision\b/i.test(parts[1])){currentDivision=ensureDivision(parts[1]);currentHigherCommand=currentDivision;parent=currentDivision;}
      currentCommand=addCommand({name,sourceText:trimmed,parent,kind:listKind});
      if(parts.length>1&&!/\bdivision\b/i.test(parts[1]))currentCommand.notes.push(parts.slice(1).join(' — '));
      if(listKind==='division'){currentDivision=currentCommand;currentHigherCommand=currentCommand;}
      continue;
    }

    // Rank bullets under a higher formation create subordinate brigades. This deliberately runs before
    // the generic "rank supplies current commander" rule so Hill's listed brigadiers do not overwrite Hill.
    if(isListLike(original)&&rank&&!unitListOpen&&(rank.tail&&/\bbrigade\b/i.test(rank.tail)||currentDivision||currentHigherCommand)){
      const parent=currentDivision||currentHigherCommand||currentCommand,brigadeName=rank.tail&&/\bbrigade\b/i.test(rank.tail)?rank.tail:`${rank.name.split(/\s+/).at(-1)}'s Brigade`;
      currentCommand=addCommand({name:brigadeName,commander:`${rank.rank} ${rank.name}`,sourceText:trimmed,parent,kind:'brigade'});continue;
    }

    // A standalone ranked name immediately under a command/division supplies that command's commander.
    if(!isListLike(original)&&rank&&!rank.tail&&currentCommand&&!unitListOpen){
      if(!currentCommand.commander)currentCommand.commander=`${rank.rank} ${rank.name}`;continue;
    }
    if(isListLike(original)&&rank&&!rank.tail&&currentCommand&&!unitListOpen){
      currentCommand.commander=`${rank.rank} ${rank.name}`;continue;
    }

    // Unit creation is deliberately strict. After an explicit Units: label, only bullets are units.
    // Outside that state, a bullet must itself look like an enumerated historical formation.
    if(isListLike(original)){
      const parsed=splitExplicitUnitLine(original,ruleset);
      const explicitFormation=parsed.length&&parsed.every(x=>/\b(?:infantry|reserves?|rifles?|sharpshooters?|battalion|battery|cavalry|regiment|militia|zouave|guards?|lands?knechts?|gendarmes?|men-at-arms|pikemen|arquebusiers?|crossbowmen|stradiots?|ginetes?)\b/i.test(x.name)||/\d+(?:st|nd|rd|th)\b/i.test(x.name));
      if(parsed.length&&(unitListOpen||explicitFormation)&&!looksNarrative(original)){
        for(const u of parsed)addFormation(u.name,u.profile,original,currentCommand);
        continue;
      }
    }

    // Legacy/Italian-Wars source tables often express a formation as "Name — Battle Axe Profile — note"
    // without bullets or an explicit Units: label. Preserve that compact, explicit format while still
    // refusing ordinary narrative prose.
    if(!isListLike(original)&&!kind&&!RANK_RE.test(plain)&&/\s+[—–]\s+|\s+-\s+/.test(plain)&&!looksNarrative(original)){
      const parts=plain.split(/\s+[—–]\s+|\s+-\s+/).map(cleanInline).filter(Boolean);
      if(parts.length>=2){const profile=profileForText(parts[1],ruleset);if(profile){addFormation(parts[0],profile,original,currentCommand);continue;}}
    }

    // Non-list prose following a Units block closes the unit-list state. It remains a note.
    if(unitListOpen&&!isListLike(original))unitListOpen=false;
    if(currentCommand&&!isGenericHeading(original))addNote(original);
  }

  for(const c of commands){
    if(!c.armyCommander)c.armyCommander=armyCommanders.get(c.faction)||'';
    c.formations=[...new Set(c.formations)];c.notes=[...new Set(c.notes||[])];
    if(c.scenarioCommander&&!c.historicalCommander&&c.associatedCommander)c.historicalCommander=c.associatedCommander;
    delete c._key;
  }
  return{forces:forces.slice(0,240),commands:commands.slice(0,160),armyCommanders:Object.fromEntries(armyCommanders)};
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
