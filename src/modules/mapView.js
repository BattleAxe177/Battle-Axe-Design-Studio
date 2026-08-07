let currentHighlighted=[];

export async function loadInlineMap(host, url) {
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok) throw new Error(`Map request failed: ${response.status}`);
  const text=await response.text();
  host.innerHTML=text;
  const svg=host.querySelector('svg');
  if(!svg) throw new Error('Loaded map did not contain an SVG root.');
  svg.removeAttribute('width'); svg.removeAttribute('height');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.classList.add('battlefield-svg');
  return svg;
}

function clearGeometryHighlight() {
  currentHighlighted.forEach(el=>el.classList.remove('ba-map-selected','ba-map-flash'));
  currentHighlighted=[];
}

export function setOverlay(overlay, box, {flash = true} = {}) {
  if (!box) return clearOverlay(overlay);
  const [left, top, width, height] = box;
  overlay.style.left = `${left}%`; overlay.style.top = `${top}%`; overlay.style.width = `${width}%`; overlay.style.height = `${height}%`;
  overlay.classList.remove('hidden', 'flash');
  if (flash) { void overlay.offsetWidth; overlay.classList.add('flash'); }
}

export function highlightFeature(svg, overlay, feature, {flash=true}={}) {
  clearGeometryHighlight(); clearOverlay(overlay);
  const ids=[...(feature.elementIds||[]),...(feature.relatedElementIds||[])];
  for(const id of ids){
    const el=svg?.querySelector(`[data-ba-geometry-id="${CSS.escape(id)}"]`);
    if(el){el.classList.add('ba-map-selected'); currentHighlighted.push(el); if(flash)el.classList.add('ba-map-flash');}
  }
  if(currentHighlighted.length){
    if(flash)setTimeout(()=>currentHighlighted.forEach(el=>el.classList.remove('ba-map-flash')),1250);
  } else if(feature.box) setOverlay(overlay,feature.box,{flash});
  // Synthetic openings get a small precise map marker even when related wall line is also highlighted.
  if(!feature.elementIds?.length && feature.box) setOverlay(overlay,feature.box,{flash});
}

export function clearOverlay(overlay) {
  overlay?.classList.add('hidden'); overlay?.classList.remove('flash'); clearGeometryHighlight();
}
