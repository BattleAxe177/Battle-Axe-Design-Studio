const COLORS={water:'#69D9E5',wood:'#3B7D23',wall:'#F2AA84',avenue:'#196B24',bridge:'#595959',structure:'#747474',track:'#726530',boundary:'#042433'};
const norm=v=>(v||'').trim().toUpperCase();
function parseColor(v){if(!v||v==='none')return null;const h=v.trim().match(/^#([0-9a-f]{6})$/i);if(h){const n=parseInt(h[1],16);return[(n>>16)&255,(n>>8)&255,n&255];}const r=v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);return r?[+r[1],+r[2],+r[3]]:null;}
function colorDistance(a,b){const x=parseColor(a),y=parseColor(b);if(!x||!y)return Infinity;return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2]);}
function styleColor(el,p){const direct=el.getAttribute(p);if(direct&&direct!=='none')return direct;try{return getComputedStyle(el)[p]||'';}catch{return'';}}
function isColor(el,p,target,tol=12){const c=styleColor(el,p);return norm(c)===norm(target)||colorDistance(c,target)<=tol;}

function transformPoint(m,x,y){return{x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f};}
function rootRelativeMatrix(el){
  const m=el?.getCTM?.();if(!m)return null;const root=el.ownerSVGElement;if(!root||root===el)return m;
  const rm=root.getCTM?.();if(!rm?.inverse)return m;
  try{return rm.inverse().multiply(m);}catch{return m;}
}
function geometryBox(el){
  try{
    if(el.ownerSVGElement===null&&el.viewBox?.baseVal){const v=el.viewBox.baseVal;return{x:v.x,y:v.y,width:v.width,height:v.height};}
    const b=el.getBBox(),m=rootRelativeMatrix(el);if(!b||!m)return null;
    // Coordinates are normalized back into the root SVG user coordinate system. They therefore
    // remain stable if the battlefield viewBox is changed for table clipping or after a reload.
    const pts=[transformPoint(m,b.x,b.y),transformPoint(m,b.x+b.width,b.y),transformPoint(m,b.x,b.y+b.height),transformPoint(m,b.x+b.width,b.y+b.height)];
    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
  }catch{return null;}
}
function overlap(a,b){return!!(a&&b&&a.x<=b.x+b.width&&a.x+a.width>=b.x&&a.y<=b.y+b.height&&a.y+a.height>=b.y);}
function clipBox(b,bound){if(!b||!bound)return null;const x1=Math.max(b.x,bound.x),y1=Math.max(b.y,bound.y),x2=Math.min(b.x+b.width,bound.x+bound.width),y2=Math.min(b.y+b.height,bound.y+bound.height);if(x2<=x1||y2<=y1)return null;return{x:x1,y:y1,width:x2-x1,height:y2-y1};}
function percentBox(b,bound,pad=.5){const c=clipBox(b,bound);if(!c||!bound.width||!bound.height)return null;let left=(c.x-bound.x)/bound.width*100,top=(c.y-bound.y)/bound.height*100,width=c.width/bound.width*100,height=c.height/bound.height*100;left=Math.max(0,left-pad);top=Math.max(0,top-pad);width=Math.min(100-left,width+pad*2);height=Math.min(100-top,height+pad*2);if(width<.35)width=Math.min(100-left,.35);if(height<.35)height=Math.min(100-top,.35);return[left,top,width,height];}
function unionBox(items){const bs=items.map(x=>x.bbox).filter(Boolean);if(!bs.length)return null;const x=Math.min(...bs.map(b=>b.x)),y=Math.min(...bs.map(b=>b.y)),x2=Math.max(...bs.map(b=>b.x+b.width)),y2=Math.max(...bs.map(b=>b.y+b.height));return{x,y,width:x2-x,height:y2-y};}
function distanceBoxes(a,b){if(!a||!b)return Infinity;const dx=Math.max(a.x-(b.x+b.width),b.x-(a.x+a.width),0),dy=Math.max(a.y-(b.y+b.height),b.y-(a.y+a.height),0);return Math.hypot(dx,dy);}
function center(b){return b?{x:b.x+b.width/2,y:b.y+b.height/2}:null;}
function pointDistanceToBox(p,b){if(!p||!b)return Infinity;const dx=Math.max(b.x-p.x,p.x-(b.x+b.width),0),dy=Math.max(b.y-p.y,p.y-(b.y+b.height),0);return Math.hypot(dx,dy);}
function centerInside(b,bound){const c=center(b);return c&&c.x>=bound.x&&c.x<=bound.x+bound.width&&c.y>=bound.y&&c.y<=bound.y+bound.height;}
function meaningfulInside(b,bound){const c=clipBox(b,bound);if(!c)return false;if(centerInside(b,bound))return true;const ratio=(c.width*c.height)/Math.max(1,b.width*b.height);return ratio>.45&&(c.width/bound.width>.015||c.height/bound.height>.015);}
function cluster(items,tol=12){const pending=[...items],groups=[];while(pending.length){const g=[pending.shift()];let changed=true;while(changed){changed=false;const ub=unionBox(g);for(let i=pending.length-1;i>=0;i--)if(distanceBoxes(ub,pending[i].bbox)<=tol){g.push(pending.splice(i,1)[0]);changed=true;}}groups.push(g);}return groups;}
function assignGeometryIds(svg){let n=0;for(const el of svg.querySelectorAll('path,rect,line,polyline,polygon,circle,ellipse,image,use,g'))if(!el.dataset.baGeometryId)el.dataset.baGeometryId=`ba-geom-${++n}`;}
function findBoundary(svg,playSpace=null){
  for(const rect of svg.querySelectorAll('rect'))if(isColor(rect,'stroke',COLORS.boundary,18)){const b=geometryBox(rect);if(b?.width&&b?.height)return b;}
  const v=svg.viewBox?.baseVal,root=v?.width?{x:v.x,y:v.y,width:v.width,height:v.height}:geometryBox(svg)||{x:0,y:0,width:1000,height:1000};
  const desired=(Number(playSpace?.width)||0)/(Number(playSpace?.height)||0),rootArea=Math.max(1,root.width*root.height),candidates=[];
  for(const rect of svg.querySelectorAll('rect')){
    const b=geometryBox(rect);if(!b?.width||!b?.height)continue;
    const area=(b.width*b.height)/rootArea;if(area<.08||area>.985)continue;
    const stroke=styleColor(rect,'stroke'),fill=styleColor(rect,'fill'),fillOpacity=Number(rect.getAttribute('fill-opacity')??1),strokeWidth=Number.parseFloat(rect.getAttribute('stroke-width')||'1')||1;
    const outlined=!!stroke&&stroke!=='none'&&(fill==='none'||!fill||fillOpacity<.12);if(!outlined)continue;
    const aspect=b.width/b.height,aspectPenalty=desired>0?Math.abs(Math.log(Math.max(.01,aspect/desired))):0;
    if(desired>0&&aspectPenalty>.72)continue;
    candidates.push({b,score:aspectPenalty*5-area+Math.min(.5,strokeWidth/100)});
  }
  if(candidates.length)return candidates.sort((a,b)=>a.score-b.score)[0].b;
  return root;
}
export function findBattlefieldBoundary(svg,playSpace=null){return findBoundary(svg,playSpace);}
function collect(svg,bound,pred,selector='path,rect,line,polyline,polygon,circle,ellipse'){const out=[];for(const el of svg.querySelectorAll(selector)){if(!pred(el))continue;const bbox=geometryBox(el);if(!bbox||!overlap(bbox,bound)||!meaningfulInside(bbox,bound))continue;out.push({el,bbox,id:el.dataset.baGeometryId});}return out;}
function featureFromGroup(group,opts,bound){const bbox=unionBox(group),box=percentBox(bbox,bound,.7);return{...opts,detectionConfidence:opts.detectionConfidence??99,interpretationConfidence:opts.interpretationConfidence??opts.confidence??80,confidence:opts.interpretationConfidence??opts.confidence??80,box,elementIds:group.map(x=>x.id).filter(Boolean)};}
function findText(svg,needle){const t=needle.toLowerCase();return[...svg.querySelectorAll('text')].find(x=>(x.textContent||'').trim().toLowerCase().includes(t));}
function nearestWallDistance(walls,b){return Math.min(...walls.map(w=>distanceBoxes(w.bbox,b)),Infinity);}
function gateAnchor(svg,bound,walls,label){const text=findText(svg,label),p=center(geometryBox(text));if(!p)return null;const mapArea=bound.width*bound.height,c=[];for(const el of svg.querySelectorAll('rect,path,polygon')){if(isColor(el,'stroke',COLORS.wall,18))continue;const b=geometryBox(el);if(!b||!meaningfulInside(b,bound))continue;const area=b.width*b.height;if(area>mapArea*.012||area<2)continue;const labelD=pointDistanceToBox(p,b),wallD=nearestWallDistance(walls,b);if(labelD>bound.width*.16||wallD>bound.width*.04)continue;const aspect=Math.max(b.width/Math.max(1,b.height),b.height/Math.max(1,b.width));c.push({bbox:b,id:el.dataset.baGeometryId,score:labelD+wallD*3+Math.max(0,aspect-5)*8});}return c.sort((a,b)=>a.score-b.score)[0]||null;}
function syntheticOpening(svg,bound,walls,needle,name,id,kind='Gatehouse',interp=88){const text=findText(svg,needle),tb=geometryBox(text),target=center(tb);if(!target)return null;const anchor=gateAnchor(svg,bound,walls,needle);const sz=bound.width*.02,bbox=anchor?.bbox||{x:target.x-sz/2,y:target.y-sz/2,width:sz,height:sz};return{id,name,category:'Crossings & Openings',proposal:kind==='Breach'?'Rubble breach / wall opening':'Fortified gatehouse / wall opening',cls:kind,effects:['Difficult'],detectionConfidence:anchor?95:76,interpretationConfidence:interp,confidence:interp,box:percentBox(bbox,bound,.5),elementIds:anchor?[anchor.id]:[],reason:anchor?`Source label “${name}” is linked to compact map geometry adjacent to a detected wall.`:`The map label “${name}” was found, but no gatehouse geometry could be resolved confidently; the marker stays at the label rather than being relocated.`};}

