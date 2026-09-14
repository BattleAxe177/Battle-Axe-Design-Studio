import { validateConditionTree } from './tacticalIntent.js?v=0.6.9.1';

export const RULE_AUTOMATION_VERSION='1.0';
export const RULE_AUTOMATION_STATUSES=Object.freeze(['tabletop','needs-validation','partial','automated']);

const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
const sideIds=new Set(['sideA','sideB']);
const timings=new Set(['setup','turn-start','side-turn-start','after-action']);
const persistenceModes=new Set(['once','while-condition','permanent']);
const actionTypes=new Set(['set-turn-one-initiative']);

export function ruleAutomationContext(scenario={},terrain=[]){
  const commands=Object.values(scenario.commands||{}).flat();
  return{
    knownCommandIds:new Set(commands.map(c=>c.id)),
    knownTerrainIds:new Set((terrain||[]).map(f=>f.id)),
    knownUnitIds:new Set(commands.flatMap(c=>(c.units||[]).map(u=>u.id))),
    knownZoneIds:new Set((scenario.deployment?.zones||[]).map(z=>z.id))
  };
}

export function validateRuleImplementation(value,context={}){
  const errors=[];
  if(!object(value))return['Structured implementation must be a JSON object.'];
  if(value.version!==RULE_AUTOMATION_VERSION)errors.push(`Unsupported rule-automation version “${value.version||''}”.`);
  if(!timings.has(value.timing))errors.push('timing must be setup, turn-start, side-turn-start, or after-action.');
  if(value.affectedSideId!=null&&!sideIds.has(value.affectedSideId))errors.push(`Unknown affectedSideId “${value.affectedSideId}”.`);
  if(value.affectedCommandId&&context.knownCommandIds?.size&&!context.knownCommandIds.has(value.affectedCommandId))errors.push(`Unknown affectedCommandId “${value.affectedCommandId}”.`);
  if(value.condition)errors.push(...validateConditionTree(value.condition,{knownCommandIds:context.knownCommandIds,knownTerrainIds:context.knownTerrainIds,knownUnitIds:context.knownUnitIds,knownZoneIds:context.knownZoneIds,path:'condition'}));
  if(!Array.isArray(value.actions)||!value.actions.length)errors.push('actions must contain at least one supported action.');
  for(const [index,action] of (value.actions||[]).entries()){
    if(!object(action)){errors.push(`actions[${index}] must be an object.`);continue;}
    if(!actionTypes.has(action.type)){errors.push(`actions[${index}].type “${action.type||''}” is unsupported.`);continue;}
    if(action.type==='set-turn-one-initiative'&&!sideIds.has(action.sideId))errors.push(`actions[${index}].sideId must be sideA or sideB.`);
  }
  if(!persistenceModes.has(value.persistence))errors.push('persistence must be once, while-condition, or permanent.');
  return errors;
}

function conditionText(condition){
  if(!condition)return'Always';
  if(condition.op==='NOT')return`NOT (${conditionText(condition.conditions?.[0])})`;
  if(condition.op)return`${condition.op} (${(condition.conditions||[]).map(conditionText).join(condition.op==='ANY'?' OR ':' AND ')})`;
  if(condition.type==='turn_reached')return`Turn ${condition.turn} is reached`;
  if(condition.type==='unit_destroyed')return`${condition.side||'matching side'} ${condition.role||'unit'} destroyed`;
  if(condition.type==='terrain_crossed')return`${condition.side||'matching side'} has crossed ${condition.terrainName||condition.terrainIds?.join(', ')}`;
  if(condition.type==='terrain_occupied')return`${condition.side||'matching side'} occupies ${condition.terrainName||condition.terrainIds?.join(', ')}`;
  return String(condition.type||'Unsupported predicate');
}

function actionText(action){
  if(action.type==='set-turn-one-initiative')return`Set Turn 1 initiative to ${action.sideId}`;
  return `Unsupported action: ${action.type||'missing type'}`;
}

export function renderRuleEngineInterpretation(value,context={}){
  const errors=validateRuleImplementation(value,context);
  if(errors.length)return`No validated executable implementation.\nUnsupported elements:\n- ${errors.join('\n- ')}`;
  return[
    `Affected side/command: ${value.affectedCommandId||value.affectedSideId||'Scenario-wide'}`,
    `Initial state: ${value.initialState||'No state change before evaluation'}`,
    `Evaluation timing: ${value.timing}`,
    `Condition: ${conditionText(value.condition)}`,
    `Action: ${value.actions.map(actionText).join('; ')}`,
    `Persistence: ${value.persistence}`,
    'Unsupported elements: None'
  ].join('\n');
}

export function executableScenarioRuleImplementations(scenario={},terrain=[]){
  const context=ruleAutomationContext(scenario,terrain),rows=[];
  for(const rule of scenario.scenarioRules||[]){
    if(rule.status==='removed'||rule.engineStatus!=='automated'||rule.automationStale)continue;
    const errors=validateRuleImplementation(rule.implementation,context);
    if(!errors.length)rows.push({ruleId:rule.id,title:rule.title||'Scenario rule',implementation:structuredClone(rule.implementation)});
  }
  return rows;
}

export function applySetupRuleImplementations(structuredRules={},implementations=[]){
  const out={...structuredRules};
  for(const row of implementations){
    if(row.implementation.timing!=='setup')continue;
    for(const action of row.implementation.actions||[])if(action.type==='set-turn-one-initiative')out.turnOneInitiative=action.sideId;
  }
  return out;
}
