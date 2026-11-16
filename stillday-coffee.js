'use strict';

const GRINDS = ['Whole bean', 'Ground for filter', 'Ground for cafetière'];
const CATALOGUE = [
  {
    id: 'daybreak', name: 'Daybreak Blend', category: 'coffee', type: 'Medium roast · 250 g',
    notes: 'Milk chocolate, toasted almond and caramel.', price: 1150, options: GRINDS,
    description: 'A round, easy-drinking blend of coffees from Brazil and Colombia. Try it with milk or brew it as a short, sweet filter.',
    pack: 'Daybreak', weight: 'Blend · 250 g', colour: '#f0b38e', background: '#eed9bd'
  },
  {
    id: 'highline', name: 'Highline Filter', category: 'coffee', type: 'Light roast · 250 g',
    notes: 'Peach, orange blossom and black tea.', price: 1400, options: GRINDS,
    description: 'A washed Ethiopian coffee with a soft, tea-like finish. Brew it as a pour-over to bring out the stone fruit and floral notes.',
    pack: 'Highline', weight: 'Single origin · 250 g', colour: '#e8cf77', background: '#eae1c8'
  },
  {
    id: 'afterhours', name: 'Afterhours Decaf', category: 'coffee', type: 'Medium roast · 250 g',
    notes: 'Cocoa, red apple and brown sugar.', price: 1250, options: GRINDS,
    description: 'A Colombian decaf with a gently sweet finish. It works well as filter coffee or a cosy evening cup with milk.',
    pack: 'Afterhours', weight: 'Decaf · 250 g', colour: '#b7c8a9', background: '#d9e0ce'
  },
  {
    id: 'dripper', name: 'The Ceramic Dripper', category: 'gear', type: 'Pour-over · 1–2 cups',
    notes: 'A simple ceramic brewer for cone filters.', price: 2200,
    description: 'Place the dripper over a mug or carafe, add a rinsed cone filter and pour slowly. Pair it with Highline for a bright morning brew.',
    image: 7937497, alt: 'White ceramic coffee dripper on a glass carafe'
  },
  {
    id: 'mug', name: 'The Everyday Mug', category: 'gear', type: 'Stoneware · 280 ml',
    notes: 'A glazed stoneware mug in warm oat.', price: 1800,
    description: 'A gently rounded mug with a comfortable handle and a warm, speckled glaze. Sized for one generous filter coffee.',
    image: 4830752, alt: 'Handmade oat-coloured ceramic mugs'
  },
  {
    id: 'tasting', name: 'The Tasting Set', category: 'gifts', type: 'Three coffees · 3 × 100 g',
    notes: 'Daybreak, Highline and Afterhours in one box.', price: 2400, options: GRINDS,
    description: 'Compare the three Stillday roasts side by side. Each box has three 100 g bags, all in your chosen grind.',
    pack: 'Tasting Set', weight: 'Three roasts · 3 × 100 g', colour: '#e4ba9a', background: '#ead7cf'
  }
];

const DELIVERY = [
  { id: 'standard', label: 'Standard delivery', estimate: '2–4 working days', price: 350 },
  { id: 'express', label: 'Express delivery', estimate: '1–2 working days', price: 595 }
];
const FREE_STANDARD_AT = 3500;
const MAX_QUANTITY = 12;
const STORAGE_KEY = 'stillday-demo-basket-v1';
const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const formatMoney = pence => money.format(pence / 100);
const productById = new Map(CATALOGUE.map(product => [product.id, product]));

const products = document.getElementById('products');
const sort = document.getElementById('sort');
const count = document.getElementById('result-count');
const filters = [...document.querySelectorAll('[data-category]')];
const announcement = document.getElementById('announcement');
const productDialog = document.getElementById('product-dialog');
const productDetail = document.getElementById('product-detail');
const basketDialog = document.getElementById('basket-dialog');
const basketTitle = document.getElementById('basket-title');
const basketContent = document.getElementById('basket-content');
const basketCount = document.getElementById('basket-count');
const basketButton = document.getElementById('open-basket');