function componentScan(mask,n,{minCount=18,maxCount=1e9,minLong=0,minAspect=1,maxFill=1}={}){
  const seen=new Uint8Array(mask.length),out=[],dirs=[-1,1,-n,n,-n-1,-n+1,n-1,n+1];
  for(let i=0;i<mask.length;i++){if(!mask[i]||seen[i])continue;const q=[i];seen[i]=1;let p=0,minx=n,miny=n,maxx=0,maxy=0,count=0;while(p<q.length){const k=q[p++],x=k%n,y=(k/n)|0;count++;minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);for(const d of dirs){const j=k+d;if(j<0||j>=mask.length||seen[j]||!mask[j])continue;const jx=j%n;if(Math.abs(jx-x)>1)continue;seen[j]=1;q.push(j);}}const w=maxx-minx+1,h=maxy-miny+1,aspect=Math.max(w/Math.max(1,h),h/Math.max(1,w)),fill=count/Math.max(1,w*h);if(count>=minCount&&count<=maxCount&&Math.max(w,h)>=minLong&&aspect>=minAspect&&fill<=maxFill)out.push({minx,miny,maxx,maxy,count,w,h,aspect,fill,pixels:q});}
  return out;
}
function mergeComponents(items,gap=9){const pending=[...items],groups=[];while(pending.length){const g=[pending.shift()];let changed=true;while(changed){changed=false;let b={minx:Math.min(...g.map(x=>x.minx)),miny:Math.min(...g.map(x=>x.miny)),maxx:Math.max(...g.map(x=>x.maxx)),maxy:Math.max(...g.map(x=>x.maxy))};for(let i=pending.length-1;i>=0;i--){const x=pending[i],dx=Math.max(b.minx-x.maxx,x.minx-b.maxx,0),dy=Math.max(b.miny-x.maxy,x.miny-b.maxy,0);if(Math.hypot(dx,dy)<=gap){g.push(pending.splice(i,1)[0]);changed=true;}}}const minx=Math.min(...g.map(x=>x.minx)),miny=Math.min(...g.map(x=>x.miny)),maxx=Math.max(...g.map(x=>x.maxx)),maxy=Math.max(...g.map(x=>x.maxy));groups.push({minx,miny,maxx,maxy,w:maxx-minx+1,h:maxy-miny+1,count:g.reduce((a,x)=>a+x.count,0),pixels:g.flatMap(x=>x.pixels||[])});}return groups;}
function rasterBox(c,n){return[c.minx/n*100,c.miny/n*100,c.w/n*100,c.h/n*100];}
function rasterRuns(c,n){const rows=new Map();for(const k of c.pixels||[]){const x=k%n,y=(k/n)|0;if(!rows.has(y))rows.set(y,[]);rows.get(y).push(x);}const runs=[];for(const [y,xs] of rows){xs.sort((a,b)=>a-b);let a=xs[0],b=a;for(let i=1;i<=xs.length;i++){const x=xs[i];if(x===b+1){b=x;continue;}runs.push([a/n*100,y/n*100,(b-a+1)/n*100,1/n*100]);a=x;b=x;}}return runs.filter(r=>r.every(Number.isFinite));}

