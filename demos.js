const gallery = document.querySelector('[data-gallery]');
if (gallery) {
  const slides = [
    ['courtyard-house', 'Courtyard House', 'A quiet courtyard brings daylight into the heart of this family home.', 'Contemporary house with large windows', '1600596542815-ffad4c1539a9'],
    ['the-workshop', 'The Workshop', 'A former workshop reimagined as a flexible place to live and work.', 'Contemporary interior with natural materials', '1600210492486-724fe5c67fb0'],
    ['riverside-apartment', 'Riverside Apartment', 'A pared-back interior makes room for living, reading, and gathering.', 'Bright apartment living room', '1600607687939-ce8a6c25118c']
  ];
  const image = gallery.querySelector('[data-image]');
  const brief = gallery.querySelector('[data-project-brief]');
  const picker = gallery.querySelector('[data-project-picker]');
  const options = picker ? [...picker.querySelectorAll('button')] : [];
  image.addEventListener('error', () => { image.hidden = true; });
  if (image.complete && !image.naturalWidth) image.hidden = true;
  let index = 0;
  function showProject(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    options.forEach((button, position) => button.setAttribute('aria-pressed', position === index));
    const [key, title, detail, alt, photo] = slides[index];
    if (brief) {
      brief.href = '#brief-' + key;
      brief.setAttribute('aria-label', 'Read the project brief for ' + title);
    }
    gallery.querySelector('[data-title]').textContent = title;
    gallery.querySelector('[data-detail]').textContent = detail;
    gallery.querySelector('[data-count]').textContent = '0' + (index + 1) + ' / 03';
    image.hidden = false;
    image.alt = alt;
    image.src = 'https://images.unsplash.com/photo-' + photo + '?auto=format&fit=crop&w=1500&q=85';
  }
  options.forEach((button, position) => {
    button.addEventListener('click', () => showProject(position));
  });
  if (picker) picker.hidden = false;
  gallery.querySelector('[data-prev]').addEventListener('click', () => showProject(index - 1));
  gallery.querySelector('[data-next]').addEventListener('click', () => showProject(index + 1));
}

const bag = document.querySelector('.bag');
if (bag) {
  const storageKey = 'morrow-demo-bag';
  const products = [...document.querySelectorAll('[data-product]')];
  let items = new Map();
  const count = document.querySelector('[data-count]');
  const list = bag.querySelector('[data-items]');
  const total = bag.querySelector('[data-total]');
  const empty = bag.querySelector('[data-empty-bag]');
  const browse = bag.querySelector('[data-browse-collection]');
  const added = document.querySelector('[data-added]');
  function restoreBag() {
    try {
      const quantities = JSON.parse(sessionStorage.getItem(storageKey));
      const restored = new Map();
      for (const [name, quantity] of Object.entries(quantities ?? {})) {
        const product = products.find(button => button.dataset.product === name);
        if (product && Number.isSafeInteger(quantity) && quantity > 0) {
          restored.set(name, {price: Number(product.dataset.price), quantity});
        }
      }
      items = restored;
    } catch {
      // Browsers may deny storage access. Keep the current bag usable.
    }
  }

  function saveBag() {
    try {
      const quantities = Object.fromEntries([...items].map(([name, item]) => [name, item.quantity]));
      sessionStorage.setItem(storageKey, JSON.stringify(quantities));
    } catch {
      // The current page keeps its bag even if storage is unavailable.
    }
  }

  function renderBag(focusedProduct, focusAction) {
    let focusTarget;
    let quantity = 0;
    let price = 0;
    list.replaceChildren();
    for (const [name, item] of items) {
      quantity += item.quantity;
      const lineTotal = item.price * item.quantity;
      price += lineTotal;
      const row = document.createElement('div');
      row.className = 'bag-item';
      const label = document.createElement('span');
      label.textContent = name + ' × ' + item.quantity;
      const cost = document.createElement('small');
      cost.className = 'bag-item-cost';
      cost.textContent = item.quantity === 1
        ? '£' + lineTotal
        : '£' + item.price + ' each · £' + lineTotal + ' total';
      const itemDetails = document.createElement('div');
      itemDetails.append(label, cost);
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'pill';
      add.textContent = 'Add one';
      add.setAttribute('aria-label', 'Add one ' + name);
      add.addEventListener('click', () => {
        item.quantity += 1;
        saveBag();
        renderBag(name, 'add');
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'pill';
      remove.textContent = 'Remove one';
      remove.setAttribute('aria-label', 'Remove one ' + name);
      remove.addEventListener('click', () => {
        item.quantity -= 1;
        if (!item.quantity) items.delete(name);
        saveBag();
        renderBag(name, 'remove');
      });
      const actions = document.createElement('div');
      actions.className = 'bag-item-actions';
      actions.append(add, remove);
      row.append(itemDetails, actions);
      list.append(row);
      if (name === focusedProduct) focusTarget = focusAction === 'add' ? add : remove;
    }
    if (empty) empty.hidden = quantity > 0;
    else if (!quantity) list.textContent = 'Your bag is empty.';
    total.hidden = Boolean(empty && !quantity);
    count.textContent = quantity;
    total.textContent = 'Subtotal £' + price;
    for (const button of products) {
      const indicator = button.parentElement.querySelector('[data-product-bag-count]');
      if (!indicator) continue;
      const inBag = items.get(button.dataset.product)?.quantity ?? 0;
      indicator.hidden = inBag === 0;
      indicator.textContent = inBag ? inBag + ' in bag' : '';
    }
    if (focusedProduct) {
      (focusTarget || list.querySelector('button') || browse || bag.querySelector('form button')).focus();
    }
  }
  document.querySelector('[data-open-bag]').addEventListener('click', () => {
    renderBag();
    bag.showModal();
    if (empty && !empty.hidden) browse?.focus();
  });
  browse?.addEventListener('click', () => {
    bag.close();
    document.getElementById('collection-title').focus();
  });
  products.forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.product;
      const item = items.get(name) || {price: Number(button.dataset.price), quantity: 0};
      item.quantity += 1;
      items.set(name, item);
      saveBag();
      renderBag();
      added.textContent = name + ' added. ' + count.textContent + ' items in your bag.';
    });
  });
  restoreBag();
  renderBag();
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      restoreBag();
      renderBag();
    }
  });
}

const filters = [...document.querySelectorAll('[data-filter]')];
if (filters.length) {
  const classes = [...document.querySelectorAll('[data-kind]')];
  const results = document.querySelector('[data-results]');
  function showClasses(button) {
    const type = button.dataset.filter;
    filters.forEach(filter => filter.setAttribute('aria-pressed', filter === button));
    classes.forEach(item => { item.hidden = type !== 'all' && item.dataset.kind !== type; });
    const count = classes.filter(item => !item.hidden).length;
    results.textContent = count === 1 ? '1 class shown.' : count + ' classes shown.';
  }

  filters.forEach(button => button.addEventListener('click', () => showClasses(button)));
  if (!location.hash || location.hash === '#timetable') {
    const type = new URLSearchParams(location.search).get('training');
    const initialFilter = filters.find(button => button.dataset.filter === type);
    if (initialFilter) showClasses(initialFilter);
  }
}
