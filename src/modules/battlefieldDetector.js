const COLORS = {
  water: '#69D9E5',
  wood: '#3B7D23',
  wall: '#F2AA84',
  avenue: '#196B24',
  bridge: '#595959',
  structure: '#747474',
  track: '#726530',
  boundary: '#042433'
};

const norm = value => (value || '').trim().toUpperCase();
const colorEq = (a,b) => norm(a) === norm(b);

function rectToBox(r){
  if(!r) return null;
  const width = Number(r.width) || 0, height = Number(r.height) || 0;
  if(width < 0 || height < 0) return null;
  return {x:Number(r.x ?? r.left) || 0, y:Number(r.y ?? r.top) || 0, width, height};
}

function visualBox(element) {
  // getBoundingClientRect is deliberately preferred here. The imported PowerPoint SVG
  // contains nested transforms and namespace-prefixed groups; browser-layout coordinates
  // are the most reliable common coordinate system for review overlays.
  try {
    const r = element.getBoundingClientRect();
    if (r && (r.width > 0 || r.height > 0)) return rectToBox(r);
  } catch {}
  try {
    const b = element.getBBox();
    return rectToBox(b);
  } catch { return null; }
}

function overlap(a,b) {
  return !!(a && b && a.x <= b.x+b.width && a.x+a.width >= b.x && a.y <= b.y+b.height && a.y+a.height >= b.y);
}

function clipBox(b, bound) {
  if(!b || !bound) return null;
  const x1=Math.max(b.x,bound.x), y1=Math.max(b.y,bound.y), x2=Math.min(b.x+b.width,bound.x+bound.width), y2=Math.min(b.y+b.height,bound.y+bound.height);
  if (x2 < x1 || y2 < y1) return null;
  return {x:x1,y:y1,width:Math.max(0,x2-x1),height:Math.max(0,y2-y1)};
}

function percentBox(b,bound,pad=0) {
  const c=clipBox(b,bound); if(!c || !bound.width || !bound.height) return null;
  let left=(c.x-bound.x)/bound.width*100, top=(c.y-bound.y)/bound.height*100;
  let width=c.width/bound.width*100, height=c.height/bound.height*100;
  left=Math.max(0,left-pad); top=Math.max(0,top-pad);
  width=Math.min(100-left,width+pad*2); height=Math.min(100-top,height+pad*2);
  // Give very thin linework a visible overlay footprint without changing source geometry.
  if(width < 0.35) width = Math.min(100-left,0.35);
  if(height < 0.35) height = Math.min(100-top,0.35);
  return [left,top,width,height];
}

function unionBox(items) {
  const boxes=items.map(x=>x.bbox).filter(Boolean); if(!boxes.length)return null;
  const x=Math.min(...boxes.map(b=>b.x)), y=Math.min(...boxes.map(b=>b.y));
  const x2=Math.max(...boxes.map(b=>b.x+b.width)), y2=Math.max(...boxes.map(b=>b.y+b.height));
  return {x,y,width:x2-x,height:y2-y};
}

function distanceBoxes(a,b) {
  if(!a || !b) return Infinity;
  const dx=Math.max(a.x-(b.x+b.width), b.x-(a.x+a.width), 0);
  const dy=Math.max(a.y-(b.y+b.height), b.y-(a.y+a.height), 0);
  return Math.hypot(dx,dy);
}

function center(b){ return b ? {x:b.x+b.width/2,y:b.y+b.height/2} : null; }
function pointDistanceToBox(p,b){
  if(!p || !b) return Infinity;
  const dx=Math.max(b.x-p.x, p.x-(b.x+b.width), 0);
  const dy=Math.max(b.y-p.y, p.y-(b.y+b.height), 0);
  return Math.hypot(dx,dy);
}

function cluster(items, tolerance=12) {
  const pending=[...items], groups=[];
  while(pending.length){
    const group=[pending.shift()]; let changed=true;
    while(changed){changed=false; const ub=unionBox(group);
      for(let i=pending.length-1;i>=0;i--){if(distanceBoxes(ub,pending[i].bbox)<=tolerance){group.push(pending.splice(i,1)[0]);changed=true;}}
    }
    groups.push(group);
  }
  return groups;
}

