const EMPTY_CLASS='map-empty';
const SVG_NS='http://www.w3.org/2000/svg';

export function newBattlefieldRevision(){
  return `bf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

function parseSvgRoot(text){
  const doc=new DOMParser().parseFromString(String(text||''),'image/svg+xml');
  if(doc.querySelector('parsererror'))return null;
  const root=doc.documentElement;
  if(root?.localName==='svg'&&root.namespaceURI===SVG_NS)return root;
  return [...doc.getElementsByTagNameNS(SVG_NS,'svg')][0]||null;
}

/**
 * Build a render-only SVG from the immutable source. The stored source SVG is never rewritten.
 * The play area is applied only to the render clone so every workspace sees the same crop while
 * preserving the author's original PowerPoint/SVG evidence for re-compilation and inspection.
 */
export function renderBattlefieldSvgText(project){
  const source=project?.mapSource;
  if(!source?.svgText)return null;
  const root=parseSvgRoot(source.svgText);
  if(!root)return source.svgText;
  const clone=root.cloneNode(true);
  clone.querySelectorAll('#ba-manual-preview,.ba-structured-selected,.ba-raster-selected').forEach(x=>x.remove());
  clone.querySelectorAll('.ba-map-selected,.ba-map-flash').forEach(x=>x.classList.remove('ba-map-selected','ba-map-flash'));
  if(source.playArea)applyPlayAreaViewBox(clone,source.playArea,{intrinsic:true});
  return new XMLSerializer().serializeToString(clone);
}

export function battlefieldImageUrl(project,{embedLocal=true}={}){
  const source=project?.mapSource;
  if(!source)return null;
  if(source.svgText){
    if(!embedLocal)return null;
    const renderText=renderBattlefieldSvgText(project)||source.svgText;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderText)}`;
  }
  if(source.svg)return new URL(`./${source.svg}`,document.baseURI).href;
  return null;
}

function syncImage(img,url){
  if(!img)return;
  const parent=img.parentElement;
  if(url){
    if(img.src!==url)img.src=url;
    img.hidden=false;
    parent?.classList.remove(EMPTY_CLASS);
  }else{
    img.removeAttribute('src');
    img.hidden=true;
    parent?.classList.add(EMPTY_CLASS);
  }
}

export function syncBattlefieldImages(state){
  const url=battlefieldImageUrl(state?.project);
  syncImage(document.querySelector('#deploymentMapImage'),url);
  syncImage(document.querySelector('#geometryPreviewImage'),url);
  syncImage(document.querySelector('#playReplayMapImage'),url);
  return url;
}

export function battlefieldAspect(boundary,fallback={width:48,height:48}){
  const width=Number(boundary?.width||fallback?.width||48);
  const height=Number(boundary?.height||fallback?.height||48);
  return {width:width>0?width:48,height:height>0?height:48};
}

export function applyBattlefieldAspect(element,boundary,fallback){
  if(!element)return;
  const {width,height}=battlefieldAspect(boundary,fallback);
  element.style.setProperty('--battlefield-width',String(width));
  element.style.setProperty('--battlefield-height',String(height));
  element.style.aspectRatio=`${width} / ${height}`;
}

export function applyPlayAreaViewBox(svg,boundary,{intrinsic=true}={}){
  if(!svg||!boundary?.width||!boundary?.height)return svg;
  svg.setAttribute('viewBox',`${boundary.x} ${boundary.y} ${boundary.width} ${boundary.height}`);
  if(intrinsic){
    // Supplying an intrinsic width/height gives responsive width:100%; height:auto SVGs a reliable
    // aspect ratio. This prevents the shallow white-strip failure seen with PowerPoint SVG exports.
    svg.setAttribute('width',String(boundary.width));
    svg.setAttribute('height',String(boundary.height));
  }
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.setAttribute('overflow','hidden');
  svg.style.overflow='hidden';
  return svg;
}

// Retained for compatibility/export tooling. Runtime state must store the immutable sourceSvgText,
// not the output of this function.
export function serializeBattlefieldSvg(svg,boundary){
  const clone=svg.cloneNode(true);
  clone.querySelectorAll('#ba-manual-preview,.ba-structured-selected,.ba-raster-selected').forEach(x=>x.remove());
  clone.querySelectorAll('.ba-map-selected,.ba-map-flash').forEach(x=>x.classList.remove('ba-map-selected','ba-map-flash'));
  applyPlayAreaViewBox(clone,boundary,{intrinsic:true});
  return new XMLSerializer().serializeToString(clone);
}

export function invalidateBattlefieldDependents(state,revision,{clearDeployment=true}={}){
  const s=state?.project?.scenario;
  if(!s)return;
  if(clearDeployment){
    s.deployment={placements:{},commanderPlacements:{},zones:[],battlefieldRevision:revision};
  }else{
    s.deployment={placements:{},commanderPlacements:{},zones:[],...(s.deployment||{}),battlefieldRevision:revision};
  }
  s.playtestPreparedHash=null;
  s.playtestSummary=null;
  s.playtestSingle=null;
}
