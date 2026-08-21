const CLASS_ORDER=['Stream','Water Body','Wet Ground','Ditch','Ravine','Elevated Ground','Masonry Wall','Earthwork','Fortification','Hedge','Fence','Gatehouse','Bridge','Ford','Dense Wood','Open Grove','Orchard','Vineyard','Field','Settlement','Building','Structure','Road','Track','Decorative','Unknown'];

export async function loadStructuredTerrainManifest(url){
  const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`Structured map manifest request failed: HTTP ${r.status}`);
  const m=await r.json();if(!Array.isArray(m.features))throw new Error('Structured map manifest does not contain features.');
  return m;
}

function findEocd(bytes){for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes[i]===0x50&&bytes[i+1]===0x4b&&bytes[i+2]===0x05&&bytes[i+3]===0x06)return i;return -1;}
function u16(v,o){return v.getUint16(o,true)} function u32(v,o){return v.getUint32(o,true)}
async function inflateRaw(data){if(typeof DecompressionStream==='undefined')throw new Error('This browser cannot decompress PPTX files locally.');const ds=new DecompressionStream('deflate-raw');return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer());}
async function unzipSelected(file,names){const bytes=new Uint8Array(await file.arrayBuffer()),view=new DataView(bytes.buffer),e=findEocd(bytes);if(e<0)throw new Error('PPTX ZIP directory not found.');const count=u16(view,e+10),cd=u32(view,e+16),wanted=new Set(names),out={};let p=cd;const td=new TextDecoder();for(let i=0;i<count;i++){if(u32(view,p)!==0x02014b50)break;const method=u16(view,p+10),cs=u32(view,p+20),nl=u16(view,p+28),el=u16(view,p+30),cl=u16(view,p+32),lo=u32(view,p+42),name=td.decode(bytes.slice(p+46,p+46+nl));if(wanted.has(name)){const lnl=u16(view,lo+26),lel=u16(view,lo+28),start=lo+30+lnl+lel,raw=bytes.slice(start,start+cs),data=method===0?raw:method===8?await inflateRaw(raw):null;if(!data)throw new Error(`Unsupported PPTX compression method ${method}`);out[name]=td.decode(data);}p+=46+nl+el+cl;}return out;}
function lname(el){return el?.localName||''} function kids(el,n){return [...(el?.children||[])].filter(x=>lname(x)===n)} function child(el,n){return kids(el,n)[0]||null}
function descendants(el,n){return [...(el?.getElementsByTagName('*')||[])].filter(x=>lname(x)===n)}
function firstDesc(el,n){return descendants(el,n)[0]||null}
function cNvPr(el){return firstDesc(el,'cNvPr')}
function xfrm(el){return firstDesc(el,'xfrm')}
function pointNode(el,n){const q=child(el,n);return q?{x:Number(q.getAttribute('x')||0),y:Number(q.getAttribute('y')||0)}:null}
function rectFromXfrm(el){const x=xfrm(el);if(!x)return null;const off=pointNode(x,'off'),ext=child(x,'ext');if(!off||!ext)return null;return{x:off.x,y:off.y,w:Number(ext.getAttribute('cx')||0),h:Number(ext.getAttribute('cy')||0)};}
function clean(s){return String(s||'').trim().toLowerCase().replace(/[\u2010-\u2015]/g,'-').replace(/[_/\\]+/g,' ').replace(/[^a-z0-9' -]+/g,' ').replace(/\s+/g,' ').trim()}
function title(s){return String(s||'').replace(/\b\w/g,c=>c.toUpperCase())}

// The ontology intentionally uses broad concept families plus aliases, not an exact-name dictionary.
// Source wording is always retained; an unfamiliar term becomes an Unknown candidate rather than disappearing.
export const TERRAIN_ONTOLOGY=[
  {family:'Boundary / reference',sourceType:'Battlefield Boundary',cls:'Decorative',effects:[],confidence:99,patterns:[/\bbattlefield boundary\b/,/\btable boundary\b/,/\bplay ?area\b/,/\bmap boundary\b/,/^background$/,/\bground base\b/]},
  {family:'Relief & elevation',sourceType:'Elevated Ground',cls:'Elevated Ground',effects:[],confidence:88,patterns:[/\bhill(s)?\b/,/\bridge(s)?\b/,/\bknoll(s)?\b/,/\bhigh ground\b/,/\bheights?\b/,/\bcrest(s)?\b/,/\bplateau\b/,/\bbluff(s)?\b/,/\bspur(s)?\b/,/\bescarpment\b/,/\bslope(s)?\b/]},
  {family:'Relief & elevation',sourceType:'Ravine / Gully',cls:'Ravine',effects:['Difficult'],confidence:86,patterns:[/\bravine(s)?\b/,/\bgull(y|ies)\b/,/\bgorge(s)?\b/,/\bhollow(s)?\b/,/\bdefile(s)?\b/,/\bcoulee\b/]},
  {family:'Hydrology',sourceType:'Watercourse',cls:'Stream',effects:['Difficult'],confidence:92,patterns:[/\briver(s)?\b/,/\bstream(s)?\b/,/\bcreek(s)?\b/,/\bbrook(s)?\b/,/\bwatercourse(s)?\b/,/\bburn(s)?\b/,/\bbeck(s)?\b/,/\bcanal(s)?\b/,/\bwadi(s)?\b/,/\barroyo(s)?\b/,/\bdrain(age)? channel(s)?\b/]},
  {family:'Hydrology',sourceType:'Ditch / Drain',cls:'Ditch',effects:[],confidence:78,patterns:[/\bditch(es)?\b/,/\bdrain(s)?\b/,/\bleat(s)?\b/,/\bsluice(s)?\b/]},
  {family:'Hydrology',sourceType:'Water Body',cls:'Water Body',effects:[],confidence:90,patterns:[/\blake(s)?\b/,/\bpond(s)?\b/,/\breservoir(s)?\b/,/\blagoon(s)?\b/,/\bpool(s)?\b/,/\bfish ?pond(s)?\b/]},
  {family:'Wet ground',sourceType:'Wet Ground',cls:'Wet Ground',effects:['Difficult'],confidence:90,patterns:[/\bmarsh(es)?\b/,/\bswamp(s)?\b/,/\bbog(s|gy)?\b/,/\bfen(s)?\b/,/\bmire\b/,/\bwet ground\b/,/\bwet meadow(s)?\b/,/\bflood(ed|plain)?\b/,/\brice padd(y|ies)\b/,/\bpadd(y|ies)\b/]},
  {family:'Vegetation',sourceType:'Dense Woodland',cls:'Dense Wood',effects:['Difficult','Obscuring'],confidence:90,patterns:[/\bforest(s)?\b/,/\bwoods?\b/,/\bwoodland(s)?\b/,/\bthicket(s)?\b/,/\bdense grove(s)?\b/]},
  {family:'Vegetation',sourceType:'Open Grove / Copse',cls:'Open Grove',effects:['Obscuring'],confidence:82,patterns:[/\bgrove(s)?\b/,/\bcopse(s)?\b/,/\bopen wood(s|land)?\b/,/\bparkland\b/,/\bscattered trees?\b/]},
  {family:'Vegetation',sourceType:'Orchard',cls:'Orchard',effects:[],confidence:92,patterns:[/\borchard(s)?\b/,/\bfruit trees?\b/,/\bolive grove(s)?\b/]},
  {family:'Vegetation',sourceType:'Scrub / Brush',cls:'Open Grove',effects:[],confidence:80,patterns:[/\bscrub\b/,/\bbrush\b/,/\bbush(es)?\b/,/\bheath\b/,/\bmaquis\b/]},
  {family:'Agriculture',sourceType:'Vineyard',cls:'Vineyard',effects:[],confidence:94,patterns:[/\bvineyard(s)?\b/,/\bvines?\b/,/\bgrape(s)?\b/]},
  {family:'Agriculture',sourceType:'Cultivated Field',cls:'Field',effects:[],confidence:84,patterns:[/\bfield(s)?\b/,/\bcrop(s)?\b/,/\bcultivat(ed|ion)\b/,/\bpasture(s)?\b/,/\bfallow\b/,/\bwheat\b/,/\bcorn\b/,/\bmaize\b/,/\bfarm land\b/]},
  {family:'Linear vegetation',sourceType:'Hedge / Bocage',cls:'Hedge',effects:[],confidence:91,patterns:[/\bhedge(row)?s?\b/,/\bbocage\b/,/\bquickset\b/,/\bvegetation line(s)?\b/,/\btree line(s)?\b/]},
  {family:'Routes',sourceType:'Road',cls:'Road',effects:[],confidence:93,patterns:[/\broad(s)?\b/,/\bavenue(s)?\b/,/\bcauseway(s)?\b/,/\bturnpike(s)?\b/]},
  {family:'Routes',sourceType:'Track / Path',cls:'Track',effects:[],confidence:88,patterns:[/\btrack(s)?\b/,/\bpath(s)?\b/,/\btrail(s)?\b/,/\blane(s)?\b/,/\bway(s)?\b/]},
  {family:'Routes',sourceType:'Sunken Road',cls:'Road',effects:[],confidence:94,patterns:[/\bsunken road\b/,/\bhollow way\b/,/\bsunken lane\b/]},
  {family:'Crossings',sourceType:'Bridge',cls:'Bridge',effects:[],confidence:96,patterns:[/\bbridge(s)?\b/,/\bculvert(s)?\b/]},
  {family:'Crossings',sourceType:'Ford / Crossing',cls:'Ford',effects:[],confidence:92,patterns:[/\bford(s)?\b/,/\bcrossing(s)?\b/,/\bstepping stones?\b/]},
  {family:'Walls & barriers',sourceType:'Wall',cls:'Masonry Wall',effects:['Defensive'],confidence:90,patterns:[/\bwall(s)?\b/,/\bstone wall(s)?\b/,/\bpark wall(s)?\b/,/\bcity wall(s)?\b/]},
  {family:'Walls & barriers',sourceType:'Fence / Palisade',cls:'Fence',effects:[],confidence:88,patterns:[/\bfence(s)?\b/,/\bpalisade(s)?\b/,/\bstockade(s)?\b/,/\brail fence(s)?\b/]},
  {family:'Fortifications',sourceType:'Earthwork / Entrenchment',cls:'Earthwork',effects:['Defensive'],confidence:93,patterns:[/\bearthwork(s)?\b/,/\bentrench(ment|ments|ed)?\b/,/\btrench(es)?\b/,/\bbreastwork(s)?\b/,/\bfieldwork(s)?\b/,/\brampart(s)?\b/]},
  {family:'Fortifications',sourceType:'Fortification',cls:'Fortification',effects:['Defensive'],confidence:93,patterns:[/\bfortification(s)?\b/,/\bredoubt(s)?\b/,/\bfort(s)?\b/,/\bsconce(s)?\b/,/\bbastion(s)?\b/,/\bfortified position(s)?\b/]},
  {family:'Fortifications',sourceType:'Breach',cls:'Breach',effects:['Difficult'],confidence:95,patterns:[/\bbreach(es)?\b/,/\bbroken wall\b/]},
  {family:'Crossings',sourceType:'Gate / Opening',cls:'Gatehouse',effects:[],confidence:91,patterns:[/\bgate(house)?s?\b/,/\bporta\b/,/\bopening(s)?\b/]},
  {family:'Built environment',sourceType:'Settlement / Built-up Area',cls:'Settlement',effects:['Difficult','Obscuring'],confidence:91,patterns:[/\b(?:built|build)[ -]?up area(s)?\b/,/\bsettlement(s)?\b/,/\bvillage(s)?\b/,/\btown(s)?\b/,/\bcit(y|ies)\b/,/\burban\b/,/\bsuburb(s)?\b/]},
  {family:'Built environment',sourceType:'Building / Structure',cls:'Building',effects:['Defensive'],confidence:82,patterns:[/\bbuilding(s)?\b/,/\bstructure(s)?\b/,/\bhouse(s)?\b/,/\bfarmstead(s)?\b/,/\bfarm house(s)?\b/,/\bchurch(es)?\b/,/\babbey(s)?\b/,/\bmonaster(y|ies)\b/,/\bcastle(s)?\b/,/\btower(s)?\b/,/\bmill(s)?\b/]},
  {family:'Military area',sourceType:'Camp / Encampment',cls:'Open Ground',effects:[],confidence:88,patterns:[/\bcamp(s)?\b/,/\bencampment(s)?\b/,/\bbivouac(s)?\b/]},
  {family:'Decorative / reference',sourceType:'Decorative',cls:'Decorative',effects:[],confidence:99,patterns:[/\bdecorative\b/,/\bjust for show\b/,/\bvisual only\b/,/\blabel(s)?\b/,/\bnorth arrow\b/,/\bscale bar\b/,/\blegend\b/]}
];

export function classifyTerrainDescription(description,{shapeKind='shape',aspect=1,closed=true}={}){
  const source=String(description||'').trim(),q=clean(source);if(!q)return{matched:false,family:'Unclassified source geometry',sourceType:'Unknown',cls:'Unknown',effects:[],confidence:0,source};
  const matches=[];for(const c of TERRAIN_ONTOLOGY)for(const p of c.patterns)if(p.test(q)){matches.push(c);break;}
  if(!matches.length)return{matched:false,family:'Unclassified source geometry',sourceType:source||'Unknown',cls:'Unknown',effects:[],confidence:0,source};
  // Prefer the most specific recognizable concept. Ordering in the ontology puts narrow concepts before broad fallbacks where needed.
  let c=matches[0];
  if(/orchard|olive grove|fruit tree/.test(q))c=TERRAIN_ONTOLOGY.find(x=>x.sourceType==='Orchard')||c;
  if(/sunken road|sunken lane|hollow way/.test(q))c=TERRAIN_ONTOLOGY.find(x=>x.sourceType==='Sunken Road')||c;
  if(/ditch/.test(q)&&/(stream|watercourse|creek|brook|river)/.test(q))c=TERRAIN_ONTOLOGY.find(x=>x.sourceType==='Watercourse')||c;
  // Geometry can refine a generic barrier/fortification without overriding explicit source wording.
  let cls=c.cls,effects=[...c.effects],confidence=c.confidence;
  if(c.sourceType==='Fortification'&&(!closed||aspect>5)){cls='Earthwork';confidence=Math.min(confidence,88);}
  if(c.sourceType==='Wall'&&!closed&&aspect>3)confidence=Math.max(confidence,92);
  return{matched:true,family:c.family,sourceType:c.sourceType,cls,effects,confidence,source};
}

function parseXml(text,label){const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw new Error(`${label} XML could not be parsed.`);return doc;}
function slideSize(presentationText){if(!presentationText)return{x:0,y:0,w:12192000,h:6858000};const doc=parseXml(presentationText,'PPTX presentation');const s=descendants(doc,'sldSz')[0];return{x:0,y:0,w:Number(s?.getAttribute('cx')||12192000),h:Number(s?.getAttribute('cy')||6858000)};}
function txt(el){return descendants(el,'t').map(x=>x.textContent||'').join(' ').trim()}
function shapeMeta(el){const nv=cNvPr(el);return{id:nv?.getAttribute('id')||'',name:nv?.getAttribute('name')||'',descr:nv?.getAttribute('descr')||'',text:txt(el)};}
function nodeType(el){const n=lname(el);if(n==='sp')return'auto-shape';if(n==='cxnSp')return'connector';if(n==='pic')return'picture';if(n==='graphicFrame')return'graphic';return n||'shape';}
function identityTransform(){return{sx:1,sy:1,tx:0,ty:0}}
function applyTransform(t,p){return{x:t.tx+p.x*t.sx,y:t.ty+p.y*t.sy}}
function composeGroup(parent,grp){const gx=xfrm(grp);if(!gx)return parent;const off=pointNode(gx,'off')||{x:0,y:0},ext=child(gx,'ext'),chOff=pointNode(gx,'chOff')||{x:0,y:0},chExt=child(gx,'chExt');if(!ext||!chExt)return parent;const sx=Number(ext.getAttribute('cx')||1)/Math.max(1,Number(chExt.getAttribute('cx')||1)),sy=Number(ext.getAttribute('cy')||1)/Math.max(1,Number(chExt.getAttribute('cy')||1));return{sx:parent.sx*sx,sy:parent.sy*sy,tx:parent.tx+parent.sx*(off.x-chOff.x*sx),ty:parent.ty+parent.sy*(off.y-chOff.y*sy)};}
function localRect(el,parent){const r=rectFromXfrm(el);if(!r)return null;const p1=applyTransform(parent,{x:r.x,y:r.y}),p2=applyTransform(parent,{x:r.x+r.w,y:r.y+r.h});return{x:Math.min(p1.x,p2.x),y:Math.min(p1.y,p2.y),w:Math.abs(p2.x-p1.x),h:Math.abs(p2.y-p1.y)};}
function shapeTransformRect(el,parent){const r=rectFromXfrm(el);if(!r)return null;return{raw:r,slide:localRect(el,parent)};}
function sampleCubic(p0,p1,p2,p3,steps=4){const out=[];for(let i=1;i<=steps;i++){const t=i/steps,u=1-t;out.push({x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y});}return out;}
function pathParts(el,parent){const sr=shapeTransformRect(el,parent);if(!sr)return[];const cust=firstDesc(el,'custGeom'),prst=firstDesc(el,'prstGeom');if(!cust){const r=sr.slide;if(lname(el)==='cxnSp'||prst?.getAttribute('prst')==='line')return[{closed:false,points:[{x:r.x,y:r.y},{x:r.x+r.w,y:r.y+r.h}]}];return[{closed:true,points:[{x:r.x,y:r.y},{x:r.x+r.w,y:r.y},{x:r.x+r.w,y:r.y+r.h},{x:r.x,y:r.y+r.h}]}];}
  const out=[];for(const path of descendants(cust,'path')){const pw=Number(path.getAttribute('w')||sr.raw.w||1),ph=Number(path.getAttribute('h')||sr.raw.h||1);let points=[],current=null,closed=false;const map=p=>{const local={x:sr.raw.x+(Number(p.x)||0)/Math.max(1,pw)*sr.raw.w,y:sr.raw.y+(Number(p.y)||0)/Math.max(1,ph)*sr.raw.h};return applyTransform(parent,local)};for(const cmd of [...path.children]){const n=lname(cmd),pts=descendants(cmd,'pt').map(p=>({x:Number(p.getAttribute('x')||0),y:Number(p.getAttribute('y')||0)}));if(n==='moveTo'&&pts[0]){if(points.length)out.push({closed,points});points=[];current=map(pts[0]);points.push(current);closed=false;}else if(n==='lnTo'&&pts[0]){current=map(pts[0]);points.push(current);}else if(n==='cubicBezTo'&&pts.length>=3&&current){const [c1,c2,e]=pts.map(map);const samples=sampleCubic(current,c1,c2,e,4);points.push(...samples);current=e;}else if(n==='quadBezTo'&&pts.length>=2&&current){const c1=map(pts[0]),e=map(pts[1]),p1={x:current.x+2/3*(c1.x-current.x),y:current.y+2/3*(c1.y-current.y)},p2={x:e.x+2/3*(c1.x-e.x),y:e.y+2/3*(c1.y-e.y)};points.push(...sampleCubic(current,p1,p2,e,4));current=e;}else if(n==='close')closed=true;}if(points.length)out.push({closed,points});}
  return out.length?out:[{closed:true,points:[{x:sr.slide.x,y:sr.slide.y},{x:sr.slide.x+sr.slide.w,y:sr.slide.y},{x:sr.slide.x+sr.slide.w,y:sr.slide.y+sr.slide.h},{x:sr.slide.x,y:sr.slide.y+sr.slide.h}]}];
}
function collectShapes(container,parent=identityTransform(),out=[]){for(const el of [...container.children]){if(lname(el)==='grpSp'){const t=composeGroup(parent,el);collectShapes(el,t,out);continue;}if(!['sp','cxnSp','pic','graphicFrame'].includes(lname(el)))continue;const meta=shapeMeta(el),rect=localRect(el,parent);if(!rect?.w&&!rect?.h)continue;const parts=pathParts(el,parent);out.push({...meta,nodeType:nodeType(el),rect,parts,closed:parts.some(p=>p.closed)});}return out;}
function rectArea(r){return Math.max(0,r?.w||0)*Math.max(0,r?.h||0)}
function aspect(r){return (r?.w||1)/Math.max(1,r?.h||1)}
function intersectRect(a,b){const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),x2=Math.min(a.x+a.w,b.x+b.w),y2=Math.min(a.y+a.h,b.y+b.h);return x2>x&&y2>y?{x,y,w:x2-x,h:y2-y}:null;}
function likelyBoundary(shapes,slide,playSpace){const desired=(Number(playSpace?.width)||0)/(Number(playSpace?.height)||1),slideArea=Math.max(1,rectArea(slide)),strong=[],weak=[];for(const s of shapes){const q=clean(s.descr||s.name),sem=classifyTerrainDescription(s.descr||s.name);if(sem.sourceType!=='Battlefield Boundary')continue;if(/battlefield boundary|table boundary|play ?area|map boundary/.test(q))strong.push(s);else weak.push(s);}const pick=list=>list.map(s=>{const area=rectArea(s.rect)/slideArea,ap=desired>0?Math.abs(Math.log(Math.max(.01,aspect(s.rect)/desired))):0;return{s,area,ap,score:ap*5-Math.min(.8,area)}}).filter(x=>x.area>.04&&(desired<=0||x.ap<.5)).sort((a,b)=>a.score-b.score)[0]?.s.rect;if(strong.length){const b=pick(strong);if(b)return b;}if(weak.length){const b=pick(weak);if(b)return b;}const candidates=shapes.filter(s=>s.closed&&s.nodeType==='auto-shape').map(s=>{const area=rectArea(s.rect)/slideArea,ap=desired>0?Math.abs(Math.log(Math.max(.01,aspect(s.rect)/desired))):0;return{s,area,ap,score:ap*4-Math.min(.8,area)}}).filter(x=>x.area>.05&&x.area<.95&&(desired<=0||x.ap<.42));return candidates.sort((a,b)=>a.score-b.score)[0]?.s.rect||slide;}
function pointPct(p,b){return[(p.x-b.x)/Math.max(1,b.w)*100,(p.y-b.y)/Math.max(1,b.h)*100]}
function clippedBoxPct(r,b){const c=intersectRect(r,b);if(!c)return null;return[(c.x-b.x)/b.w*100,(c.y-b.y)/b.h*100,c.w/b.w*100,c.h/b.h*100];}
function geometryPct(parts,b){return{parts:parts.map(p=>({closed:p.closed,points:p.points.map(x=>pointPct(x,b)).map(([x,y])=>[Math.max(0,Math.min(100,x)),Math.max(0,Math.min(100,y))])})).filter(p=>p.points.length>=2)};}
function meaningfulShape(s,b){const c=intersectRect(s.rect,b);if(!c)return false;const ratio=rectArea(c)/Math.max(1,rectArea(b));return ratio>.00004||Math.max(c.w/b.w,c.h/b.h)>.018;}
function preferredSourceText(s){const d=String(s.descr||'').trim();if(d)return d;const n=String(s.name||'').trim();if(n&&!/^(rectangle|freeform|shape|picture|text ?box|textbox|group|connector|straight connector|line|arc|oval|ellipse|auto ?shape)\b/i.test(n))return n;return'';}
function featureName(sourceType,source,count){const base=source&&clean(source)!==clean(sourceType)?source:sourceType;return count>1?`${base} ${count}`:base;}

export async function compilePptxTerrain(file,{playSpace=null}={}){
  const z=await unzipSelected(file,['ppt/slides/slide1.xml','ppt/presentation.xml']);const slideText=z['ppt/slides/slide1.xml'];if(!slideText)throw new Error('PPTX slide1.xml was not found.');const slideDoc=parseXml(slideText,'PPTX slide');const slide=slideSize(z['ppt/presentation.xml']);const tree=descendants(slideDoc,'spTree')[0];if(!tree)throw new Error('PPTX slide did not contain a shape tree.');const shapes=collectShapes(tree);const boundary=likelyBoundary(shapes,slide,playSpace),features=[],candidates=[],counts=new Map();
  for(const s of shapes){if(!meaningfulShape(s,boundary))continue;const source=preferredSourceText(s),shapeAspect=Math.max(aspect(s.rect),1/Math.max(.001,aspect(s.rect))),sem=classifyTerrainDescription(source,{shapeKind:s.nodeType,aspect:shapeAspect,closed:s.closed});
    if(sem.sourceType==='Battlefield Boundary'||sem.sourceType==='Decorative'||/\bbackground\b/i.test(source))continue;
    const box=clippedBoxPct(s.rect,boundary);if(!box)continue;const geometry=geometryPct(s.parts,boundary);const identity=source||s.name||`PowerPoint shape ${s.id||features.length+candidates.length+1}`;
    if(sem.matched){const key=sem.sourceType,n=(counts.get(key)||0)+1;counts.set(key,n);const reason=`PowerPoint-authored geometry identified from source metadata “${identity}”. Classified through the general terrain ontology (${sem.family}); source wording is preserved for review.`;const rec={id:`pptx-${s.id||features.length+candidates.length+1}`,name:featureName(sem.sourceType,source,n),sourceLabel:source||identity,sourceType:sem.sourceType,category:sem.family,proposal:sem.sourceType,cls:sem.cls,effects:sem.effects,detectionConfidence:100,interpretationConfidence:sem.confidence,confidence:sem.confidence,box,geometry,elementIds:[],reason,provenance:'PPTX authored geometry'};if(sem.confidence>=76)features.push(rec);else candidates.push({...rec,kind:sem.sourceType});
    }else if(source||s.nodeType==='connector'||(s.nodeType==='auto-shape'&&s.parts.some(p=>p.points.length>4))){candidates.push({id:`pptx-unknown-${s.id||candidates.length+1}`,name:source||`Unclassified authored shape ${s.id||candidates.length+1}`,sourceLabel:source||identity,sourceType:'Unknown',kind:'unclassified PowerPoint-authored terrain geometry',category:'Unclassified source geometry',proposal:'Review source-authored geometry',cls:'Unknown',effects:[],detectionConfidence:100,interpretationConfidence:0,confidence:0,box,geometry,elementIds:[],reason:'The PowerPoint contains explicit authored geometry inside the battlefield, but its wording is not in the terrain ontology. It is retained for human classification instead of being discarded.',provenance:'PPTX authored geometry'});}
  }
  const byType={};for(const f of features)byType[f.sourceType]=(byType[f.sourceType]||0)+1;return{features,candidates,boundary,slideBounds:slide,shapes,descriptions:shapes.map(s=>s.descr).filter(Boolean),stats:{structured:true,source:'pptx',shapes:shapes.length,promoted:features.length,explorer:candidates.length,counts:byType,summary:Object.entries(byType).map(([k,v])=>`${k} ${v}`).join(' · ')}};
}

export async function inspectPptxAuthoring(file){
  const compiled=await compilePptxTerrain(file);const descriptions=compiled.descriptions;const semantic=compiled.features.map(f=>({description:f.sourceLabel,sourceType:f.sourceType,category:f.category,cls:f.cls,effects:f.effects,confidence:f.interpretationConfidence}));
  return{file:file.name,descriptions,semantic,shapeCount:compiled.shapes.length,featureCount:compiled.features.length,candidateCount:compiled.candidates.length,summary:compiled.stats.summary||`${compiled.shapes.length} authored shapes; ${compiled.candidates.length} unresolved`};
}
export function manifestStats(m){const counts={};for(const f of m.features||[])counts[f.cls]=(counts[f.cls]||0)+1;return{promoted:m.features?.length||0,explorer:m.candidates?.length||0,structured:true,counts};}
export function classSummary(m){const c=manifestStats(m).counts;return CLASS_ORDER.filter(k=>c[k]).map(k=>`${k} ${c[k]}`).join(' · ');}
