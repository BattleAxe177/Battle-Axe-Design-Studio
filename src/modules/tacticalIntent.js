export const TACTICAL_INTENT_VERSION='1.0';

export const TACTICAL_ORDERS=Object.freeze(['Auto','Hold','Defend','Advance','Assault','Reserve','Screen','Maneuver','Withdraw']);
export const ARMY_POSTURES=Object.freeze(['Auto','Offensive','Balanced','Defensive','Delay']);

const ORDER_SET=new Set(TACTICAL_ORDERS);
const REGION_SET=new Set(['left','right','nearest','front','rear','center','north','south','east','west']);
const CONDITION_OPS=new Set(['ANY','ALL','NOT']);
const PREDICATE_TYPES=new Set(['turn_reached','unit_destroyed','terrain_occupied','line_breached','line_abandoned','enemy_vulnerable','command_event','proximity']);
const norm=s=>String(s||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();

function commandAliases(c){return[c?.name,c?.commander,c?.commanderName,c?.historicalCommander,c?.scenarioCommanderOverride].map(norm).filter(x=>x.length>=3);}
function phrase(text,value){const n=norm(value);return !!n&&new RegExp(`\\b${n.replace(/ /g,'\\s+')}\\b`).test(norm(text));}
function sideAliases(context={}){
  const out=[];
  for(const side of ['sideA','sideB']){const label=context.sideLabels?.[side]||side;out.push([side,label]);}
  const supplement=norm(context.supplementId||context.ruleset?.supplement||'');
  if(supplement.includes('american civil war'))out.push(['sideA','Union'],['sideA','Federal'],['sideB','Confederate'],['sideB','Confederates'],['sideB','Rebel'],['sideB','Rebels']);
  return out;
}
function resolveSide(text,context){for(const [side,label] of sideAliases(context))if(phrase(text,label))return{side,label:context.sideLabels?.[side]||label,alias:label};return null;}
function resolveCommands(text,context){return(context.commands||[]).filter(c=>commandAliases(c).some(a=>phrase(text,a))).map(c=>({id:c.id,name:c.name||c.id,commander:c.commander||'',side:c.side||c.faction||null}));}
function resolveTerrain(text,context){return(context.terrain||[]).filter(f=>f?.name&&phrase(text,f.name)).map(f=>({id:f.id,name:f.name})).sort((a,b)=>norm(b.name).length-norm(a.name).length);}
function opposite(side){return side==='sideA'?'sideB':'sideA';}

function actionFromText(t,{security=false}={}){
  if(/\b(withdraw|fall back|retire)\b/.test(t))return'Withdraw';
  if(/\b(reserve|hold back)\b/.test(t))return'Reserve';
  if(/\b(screen|skirmish)\b/.test(t))return'Screen';
  if(/\b(assault|charge|attack|strike)\b/.test(t))return'Assault';
  if(security&&/\b(protect|guard|secure|refuse|cover)\b/.test(t))return'Defend';
  if(/\b(maneuver|manoeuvre|envelop|turn the)\b/.test(t))return'Maneuver';
  if(/\b(advance|move forward|press forward)\b/.test(t))return'Advance';
  if(/\b(defend|hold|remain|stay)\b/.test(t))return'Defend';
  return null;
}

function targetRegion(t,{security=false}={}){
  const compass=/\b(northern|north|southern|south|eastern|east|western|west)\b/.exec(t);
  if(compass){const direction={northern:'north',north:'north',southern:'south',south:'south',eastern:'east',east:'east',western:'west',west:'west'}[compass[1]];return{kind:'region',frame:'geographic',region:direction,area:/\bflank\b/.test(t)?'flank':/\b(end|edge)\b/.test(t)?'end':'sector',purpose:security?'security':'offensive'};}
  const relative=/\b(left|right)\s+(?:hand\s+)?flank\b/.exec(t)||/\b(left|right)\s+(?:of|side of)\b/.exec(t);
  if(relative)return{kind:'region',frame:'formation-relative',region:relative[1],area:'flank',purpose:security?'security':'offensive'};
  if(/\bflank\b/.test(t))return{kind:'region',frame:'formation-relative',region:'nearest',area:'flank',purpose:security?'security':'offensive'};
  if(/\brear\b/.test(t))return{kind:'region',frame:'formation-relative',region:'rear',area:'sector',purpose:security?'security':'offensive'};
  if(/\bcent(?:er|re)\b/.test(t))return{kind:'region',frame:'formation-relative',region:'center',area:'sector',purpose:security?'security':'offensive'};
  if(/\bfront\b/.test(t))return{kind:'region',frame:'formation-relative',region:'front',area:'sector',purpose:security?'security':'offensive'};
  return null;
}

function splitConditionClauses(text){
  const lower=String(text||'').replace(/[’']/g,"'");
  const lead=/(?:until|when|once|after|release\s+(?:once|when|after)?|commit\s+(?:once|when|after)?|not\s+before)\s+(.+?)(?=\bthen\b|[.;]|$)/i.exec(lower);
  return lead?.[1]?.trim()||'';
}
function turnPredicate(text){const m=/\b(?:by|on|at|after|before)?\s*turn\s*(\d+)\b/i.exec(text);return m?{type:'turn_reached',turn:Number(m[1])}:null;}
function unitDestroyedPredicate(text,context){
  if(!/\b(destroyed|broken|eliminated|lost)\b/i.test(text))return null;
  const side=resolveSide(text,context)?.side||(/\b(enemy|opposing)\b/i.test(text)?opposite(context.ownSide):/\b(friendly|our|own)\b/i.test(text)?context.ownSide:null);
  const role=/\b(artillery|battery|cannon)\b/i.test(text)?'artillery':/\b(cavalry|horse|mounted)\b/i.test(text)?'cavalry':/\b(infantry|regiment|foot)\b/i.test(text)?'infantry':null;
  const command=resolveCommands(text,context).find(c=>c.id!==context.commandId)||null;
  return{type:'unit_destroyed',side,role,commandId:command?.id||null,quantity:1};
}
function terrainPredicate(text,context){
  if(!/\b(reach|reaches|cross|crosses|enter|enters|occupy|occupies|capture|captures)\b/i.test(text))return null;
  const terrain=resolveTerrain(text,context);if(!terrain.length)return null;
  const side=resolveSide(text,context)?.side||(/\b(enemy|opposing)\b/i.test(text)?opposite(context.ownSide):null);
  const command=resolveCommands(text,context).find(c=>c.id!==context.commandId)||null;
  return{type:'terrain_occupied',terrainIds:terrain.filter(x=>norm(x.name)===norm(terrain[0].name)).map(x=>x.id),terrainName:terrain[0].name,side:command?.side||side||opposite(context.ownSide),commandId:command?.id||null};
}
function simplePredicate(text,context){
  return turnPredicate(text)||unitDestroyedPredicate(text,context)||terrainPredicate(text,context)||
    (/\bline\s+(?:is\s+)?breached|break(?:s|ing)?\s+through|breach(?:es)?\s+the\s+line\b/i.test(text)?{type:'line_breached',side:context.ownSide}:null)||
    (/\bline\s+(?:leaves|abandons)|defenders\s+(?:leave|abandon)\b/i.test(text)?{type:'line_abandoned',side:context.ownSide}:null)||
    (/\benemy\s+(?:is|becomes)?\s*(?:vulnerable|shaken|disordered|disorganized)\b/i.test(text)?{type:'enemy_vulnerable',side:opposite(context.ownSide)}:null);
}
function parseConditionTree(raw,context){
  const clause=splitConditionClauses(raw);if(!clause)return{condition:null,unresolved:[]};
  const normalized=clause.replace(/\bwhichever\s+(?:happens|occurs)\s+first\b/ig,'').replace(/\beither\b/ig,'').trim();
  const op=/\bor\b/i.test(normalized)?'ANY':/\band\b/i.test(normalized)?'ALL':null;
  const pieces=op?normalized.split(op==='ANY'?/\bor\b/i:/\band\b/i):[normalized];
  const predicates=[],unresolved=[];
  for(const piece of pieces){const p=simplePredicate(piece,context);if(p)predicates.push(p);else if(piece.trim())unresolved.push(piece.trim());}
  if(!predicates.length)return{condition:null,unresolved:unresolved.length?unresolved:[clause]};
  if(unresolved.length)return{condition:null,unresolved};
  return{condition:predicates.length===1?predicates[0]:{op,conditions:predicates},unresolved:[]};
}

function postReleaseOrder(t){const m=/\bthen\s+(withdraw|fall back|retire|assault|charge|attack|advance|move forward|press forward|maneuver|manoeuvre|flank|envelop|defend|hold)\b/.exec(t);return m?actionFromText(m[1]):null;}
function humanCondition(c,context){
  if(!c)return'';if(c.op)return`${c.op==='ANY'?'any':'all'} of: ${c.conditions.map(x=>humanCondition(x,context)).join(c.op==='ANY'?' OR ':' AND ')}`;
  if(c.type==='turn_reached')return`Turn ${c.turn} is reached`;
  if(c.type==='unit_destroyed'){const label=context.sideLabels?.[c.side]||c.side||'matching',role=c.role||'unit';return`${label} ${role} is destroyed`;}
  if(c.type==='terrain_occupied')return`${context.sideLabels?.[c.side]||c.side||'matching force'} reaches ${c.terrainName||c.terrainIds?.[0]}`;
  return c.type.replaceAll('_',' ');
}

export function compileTacticalIntent(text,context={}){
  const raw=String(text||'').trim(),t=norm(raw),commands=resolveCommands(raw,context),sideReference=resolveSide(raw,context),terrain=resolveTerrain(raw,context),security=/\b(protect|guard|secure|refuse|cover)\b/.test(t)&&!(/\b(attack|assault|charge|strike)\b/.test(t)),order=actionFromText(t,{security}),region=targetRegion(t,{security}),targetCommand=commands.find(c=>c.id!==context.commandId&&(security?(!c.side||c.side===context.ownSide):(!c.side||c.side!==context.ownSide)))||null;
  const {condition:releaseCondition,unresolved:conditionUnresolved}=parseConditionTree(raw,{...context});
  const conditional=/\b(until|when|once|after|unless|only if|not until|whichever happens first)\b/.test(t);
  const unresolved=[...conditionUnresolved],warnings=[];
  if(conditional&&!releaseCondition&&!conditionUnresolved.length)unresolved.push('conditional clause could not be compiled to an executable predicate');
  if(region&&!targetCommand&&!sideReference&&!security)warnings.push('No explicit target formation or side was named; the live engine will use the opposing force.');
  if(raw&&!order&&!releaseCondition&&!region)unresolved.push('no executable military intent was recognized');
  const target=region?{...region,commandId:targetCommand?.id||null,side:targetCommand?.side||sideReference?.side||(security?context.ownSide:opposite(context.ownSide))}:targetCommand?{kind:'command',commandId:targetCommand.id,side:targetCommand.side||sideReference?.side||null}:sideReference?{kind:'side',side:sideReference.side}:terrain.length===1?{kind:'terrain',terrainIds:[terrain[0].id],terrainName:terrain[0].name}:null;
  const intent={version:TACTICAL_INTENT_VERSION,source:'free-text',scope:context.scope||'command',commandId:context.commandId||null,side:context.ownSide||null,raw,order,mission:security?'flank-security':region?.purpose==='offensive'?'offensive-maneuver':null,target,releaseCondition,postReleaseOrder:postReleaseOrder(t),formationIntent:null,replanTriggers:[],warnings,unresolved,status:!raw?'empty':unresolved.length?'blocked':warnings.length?'understood-with-warning':'understood'};
  const meaning=[];if(order)meaning.push(`Action: ${order}.`);if(target?.frame==='geographic')meaning.push(`${security?'Security':'Spatial target'}: geographic ${target.region} ${target.area}.`);else if(target?.frame==='formation-relative')meaning.push(`${security?'Security':'Spatial target'}: ${target.region} ${target.area} of the target formation, derived from its current facing.`);if(targetCommand)meaning.push(`Target formation: ${targetCommand.name}.`);else if(sideReference)meaning.push(`Side reference: ${sideReference.label}.`);if(releaseCondition)meaning.push(`Release when ${humanCondition(releaseCondition,context)}.`);if(intent.postReleaseOrder)meaning.push(`After release: ${intent.postReleaseOrder}.`);
  const legacyRelease=releaseCondition?.type==='terrain_occupied'?`${context.sideLabels?.[releaseCondition.side]||releaseCondition.side} reaches ${releaseCondition.terrainName}`:null;
  return{...intent,meaning,execution:[...(order?[{field:'order',value:order}]:[]),...(target?[{field:'target',value:target}]:[]),...(legacyRelease?[{field:'releaseTrigger',value:legacyRelease}]:[]),...(releaseCondition?[{field:'releaseCondition',value:releaseCondition}]:[]),...(intent.postReleaseOrder?[{field:'postReleaseOrder',value:intent.postReleaseOrder}]:[])],resolved:{commands,side:sideReference,terrain}};
}

export function validateConditionTree(condition,{knownCommandIds=null,knownTerrainIds=null,path='releaseCondition'}={}){
  const errors=[];if(!condition||typeof condition!=='object')return[`${path} must be an object.`];
  if(condition.op){if(!CONDITION_OPS.has(condition.op))errors.push(`${path}.op is unsupported.`);if(!Array.isArray(condition.conditions)||(condition.op==='NOT'?condition.conditions.length!==1:condition.conditions.length<2))errors.push(`${path}.conditions has invalid arity.`);else condition.conditions.forEach((c,i)=>errors.push(...validateConditionTree(c,{knownCommandIds,knownTerrainIds,path:`${path}.conditions[${i}]`})));return errors;}
  if(!PREDICATE_TYPES.has(condition.type))errors.push(`${path}.type “${condition.type}” is unsupported.`);
  if(condition.type==='turn_reached'&&!(Number(condition.turn)>=1))errors.push(`${path}.turn must be at least 1.`);
  if(condition.commandId&&knownCommandIds&&!knownCommandIds.has(condition.commandId))errors.push(`${path}.commandId “${condition.commandId}” is unknown.`);
  if(condition.type==='terrain_occupied'){if(!Array.isArray(condition.terrainIds)||!condition.terrainIds.length)errors.push(`${path}.terrainIds must contain at least one ID.`);else if(knownTerrainIds)for(const id of condition.terrainIds)if(!knownTerrainIds.has(id))errors.push(`${path}.terrainIds contains unknown ID “${id}”.`);}
  return errors;
}

export function validateTacticalIntent(intent,context={}){
  const errors=[];if(!intent||typeof intent!=='object')return['TacticalIntent must be an object.'];
  if(intent.version!==TACTICAL_INTENT_VERSION)errors.push(`Unsupported TacticalIntent version “${intent.version}”.`);
  if(intent.order&&!ORDER_SET.has(intent.order))errors.push(`Unsupported TacticalIntent order “${intent.order}”.`);
  const knownCommandIds=context.knownCommandIds||new Set((context.commands||[]).map(c=>c.id)),knownTerrainIds=context.knownTerrainIds||new Set((context.terrain||[]).map(f=>f.id));
  if(intent.commandId&&knownCommandIds.size&&!knownCommandIds.has(intent.commandId))errors.push(`Unknown TacticalIntent commandId “${intent.commandId}”.`);
  if(intent.target?.commandId&&knownCommandIds.size&&!knownCommandIds.has(intent.target.commandId))errors.push(`Unknown target commandId “${intent.target.commandId}”.`);
  if(intent.target?.region&&!REGION_SET.has(intent.target.region))errors.push(`Unsupported target region “${intent.target.region}”.`);
  if(intent.target?.frame&&!['formation-relative','geographic'].includes(intent.target.frame))errors.push(`Unsupported target frame “${intent.target.frame}”.`);
  if(intent.releaseCondition)errors.push(...validateConditionTree(intent.releaseCondition,{knownCommandIds,knownTerrainIds}));
  return errors;
}

export function normalizeExternalTacticalIntent(row,context={}){
  const supplied=row?.tactical_intent||row?.tacticalIntent||null;
  let externalTarget=row?.target||null;if(externalTarget&&!externalTarget.kind){const id=externalTarget.id||externalTarget.command_id||null,region=externalTarget.region||null,type=externalTarget.type||'formation';externalTarget=type==='terrain'?{kind:'terrain',terrainIds:id?[id]:externalTarget.terrain_ids||[],terrainName:externalTarget.name||null}:region?{kind:'region',frame:['north','south','east','west'].includes(region)?'geographic':'formation-relative',region,area:'flank',purpose:'offensive',commandId:id,side:externalTarget.side||null}:{kind:type==='side'?'side':'command',commandId:type==='side'?null:id,side:externalTarget.side||null};}
  const intent=supplied?structuredClone(supplied):{version:TACTICAL_INTENT_VERSION,source:'external-ai',scope:'command',commandId:context.commandId||null,side:context.ownSide||null,raw:row?.text||'',order:row?.order||null,mission:row?.mission||null,target:externalTarget,releaseCondition:row?.release_condition||row?.releaseCondition||null,postReleaseOrder:row?.post_release_order||row?.postReleaseOrder||null,formationIntent:row?.formation_intent||row?.formationIntent||null,replanTriggers:row?.replan_triggers||row?.replanTriggers||[],warnings:[],unresolved:[],status:'understood'};
  intent.version=intent.version||TACTICAL_INTENT_VERSION;intent.source='external-ai';intent.scope=intent.scope||'command';intent.commandId=intent.commandId||context.commandId||null;intent.side=intent.side||context.ownSide||null;intent.order=intent.order||row?.order||null;intent.warnings=Array.isArray(intent.warnings)?intent.warnings:[];intent.unresolved=Array.isArray(intent.unresolved)?intent.unresolved:[];intent.replanTriggers=Array.isArray(intent.replanTriggers)?intent.replanTriggers:[];
  const errors=validateTacticalIntent(intent,context);if(errors.length)throw new Error(errors.join(' '));return intent;
}

export function intentToLegacyModifiers(intent){
  const target=intent?.target||{},out={tacticalIntent:intent||null,releaseCondition:intent?.releaseCondition||null,postReleaseOrder:intent?.postReleaseOrder||null,targetRegion:target.frame==='formation-relative'?target.region:null,targetGeographicRegion:target.frame==='geographic'?target.region:null,targetCommandId:target.commandId||null,targetSide:target.side||null,conditionalAdvance:!!intent?.releaseCondition,unparsedConditional:!!intent?.unresolved?.length};
  if(intent?.mission==='flank-security')out.screenFlank=true;
  return out;
}
