/**
 * Battle Axe core road rule (v0.6.5.0).
 * Roads never add distance. For MOVEMENT ONLY, any base overlap with a road suppresses
 * Difficult/Impassable movement effects from underlying terrain. Non-movement effects remain.
 */
const norm=s=>String(s||'').trim().toLowerCase();
export function isRoadFeature(feature){
  const effects=Array.isArray(feature?.effects)?feature.effects:[feature?.effects].filter(Boolean);
  if(effects.some(e=>norm(e)==='road'))return true;
  const cls=norm(feature?.classification||feature?.cls);
  if(cls==='road')return true;
  // Names may carry a road identity even when legacy data lacks the explicit Road effect.
  // Generic Track terrain remains separate unless the author classified it as a Road.
  const hay=[feature?.type,feature?.name,feature?.label].map(norm).join(' ');
  return /\b(?:road|avenue|causeway|turnpike|sunken lane)\b/.test(hay);
}
export function roadMovementOpen(baseOverlapsRoad){return !!baseOverlapsRoad;}
export function movementEffectsWithRoadOverlap(effects=[],baseOverlapsRoad=false){
  const list=Array.isArray(effects)?effects:[effects];
  if(!baseOverlapsRoad)return [...list];
  return list.filter(effect=>!['difficult','impassable'].includes(norm(effect)));
}
export function movementBlockedByTerrain(effects=[],baseOverlapsRoad=false){
  return movementEffectsWithRoadOverlap(effects,baseOverlapsRoad).some(e=>norm(e)==='impassable');
}
export function movementDistanceMultiplier(effects=[],baseOverlapsRoad=false){
  // No road speed bonus: the maximum is always 1.0.
  return movementEffectsWithRoadOverlap(effects,baseOverlapsRoad).some(e=>norm(e)==='difficult')?0.5:1;
}
export function nonMovementEffects(effects=[]){return Array.isArray(effects)?[...effects]:[effects];}
