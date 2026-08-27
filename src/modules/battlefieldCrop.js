/**
 * v0.6.5.0: keep authored PowerPoint geometry and rendered SVG in one coordinate frame.
 * The authored tabletop border is authoritative when available.  The helper accepts several
 * compiler metadata shapes and falls back to a visible black/no-fill SVG rectangle so it does
 * not depend on one test fixture or one compiler serialization spelling.
 */
export function svgRootBounds(svg){
  const vb=svg?.viewBox?.baseVal;
  if(vb&&Number(vb.width)>0&&Number(vb.height)>0)return{x:Number(vb.x)||0,y:Number(vb.y)||0,width:Number(vb.width),height:Number(vb.height)};
  const width=Number(svg?.width?.baseVal?.value||svg?.getAttribute?.('width'));
  const height=Number(svg?.height?.baseVal?.value||svg?.getAttribute?.('height'));
  return width>0&&height>0?{x:0,y:0,width,height}:null;
}

function numeric(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function rect(b){
  if(!b)return null;
  let x=numeric(b.x??b.left??b.x0),y=numeric(b.y??b.top??b.y0),width=numeric(b.width??b.w),height=numeric(b.height??b.h);
  if(width==null&&numeric(b.right)!=null&&x!=null)width=numeric(b.right)-x;
  if(height==null&&numeric(b.bottom)!=null&&y!=null)height=numeric(b.bottom)-y;
  if(x==null||y==null||width==null||height==null)return null;
  return{x,y,width,height};
}
function firstRect(...items){for(const item of items){const r=rect(item);if(r&&r.width>0&&r.height>0)return r;}return null;}
function dimensionsRect(o){
  if(!o)return null;
  const width=numeric(o.slideWidth??o.width??o.cx??o.pageWidth),height=numeric(o.slideHeight??o.height??o.cy??o.pageHeight);
  return width>0&&height>0?{x:0,y:0,width,height}:null;
}
function normalizeColor(s){return String(s||'').trim().toLowerCase().replace(/\s+/g,'');}
function nearBlack(s){
  const c=normalizeColor(s);
  if(!c)return false;
  if(['black','#000','#000000','rgb(0,0,0)'].includes(c))return true;
  const hex=c.match(/^#([0-9a-f]{6})$/i);if(hex){const n=parseInt(hex[1],16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;return r<55&&g<55&&b<55;}
  const rgb=c.match(/^rgb\((\d+),(\d+),(\d+)\)$/);return !!rgb&&rgb.slice(1).every(v=>Number(v)<55);
}
function parseStyle(el){const out={};for(const part of String(el?.getAttribute?.('style')||'').split(';')){const i=part.indexOf(':');if(i>0)out[part.slice(0,i).trim().toLowerCase()]=part.slice(i+1).trim();}return out;}
function rectFromElement(el){
  const x=numeric(el?.getAttribute?.('x'))??0,y=numeric(el?.getAttribute?.('y'))??0,width=numeric(el?.getAttribute?.('width')),height=numeric(el?.getAttribute?.('height'));
  return width>0&&height>0?{x,y,width,height}:null;
}
/** Largest plausible black/no-fill rectangle inside the SVG root. */
export function visibleBorderRect(svg){
  const root=svgRootBounds(svg);if(!root||!svg?.querySelectorAll)return null;
  const rootArea=root.width*root.height,candidates=[];
  for(const el of svg.querySelectorAll('rect')){
    const r=rectFromElement(el);if(!r)continue;
    const style=parseStyle(el),stroke=el.getAttribute?.('stroke')||style.stroke||'',fill=normalizeColor(el.getAttribute?.('fill')||style.fill||'');
    const area=r.width*r.height,areaRatio=area/rootArea;
    const fillOpen=!fill||fill==='none'||fill==='transparent'||fill==='rgba(0,0,0,0)';
    if(!nearBlack(stroke)||!fillOpen||areaRatio<0.08||areaRatio>0.94)continue;
    if(r.width<root.width*0.18||r.height<root.height*0.18)continue;
    candidates.push({r,score:areaRatio});
  }
  candidates.sort((a,b)=>b.score-a.score);return candidates[0]?.r||null;
}

export function authoredBoundaryToSvg(svg,structured){
  const root=svgRootBounds(svg);if(!root)return null;
  const boundary=firstRect(
    structured?.boundary,structured?.playArea,structured?.playAreaBounds,structured?.battlefieldBoundary,
    structured?.authoring?.boundary,structured?.stats?.boundary,structured?.stats?.playArea
  );
  const slide=firstRect(
    structured?.slideBounds,structured?.pageBounds,structured?.sourceBounds,structured?.slide?.bounds,
    structured?.stats?.slideBounds,structured?.stats?.sourceBounds
  )||dimensionsRect(structured?.slide)||dimensionsRect(structured?.stats)||dimensionsRect(structured);
  if(boundary&&slide&&boundary.width>0&&boundary.height>0&&slide.width>0&&slide.height>0){
    const x=root.x+((boundary.x-slide.x)/slide.width)*root.width;
    const y=root.y+((boundary.y-slide.y)/slide.height)*root.height;
    const width=(boundary.width/slide.width)*root.width;
    const height=(boundary.height/slide.height)*root.height;
    if([x,y,width,height].every(Number.isFinite)&&width>0&&height>0)return{x,y,width,height};
  }
  // Some compilers already express the authored border in SVG/root units.
  if(boundary&&boundary.x>=root.x-1&&boundary.y>=root.y-1&&boundary.x+boundary.width<=root.x+root.width+1&&boundary.y+boundary.height<=root.y+root.height+1)return boundary;
  // Last safe fallback: use the author's visible black frame, not the full slide/root.
  return visibleBorderRect(svg);
}
