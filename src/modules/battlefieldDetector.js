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

function rootPoint(svg, element, x, y) {
  const point = new DOMPoint(x, y);
  const m = element.getCTM();
  return m ? point.matrixTransform(m) : point;
}

function transformedBox(svg, element) {
  let b;
  try { b = element.getBBox(); } catch { return null; }
  const pts = [
    rootPoint(svg, element, b.x, b.y), rootPoint(svg, element, b.x + b.width, b.y),
    rootPoint(svg, element, b.x, b.y + b.height), rootPoint(svg, element, b.x + b.width, b.y + b.height)
  ];
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return {x:Math.min(...xs), y:Math.min(...ys), width:Math.max(...xs)-Math.min(...xs), height:Math.max(...ys)-Math.min(...ys)};
}

function overlap(a,b) {
  return a && b && a.x <= b.x+b.width && a.x+a.width >= b.x && a.y <= b.y+b.height && a.y+a.height >= b.y;
}

function clipBox(b, bound) {
  const x1=Math.max(b.x,bound.x), y1=Math.max(b.y,bound.y), x2=Math.min(b.x+b.width,bound.x+bound.width), y2=Math.min(b.y+b.height,bound.y+bound.height);
  if (x2<=x1 || y2<=y1) return null;
  return {x:x1,y:y1,width:x2-x1,height:y2-y1};
}

function percentBox(b,bound,pad=0) {
  const c=clipBox(b,bound); if(!c) return null;
  const left=(c.x-bound.x)/bound.width*100, top=(c.y-bound.y)/bound.height*100;
  const width=c.width/bound.width*100, height=c.height/bound.height*100;
  return [Math.max(0,left-pad),Math.max(0,top-pad),Math.min(100-left+pad,width+pad*2),Math.min(100-top+pad,height+pad*2)];
}

function unionBox(items) {
  const boxes=items.map(x=>x.bbox).filter(Boolean); if(!boxes.length)return null;
  const x=Math.min(...boxes.map(b=>b.x)), y=Math.min(...boxes.map(b=>b.y));
  const x2=Math.max(...boxes.map(b=>b.x+b.width)), y2=Math.max(...boxes.map(b=>b.y+b.height));
  return {x,y,width:x2-x,height:y2-y};
}

function distanceBoxes(a,b) {
  const dx=Math.max(a.x-(b.x+b.width), b.x-(a.x+a.width), 0);
  const dy=Math.max(a.y-(b.y+b.height), b.y-(a.y+a.height), 0);
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
  for(const el of svg.querySelectorAll('path,rect,line,polyline,polygon,circle,ellipse,image,use')){
    if(!el.dataset.baGeometryId) el.dataset.baGeometryId=`ba-geom-${++n}`;
  }
}

function findBoundary(svg) {
  for(const rect of svg.querySelectorAll('rect')) {
    if(colorEq(rect.getAttribute('stroke'),COLORS.boundary)) return transformedBox(svg,rect);
  }
  const vb=svg.viewBox?.baseVal;
  return vb && vb.width ? {x:vb.x,y:vb.y,width:vb.width,height:vb.height} : {x:0,y:0,width:1280,height:720};
}

function collect(svg,bound,predicate) {
  const out=[];
  for(const el of svg.querySelectorAll('path,rect,line,polyline,polygon,circle,ellipse')){
    if(!predicate(el)) continue;
    const bbox=transformedBox(svg,el); if(!bbox||!overlap(bbox,bound)) continue;
    out.push({el,bbox,id:el.dataset.baGeometryId});
  }
  return out;
}

function featureFromGroup(group, opts, bound) {
  const bbox=unionBox(group); return {
    ...opts,
    detectionConfidence: opts.detectionConfidence ?? 99,
    interpretationConfidence: opts.interpretationConfidence ?? opts.confidence ?? 80,
    confidence: opts.interpretationConfidence ?? opts.confidence ?? 80,
    box:percentBox(bbox,bound,0.7),
    elementIds:group.map(x=>x.id)
  };
}

function lineSampleClosest(svg, paths, target) {
  let best=null;
  for(const item of paths){
    const path=item.el; if(typeof path.getTotalLength!=='function') continue;
    let len; try{len=path.getTotalLength();}catch{continue;}
    const steps=Math.max(10,Math.min(80,Math.ceil(len/12)));
    for(let i=0;i<=steps;i++){
      const p=path.getPointAtLength(len*i/steps); const rp=rootPoint(svg,path,p.x,p.y);
      const d=Math.hypot(rp.x-target.x,rp.y-target.y);
      if(!best||d<best.d) best={d,x:rp.x,y:rp.y,item};
    }
  }
  return best;
}