let category = 'all';
let basket = readBasket();
let delivery = DELIVERY[0];

function readBasket() {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(items)) return [];
    const valid = new Map();
    for (const item of items) {
      const product = productById.get(item?.id);
      if (!product || !Number.isInteger(item.quantity) || item.quantity < 1) continue;
      const options = product.options || [''];
      if (!options.includes(item.option)) continue;
      const key = product.id + ':' + item.option;
      const earlier = valid.get(key)?.quantity || 0;
      valid.set(key, { id: product.id, option: item.option, quantity: Math.min(earlier + item.quantity, MAX_QUANTITY) });
    }
    return [...valid.values()];
  } catch {
    return [];
  }
}

function saveBasket() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
  } catch {
    // The basket still works for the current page if browser storage is unavailable.
  }
  basketCount.textContent = basket.reduce((total, item) => total + item.quantity, 0);
}

function visual(product) {
  if (product.image) {
    const src = 'https://images.pexels.com/photos/' + product.image + '/pexels-photo-' + product.image + '.jpeg?auto=compress&amp;cs=tinysrgb&amp;w=720';
    return '<div class="product-visual"><img src="' + src + '" alt="' + product.alt + '" width="720" height="540" loading="lazy"></div>';
  }
  const packClass = product.category === 'gifts' ? 'pack pack-box' : 'pack';
  return '<div class="product-visual" aria-hidden="true" style="--product-bg:' + product.background + ';--pack:' + product.colour + '">' +
    '<span class="' + packClass + '"><span class="pack-mark">Stillday Coffee</span><span class="pack-name">' + product.pack +
    '</span><span class="pack-weight">' + product.weight + '</span></span></div>';
}

function renderCatalogue() {
  const selection = CATALOGUE.filter(product => category === 'all' || product.category === category);
  if (sort.value === 'low') selection.sort((a, b) => a.price - b.price);
  if (sort.value === 'high') selection.sort((a, b) => b.price - a.price);
  count.textContent = selection.length + (selection.length === 1 ? ' product' : ' products');
  products.innerHTML = selection.map(product =>
    '<article class="product-card">' + visual(product) + '<div class="product-copy">' +
    '<p class="product-type">' + product.type + '</p><h3><button type="button" class="product-title-button" data-product="' + product.id + '">' + product.name + '</button></h3>' +
    '<p class="product-notes">' + product.notes + '</p><div class="product-bottom"><strong>' + formatMoney(product.price) + '</strong>' +
    '<button type="button" class="button secondary" data-product="' + product.id + '">' +
    (product.options ? 'Choose grind' : 'View product') + '<span class="visually-hidden"> for ' + product.name + '</span></button></div></div></article>'
  ).join('');
}

function selectCategory(next) {
  category = next;
  for (const filter of filters) filter.setAttribute('aria-pressed', String(filter.dataset.category === category));
  renderCatalogue();
}

function openProduct(product) {
  const options = product.options ? (
    '<label for="grind">Choose your grind</label><select id="grind" name="grind">' +
    product.options.map(option => '<option>' + option + '</option>').join('') + '</select>'
  ) : '';
  productDetail.innerHTML = '<div class="detail-grid">' + visual(product) +
    '<div class="detail-copy"><p class="product-type">' + product.type + '</p><h2 id="product-title" tabindex="-1">' + product.name + '</h2>' +
    '<p>' + product.description + '</p><p><strong>' + formatMoney(product.price) + '</strong></p>' +
    '<form class="product-form" data-product-form="' + product.id + '">' + options +
    '<button type="submit" class="button">Add to basket</button></form></div></div>';
  productDialog.showModal();
  document.getElementById('product-title').focus();
}

function subtotal() {
  return basket.reduce((total, item) => total + productById.get(item.id).price * item.quantity, 0);
}

