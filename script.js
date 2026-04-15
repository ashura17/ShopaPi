// CART STATE with localStorage persistence
let cart = [];

// DOM Elements
const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
const cartBody = document.getElementById('cartBody');
const cartTotal = document.getElementById('cartTotal');
const cartBadge = document.getElementById('cartBadge');
const cartVoucher = document.getElementById('cartVoucher');
const closeCartBtn = document.getElementById('closeCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const cartIcon = document.getElementById('cartIcon');

// Helper: Show toast
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem('shopapi_cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
  const saved = localStorage.getItem('shopapi_cart');
  if (saved) {
    cart = JSON.parse(saved);
    updateCartBadge();
    renderCart();
  }
}

// Open / Close Cart
function openCart() {
  cartOverlay.classList.add('open');
  cartSidebar.classList.add('open');
  renderCart();
}
function closeCart() {
  cartOverlay.classList.remove('open');
  cartSidebar.classList.remove('open');
}
if (cartIcon) cartIcon.addEventListener('click', openCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

// Add to Cart
window.addToCart = function(name, price, id) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }
  saveCart();
  updateCartBadge();
  renderCart();
  showToast(`${name} added to cart!`);
};

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartBadge();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(item => item.id === id);
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
    saveCart();
    updateCartBadge();
    renderCart();
  }
}

function updateCartBadge() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartBadge) cartBadge.innerText = totalQty;
}

function renderCart() {
  if (cart.length === 0) {
    if (cartBody) cartBody.innerHTML = '<p style="text-align:center;padding:40px;">Your cart is empty.</p>';
    if (cartTotal) cartTotal.innerText = '₱0';
    if (cartVoucher) cartVoucher.style.display = 'none';
    return;
  }
  let total = 0;
  let html = '';
  cart.forEach(item => {
    const priceNum = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
    total += priceNum * item.qty;
    html += `
      <div class="cart-item">
        <img src="shopapiPics/${item.id}.png" onerror="this.src='https://via.placeholder.com/72x72?text=${item.id}'" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${item.price}</div>
          <div class="cart-qty">
            <button onclick="changeQty('${item.id}', -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty('${item.id}', 1)">+</button>
          </div>
          <button class="remove-item" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
    `;
  });
  if (cartBody) cartBody.innerHTML = html;
  if (cartVoucher) {
    cartVoucher.style.display = 'flex';
    cartVoucher.innerHTML = `<span>🎟️ Voucher SHOPAPI50 applied</span><span style="color:var(--accent);">-₱500</span>`;
  }
  const discount = 500;
  const finalTotal = Math.max(0, total - discount);
  if (cartTotal) cartTotal.innerText = `₱${finalTotal.toLocaleString()}`;
}

// Checkout
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      showToast('Your cart is empty!');
      return;
    }
    closeCart();
    cart = [];
    saveCart();
    updateCartBadge();
    renderCart();
    showToast('🎉 Order placed! Thank you for shopping!');
  });
}

// Scroll to products
window.scrollToProducts = function() {
  const productsSection = document.getElementById('products');
  if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
};

// ---------- INDEX PAGE: Combined Category + Search Filter ----------
function initIndexFilters() {
  const categoryPills = document.querySelectorAll('#categoryFilter .cat-pill');
  const searchInput = document.getElementById('searchInput');
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  function filterIndexProducts() {
    const activeCat = document.querySelector('#categoryFilter .cat-pill.active')?.dataset.category || 'all';
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const cards = document.querySelectorAll('#productsGrid .product-card');
    cards.forEach(card => {
      const catMatch = activeCat === 'all' || card.dataset.category === activeCat;
      const nameEl = card.querySelector('.product-name');
      const nameMatch = nameEl ? nameEl.innerText.toLowerCase().includes(searchTerm) : true;
      card.style.display = (catMatch && nameMatch) ? '' : 'none';
    });
  }

  if (categoryPills.length) {
    categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filterIndexProducts();
      });
    });
  }
  if (searchInput) {
    searchInput.addEventListener('input', filterIndexProducts);
  }
}

// ---------- PRODUCTS PAGE: Filter + Sort + Search ----------
function initProductsFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const sortSelect = document.getElementById('sortSelect');
  const searchInput = document.getElementById('searchInput');
  const grid = document.getElementById('allProductsGrid');
  if (!grid) return;

  function filterAndSort() {
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const cards = Array.from(document.querySelectorAll('#allProductsGrid .product-card'));
    
    // Filter by category and search
    let visible = cards.filter(card => {
      const catMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
      const name = card.querySelector('.product-name')?.innerText.toLowerCase() || '';
      const searchMatch = name.includes(searchTerm);
      return catMatch && searchMatch;
    });
    
    // Sort
    const sortVal = sortSelect ? sortSelect.value : '';
    if (sortVal === 'price-asc') visible.sort((a,b) => +a.dataset.price - +b.dataset.price);
    if (sortVal === 'price-desc') visible.sort((a,b) => +b.dataset.price - +a.dataset.price);
    if (sortVal === 'name') visible.sort((a,b) => a.querySelector('.product-name').textContent.localeCompare(b.querySelector('.product-name').textContent));
    
    // Re-append in sorted order
    visible.forEach(card => grid.appendChild(card));
    // Update count label
    const countLabel = document.getElementById('countLabel');
    if (countLabel) countLabel.textContent = `Showing ${visible.length} product${visible.length !== 1 ? 's' : ''}`;
  }
  
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterAndSort();
      });
    });
  }
  if (sortSelect) sortSelect.addEventListener('change', filterAndSort);
  if (searchInput) searchInput.addEventListener('input', filterAndSort);
}

// ---------- FIX NAVIGATION: only preventDefault for hash links ----------
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const offset = 80;
        const pos = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: pos, behavior: 'smooth' });
      }
    }
    // else allow normal navigation
  });
});

// ---------- MOBILE NAV TOGGLE ----------
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('mainNav');
if (hamburger && mainNav) {
  hamburger.addEventListener('click', () => {
    const isVisible = mainNav.style.display === 'flex';
    mainNav.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      mainNav.style.flexDirection = 'column';
      mainNav.style.position = 'absolute';
      mainNav.style.top = '68px';
      mainNav.style.left = '0';
      mainNav.style.right = '0';
      mainNav.style.background = 'var(--purple-dark)';
      mainNav.style.padding = '12px 0';
      mainNav.style.zIndex = '99';
    }
  });
  // Close mobile nav on link click
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.style.display = 'none';
    });
  });
  // Reset on window resize > 900px
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      mainNav.style.display = '';
      mainNav.style.removeProperty('flex-direction');
      mainNav.style.removeProperty('position');
      mainNav.style.removeProperty('top');
      mainNav.style.removeProperty('left');
      mainNav.style.removeProperty('right');
      mainNav.style.removeProperty('background');
      mainNav.style.removeProperty('padding');
      mainNav.style.removeProperty('z-index');
    } else {
      // Ensure mobile nav is hidden by default on small screens
      if (mainNav.style.display !== 'flex') mainNav.style.display = 'none';
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  initIndexFilters();
  initProductsFilters();
});