function findText(svg, needle) {
  return [...svg.querySelectorAll('text')].find(t => (t.textContent||'').trim().toLowerCase()===needle.toLowerCase());
}

function textCenter(svg,el){const b=transformedBox(svg,el);return b?{x:b.x+b.width/2,y:b.y+b.height/2}:null;}

function syntheticOpening(svg,bound,walls,needle,name,id,kind='Gatehouse',interp=88){
  const text=findText(svg,needle); if(!text)return null;
  const target=textCenter(svg,text); if(!target)return null;
  const nearest=lineSampleClosest(svg,walls,target); if(!nearest)return null;
  const s=Math.max(10,bound.width*.022);
  return {
    id,name,category:'Crossings & Openings',proposal:kind==='Breach'?'Rubble breach / wall opening':'Fortified gatehouse / wall opening',cls:kind,effects:['Difficult'],
    detectionConfidence:98,interpretationConfidence:interp,confidence:interp,
    box:percentBox({x:nearest.x-s/2,y:nearest.y-s/2,width:s,height:s},bound,0.6),
    relatedElementIds:[nearest.item.id],
    reason:`Map-first detection: the source-map label “${name}” is associated with the nearest detected wall geometry. Historical context was not used to place this feature.`
  };
}

export function detectBattlefieldFeatures(svg, {mapNotes=''}={}) {
  assignGeometryIds(svg);
  const bound=findBoundary(svg);
  const byFill = color => collect(svg,bound,el=>colorEq(el.getAttribute('fill'),color));
  const byStroke = color => collect(svg,bound,el=>colorEq(el.getAttribute('stroke'),color));

  const waters=byFill(COLORS.water), woods=byFill(COLORS.wood), walls=byStroke(COLORS.wall), avenues=byStroke(COLORS.avenue), bridges=byFill(COLORS.bridge), structures=byFill(COLORS.structure), tracks=byFill(COLORS.track);
  const features=[], candidates=[];

  waters.forEach((item,i)=>features.push(featureFromGroup([item],{
    id:`map-water-${i+1}`,name:`Detected water / wet channel ${i+1}`,category:'Hydrology',proposal:'Stream / wet channel',cls:'Stream',effects:['Difficult'],
    detectionConfidence:99,interpretationConfidence:88,
    reason:'Detected directly from long cyan source-map geometry. Classification uses color and shape; historical battlefield text is not used for detection.'
  },bound)));

  woods.forEach((item,i)=>features.push(featureFromGroup([item],{
    id:`map-wood-${i+1}`,name:`Woodland block ${i+1}`,category:'Woods & Groves',proposal:'Woodland polygon',cls:'Dense Wood',effects:['Difficult','Obscuring'],
    detectionConfidence:99,interpretationConfidence:84,
    reason:'Detected directly from irregular green source-map polygon geometry.'
  },bound)));

  cluster(walls,18).forEach((group,i)=>features.push(featureFromGroup(group,{
    id:`map-wall-${i+1}`,name:`Park wall segment ${i+1}`,category:'Walls & Fortifications',proposal:'Masonry wall',cls:'Masonry Wall',effects:['Impassable','Tall'],
    detectionConfidence:99,interpretationConfidence:94,
    reason:'Detected directly from salmon source-map linework forming the park enclosure. Nearby openings are modeled separately.'
  },bound)));

  cluster(avenues,14).forEach((group,i)=>features.push(featureFromGroup(group,{
    id:`map-avenue-trees-${i+1}`,name:`Roadside tree line ${i+1}`,category:'Vegetation Lines',proposal:'Tree-lined avenue vegetation',cls:'Open Grove',effects:['Obscuring'],
    detectionConfidence:99,interpretationConfidence:80,
    reason:'Detected from paired green source-map linework; kept separate from woodland polygons.'
  },bound)));

  // Compact dark-gray source objects are intentionally promoted as crossing proposals so the user can confirm them.
  bridges.forEach((item,i)=>features.push(featureFromGroup([item],{
    id:`map-crossing-${i+1}`,name:`Possible bridge / crossing ${i+1}`,category:'Crossings & Openings',proposal:'Bridge or culvert crossing',cls:'Bridge',effects:[],
    detectionConfidence:99,interpretationConfidence:72,
    reason:'Compact dark-gray source geometry resembles the bridge symbols used on this map. It is promoted for review rather than silently accepted.'
  },bound)));

  const openings=[
    syntheticOpening(svg,bound,walls,'Pescarina','Porta Pescarina','map-gate-pescarina','Gatehouse',91),
    syntheticOpening(svg,bound,walls,'Repentita','Porta Repentita','map-gate-repentita','Gatehouse',88),
    syntheticOpening(svg,bound,walls,'Riazzo','Porta Riazzo','map-gate-riazzo','Gatehouse',86),
    syntheticOpening(svg,bound,walls,'Due Porte','Due Porte','map-gate-due-porte','Gatehouse',82),
    syntheticOpening(svg,bound,walls,'Breach','Imperial breach','map-breach','Breach',92)
  ].filter(Boolean);
  features.push(...openings);

  // Mirabello: source label + nearest compact structure is map evidence, not historical-context placement.
  const mirText=findText(svg,'Mirabello');
  if(mirText && structures.length){
    const target=textCenter(svg,mirText);
    const nearest=[...structures].sort((a,b)=>distanceBoxes(a.bbox,{x:target.x,y:target.y,width:0,height:0})-distanceBoxes(b.bbox,{x:target.x,y:target.y,width:0,height:0}))[0];
    features.push(featureFromGroup([nearest],{id:'map-mirabello',name:'Castello Mirabello',category:'Structures',proposal:'Major structure / castle complex',cls:'Building',effects:['Impassable','Tall','Defensive'],detectionConfidence:98,interpretationConfidence:85,reason:'Source-map text label is linked to the nearest compact structure geometry. Placement comes from the imported map.'},bound));
  }

  // Remaining compact structure and brown geometry stay in Geometry Explorer to keep the normal workflow clean.
  const usedStructureIds=new Set(features.flatMap(f=>f.elementIds||[]));
  structures.filter(x=>!usedStructureIds.has(x.id)).forEach((item,i)=>candidates.push(featureFromGroup([item],{
    id:`candidate-structure-${i+1}`,name:`Additional compact structure ${i+1}`,kind:'building / gatehouse / landmark',proposal:'Unclassified compact structure',cls:'Unknown',effects:[],detectionConfidence:99,interpretationConfidence:46,confidence:46,
    reason:'Clearly detected source geometry, but its gameplay role is ambiguous. Review in Geometry Explorer if it matters.'
  },bound)));
  tracks.forEach((item,i)=>candidates.push(featureFromGroup([item],{
    id:`candidate-track-${i+1}`,name:`Possible route / boundary ${i+1}`,kind:'brown linear or patterned geometry',proposal:'Possible road, track, ditch, or decorative line',cls:'Unknown',effects:[],detectionConfidence:98,interpretationConfidence:48,confidence:48,
    reason:'Detected directly from source geometry. It is not promoted because this visual convention can represent several map elements.'
  },bound)));

  // Deep-scan rendered objects (images/use instances) only for Geometry Explorer. These are deliberately not promoted.
  const visualObjects=[];
  for(const el of svg.querySelectorAll('image,use')){
    const bbox=transformedBox(svg,el); if(!bbox||!overlap(bbox,bound))continue;
    const c=clipBox(bbox,bound); if(!c)continue;
    const area=c.width*c.height, mapArea=bound.width*bound.height;
    const ratio=Math.max(c.width/Math.max(c.height,1),c.height/Math.max(c.width,1));
    if(area<18 || area>mapArea*.035 || ratio>35)continue;
    visualObjects.push({el,bbox:c,id:el.dataset.baGeometryId,area});
  }
  visualObjects.sort((a,b)=>b.area-a.area).slice(0,60).forEach((item,i)=>candidates.push(featureFromGroup([item],{
    id:`candidate-rendered-${i+1}`,name:`Additional rendered map object ${i+1}`,kind:'rendered/grouped source object',proposal:'Unclassified rendered feature',cls:'Unknown',effects:[],detectionConfidence:96,interpretationConfidence:25,confidence:25,
    reason:'Detected as a discrete rendered object in the imported SVG but intentionally withheld from normal review. Use Geometry Explorer only if this object is gameplay-relevant.'
  },bound)));

  // De-duplicate tiny or off-map candidates.
  const cleanedCandidates=candidates.filter(c=>c.box && c.box[2]*c.box[3]>.03);
  return {features:features.filter(f=>f.box), candidates:cleanedCandidates, boundary:bound, stats:{water:waters.length,wood:woods.length,wall:walls.length,avenue:avenues.length,bridge:bridges.length,structure:structures.length,track:tracks.length}};
}
