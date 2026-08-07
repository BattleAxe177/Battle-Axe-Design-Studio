import { highlightFeature, clearOverlay } from './mapView.js?v=0.3.3.5';

export const RULES = {
  Difficult: 'Move Value is halved for units moving in Difficult terrain.',
  Obscuring: 'Line of sight may be traced into Obscuring terrain, but the terrain limits sight through it according to the applicable Battle Axe rule.',
  Tall: 'Tall terrain blocks ground-level line of sight where the applicable Battle Axe sight line crosses it.',
  Dangerous: 'A unit moving through Dangerous terrain must make the applicable Danger Test.',
  Impassable: 'Units may not move into or across Impassable terrain except through an approved opening or crossing override.',
  Defensive: 'Units benefiting from Defensive terrain receive the applicable defensive combat benefit.'
};

export const CLASSES = ['Open Ground','Dense Wood','Open Grove','Wet Ground','Stream','Road','Masonry Wall','Bridge','Gatehouse','Breach','Building','Decorative','Unknown'];
export const EFFECTS = Object.keys(RULES);

function grouped(features) {
  const groups = new Map();
  for (const feature of features) {
    if (!groups.has(feature.category)) groups.set(feature.category, []);
    groups.get(feature.category).push(feature);
  }
  return groups;
}

export function setupFeatureReview(state, persist, svg) {
  const rows = document.querySelector('#featureRows');
  const count = document.querySelector('#featureCount');
  const overlay = document.querySelector('#selectionOverlay');
  const terrainClass = document.querySelector('#terrainClass');
  const effectList = document.querySelector('#effectList');
  const rulesBox = document.querySelector('#rulesBox');
  CLASSES.forEach(value => terrainClass.add(new Option(value, value)));

  const currentFeatures = () => {
    const imported = state.project.candidates
      .filter(c => state.importedCandidateIds.includes(c.id))
      .map(c => ({...c, category:'Imported from Geometry Explorer', proposal:c.kind, cls:'Unknown', effects:[], reason:`Imported candidate. ${c.reason}`}));
    return [...state.project.features, ...imported];
  };

  function renderRules() {
    const selected = [...effectList.querySelectorAll('input:checked')].map(x => x.value);
    rulesBox.innerHTML = `<strong>Rules context</strong>${selected.length ? selected.map(effect => `<div class="rule-entry"><b>${effect}</b><p>${RULES[effect]}</p></div>`).join('') : '<p>No Battle Axe effects selected.</p>'}`;
  }

  function renderEffects(selected) {
    effectList.innerHTML = '';
    for (const effect of EFFECTS) {
      const label = document.createElement('label');
      label.className = 'effect-row';
      const input = document.createElement('input');
      input.type = 'checkbox'; input.value = effect; input.checked = selected.includes(effect);
      const span = document.createElement('span'); span.textContent = effect;
      label.append(input, span);
      input.addEventListener('change', renderRules);
      effectList.appendChild(label);
    }
    renderRules();
  }

  function renderRows() {
    rows.innerHTML = '';
    const features = currentFeatures();
    count.textContent = features.length;
    for (const [category, items] of grouped(features)) {
      const section = document.createElement('section'); section.className = 'feature-group';
      const h = document.createElement('h4'); h.innerHTML = `${category}<span>${items.length}</span>`; section.appendChild(h);
      for (const feature of items) {
        const button = document.createElement('button'); button.className = 'feature-row'; button.dataset.id = feature.id;
        const decision = state.decisions[feature.id];
        button.innerHTML = `<span class="feature-symbol"></span><span><strong>${feature.name}</strong><small>${feature.proposal} · detect ${feature.detectionConfidence ?? feature.confidence}% · interpret ${feature.interpretationConfidence ?? feature.confidence}%</small></span><b>${decision?.status === 'approved' ? '✓' : decision?.status === 'rejected' ? '×' : '›'}</b>`;
        button.addEventListener('click', () => select(feature.id)); section.appendChild(button);
      }
      rows.appendChild(section);
    }
  }

  function select(id) {
    const feature = currentFeatures().find(f => f.id === id);
    if (!feature) return;
    state.selectedFeatureId = id;
    document.querySelectorAll('.feature-row').forEach(row => row.classList.toggle('selected', row.dataset.id === id));
    const decision = state.decisions[id] || {};
    document.querySelector('#featureName').textContent = feature.name;
    document.querySelector('#featureProposal').innerHTML = `<strong>${feature.proposal}</strong><br><span class="confidence-line">Detection ${feature.detectionConfidence ?? feature.confidence}% · Interpretation ${feature.interpretationConfidence ?? feature.confidence}%</span><br><small>${feature.reason || ''}</small>`;
    terrainClass.value = decision.cls || feature.cls || 'Unknown';
    document.querySelector('#reviewerNote').value = decision.note || '';
    renderEffects(decision.effects || feature.effects || []);
    highlightFeature(svg, overlay, feature, {flash:true});
  }

  function saveDecision(status) {
    if (!state.selectedFeatureId) return;
    state.decisions[state.selectedFeatureId] = {
      status,
      cls: terrainClass.value,
      effects: [...effectList.querySelectorAll('input:checked')].map(x => x.value),
      note: document.querySelector('#reviewerNote').value
    };
    persist(); renderRows(); select(state.selectedFeatureId);
  }

  document.querySelector('#approveButton').addEventListener('click', () => saveDecision('approved'));
  document.querySelector('#reviseButton').addEventListener('click', () => saveDecision('revised'));
  document.querySelector('#rejectButton').addEventListener('click', () => saveDecision('rejected'));
  document.querySelector('#clearSelection').addEventListener('click', () => clearOverlay(overlay));

  renderRows();
  const first = currentFeatures()[0]; if (first) select(first.id);
  return { renderRows, select, currentFeatures };
}
