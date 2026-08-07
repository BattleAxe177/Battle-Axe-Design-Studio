export function setupNavigation() {
  const sidebar = document.querySelector('#sidebar');
  const showView = (name) => {
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    sidebar.classList.remove('open');
    history.replaceState(null, '', `#${name}`);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };
  document.querySelectorAll('.nav-item,.jump').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  document.querySelector('#menuButton').addEventListener('click', () => sidebar.classList.toggle('open'));
  const hash = location.hash.slice(1);
  if (hash && document.querySelector(`#view-${hash}`)) showView(hash);
  return { showView };
}
