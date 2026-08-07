import { setOverlay, clearOverlay } from './mapView.js';

export function setupGeometryExplorer(state, persist, featureReview) {
  const dialog = document.querySelector('#geometryDialog');
  const rows = document.querySelector('#candidateRows');
  const info = document.querySelector('#candidateInfo');
  const overlay = document.querySelector('#candidateOverlay');
  const importButton = document.querySelector('#importCandidate');
  const ignoreButton = document.querySelector('#ignoreCandidate');

  const available = () => state.project.candidates.filter(c => !state.importedCandidateIds.includes(c.id) && !state.ignoredCandidates[c.id]);

  function render() {
    rows.innerHTML = '';
    const candidates = available();
    if (!candidates.length) rows.innerHTML = '<p class="muted">No additional candidates remain.</p>';
    for (const candidate of candidates) {
      const button = document.createElement('button'); button.className = 'candidate-row'; button.dataset.id = candidate.id;
      button.innerHTML = `<strong>${candidate.name}</strong><small>${candidate.kind} · ${candidate.confidence}%</small>`;
      button.addEventListener('click', () => select(candidate.id)); rows.appendChild(button);
    }
    document.querySelector('#diagExplorer').textContent = `${candidates.length} candidates`;
  }

  function select(id) {
    const candidate = available().find(c => c.id === id);
    if (!candidate) return;
    state.selectedCandidateId = id;
    [...rows.querySelectorAll('.candidate-row')].forEach(r => r.classList.toggle('selected', r.dataset.id === id));
    info.innerHTML = `<h3>${candidate.name}</h3><p><strong>Candidate:</strong> ${candidate.kind}</p><p><strong>Confidence:</strong> ${candidate.confidence}%</p><p><strong>Why not automatically promoted:</strong> ${candidate.reason}</p><p class="muted">Preview defaults to the whole battlefield. The candidate flashes red and remains translucent red for context.</p>`;
    setOverlay(overlay, candidate.box, {flash:true});
    importButton.disabled = false; ignoreButton.disabled = false;
  }

  function open() {
    render();
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
    const first = available()[0]; if (first) select(first.id); else clearOverlay(overlay);
  }

  function close() { if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open'); }
  document.querySelector('#detectButton').addEventListener('click', open);
  document.querySelector('#closeExplorer').addEventListener('click', close);
  importButton.addEventListener('click', () => {
    if (!state.selectedCandidateId) return;
    state.importedCandidateIds.push(state.selectedCandidateId);
    persist(); featureReview.renderRows(); render();
    const imported = state.selectedCandidateId; state.selectedCandidateId = null;
    close(); featureReview.select(imported);
  });
  ignoreButton.addEventListener('click', () => {
    if (!state.selectedCandidateId) return;
    state.ignoredCandidates[state.selectedCandidateId] = true; state.selectedCandidateId = null;
    persist(); render(); clearOverlay(overlay); importButton.disabled = true; ignoreButton.disabled = true;
    info.innerHTML = '<h3>Candidate ignored</h3><p>Ignored geometry remains excluded from the normal review queue.</p>';
  });
  render();
  return { open, render };
}