function assignGeometryIds(svg) {
  let n=0;
  for(const el of svg.querySelectorAll('path,rect,line,polyline,polygon,circle,ellipse,image,use,g')){
    if(!el.dataset.baGeometryId) el.dataset.baGeometryId=`ba-geom-${++n}`;
  }
}

function findBoundary(svg) {
  // Prefer the actual rendered black play-space border. Falling back to the SVG itself
  // keeps detector coordinates in the same browser-layout coordinate system.
  for(const rect of svg.querySelectorAll('rect')) {
    if(colorEq(rect.getAttribute('stroke'),COLORS.boundary)) {
      const b=visualBox(rect); if(b && b.width && b.height) return b;
    }
  }
  const b=visualBox(svg);
  if(b && b.width && b.height) return b;
  return {x:0,y:0,width:1000,height:1000};
}

function collect(svg,bound,predicate, selector='path,rect,line,polyline,polygon,circle,ellipse') {
  const out=[];
  for(const el of svg.querySelectorAll(selector)){
    if(!predicate(el)) continue;
    const bbox=visualBox(el); if(!bbox||!overlap(bbox,bound)) continue;
    out.push({el,bbox,id:el.dataset.baGeometryId});
  }
  return out;
}

function featureFromGroup(group, opts, bound) {
  const bbox=unionBox(group);
  const box=percentBox(bbox,bound,0.7);
  return {
    ...opts,
    detectionConfidence: opts.detectionConfidence ?? 99,
    interpretationConfidence: opts.interpretationConfidence ?? opts.confidence ?? 80,
    confidence: opts.interpretationConfidence ?? opts.confidence ?? 80,
    box,
    elementIds:group.map(x=>x.id).filter(Boolean)
  };
}

function findText(svg, needle) {
  const target=needle.toLowerCase();
  return [...svg.querySelectorAll('text')].find(t => (t.textContent||'').trim().toLowerCase()===target);
}
function textCenter(el){ return center(visualBox(el)); }

function nearestWallDistance(walls,bbox){ return Math.min(...walls.map(w=>distanceBoxes(w.bbox,bbox)),Infinity); }

function gateAnchor(svg,bound,walls,labelText){
  const text=findText(svg,labelText); if(!text) return null;
  const labelPoint=textCenter(text); if(!labelPoint) return null;
  const maxLabelDistance=Math.max(90,bound.width*.16);
  const maxWallDistance=Math.max(24,bound.width*.035);
  const mapArea=bound.width*bound.height;
  const candidates=[];
  for(const el of svg.querySelectorAll('image,use,rect,path,g')){
    if(el===text || el.getAttribute('stroke')===COLORS.wall) continue;
    const bbox=visualBox(el); if(!bbox || !overlap(bbox,bound)) continue;
    const area=Math.max(1,bbox.width*bbox.height);
    if(area > mapArea*.012 || (bbox.width<2 && bbox.height<2)) continue;
    const labelD=pointDistanceToBox(labelPoint,bbox);
    if(labelD>maxLabelDistance) continue;
    const wallD=nearestWallDistance(walls,bbox);
    if(wallD>maxWallDistance) continue;
    // Favor compact symbols close to the label and actually coincident with wall geometry.
    const aspect=Math.max(bbox.width/Math.max(1,bbox.height),bbox.height/Math.max(1,bbox.width));
    const score=labelD + wallD*3 + Math.max(0,aspect-5)*8 + Math.log(area+1)*.35;
    candidates.push({el,bbox,id:el.dataset.baGeometryId,score,wallD,labelD});
  }
  candidates.sort((a,b)=>a.score-b.score);
  return candidates[0] || null;
}

function nearestWallPointBox(bound,walls,labelText){
  const text=findText(svg,labelText);
  return null;
}

