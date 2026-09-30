/**
 * Frutos del Sol - Core Logic
 */

// --- Base Products Mock Data ---
const PRODUCTS = [
    {
        id: 1,
        name: "Nueces Mariposa Premium",
        category: "frutos-secos",
        price: 4990,
        unit: "500g",
        image: "https://images.unsplash.com/photo-1543208541-005dd2419920?auto=format&fit=crop&q=80&w=500"
    },
    {
        id: 2,
        name: "Almendras Tostadas Sin Sal",
        category: "frutos-secos",
        price: 5490,
        unit: "500g",
        image: "https://images.unsplash.com/photo-1508061252966-17325f462551?auto=format&fit=crop&q=80&w=500"
    },
    {
        id: 3,
        name: "Mix Energía Vital",
        category: "mixes",
        price: 3990,
        unit: "400g",
        image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=500"
    },
    {
        id: 4,
        name: "Semillas de Chía Orgánica",
        category: "semillas",
        price: 2490,
        unit: "250g",
        image: "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&q=80&w=500"
    },
    {
        id: 5,
        name: "Castañas de Cajú Naturales",
        category: "frutos-secos",
        price: 6990,
        unit: "500g",
        image: "https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&q=80&w=500"
    },
    {
        id: 6,
        name: "Mango Deshidratado sin Azúcar",
        category: "deshidratados",
        price: 3290,
        unit: "200g",
        image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=500"
    },
    {
        id: 7,
        name: "Semillas de Zapallo Peladas",
        category: "semillas",
        price: 2990,
        unit: "300g",
        image: "https://images.unsplash.com/photo-1508061252966-17325f462551?auto=format&fit=crop&q=80&w=500"
    },
    {
        id: 8,
        name: "Mix Keto Proteico",
        category: "mixes",
        price: 4590,
        unit: "400g",
        image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=500"
    }
];

// --- Application State ---
let cart = JSON.parse(localStorage.getItem('cart_items')) || [];
let currentCategory = 'all';
let searchQuery = '';

// --- DOM Elements ---
const productsGrid = document.getElementById('products-grid');
const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartBadge = document.getElementById('cart-badge');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// --- Functions ---

// Currency Formatter
function formatPrice(amount) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
}

// Render Products Catalog
function renderProducts() {
    const filtered = PRODUCTS.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        productsGrid.innerHTML = `
            <div class="col-span-full py-12 text-center text-gray-500">
                <i data-lucide="package-open" class="w-12 h-12 mx-auto mb-3 text-gray-400"></i>
                <p class="text-lg font-medium">No se encontraron productos</p>
                <p class="text-sm">Intenta cambiando el filtro o término de búsqueda.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    productsGrid.innerHTML = filtered.map(p => `
        <div class="product-card bg-white rounded-2xl border border-brand-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
            <div class="relative overflow-hidden h-48 bg-gray-100">
                <img src="${p.image}" alt="${p.name}" class="product-card-img w-full h-full object-cover">
                <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-brand-900 text-xs font-bold px-2.5 py-1 rounded-full border border-brand-100 shadow-sm">
                    ${p.unit}
                </span>
            </div>
            <div class="p-5 flex flex-col flex-grow justify-between">
                <div>
                    <h3 class="font-bold text-gray-800 text-lg group-hover:text-brand-600 transition-colors">${p.name}</h3>
                    <p class="text-amber-700 font-extrabold text-xl mt-2">${formatPrice(p.price)}</p>
                </div>
                <button onclick="addToCart(${p.id})" class="mt-4 w-full py-2.5 bg-brand-50 hover:bg-brand-800 hover:text-white text-brand-800 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-brand-200 hover:border-transparent">
                    <i data-lucide="shopping-cart" class="w-4 h-4"></i> Agregar
                </button>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

// Render Cart Drawer
function renderCart() {
    // Update Badge
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalCount;
    if (totalCount > 0) {
        cartBadge.classList.remove('opacity-0', 'scale-75');
        cartBadge.classList.add('opacity-100', 'scale-100');
    } else {
        cartBadge.classList.remove('opacity-100', 'scale-100');
        cartBadge.classList.add('opacity-0', 'scale-75');
    }

    // Empty state
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <i data-lucide="shopping-bag" class="w-16 h-16 mb-4 stroke-1"></i>
                <p class="text-lg font-medium text-gray-600">Tu carrito está vacío</p>
                <p class="text-sm">Agrega algunos frutos secos para comenzar</p>
            </div>
        `;
        cartTotalPrice.textContent = formatPrice(0);
        lucide.createIcons();
        return;
    }

    // Render Items
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="flex items-center gap-4 p-3 bg-brand-50/40 rounded-xl border border-brand-100">
            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg flex-shrink-0">
            <div class="flex-grow">
                <h4 class="font-bold text-gray-800 text-sm leading-tight">${item.name}</h4>
                <p class="text-xs text-gray-500 mt-0.5">${item.unit}</p>
                <p class="text-sm font-semibold text-amber-700 mt-1">${formatPrice(item.price * item.quantity)}</p>
            </div>
            <div class="flex flex-col items-end gap-2">
                <button onclick="removeFromCart(${item.id})" class="text-gray-400 hover:text-red-500 transition-colors p-1">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
                <div class="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                    <button onclick="updateQuantity(${item.id}, -1)" class="px-2 py-0.5 text-gray-600 hover:bg-gray-100">-</button>
                    <span class="px-2 text-xs font-bold text-gray-800">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)" class="px-2 py-0.5 text-gray-600 hover:bg-gray-100">+</button>
                </div>
            </div>
        </div>
    `).join('');

    // Calculate Total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalPrice.textContent = formatPrice(total);

    lucide.createIcons();
}

// Cart Actions
function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    renderCart();
    showToast(`"${product.name}" agregado al carrito`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        renderCart();
    }
}

function saveCart() {
    localStorage.setItem('cart_items', JSON.stringify(cart));
}

// UI Controls
function toggleCart(open) {
    if (open) {
        cartDrawerOverlay.classList.remove('opacity-0', 'pointer-events-none');
        cartDrawer.classList.remove('translate-x-full');
    } else {
        cartDrawerOverlay.classList.add('opacity-0', 'pointer-events-none');
        cartDrawer.classList.add('translate-x-full');
    }
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
}

// --- Event Listeners ---
cartToggleBtn.addEventListener('click', () => toggleCart(true));
closeCartBtn.addEventListener('click', () => toggleCart(false));
cartDrawerOverlay.addEventListener('click', (e) => {
    if (e.target === cartDrawerOverlay) toggleCart(false);
});

// Category Filter Handling
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
            b.classList.remove('bg-brand-800', 'text-white');
            b.classList.add('bg-white', 'text-gray-600');
        });
        btn.classList.remove('bg-white', 'text-gray-600');
        btn.classList.add('bg-brand-800', 'text-white');

        currentCategory = btn.dataset.category;
        renderProducts();
    });
});

// Live Search Handling
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProducts();
});

// Checkout Action
document.getElementById('checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }
    alert("¡Gracias por tu interés! Aquí puedes integrar la pasarela de pago (MercadoPago, Webpay, etc.) o derivar la orden a WhatsApp.");
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    renderProducts();
    renderCart();
});