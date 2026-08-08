let currentHighlighted=[];
let currentRasterOverlay=null;

const SVG_NS = 'http://www.w3.org/2000/svg';

function parseSvgDocument(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    const detail = parserError.textContent?.trim().replace(/\s+/g,' ').slice(0,240) || 'Unknown SVG parser error';
    throw new Error(`SVG parse failed: ${detail}`);
  }

  // PowerPoint-derived SVGs can legitimately use a namespace prefix such as <ns0:svg>.
  // In that case nodeName is "ns0:svg" but localName is still "svg" and the SVG namespace is authoritative.
  const root = doc.documentElement;
  if (!root || root.localName !== 'svg' || root.namespaceURI !== SVG_NS) {
    const nested = [...doc.getElementsByTagNameNS(SVG_NS,'svg')][0];
    if (!nested) {
      const rootName = root?.nodeName || 'none';
      const rootNs = root?.namespaceURI || 'none';
      throw new Error(`Loaded map did not contain an SVG root (root=${rootName}, namespace=${rootNs}).`);
    }
    return nested;
  }
  return root;
}

export async function loadInlineMap(host, url) {
  if (!host) throw new Error('Battlefield map host element was not found.');
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok) throw new Error(`Map request failed: HTTP ${response.status} ${response.statusText}`);
  const text=await response.text();
  if(!text.trim()) throw new Error('Map request returned an empty response.');

  const parsedRoot = parseSvgDocument(text);
  // Import the parsed XML node into the HTML document. Using host.innerHTML would leave prefixed
  // source tags such as <ns0:svg> in the HTML namespace, which are not real SVG DOM elements.
  const svg = document.importNode(parsedRoot, true);
  host.replaceChildren(svg);

  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.classList.add('battlefield-svg');
  svg.dataset.baLoaded = 'true';
  return svg;
}

function clearGeometryHighlight() {
  currentHighlighted.forEach(el=>el.classList.remove('ba-map-selected','ba-map-flash'));
  currentHighlighted=[];
  currentRasterOverlay?.remove(); currentRasterOverlay=null;
}

function highlightStructuredGeometry(svg,feature,{flash=true}={}){
  const parts=feature?.geometry?.parts;
  if(!svg||!Array.isArray(parts)||!parts.length)return false;
  const vb=svg.viewBox?.baseVal;if(!vb?.width||!vb?.height)return false;
  const g=document.createElementNS(SVG_NS,'g');g.classList.add('ba-structured-selected');if(flash)g.classList.add('ba-map-flash');
  const toXY=p=>[vb.x+(Number(p[0])||0)/100*vb.width,vb.y+(Number(p[1])||0)/100*vb.height];
  for(const part of parts){
    const pts=(part.points||[]).map(toXY);if(pts.length<2)continue;
    const el=document.createElementNS(SVG_NS,part.closed?'polygon':'polyline');
    el.setAttribute('points',pts.map(p=>`${p[0]},${p[1]}`).join(' '));
    el.setAttribute('vector-effect','non-scaling-stroke');
    g.appendChild(el);
  }
  if(!g.childNodes.length)return false;
  svg.appendChild(g);currentRasterOverlay=g;if(flash)setTimeout(()=>g.classList.remove('ba-map-flash'),1250);return true;
}

function highlightRasterRuns(svg,feature,{flash=true}={}){
  if(!svg||!feature.rasterRuns?.length)return false;const vb=svg.viewBox?.baseVal;if(!vb?.width||!vb?.height)return false;
  const g=document.createElementNS(SVG_NS,'g');g.classList.add('ba-raster-selected');if(flash)g.classList.add('ba-map-flash');
  for(const [x,y,w,h] of feature.rasterRuns){const r=document.createElementNS(SVG_NS,'rect');r.setAttribute('x',vb.x+x/100*vb.width);r.setAttribute('y',vb.y+y/100*vb.height);r.setAttribute('width',Math.max(.5,w/100*vb.width));r.setAttribute('height',Math.max(.5,h/100*vb.height));g.appendChild(r);}
  svg.appendChild(g);currentRasterOverlay=g;if(flash)setTimeout(()=>g.classList.remove('ba-map-flash'),1250);return true;
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
  } else if(!highlightStructuredGeometry(svg,feature,{flash}) && !highlightRasterRuns(svg,feature,{flash}) && feature.box) setOverlay(overlay,feature.box,{flash});
  // Bounding boxes are a last-resort diagnostic only. Structured PPTX geometry and raster pixels flash their actual recognized shape.
  if(!feature.elementIds?.length && !feature.geometry?.parts?.length && !feature.rasterRuns?.length && feature.box) setOverlay(overlay,feature.box,{flash});
}

export function clearOverlay(overlay) {
  overlay?.classList.add('hidden'); overlay?.classList.remove('flash'); clearGeometryHighlight();
}
