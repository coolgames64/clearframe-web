const filters = document.querySelector('.filters');
const buttons = [...filters.querySelectorAll('[data-filter]')];
const groups = [...document.querySelectorAll('[data-menu-group]')];
const status = document.getElementById('menu-status');

function selectMenu(requestedFilter) {
  const active = buttons.find(button => button.dataset.filter === requestedFilter) || buttons[0];
  const filter = active.dataset.filter;
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(button === active));
  }
  for (const group of groups) {
    group.hidden = filter !== 'all' && group.dataset.menuGroup !== filter;
  }
  status.textContent = filter === 'all' ? 'Showing all menu highlights.' : 'Showing ' + active.textContent + '.';
}

for (const button of buttons) {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    const hash = filter === 'all' ? '' : '#' + filter;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search + hash);
    }
    selectMenu(filter);
  });
}

function readMenuLink() {
  selectMenu(window.location.hash.slice(1));
}

filters.hidden = false;
readMenuLink();
window.addEventListener('hashchange', readMenuLink);