export function genericAppearanceComponents(data,n){
  const bins={blue:new Uint8Array(n*n),green:new Uint8Array(n*n),earth:new Uint8Array(n*n),dark:new Uint8Array(n*n)};
  for(let i=0;i<n*n;i++){
    const r=data[i*4],g=data[i*4+1],b=data[i*4+2],a=data[i*4+3];if(a<35)continue;
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx-mn;
    if(mx>247&&mn>247)continue;
    if(b>r+14&&b>=g-10&&sat>24)bins.blue[i]=1;
    if(g>r+8&&g>b+7&&sat>20)bins.green[i]=1;
    if(r>g+12&&g>=b-18&&sat>22)bins.earth[i]=1;
    if(mx<118&&mn<92)bins.dark[i]=1;
  }
  const minCount=Math.max(12,Math.floor(n*n*.00018)),minLong=Math.max(5,Math.floor(n*.018)),items=[];
  for(const [kind,mask] of Object.entries(bins)){
    const comps=mergeComponents(componentScan(mask,n,{minCount,minLong,minAspect:1,maxFill:1}),Math.max(2,Math.floor(n*.012)));
    for(const c of comps){const area=(c.w*c.h)/(n*n),coverage=c.count/(n*n);if(area>.48||coverage>.38||Math.max(c.w,c.h)<minLong)continue;items.push({...c,kind,score:c.count+Math.max(c.w,c.h)*2});}
  }
  return items.sort((a,b)=>b.score-a.score).slice(0,24);
}
function genericRasterReviewCandidates(data,n){
  const labels={blue:['possible water / ditch / cool-colored line','Hydrology candidate','Unknown'],green:['possible vegetation / field edge','Vegetation or field candidate','Unknown'],earth:['possible earthwork / road / cultivated feature','Earthwork, road, or field candidate','Unknown'],dark:['possible structure / boundary / linework','Structure or boundary candidate','Unknown']};
  return genericAppearanceComponents(data,n).map((c,i)=>({id:`visual-region-${c.kind}-${i+1}`,name:`Visual map region ${i+1}`,kind:labels[c.kind][0],category:'Generic appearance geometry',proposal:labels[c.kind][1],cls:labels[c.kind][2],effects:[],detectionConfidence:78,interpretationConfidence:38,confidence:38,box:rasterBox(c,n),rasterRuns:rasterRuns(c,n),elementIds:[],reason:'Scenario-independent appearance fallback: a coherent visual region was detected inside the play area, but its terrain meaning is intentionally left unresolved for Geometry Explorer review.'}));
}
async function rasterClassifiers(svg,bound){
  // Appearance-assisted classifiers supplement, rather than replace, vector geometry. They are deliberately conservative.
  try{
    const clone=svg.cloneNode(true);clone.setAttribute('viewBox',`${bound.x} ${bound.y} ${bound.width} ${bound.height}`);clone.removeAttribute('width');clone.removeAttribute('height');clone.setAttribute('preserveAspectRatio','none');
    const xml=new XMLSerializer().serializeToString(clone),blob=new Blob([xml],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url;});
    const n=420,canvas=document.createElement('canvas');canvas.width=n;canvas.height=n;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,n,n);URL.revokeObjectURL(url);const data=ctx.getImageData(0,0,n,n).data;
    const masks={water:new Uint8Array(n*n),wall:new Uint8Array(n*n),green:new Uint8Array(n*n),road:new Uint8Array(n*n)};
    for(let i=0;i<n*n;i++){const r=data[i*4],g=data[i*4+1],b=data[i*4+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);
      if(b>=g-8&&b>r+22&&mx-mn>35&&r<150&&g<195&&b<230)masks.water[i]=1;
      if(r>175&&r>g+24&&g>b+10&&g>85&&b<175)masks.wall[i]=1;
      if(g>r+12&&g>b+25&&g>80&&g<195&&r<155&&b<135)masks.green[i]=1;
      if(r>155&&g>145&&r-b>28&&g-b>25&&Math.abs(r-g)<55&&b<155)masks.road[i]=1;
    }
    const streams=mergeComponents(componentScan(masks.water,n,{minCount:22,minLong:35,minAspect:1.7,maxFill:.62}),11).filter(c=>Math.max(c.w,c.h)>42).slice(0,5);
    const wallParts=mergeComponents(componentScan(masks.wall,n,{minCount:18,minLong:20,minAspect:1.5,maxFill:.75}),7).filter(c=>Math.max(c.w,c.h)>28).slice(0,14);
    const greenParts=componentScan(masks.green,n,{minCount:22,minLong:10,minAspect:1,maxFill:1});
    const woods=greenParts.filter(c=>c.count>250&&c.w>18&&c.h>18&&c.fill>.10).sort((a,b)=>b.count-a.count).slice(0,10);
    const avenues=greenParts.filter(c=>c.count>=18&&c.count<900&&c.aspect>=3.2&&c.fill<.45&&Math.max(c.w,c.h)>24).sort((a,b)=>b.count-a.count).slice(0,10);
    const roads=componentScan(masks.road,n,{minCount:30,maxCount:4500,minLong:35,minAspect:2.2,maxFill:.65}).filter(c=>c.w<n*.85&&c.h<n*.85).sort((a,b)=>b.count-a.count).slice(0,12);
    return{
      streams:streams.map((c,i)=>({id:`raster-stream-${i+1}`,name:`Watercourse ${i+1}`,category:'Hydrology',proposal:'Stream / river corridor',cls:'Stream',effects:['Difficult'],detectionConfidence:90,interpretationConfidence:84,confidence:84,box:rasterBox(c,n),rasterRuns:rasterRuns(c,n),elementIds:[],reason:'Appearance-assisted detection: connected blue/cyan meandering geometry in the rendered source map. derived review geometry only.'})),
      walls:wallParts.map((c,i)=>({id:`raster-wall-${i+1}`,name:`Wall / linear earthwork ${i+1}`,category:'Walls & Fortifications',proposal:'Wall or fortified line',cls:'Masonry Wall',effects:['Impassable','Tall'],detectionConfidence:88,interpretationConfidence:72,confidence:72,box:rasterBox(c,n),rasterRuns:rasterRuns(c,n),elementIds:[],reason:'Appearance-assisted detection: elongated warm-colored defensive linework. Review classification before accepting.'})),
      woods:woods.map((c,i)=>({id:`raster-wood-${i+1}`,name:`Vegetation block ${i+1}`,category:'Woods & Groves',proposal:'Woodland area',cls:'Dense Wood',effects:['Difficult','Obscuring'],detectionConfidence:89,interpretationConfidence:76,confidence:76,box:rasterBox(c,n),rasterRuns:rasterRuns(c,n),elementIds:[],reason:'Appearance-assisted detection: large contiguous dark-green vegetation area.'})),
      avenues:avenues.map((c,i)=>({id:`raster-avenue-${i+1}`,name:`Vegetation line ${i+1}`,category:'Vegetation Lines',proposal:'Linear vegetation',cls:'Open Grove',effects:['Obscuring'],detectionConfidence:82,interpretationConfidence:62,confidence:62,box:rasterBox(c,n),rasterRuns:rasterRuns(c,n),elementIds:[],reason:'Appearance-assisted detection: narrow elongated dark-green vegetation line. It may be an avenue, hedge, field edge, or decorative vegetation; review required.'})),
      roads:roads.map((c,i)=>({id:`raster-road-${i+1}`,name:`Pale route / linear feature ${i+1}`,category:'Roads & Tracks',proposal:'Road or maintained track',cls:'Open Ground',effects:[],detectionConfidence:76,interpretationConfidence:58,confidence:58,box:rasterBox(c,n),rasterRuns:rasterRuns(c,n),elementIds:[],reason:'Appearance-assisted detection: elongated pale/tan route geometry. Lower confidence because ground texture can use similar colors.'})),
      generic:genericRasterReviewCandidates(data,n)
    };
  }catch(e){console.warn('Raster classifier fallback unavailable',e);return{streams:[],walls:[],woods:[],avenues:[],roads:[],generic:[]};}
}

