const EPS=1e-6;

export function mmToInches(mm){return Number(mm||0)/25.4;}
export function normDeg(d){return ((Number(d)||0)%360+360)%360;}
export function forwardVec(facing=0){const r=normDeg(facing)*Math.PI/180;return{x:Math.sin(r),y:-Math.cos(r)};}
export function rightVec(facing=0){const r=normDeg(facing)*Math.PI/180;return{x:Math.cos(r),y:Math.sin(r)};}

export function footprintSpec(entity={},defaults={}){
  const kind=entity.kind||defaults.kind||'unit';
  const legacyDefault=kind==='commander'?Number(defaults.commanderBaseMm||25):Number(defaults.unitBaseMm||50);
  const defaultWidth=kind==='commander'?legacyDefault:Number(defaults.unitBaseWidthMm||legacyDefault);
  const defaultDepth=kind==='commander'?legacyDefault:Number(defaults.unitBaseDepthMm||legacyDefault);
  const explicitBase=entity.baseMm!=null&&String(entity.baseMm).trim()!==''?Number(entity.baseMm):null;
  const baseMm=Number.isFinite(explicitBase)&&explicitBase>0?explicitBase:legacyDefault;
  // A legacy/per-profile baseMm remains an authoritative square footprint unless width/depth are explicit.
  // This prevents scenario-wide rectangular defaults from silently stretching fixed-size assets or old unit overrides.
  const widthMm=Number(entity.baseWidthMm||entity.widthMm||(Number.isFinite(explicitBase)&&explicitBase>0?baseMm:defaultWidth));
  const depthMm=Number(entity.baseDepthMm||entity.depthMm||(Number.isFinite(explicitBase)&&explicitBase>0?baseMm:defaultDepth));
  const shape=entity.baseShape||entity.shape||(kind==='commander'?'circle':'rect');
  return{kind,shape,widthMm,depthMm,width:mmToInches(widthMm),depth:mmToInches(depthMm)};
}

export function rectCorners(entity,x=entity.x,y=entity.y,facing=entity.facing??0,defaults={}){
  const spec=footprintSpec(entity,defaults),hw=spec.width/2,hd=spec.depth/2,f=forwardVec(facing),r=rightVec(facing);
  return[
    {x:x+f.x*hd+r.x*hw,y:y+f.y*hd+r.y*hw},
    {x:x+f.x*hd-r.x*hw,y:y+f.y*hd-r.y*hw},
    {x:x-f.x*hd-r.x*hw,y:y-f.y*hd-r.y*hw},
    {x:x-f.x*hd+r.x*hw,y:y-f.y*hd+r.y*hw}
  ];
}

export function circlePolygon(entity,x=entity.x,y=entity.y,defaults={},segments=24){
  const spec=footprintSpec(entity,defaults),radius=Math.max(spec.width,spec.depth)/2,out=[];
  for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2;out.push({x:x+Math.cos(a)*radius,y:y+Math.sin(a)*radius});}
  return out;
}

export function footprintPolygon(entity,x=entity.x,y=entity.y,facing=entity.facing??0,defaults={}){
  const spec=footprintSpec(entity,defaults);
  return spec.shape==='circle'?circlePolygon(entity,x,y,defaults):rectCorners(entity,x,y,facing,defaults);
}

function axes(poly){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;out.push({x:-dy/l,y:dx/l});}return out;}
function project(poly,axis){let lo=Infinity,hi=-Infinity;for(const p of poly){const q=p.x*axis.x+p.y*axis.y;lo=Math.min(lo,q);hi=Math.max(hi,q);}return{lo,hi};}

// Edge touch is legal. This returns true only for actual polygon penetration.
export function polygonsPenetrate(a,b,tol=EPS){
  for(const axis of [...axes(a),...axes(b)]){const A=project(a,axis),B=project(b,axis);if(A.hi<=B.lo+tol||B.hi<=A.lo+tol)return false;}
  return true;
}

