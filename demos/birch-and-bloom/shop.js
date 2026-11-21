const products = {
  'house-blend': { name: 'House Blend', price: 1150 },
  'bright-filter': { name: 'Bright Filter', price: 1300 },
  decaf: { name: 'Decaf', price: 1250 }
};
const grinds = { 'whole-bean': 'Whole bean', ground: 'Ground' };
const storageKey = 'clearframe-birch-and-bloom-basket';
const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const pounds = pence => currency.format(pence / 100);

const countLabels = document.querySelectorAll('[data-basket-count]');
const shopForms = document.querySelectorAll('form[data-product]');
const checkout = document.querySelector('[data-checkout]');
const basketItems = document.querySelector('[data-basket-items]');
const basketStatus = document.querySelector('[data-basket-status]');
const emptyBasket = document.querySelector('[data-basket-empty]');
const checkoutButton = checkout?.querySelector('[type="submit"]');
const deliveryMethod = checkout?.elements.namedItem('delivery');

function restoreBasket() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (Array.isArray(saved)) {
      return saved.filter(item => item && Object.hasOwn(products, item.product) &&
        Object.hasOwn(grinds, item.grind) && Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 && item.quantity <= 99);
    }
  } catch {
    // Browsers can block storage, including in some file previews.
  }
  return [];
}

let basket = restoreBasket();

function saveBasket() {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(basket));
    return true;
  } catch {
    return false;
  }
}

function renderBasket() {
  const count = basket.reduce((sum, item) => sum + item.quantity, 0);
  for (const label of countLabels) label.textContent = count;
  if (!checkout) return;

  const subtotal = basket.reduce((sum, item) => sum + item.quantity * products[item.product].price, 0);
  const delivery = subtotal > 0 && subtotal < 3000 && deliveryMethod.value === 'standard' ? 395 : 0;
  checkout.querySelector('[data-subtotal]').textContent = pounds(subtotal);
  checkout.querySelector('[data-delivery]').textContent = pounds(delivery);
  checkout.querySelector('[data-total]').textContent = pounds(subtotal + delivery);
  checkoutButton.disabled = count === 0;
  emptyBasket.hidden = count > 0;
  basketItems.replaceChildren(...basket.map(basketRow));
}

function changeQuantity(product, grind, change) {
  const item = basket.find(line => line.product === product && line.grind === grind);
  if (item) {
    if (item.quantity + change > 99) return 'The basket can hold up to 99 bags of each option.';
    item.quantity += change;
    if (item.quantity === 0) basket = basket.filter(line => line !== item);
  } else {
    basket.push({ product, grind, quantity: 1 });
  }
  const saved = saveBasket();
  renderBasket();
  return saved ? '' : 'This browser could not save the basket between pages.';
}

function basketRow(item) {
  const { product, grind, quantity } = item;
  const { name, price } = products[product];
  const description = name + ', ' + grinds[grind];
  const row = document.createElement('li');
  row.className = 'basket-row';

  const productDetails = document.createElement('div');
  productDetails.className = 'basket-product';
  const title = document.createElement('strong');
  title.textContent = name;
  const details = document.createElement('span');
  details.textContent = `250 g · ${grinds[grind]} · ${pounds(price)} each`;
  productDetails.append(title, details);

  const controls = document.createElement('div');
  controls.className = 'quantity basket-controls';
  for (const [change, symbol, action] of [[-1, '−', 'Remove one'], [1, '+', 'Add one']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = symbol;
    button.setAttribute('aria-label', `${action} ${description}`);
    button.addEventListener('click', () => {
      const previousIndex = basket.indexOf(item);
      const notice = changeQuantity(product, grind, change);
      basketStatus.textContent = notice || (quantity + change === 0
        ? `${description} removed.`
        : `${description}, quantity ${quantity + change}.`);
      const focusRow = basketItems.children[Math.min(previousIndex, basket.length - 1)];
      const focusTarget = focusRow?.querySelectorAll('button')[change < 0 ? 0 : 1]
        ?? emptyBasket.querySelector('[data-empty-link]');
      focusTarget.focus();
    });
    controls.append(button);
    if (change === -1) {
      const amount = document.createElement('span');
      amount.textContent = quantity;
      controls.append(amount);
    }
  }

  const linePrice = document.createElement('strong');
  linePrice.className = 'basket-line-price';
  linePrice.textContent = pounds(price * quantity);
  row.append(productDetails, controls, linePrice);
  return row;
}

for (const form of shopForms) {
  const status = form.querySelector('[data-shop-status]');
  const basketLink = form.querySelector('.view-basket');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const { product } = form.dataset;
    const grind = new FormData(form).get('grind');
    if (!Object.hasOwn(products, product) || !Object.hasOwn(grinds, grind)) return;

    const notice = changeQuantity(product, grind, 1);
    const count = basket.reduce((sum, item) => sum + item.quantity, 0);
    basketLink.hidden = Boolean(notice);
    status.textContent = notice || `${products[product].name} added. ${count} ${count === 1 ? 'bag' : 'bags'} in your basket.`;
  });
  form.querySelector('[type="submit"]').disabled = false;
}

if (checkout) {
  deliveryMethod.addEventListener('change', renderBasket);
  checkout.addEventListener('submit', event => {
    event.preventDefault();
    if (!basket.length) return;
    basket = [];
    saveBasket();
    renderBasket();
    basketStatus.textContent = 'Demo order complete. No payment was taken.';
    basketStatus.focus();
  });
}
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    basket = restoreBasket();
    for (const form of shopForms) {
      form.querySelector('[data-shop-status]').textContent = '';
      form.querySelector('.view-basket').hidden = true;
    }
    if (basketStatus) basketStatus.textContent = '';
    renderBasket();
  }
});
renderBasket();