function itemLabel(item) {
  return productById.get(item.id).name + (item.option ? ', ' + item.option : '');
}

function renderBasket() {
  basketTitle.textContent = 'Your basket';
  if (!basket.length) {
    basketContent.innerHTML = '<h3>Your basket is empty.</h3><p>Choose a coffee or a piece of brew gear to get started.</p>' +
      '<a class="button" href="#shop" data-basket-action="browse">Browse the shop</a>';
    return;
  }

  const rows = basket.map((item, index) => {
    const product = productById.get(item.id);
    const label = itemLabel(item);
    return '<li class="basket-row"><div><strong>' + product.name + '</strong>' +
      '<small>' + (item.option || product.type) + '</small><div class="basket-actions">' +
      '<div class="quantity"><button type="button" data-basket-action="less" data-index="' + index +
      '" aria-label="Decrease quantity of ' + label + '"' + (item.quantity === 1 ? ' disabled' : '') + '>−</button>' +
      '<span aria-label="Quantity">' + item.quantity + '</span><button type="button" data-basket-action="more" data-index="' + index +
      '" aria-label="Increase quantity of ' + label + '"' + (item.quantity === MAX_QUANTITY ? ' disabled' : '') + '>+</button></div>' +
      '<button type="button" class="remove" data-basket-action="remove" data-index="' + index +
      '" aria-label="Remove ' + label + '">Remove</button></div></div>' +
      '<strong>' + formatMoney(product.price * item.quantity) + '</strong></li>';
  }).join('');
  const leftToFreeDelivery = FREE_STANDARD_AT - subtotal();
  const deliveryNote = leftToFreeDelivery > 0
    ? 'Add ' + formatMoney(leftToFreeDelivery) + ' for free standard delivery.'
    : 'Your basket qualifies for free standard delivery.';
  basketContent.innerHTML = '<ul class="basket-items">' + rows + '</ul>' +
    '<dl class="totals"><div><dt>Subtotal</dt><dd>' + formatMoney(subtotal()) + '</dd></div></dl>' +
    '<p class="basket-note">' + deliveryNote + '</p><div class="basket-buttons">' +
    '<button type="button" class="button" data-basket-action="checkout">Sample checkout</button>' +
    '<button type="button" class="button secondary" data-basket-action="continue">Continue shopping</button></div>';
}

function showBasket() {
  renderBasket();
  basketDialog.showModal();
  basketTitle.focus();
}

function deliveryPrice(method) {
  return method.id === 'standard' && subtotal() >= FREE_STANDARD_AT ? 0 : method.price;
}

function updateCheckoutTotal() {
  const shipping = deliveryPrice(delivery);
  document.getElementById('shipping-amount').textContent = shipping ? formatMoney(shipping) : 'Free';
  document.getElementById('order-total').textContent = formatMoney(subtotal() + shipping);
}

function renderCheckout() {
  basketTitle.textContent = 'Sample checkout';
  const summary = basket.map(item =>
    '<li><span>' + item.quantity + ' × ' + itemLabel(item) + '</span><strong>' +
    formatMoney(productById.get(item.id).price * item.quantity) + '</strong></li>'
  ).join('');
  const ways = DELIVERY.map(method => {
    const price = deliveryPrice(method);
    return '<label><input type="radio" name="delivery" value="' + method.id + '"' +
      (method.id === delivery.id ? ' checked' : '') + '> ' + method.label + ' · ' + method.estimate + ' · ' +
      (price ? formatMoney(price) : 'Free') + '</label>';
  }).join('');
  basketContent.innerHTML = '<p class="basket-note">This checkout is a demo. It uses sample delivery options and takes no payment or personal details.</p>' +
    '<h3>Order summary</h3><ul class="checkout-items">' + summary + '</ul>' +
    '<fieldset class="delivery"><legend>Delivery method</legend>' + ways + '</fieldset>' +
    '<dl class="totals" aria-live="polite"><div><dt>Subtotal</dt><dd>' + formatMoney(subtotal()) + '</dd></div>' +
    '<div><dt>Delivery</dt><dd id="shipping-amount"></dd></div><div class="grand-total"><dt>Total</dt><dd id="order-total"></dd></div></dl>' +
    '<div class="basket-buttons"><button type="button" class="button" data-basket-action="place">Place demo order</button>' +
    '<button type="button" class="button secondary" data-basket-action="back">Back to basket</button></div>';
  updateCheckoutTotal();
  basketTitle.focus();
}

