const gallery = document.querySelector('[data-gallery]');
if (gallery) {
  const slides = [
    ['Courtyard House', 'A quiet courtyard brings daylight into the heart of this family home.', 'Contemporary house with large windows', '1600596542815-ffad4c1539a9'],
    ['The Workshop', 'A former workshop reimagined as a flexible place to live and work.', 'Contemporary interior with natural materials', '1600210492486-724fe5c67fb0'],
    ['Riverside Apartment', 'A pared-back interior makes room for living, reading, and gathering.', 'Bright apartment living room', '1600607687939-ce8a6c25118c']
  ];
  const image = gallery.querySelector('[data-image]');
  image.addEventListener('error', () => { image.hidden = true; });
  if (image.complete && !image.naturalWidth) image.hidden = true;
  let index = 0;
  function move(step) {
    index = (index + step + slides.length) % slides.length;
    const [title, detail, alt, photo] = slides[index];
    gallery.querySelector('[data-title]').textContent = title;
    gallery.querySelector('[data-detail]').textContent = detail;
    gallery.querySelector('[data-count]').textContent = '0' + (index + 1) + ' / 03';
    image.hidden = false;
    image.alt = alt;
    image.src = 'https://images.unsplash.com/photo-' + photo + '?auto=format&fit=crop&w=1500&q=85';
  }
  gallery.querySelector('[data-prev]').addEventListener('click', () => move(-1));
  gallery.querySelector('[data-next]').addEventListener('click', () => move(1));
}

const bag = document.querySelector('.bag');
if (bag) {
  const items = new Map();
  const count = document.querySelector('[data-count]');
  const list = bag.querySelector('[data-items]');
  const total = bag.querySelector('[data-total]');
  const added = document.querySelector('[data-added]');
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
        renderBag();
        (list.querySelector('button') || bag.querySelector('form button')).focus();
      });
      row.append(label, remove);
      list.append(row);
    }
    if (!quantity) list.textContent = 'Your bag is empty.';
    count.textContent = quantity;
    total.textContent = 'Subtotal £' + price;
  }
  document.querySelector('[data-open-bag]').addEventListener('click', () => {
    renderBag();
    bag.showModal();
  });
  document.querySelectorAll('[data-product]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.product;
      const item = items.get(name) || {price: Number(button.dataset.price), quantity: 0};
      item.quantity += 1;
      items.set(name, item);
      renderBag();
      added.textContent = name + ' added. ' + count.textContent + ' items in your bag.';
    });
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
