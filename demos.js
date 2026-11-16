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

  function renderBag() {
    let quantity = 0;
    let price = 0;
    list.replaceChildren();
    for (const [name, item] of items) {
      quantity += item.quantity;
      price += item.price * item.quantity;
      const row = document.createElement('div');
      row.className = 'bag-item';
      const label = document.createElement('span');
      label.textContent = name + ' × ' + item.quantity;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'pill';
      remove.textContent = 'Remove one';
      remove.setAttribute('aria-label', 'Remove one ' + name);
      remove.addEventListener('click', () => {
        item.quantity -= 1;
        if (!item.quantity) items.delete(name);
        saveBag();
        renderBag();
        (list.querySelector('button') || bag.querySelector('form button')).focus();
      });
      row.append(label, remove);
      list.append(row);
    }
    if (!quantity) list.textContent = 'Your bag is empty.';
    count.textContent = quantity;
    total.textContent = 'Subtotal £' + price;
    for (const button of products) {
      const indicator = button.parentElement.querySelector('[data-product-bag-count]');
      if (!indicator) continue;
      const inBag = items.get(button.dataset.product)?.quantity ?? 0;
      indicator.hidden = inBag === 0;
      indicator.textContent = inBag ? inBag + ' in bag' : '';
    }
  }
  document.querySelector('[data-open-bag]').addEventListener('click', () => {
    renderBag();
    bag.showModal();
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

const filters = document.querySelectorAll('[data-filter]');
if (filters.length) {
  const classes = [...document.querySelectorAll('[data-kind]')];
  const results = document.querySelector('[data-results]');
  filters.forEach(button => {
    button.addEventListener('click', () => {
      const type = button.dataset.filter;
      filters.forEach(filter => filter.setAttribute('aria-pressed', filter === button));
      classes.forEach(item => { item.hidden = type !== 'all' && item.dataset.kind !== type; });
      results.textContent = classes.filter(item => !item.hidden).length + ' classes shown.';
    });
  });
}