function rgbKind(value){
  const c=parseColor(value);if(!c)return null;const [r,g,b]=c,mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx-mn<22)return 'neutral';if(b>r+20&&b>=g-8)return 'water';if(g>r+12&&g>b+12)return 'vegetation';if(r>g+18&&g>b-5)return 'earth';return 'other';
}
function genericVectorCandidates(svg,bound,used,max=28){
  const out=[],mapArea=Math.max(1,bound.width*bound.height);
  for(const el of svg.querySelectorAll('path,rect,line,polyline,polygon,circle,ellipse,use')){
    const id=el.dataset.baGeometryId;if(!id||used.has(id))continue;const b=geometryBox(el);if(!b||!meaningfulInside(b,bound))continue;
    const clipped=clipBox(b,bound);if(!clipped)continue;const relArea=(clipped.width*clipped.height)/mapArea,relLong=Math.max(clipped.width/bound.width,clipped.height/bound.height);if(relArea>.55||(relArea<.000012&&relLong<.012))continue;
    const fill=styleColor(el,'fill'),stroke=styleColor(el,'stroke'),kindFill=rgbKind(fill),kindStroke=rgbKind(stroke),aspect=Math.max(clipped.width/Math.max(1,clipped.height),clipped.height/Math.max(1,clipped.width));let kind='unclassified source geometry',proposal='Review source geometry',cls='Unknown',effects=[],confidence=42;
    if(kindStroke==='water'||kindFill==='water'){kind='possible watercourse / wet feature';proposal='Hydrology candidate';cls=aspect>2.2?'Stream':'Wet Ground';effects=['Difficult'];confidence=68;}
    else if(kindFill==='vegetation'&&relArea>.0015){kind='possible vegetation area';proposal='Woodland / grove candidate';cls=relArea>.01?'Dense Wood':'Open Grove';effects=relArea>.01?['Difficult','Obscuring']:['Obscuring'];confidence=64;}
    else if(aspect>4&&stroke&&stroke!=='none'){kind='possible linear terrain';proposal='Road / wall / ditch / boundary candidate';confidence=54;}
    else if(relArea>.003){kind='possible area terrain';proposal='Area terrain candidate';confidence=48;}
    else if(relArea>.00008){kind='possible compact structure / point feature';proposal='Structure / landmark candidate';confidence=46;}
    else continue;
    out.push({id:`generic-${id}`,name:`Source geometry ${out.length+1}`,kind,category:'Generic source geometry',proposal,cls,effects,detectionConfidence:96,interpretationConfidence:confidence,confidence,box:percentBox(clipped,bound,.35),elementIds:[id],reason:'Scenario-independent vector fallback: meaningful source geometry was detected inside the play area, but its map convention was not recognized confidently enough for automatic classification.',_score:confidence+Math.min(20,relArea*500)+Math.min(8,aspect)});
  }
  return out.filter(x=>x.box).sort((a,b)=>b._score-a._score).slice(0,max).map(({_score,...x})=>x);
}

