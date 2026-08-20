export function lengthToInches(value,units='inches'){
  const n=Number(value)||0;
  const u=String(units||'inches').toLowerCase();
  if(u.startsWith('ft')||u.startsWith('foot')||u.startsWith('feet'))return n*12;
  if(u.startsWith('mm'))return n/25.4;
  if(u.startsWith('cm'))return n/2.54;
  if(u.startsWith('m')&&!u.startsWith('mm'))return n*39.37007874;
  return n;
}
export function playSpaceInches(playSpace={}){
  return{
    width:Math.max(.001,lengthToInches(playSpace.width||48,playSpace.units||'inches')),
    height:Math.max(.001,lengthToInches(playSpace.height||48,playSpace.units||'inches'))
  };
}
export function mmToInches(mm){return Number(mm||0)/25.4;}
export function footprintPercent(mm,playSpace={}){
  const p=playSpaceInches(playSpace),size=mmToInches(mm);
  return{width:size/p.width*100,height:size/p.height*100};
}
export function battlefieldAspect(playSpace={}){
  const p=playSpaceInches(playSpace);return p.width/p.height;
}
export function applyBattlefieldAspect(el,playSpace={}){
  if(!el)return battlefieldAspect(playSpace);
  const p=playSpaceInches(playSpace);
  el.style.setProperty('--battlefield-width',String(p.width));
  el.style.setProperty('--battlefield-height',String(p.height));
  el.style.aspectRatio=`${p.width} / ${p.height}`;
  return p.width/p.height;
}
