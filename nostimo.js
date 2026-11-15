const controls = document.querySelector('[data-controls]');
const groups = [...document.querySelectorAll('[data-menu-group]')];
const result = document.querySelector('[data-result]');
const buttons = [...controls.querySelectorAll('button')];

controls.hidden = false;
controls.addEventListener('click', event => {
  const selected = event.target.closest('button[data-category]');
  if (!selected) return;

  buttons.forEach(button => button.setAttribute('aria-pressed', button === selected));
  const category = selected.dataset.category;
  let count = 0;
  groups.forEach(group => {
    group.hidden = category !== 'all' && group.dataset.menuGroup !== category;
    if (!group.hidden) count += group.querySelectorAll('article').length;
  });
  result.textContent = count + ' dishes shown.';
});
