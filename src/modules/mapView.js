export function setOverlay(overlay, box, {flash = true} = {}) {
  if (!box) return clearOverlay(overlay);
  const [left, top, width, height] = box;
  overlay.style.left = `${left}%`;
  overlay.style.top = `${top}%`;
  overlay.style.width = `${width}%`;
  overlay.style.height = `${height}%`;
  overlay.classList.remove('hidden', 'flash');
  if (flash) {
    void overlay.offsetWidth;
    overlay.classList.add('flash');
  }
}

export function clearOverlay(overlay) {
  overlay.classList.add('hidden');
  overlay.classList.remove('flash');
}
