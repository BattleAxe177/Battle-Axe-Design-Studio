const CLASS_ORDER=['Stream','Wet Ground','Masonry Wall','Gatehouse','Bridge','Dense Wood','Open Grove','Building','Road'];

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
function cNvPr(el){return [...el.getElementsByTagName('*')].find(x=>lname(x)==='cNvPr')||null}
function xfrm(el){return [...el.getElementsByTagName('*')].find(x=>lname(x)==='xfrm')||null}
function pointNode(el,n){const q=child(el,n);return q?{x:Number(q.getAttribute('x')||0),y:Number(q.getAttribute('y')||0)}:null}
function rectFromXfrm(el){const x=xfrm(el);if(!x)return null;const off=pointNode(x,'off'),ext=child(x,'ext');if(!off||!ext)return null;return{x:off.x,y:off.y,w:Number(ext.getAttribute('cx')||0),h:Number(ext.getAttribute('cy')||0)};}
function clean(s){return String(s||'').trim().toLowerCase().replace(/\s+/g,' ')}
const SEMANTICS={
 'marsh':{cls:'Wet Ground',effects:['Difficult']},'marsh area':{cls:'Wet Ground',effects:['Difficult']},
 'woods':{cls:'Dense Wood',effects:['Difficult','Obscuring']},'built up areas':{cls:'Building',effects:['Difficult','Obscuring','Defensive']},
 'roads':{cls:'Road',effects:[]},'dirt roads':{cls:'Road',effects:[]},'streams':{cls:'Stream',effects:['Difficult']},
 'park walls':{cls:'Masonry Wall',effects:['Impassable','Defensive']},'gates':{cls:'Gatehouse',effects:['Difficult']},
 'tree lines along roads':{cls:'Open Grove',effects:['Obscuring']},'bridges':{cls:'Bridge',effects:[]},'earthworks':{cls:'Building',effects:['Defensive']}
};
export async function inspectPptxAuthoring(file){
  const z=await unzipSelected(file,['ppt/slides/slide1.xml']);const text=z['ppt/slides/slide1.xml'];if(!text)throw new Error('PPTX slide1.xml was not found.');
  const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw new Error('PPTX slide XML could not be parsed.');
  const descriptions=[];for(const el of [...doc.getElementsByTagName('*')].filter(x=>lname(x)==='cNvPr')){const d=el.getAttribute('descr')||'';if(d.trim())descriptions.push(d.trim());}
  const semantic=[...new Set(descriptions.map(clean).filter(d=>SEMANTICS[d]||d.startsWith('buildings - just decorative')))].map(d=>d.startsWith('buildings - just decorative')?{description:d,mode:'decorative'}:{description:d,...SEMANTICS[d]});
  return{file:file.name,descriptions,semantic,summary:semantic.map(x=>x.description).join(' · ')};
}
export function manifestStats(m){const counts={};for(const f of m.features||[])counts[f.cls]=(counts[f.cls]||0)+1;return{promoted:m.features?.length||0,explorer:0,structured:true,counts};}
export function classSummary(m){const c=manifestStats(m).counts;return CLASS_ORDER.filter(k=>c[k]).map(k=>`${k} ${c[k]}`).join(' · ');}
