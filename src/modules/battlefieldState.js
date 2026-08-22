const EMPTY_CLASS='map-empty';

export function newBattlefieldRevision(){
  return `bf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

export function battlefieldImageUrl(project,{embedLocal=true}={}){
  const source=project?.mapSource;
  if(!source)return null;
  if(source.svgText){
    if(!embedLocal)return null;
    let text=source.svgText;
    if(source.playArea){
      try{
        const doc=new DOMParser().parseFromString(text,'image/svg+xml'),svg=doc.documentElement;
        applyPlayAreaViewBox(svg,source.playArea);
        text=new XMLSerializer().serializeToString(svg);
      }catch(error){console.warn('Could not normalize battlefield SVG viewBox for downstream workspace',error);}
    }
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
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

export function applyPlayAreaViewBox(svg,boundary){
  if(!svg||!boundary?.width||!boundary?.height)return svg;
  svg.setAttribute('viewBox',`${boundary.x} ${boundary.y} ${boundary.width} ${boundary.height}`);
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.setAttribute('overflow','hidden');
  svg.style.overflow='hidden';
  return svg;
}

export function serializeBattlefieldSvg(svg,boundary){
  const clone=svg.cloneNode(true);
  clone.querySelectorAll('#ba-manual-preview,.ba-structured-selected,.ba-raster-selected').forEach(x=>x.remove());
  clone.querySelectorAll('.ba-map-selected,.ba-map-flash').forEach(x=>x.classList.remove('ba-map-selected','ba-map-flash'));
  applyPlayAreaViewBox(clone,boundary);
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
