let currentHighlighted=[];

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