function completeDemoOrder() {
  const total = formatMoney(subtotal() + deliveryPrice(delivery));
  basket = [];
  delivery = DELIVERY[0];
  saveBasket();
  basketTitle.textContent = 'Demo order complete';
  basketContent.innerHTML = '<p>Your sample order total was <strong>' + total + '</strong>. No payment was taken.</p>' +
    '<a class="button" href="#shop" data-basket-action="browse">Back to the shop</a>';
  basketTitle.focus();
}

function changeQuantity(action, rawIndex) {
  const index = Number(rawIndex);
  const item = basket[index];
  if (!item) return;
  const label = itemLabel(item);
  if (action === 'remove') {
    basket.splice(index, 1);
    announcement.textContent = label + ' removed.';
  } else {
    const direction = action === 'more' ? 1 : -1;
    item.quantity = Math.max(1, Math.min(MAX_QUANTITY, item.quantity + direction));
    announcement.textContent = label + ', quantity ' + item.quantity + '.';
  }
  saveBasket();
  renderBasket();
  const next = basketContent.querySelector('[data-index="' + index + '"][data-basket-action="' + action + '"]:not(:disabled)') ||
    basketContent.querySelector('[data-index="' + index + '"][data-basket-action="remove"]');
  (next || basketTitle).focus();
}

for (const filter of filters) filter.addEventListener('click', () => selectCategory(filter.dataset.category));
sort.addEventListener('change', renderCatalogue);
products.addEventListener('click', event => {
  const button = event.target.closest('[data-product]');
  if (button) openProduct(productById.get(button.dataset.product));
});
productDetail.addEventListener('submit', event => {
  event.preventDefault();
  const product = productById.get(event.target.dataset.productForm);
  const option = new FormData(event.target).get('grind') || '';
  const item = basket.find(entry => entry.id === product.id && entry.option === option);
  if (item) {
    if (item.quantity === MAX_QUANTITY) announcement.textContent = 'The basket already contains the maximum quantity of this item.';
    else item.quantity += 1;
  } else {
    basket.push({ id: product.id, option, quantity: 1 });
  }
  saveBasket();
  productDialog.close();
  showBasket();
});

basketButton.addEventListener('click', showBasket);
for (const dialog of [productDialog, basketDialog]) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
}
basketContent.addEventListener('click', event => {
  const target = event.target.closest('[data-basket-action]');
  if (!target) return;
  const { basketAction: action, index } = target.dataset;
  switch (action) {
    case 'more':
    case 'less':
    case 'remove':
      changeQuantity(action, index);
      break;
    case 'checkout':
      if (basket.length) renderCheckout();
      break;
    case 'back':
      renderBasket();
      basketTitle.focus();
      break;
    case 'place':
      if (basket.length) completeDemoOrder();
      break;
    case 'continue':
      basketDialog.close();
      break;
    case 'browse':
      basketDialog.close();
      document.getElementById('shop-title').focus({ preventScroll: true });
      break;
  }
});

basketContent.addEventListener('change', event => {
  if (event.target.name !== 'delivery') return;
  delivery = DELIVERY.find(method => method.id === event.target.value) || DELIVERY[0];
  updateCheckoutTotal();
});

saveBasket();
const entry = new URLSearchParams(window.location.search);
selectCategory(['coffee', 'gear', 'gifts'].includes(entry.get('category')) ? entry.get('category') : 'all');
if (entry.get('basket') === '1') showBasket();