function syntheticOpening(svg,bound,walls,needle,name,id,kind='Gatehouse',interp=88){
  const text=findText(svg,needle); if(!text)return null;
  const target=textCenter(text); if(!target)return null;
  const anchor=gateAnchor(svg,bound,walls,needle);
  let bbox, elementIds=[];
  if(anchor){
    bbox=anchor.bbox; elementIds=[anchor.id];
  } else {
    // Conservative fallback: a small marker centered on the label itself. This is preferable
    // to relocating a gate to an arbitrary wall segment when no map symbol can be resolved.
    const s=Math.max(10,bound.width*.018);
    bbox={x:target.x-s/2,y:target.y-s/2,width:s,height:s};
  }
  return {
    id,name,category:'Crossings & Openings',proposal:kind==='Breach'?'Rubble breach / wall opening':'Fortified gatehouse / wall opening',cls:kind,effects:['Difficult'],
    detectionConfidence:anchor?96:78,interpretationConfidence:interp,confidence:interp,
    box:percentBox(bbox,bound,0.6), elementIds,
    reason:anchor
      ? `Map-first detection: the source label “${name}” is linked to a compact rendered object adjacent to detected wall geometry. Historical context was not used to place it.`
      : `Map-first fallback: the source label “${name}” was detected, but no reliable gatehouse symbol could be linked automatically. The review marker remains at the map label rather than inventing a location.`
  };
}