export async function detectBattlefieldFeatures(svg,{mapNotes='',playSpace=null}={}){
  assignGeometryIds(svg);const bound=findBoundary(svg,playSpace),byFill=(c,t=18)=>collect(svg,bound,e=>isColor(e,'fill',c,t)),byStroke=(c,t=18)=>collect(svg,bound,e=>isColor(e,'stroke',c,t));
  const wet=byFill(COLORS.water,45),woods=byFill(COLORS.wood),walls=byStroke(COLORS.wall),avenues=byStroke(COLORS.avenue),bridges=byFill(COLORS.bridge),structures=byFill(COLORS.structure),tracks=byFill(COLORS.track);
  const raster=await rasterClassifiers(svg,bound),features=[],candidates=[];let classified=0;
  wet.forEach((item,i)=>{classified++;features.push(featureFromGroup([item],{id:`map-wet-${i+1}`,name:`Wet-ground polygon ${i+1}`,category:'Hydrology',proposal:'Wet ground / marsh margin',cls:'Wet Ground',effects:['Difficult'],detectionConfidence:99,interpretationConfidence:82,reason:'Detected directly from cyan source-map polygon geometry. Classified separately from stream channels.'},bound));});
  features.push(...raster.streams);classified+=raster.streams.length;
  woods.forEach((item,i)=>{classified++;features.push(featureFromGroup([item],{id:`map-wood-${i+1}`,name:`Woodland block ${i+1}`,category:'Woods & Groves',proposal:'Woodland polygon',cls:'Dense Wood',effects:['Difficult','Obscuring'],detectionConfidence:99,interpretationConfidence:84,reason:'Detected directly from irregular green source-map polygon geometry.'},bound));});
  if(woods.length<2){features.push(...raster.woods);classified+=raster.woods.length;}
  cluster(walls,18).forEach((group,i)=>{classified+=group.length;features.push(featureFromGroup(group,{id:`map-wall-${i+1}`,name:`Park wall segment ${i+1}`,category:'Walls & Fortifications',proposal:'Masonry wall',cls:'Masonry Wall',effects:['Impassable','Tall'],detectionConfidence:99,interpretationConfidence:94,reason:'Detected directly from salmon source-map linework.'},bound));});
  if(walls.length<3){features.push(...raster.walls);classified+=raster.walls.length;}
  cluster(avenues,14).forEach((group,i)=>{classified+=group.length;features.push(featureFromGroup(group,{id:`map-avenue-trees-${i+1}`,name:`Roadside tree line ${i+1}`,category:'Vegetation Lines',proposal:'Tree-lined avenue vegetation',cls:'Open Grove',effects:['Obscuring'],detectionConfidence:99,interpretationConfidence:80,reason:'Detected from paired green source-map linework.'},bound));});
  if(avenues.length<2){for(const x of raster.avenues)candidates.push({...x,kind:'possible tree line / avenue',interpretationConfidence:58,confidence:58,reason:'Appearance-assisted elongated vegetation candidate. Withheld from normal review until paired vegetation + route topology confirms a tree-lined avenue.'});}
  bridges.forEach((item,i)=>{classified++;features.push(featureFromGroup([item],{id:`map-crossing-${i+1}`,name:`Possible bridge / crossing ${i+1}`,category:'Crossings & Openings',proposal:'Bridge or culvert crossing',cls:'Bridge',effects:[],detectionConfidence:99,interpretationConfidence:72,reason:'Compact dark-gray source geometry resembles bridge/crossing symbols and is promoted for review.'},bound));});
  // Generic label-grounded openings. Proper names are not hard-coded: any map label that explicitly
  // says gate/porta/breach can be tied to nearby wall geometry and offered for review.
  const openings=[];let openingIndex=0;for(const textEl of svg.querySelectorAll('text')){const label=(textEl.textContent||'').trim();if(!label)continue;const q=label.toLowerCase();const isBreach=/\bbreach\b/.test(q),isGate=/\bgate(house)?\b|\bporta\b/.test(q);if(!isBreach&&!isGate)continue;const id=`map-labeled-opening-${++openingIndex}`;const item=syntheticOpening(svg,bound,walls,label,label,id,isBreach?'Breach':'Gatehouse',isBreach?86:82);if(item)openings.push(item);}classified+=openings.length;features.push(...openings);
  raster.roads.forEach(x=>candidates.push({...x,kind:'possible road / track'}));
  for(const x of raster.generic||[])candidates.push(x);
  const used=new Set(features.flatMap(f=>f.elementIds||[]));structures.filter(x=>!used.has(x.id)).forEach((item,i)=>candidates.push(featureFromGroup([item],{id:`candidate-structure-${i+1}`,name:`Additional compact structure ${i+1}`,kind:'building / gatehouse / landmark',proposal:'Unclassified compact structure',cls:'Unknown',effects:[],detectionConfidence:99,interpretationConfidence:46,confidence:46,reason:'Clearly detected source geometry, but its gameplay role is ambiguous.'},bound)));
  tracks.filter(x=>meaningfulInside(x.bbox,bound)).forEach((item,i)=>candidates.push(featureFromGroup([item],{id:`candidate-track-${i+1}`,name:`Possible route / boundary ${i+1}`,kind:'brown linear or patterned geometry',proposal:'Possible road, track, ditch, or decorative line',cls:'Unknown',effects:[],detectionConfidence:98,interpretationConfidence:48,confidence:48,reason:'Detected directly from source geometry; withheld because this convention can represent several map elements.'},bound)));
  const validBox=x=>Array.isArray(x.box)&&x.box.length===4&&x.box.every(Number.isFinite)&&x.box[2]>.05&&x.box[3]>.05&&!((x.box[0]<.15&&x.box[1]<.15)&&(x.box[2]<2.5||x.box[3]<2.5));
  const promoted=features.filter(validBox),cleanCandidates=candidates.filter(validBox),claimedIds=new Set([...promoted,...cleanCandidates].flatMap(f=>f.elementIds||[]));
  const generic=genericVectorCandidates(svg,bound,claimedIds,Math.max(10,28-cleanCandidates.length));for(const g of generic)if(!cleanCandidates.some(x=>x.id===g.id))cleanCandidates.push(g);
  if(!promoted.length&&!cleanCandidates.length&&svg.querySelector('image'))cleanCandidates.push({id:'visual-source-unresolved',name:'Rendered map image',kind:'raster map requiring geometry review',category:'Compiler diagnostic',proposal:'Inspect image-derived terrain',cls:'Unknown',effects:[],detectionConfidence:100,interpretationConfidence:0,confidence:0,box:[0,0,100,100],elementIds:[],reason:'The SVG contains rendered image content inside the play area, but automatic segmentation did not resolve individual terrain features. This diagnostic is kept in Geometry Explorer so a geometry-rich map never reports a silent successful zero-feature compile.'});
  const raw=wet.length+woods.length+walls.length+avenues.length+bridges.length+structures.length+tracks.length+raster.streams.length+raster.walls.length+raster.woods.length+raster.avenues.length+raster.roads.length+(raster.generic?.length||0)+generic.length;
  return{features:promoted,candidates:cleanCandidates,boundary:bound,stats:{raw,classified,promoted:promoted.length,explorer:cleanCandidates.length,generic:generic.length,water:raster.streams.length,wet:wet.length,wood:woods.length,wall:walls.length,avenue:avenues.length,bridge:bridges.length,structure:structures.length,track:tracks.length,rasterWall:raster.walls.length,rasterWood:raster.woods.length,rasterAvenue:raster.avenues.length,rasterRoad:raster.roads.length,genericRaster:raster.generic?.length||0,diagnosticOnly:cleanCandidates.length===1&&cleanCandidates[0].id==='visual-source-unresolved'}};
}
