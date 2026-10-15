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
        image: "https://images.unsplash.com/photo-1543208541-005dd2419920?auto=format&fit=crop&w=600&q=80"
    },

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

// Currency Formatter (Pesos Chilenos / CLP)
function formatPrice(amount) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
}

// Render Products Catalog
function renderProducts() {
    if (!productsGrid) return;

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
        if (window.lucide) lucide.createIcons();
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

    if (window.lucide) lucide.createIcons();
}

// Render Cart Drawer
function renderCart() {
    if (!cartItemsContainer || !cartBadge || !cartTotalPrice) return;

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
        if (window.lucide) lucide.createIcons();
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

    if (window.lucide) lucide.createIcons();
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
    if (!cartDrawerOverlay || !cartDrawer) return;
    if (open) {
        cartDrawerOverlay.classList.remove('opacity-0', 'pointer-events-none');
        cartDrawer.classList.remove('translate-x-full');
    } else {
        cartDrawerOverlay.classList.add('opacity-0', 'pointer-events-none');
        cartDrawer.classList.add('translate-x-full');
    }
}

function showToast(message) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
}

// --- Event Listeners ---

if (filterBtns.length > 0) {
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
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts();
    });
}

if (cartToggleBtn) cartToggleBtn.addEventListener('click', () => toggleCart(true));
if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
if (cartDrawerOverlay) {
    cartDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === cartDrawerOverlay) toggleCart(false);
    });
}



// --- Initialization ---
function initApp() {
    renderProducts();
    renderCart();
    if (window.lucide) {
        lucide.createIcons();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Agrega esto al final de tu archivo scripts/script.js para que sea global
window.actualizarCarritoGlobal = function() {
    cart = JSON.parse(localStorage.getItem('cart_items')) || [];
    renderCart();
};

/**
 * Sistema de Toasts Personalizados - NutraNuts
 * Posición: Superior Centrado | Z-Index superior a Modales
 * Tipos soportados: 'success', 'error', 'warning', 'info'
 */
function mostrarToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Configuración de colores e iconos según el tipo de alerta
    const estilos = {
        success: {
            bg: 'bg-emerald-50 text-emerald-950 border-emerald-300 shadow-emerald-900/10',
            icon: 'check-circle-2',
            iconColor: 'text-emerald-600'
        },
        error: {
            bg: 'bg-rose-50 text-rose-950 border-rose-300 shadow-rose-900/10',
            icon: 'alert-circle',
            iconColor: 'text-rose-600'
        },
        warning: {
            bg: 'bg-amber-50 text-amber-950 border-amber-300 shadow-amber-900/10',
            icon: 'alert-triangle',
            iconColor: 'text-amber-600'
        },
        info: {
            bg: 'bg-blue-50 text-blue-950 border-blue-300 shadow-blue-900/10',
            icon: 'info',
            iconColor: 'text-blue-600'
        }
    };

    const config = estilos[tipo] || estilos.success;

    // Crear elemento del toast (más grande, padding amplio, texto en text-sm / font-bold)
   const toast = document.createElement('div');
toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 shadow-xl transition-all duration-300 transform -translate-y-5 opacity-0 max-w-xs bg-white/95 backdrop-blur-md ${config.bg}`;
    toast.innerHTML = `
        <i data-lucide="${config.icon}" class="w-6 h-6 flex-shrink-0 ${config.iconColor}"></i>
        <p class="text-sm font-bold leading-snug flex-grow">${mensaje}</p>
        <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-700 font-extrabold text-base ml-2 transition-colors">✕</button>
    `;

    container.appendChild(toast);

    // Inicializar iconos de Lucide
    if (window.lucide) {
        lucide.createIcons();
    }

    // Animación de entrada hacia abajo
    setTimeout(() => {
        toast.classList.remove('-translate-y-5', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    // Auto-eliminación después de 4 segundos
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('-translate-y-5', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}