export function detectBattlefieldFeatures(svg, {mapNotes=''}={}) {
  assignGeometryIds(svg);
  const bound=findBoundary(svg);
  const byFill = color => collect(svg,bound,el=>colorEq(el.getAttribute('fill'),color));
  const byStroke = color => collect(svg,bound,el=>colorEq(el.getAttribute('stroke'),color));

  const waters=byFill(COLORS.water), woods=byFill(COLORS.wood), walls=byStroke(COLORS.wall), avenues=byStroke(COLORS.avenue), bridges=byFill(COLORS.bridge), structures=byFill(COLORS.structure), tracks=byFill(COLORS.track);
  const features=[], candidates=[];
  let classified=0;

  waters.forEach((item,i)=>{classified++; features.push(featureFromGroup([item],{
    id:`map-water-${i+1}`,name:`Detected water / wet channel ${i+1}`,category:'Hydrology',proposal:'Stream / wet channel',cls:'Stream',effects:['Difficult'],
    detectionConfidence:99,interpretationConfidence:88,
    reason:'Detected directly from long cyan source-map geometry. Classification uses map color and geometry; historical battlefield text is not used for detection.'
  },bound));});

  woods.forEach((item,i)=>{classified++; features.push(featureFromGroup([item],{
    id:`map-wood-${i+1}`,name:`Woodland block ${i+1}`,category:'Woods & Groves',proposal:'Woodland polygon',cls:'Dense Wood',effects:['Difficult','Obscuring'],
    detectionConfidence:99,interpretationConfidence:84,
    reason:'Detected directly from irregular green source-map polygon geometry.'
  },bound));});

  cluster(walls,18).forEach((group,i)=>{classified+=group.length; features.push(featureFromGroup(group,{
    id:`map-wall-${i+1}`,name:`Park wall segment ${i+1}`,category:'Walls & Fortifications',proposal:'Masonry wall',cls:'Masonry Wall',effects:['Impassable','Tall'],
    detectionConfidence:99,interpretationConfidence:94,
    reason:'Detected directly from salmon source-map linework forming the park enclosure. Nearby openings are modeled separately.'
  },bound));});

  cluster(avenues,14).forEach((group,i)=>{classified+=group.length; features.push(featureFromGroup(group,{
    id:`map-avenue-trees-${i+1}`,name:`Roadside tree line ${i+1}`,category:'Vegetation Lines',proposal:'Tree-lined avenue vegetation',cls:'Open Grove',effects:['Obscuring'],
    detectionConfidence:99,interpretationConfidence:80,
    reason:'Detected from paired green source-map linework; kept separate from woodland polygons.'
  },bound));});

  bridges.forEach((item,i)=>{classified++; features.push(featureFromGroup([item],{
    id:`map-crossing-${i+1}`,name:`Possible bridge / crossing ${i+1}`,category:'Crossings & Openings',proposal:'Bridge or culvert crossing',cls:'Bridge',effects:[],
    detectionConfidence:99,interpretationConfidence:72,
    reason:'Compact dark-gray source geometry resembles bridge/crossing symbols used on this map. It is promoted for explicit review rather than silently accepted.'
  },bound));});

  const openings=[
    syntheticOpening(svg,bound,walls,'Pescarina','Porta Pescarina','map-gate-pescarina','Gatehouse',91),
    syntheticOpening(svg,bound,walls,'Repentita','Porta Repentita','map-gate-repentita','Gatehouse',88),
    syntheticOpening(svg,bound,walls,'Riazzo','Porta Riazzo','map-gate-riazzo','Gatehouse',86),
    syntheticOpening(svg,bound,walls,'Due Porte','Due Porte','map-gate-due-porte','Gatehouse',82),
    syntheticOpening(svg,bound,walls,'Breach','Imperial breach','map-breach','Breach',92)
  ].filter(Boolean);
  classified+=openings.length; features.push(...openings);

  // Mirabello: source label + nearest compact structure is map evidence, not historical-context placement.
  const mirText=findText(svg,'Mirabello');
  if(mirText && structures.length){
    const target=textCenter(mirText);
    const nearest=[...structures].sort((a,b)=>pointDistanceToBox(target,a.bbox)-pointDistanceToBox(target,b.bbox))[0];
    classified++;
    features.push(featureFromGroup([nearest],{id:'map-mirabello',name:'Castello Mirabello',category:'Structures',proposal:'Major structure / castle complex',cls:'Building',effects:['Impassable','Tall','Defensive'],detectionConfidence:98,interpretationConfidence:85,reason:'Source-map text label is linked to the nearest compact structure geometry. Placement comes from the imported map.'},bound));
  }

  const usedStructureIds=new Set(features.flatMap(f=>f.elementIds||[]));
  structures.filter(x=>!usedStructureIds.has(x.id)).forEach((item,i)=>candidates.push(featureFromGroup([item],{
    id:`candidate-structure-${i+1}`,name:`Additional compact structure ${i+1}`,kind:'building / gatehouse / landmark',proposal:'Unclassified compact structure',cls:'Unknown',effects:[],detectionConfidence:99,interpretationConfidence:46,confidence:46,
    reason:'Clearly detected source geometry, but its gameplay role is ambiguous. Review in Geometry Explorer if it matters.'
  },bound)));
  tracks.forEach((item,i)=>candidates.push(featureFromGroup([item],{
    id:`candidate-track-${i+1}`,name:`Possible route / boundary ${i+1}`,kind:'brown linear or patterned geometry',proposal:'Possible road, track, ditch, or decorative line',cls:'Unknown',effects:[],detectionConfidence:98,interpretationConfidence:48,confidence:48,
    reason:'Detected directly from source geometry. It is not promoted because this visual convention can represent several map elements.'
  },bound)));

  const visualObjects=[];
  for(const el of svg.querySelectorAll('image,use')){
    const bbox=visualBox(el); if(!bbox||!overlap(bbox,bound))continue;
    const c=clipBox(bbox,bound); if(!c)continue;
    const area=c.width*c.height, mapArea=bound.width*bound.height;
    const ratio=Math.max(c.width/Math.max(c.height,1),c.height/Math.max(c.width,1));
    if(area<8 || area>mapArea*.035 || ratio>35)continue;
    visualObjects.push({el,bbox:c,id:el.dataset.baGeometryId,area});
  }
  visualObjects.sort((a,b)=>b.area-a.area).slice(0,60).forEach((item,i)=>candidates.push(featureFromGroup([item],{
    id:`candidate-rendered-${i+1}`,name:`Additional rendered map object ${i+1}`,kind:'rendered/grouped source object',proposal:'Unclassified rendered feature',cls:'Unknown',effects:[],detectionConfidence:96,interpretationConfidence:25,confidence:25,
    reason:'Detected as a discrete rendered object in the imported SVG but intentionally withheld from normal review. Use Geometry Explorer only if this object is gameplay-relevant.'
  },bound)));

  const promoted=features.filter(f=>Array.isArray(f.box) && f.box.every(Number.isFinite));
  const cleanedCandidates=candidates.filter(c=>Array.isArray(c.box) && c.box.every(Number.isFinite) && c.box[2]*c.box[3]>.01);
  const raw=waters.length+woods.length+walls.length+avenues.length+bridges.length+structures.length+tracks.length;
  return {
    features:promoted,
    candidates:cleanedCandidates,
    boundary:bound,
    stats:{
      raw, classified, promoted:promoted.length, explorer:cleanedCandidates.length,
      water:waters.length,wood:woods.length,wall:walls.length,avenue:avenues.length,bridge:bridges.length,structure:structures.length,track:tracks.length
    }
  };
}