export function footprintsPenetrate(a,b,defaults={},tol=EPS){return polygonsPenetrate(footprintPolygon(a,a.x,a.y,a.facing??0,defaults),footprintPolygon(b,b.x,b.y,b.facing??0,defaults),tol);}
export function sweptFootprintContactDistance(mover,target,dir,maxDistance=Infinity,defaults={}){
  const A=footprintPolygon(mover,mover.x,mover.y,mover.facing??0,defaults),B=footprintPolygon(target,target.x,target.y,target.facing??0,defaults),len=Math.hypot(Number(dir?.x||0),Number(dir?.y||0));
  if(len<EPS)return null;const velocity={x:Number(dir.x)/len,y:Number(dir.y)/len};let entry=-Infinity,exit=Infinity;
  for(const axis of [...axes(A),...axes(B)]){const a=project(A,axis),b=project(B,axis),v=velocity.x*axis.x+velocity.y*axis.y;if(Math.abs(v)<EPS){if(a.hi<b.lo-EPS||b.hi<a.lo-EPS)return null;continue;}const t1=(b.lo-a.hi)/v,t2=(b.hi-a.lo)/v,e=Math.min(t1,t2),x=Math.max(t1,t2);entry=Math.max(entry,e);exit=Math.min(exit,x);if(entry>exit+EPS)return null;}
  if(exit<-EPS)return null;const t=Math.max(0,entry);return t<=Number(maxDistance)+EPS?t:null;
}

export function footprintsTouchOrOverlap(a,b,defaults={},tol=.035){
  const A=footprintPolygon(a,a.x,a.y,a.facing??0,defaults),B=footprintPolygon(b,b.x,b.y,b.facing??0,defaults);
  for(const axis of [...axes(A),...axes(B)]){const x=project(A,axis),y=project(B,axis);if(x.hi<y.lo-tol||y.hi<x.lo-tol)return false;}return true;
}

export function footprintInsideBattlefield(entity,width,height,x=entity.x,y=entity.y,facing=entity.facing??0,defaults={}){
  return footprintPolygon(entity,x,y,facing,defaults).every(p=>p.x>=-EPS&&p.x<=Number(width)+EPS&&p.y>=-EPS&&p.y<=Number(height)+EPS);
}

function pointInPoly(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j],hit=((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/((b.y-a.y)||1e-12)+a.x);if(hit)inside=!inside;}return inside;}
function pointSegDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;if(!l2)return Math.hypot(p.x-a.x,p.y-a.y);let t=((p.x-a.x)*dx+(p.y-a.y)*dy)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));}
function pointPolyDistance(p,poly){if(pointInPoly(p,poly))return 0;let m=Infinity;for(let i=0;i<poly.length;i++)m=Math.min(m,pointSegDistance(p,poly[i],poly[(i+1)%poly.length]));return m;}
export function footprintGapDistance(a,b,defaults={}){
  const A=footprintPolygon(a,a.x,a.y,a.facing??0,defaults),B=footprintPolygon(b,b.x,b.y,b.facing??0,defaults);if(footprintsTouchOrOverlap(a,b,defaults,0))return 0;let m=Infinity;for(const p of A)m=Math.min(m,pointPolyDistance(p,B));for(const p of B)m=Math.min(m,pointPolyDistance(p,A));return m;
}

export function frontCorners(entity,x=entity.x,y=entity.y,facing=entity.facing??0,defaults={}){
  const spec=footprintSpec(entity,defaults),hw=spec.width/2,hd=spec.depth/2,f=forwardVec(facing),r=rightVec(facing);
  return{right:{x:x+f.x*hd+r.x*hw,y:y+f.y*hd+r.y*hw},left:{x:x+f.x*hd-r.x*hw,y:y+f.y*hd-r.y*hw}};
}

export function footprintPercentFromSpec(entity,playSpace={},defaults={}){
  const spec=footprintSpec(entity,defaults),width=Math.max(.001,Number(playSpace.width||48)),height=Math.max(.001,Number(playSpace.height||48));
  return{width:spec.width/width*100,height:spec.depth/height*100};
}
