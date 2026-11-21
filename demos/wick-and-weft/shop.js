const products = {
  candle: { name: 'Evening Candle', price: 2200, variants: ['Cedar & fig', 'Unscented'] },
  linen: { name: 'Linen Napkin Pair', price: 1800, variants: ['Oat', 'Clay'] },
  bowl: { name: 'Breakfast Bowl', price: 2600, variants: ['Chalk', 'Moss'] }
};
const storageKey = 'clearframe-wick-and-weft-basket';
const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const pounds = pence => currency.format(pence / 100);
const elements = Object.fromEntries(
  ['bag', 'basket-count', 'basket-items', 'empty', 'shipping', 'shipping-cost', 'subtotal', 'total', 'checkout', 'place-order', 'shop-status', 'checkout-status']
    .map(id => [id, document.getElementById(id)])
);

function restoreBasket() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (!Array.isArray(saved)) return [];
    return saved.filter(item => item && Object.hasOwn(products, item.product) &&
      products[item.product].variants.includes(item.variant) &&
      Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
}

let basket = restoreBasket();

function changeQuantity(product, variant, change) {
  const item = basket.find(line => line.product === product && line.variant === variant);
  if (item) {
    item.quantity += change;
    if (item.quantity === 0) basket = basket.filter(line => line !== item);
  } else {
    basket.push({ product, variant, quantity: 1 });
  }
  elements['checkout-status'].textContent = '';
  renderBasket();
}

function renderBasket() {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(basket));
  } catch {
    // The basket still works for the current page when browser storage is unavailable.
  }
  const count = basket.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = basket.reduce((sum, item) => sum + item.quantity * products[item.product].price, 0);
  const delivery = count && subtotal < 6000 && elements.shipping.value === 'standard' ? 495 : 0;
  elements['basket-count'].textContent = `(${count})`;
  elements.empty.hidden = count > 0;
  elements.subtotal.textContent = pounds(subtotal);
  elements['shipping-cost'].textContent = pounds(delivery);
  elements.total.textContent = pounds(subtotal + delivery);
  elements['place-order'].disabled = count === 0;
  elements['basket-items'].replaceChildren(...basket.map(basketRow));
}

function basketRow({ product, variant, quantity }) {
  const { name, price } = products[product];
  const row = document.createElement('li');
  const description = document.createElement('div');
  const title = document.createElement('strong');
  const details = document.createElement('small');
  title.textContent = name;
  details.textContent = `${variant} · ${pounds(quantity * price)}`;
  description.append(title, details);

  const controls = document.createElement('div');
  controls.className = 'quantity';
  for (const [change, symbol, action] of [[-1, '−', 'Remove one'], [1, '+', 'Add one']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = symbol;
    button.setAttribute('aria-label', `${action} ${name}, ${variant}`);
    button.addEventListener('click', () => {
      const previousIndex = basket.findIndex(item => item.product === product && item.variant === variant);
      changeQuantity(product, variant, change);
      const focusRow = elements['basket-items'].children[Math.min(previousIndex, basket.length - 1)];
      if (focusRow) {
        focusRow.querySelectorAll('button')[change < 0 ? 0 : 1].focus();
      } else {
        document.querySelector('nav a[href="#bag"]').focus();
      }
    });
    controls.append(button);
    if (change === -1) controls.append(document.createTextNode(quantity));
  }
  row.append(description, controls);
  return row;
}

for (const form of document.querySelectorAll('.add')) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const { product } = form.closest('[data-product]').dataset;
    const variant = new FormData(form).get('variant');
    changeQuantity(product, variant, 1);
    const count = elements['basket-count'].textContent.slice(1, -1);
    elements['shop-status'].textContent = `${products[product].name} added. Basket count ${count}.`;
  });
}

elements.shipping.addEventListener('change', renderBasket);
elements.checkout.addEventListener('submit', event => {
  event.preventDefault();
  if (!basket.length) return;
  basket = [];
  renderBasket();
  elements['checkout-status'].textContent = 'Demo order complete. No payment was taken.';
});
renderBasket();
