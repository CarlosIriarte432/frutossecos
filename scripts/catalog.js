/**
 * NutraNuts - Catálogo Dinámico con SQLite
 */

const API_BACKEND_URL = 'http://localhost:3000/api';
let allProductsFromDB = [];

// Función para cargar los productos desde el servidor SQLite
async function cargarCatalogoDesdeBD() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    try {
        const response = await fetch(`${API_BACKEND_URL}/productos`);
        if (!response.ok) throw new Error('Error al conectar con el backend');
        
        allProductsFromDB = await response.json();
        renderizarProductosDinamicos(allProductsFromDB);

    } catch (error) {
        console.error('No se pudo cargar el catálogo de la BD:', error);
        productsGrid.innerHTML = `
            <div class="col-span-full py-12 text-center text-gray-500">
                <p class="text-lg font-medium text-amber-900">⚠️ Servidor desconectado</p>
                <p class="text-sm">Asegúrate de tener corriendo <code class="bg-amber-100 px-2 py-1 rounded">node index.js</code> en la carpeta backend.</p>
            </div>
        `;
    }
}

// Función auxiliar para formatear texto (ej: "frutos-secos" -> "Frutos Secos")
function formatearCategoria(cat) {
    if (!cat) return '';
    return cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Función para pintar las tarjetas en el grid respetando stock y estado
function renderizarProductosDinamicos(productosA_Mostrar) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    if (productosA_Mostrar.length === 0) {
        productsGrid.innerHTML = `
            <div class="col-span-full py-12 text-center text-gray-500">
                <p class="text-lg font-medium">No se encontraron productos</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = productosA_Mostrar.map(p => {
        const isAvailable = p.disponible === 1;

        return `
            <div class="product-card bg-white rounded-2xl border border-brand-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                <div class="relative overflow-hidden h-48 bg-gray-100 flex items-center justify-center">
                    <img src="${p.imagen}" alt="${p.nombre}" class="product-card-img w-full h-full object-cover ${!isAvailable ? 'opacity-50 grayscale' : ''}">
                    <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-brand-900 text-xs font-bold px-2.5 py-1 rounded-full border border-brand-100 shadow-sm">
                        ${formatearCategoria(p.categoria)}
                    </span>
                    ${!isAvailable ? '<span class="absolute top-3 right-3 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">AGOTADO</span>' : ''}
                </div>
                <div class="p-5 flex flex-col flex-grow justify-between">
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg group-hover:text-brand-600 transition-colors">${p.nombre}</h3>
                        <p class="text-amber-700 font-extrabold text-xl mt-2">$${Number(p.precio).toLocaleString('es-CL')}</p>
                    </div>
                    
                    <button 
                        onclick="${isAvailable ? `agregarAlCarritoBD(${p.id})` : 'void(0)'}" 
                        class="mt-4 w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border text-sm ${
                            isAvailable 
                            ? 'bg-brand-50 hover:bg-brand-800 hover:text-white text-brand-800 border-brand-200 hover:border-transparent cursor-pointer' 
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }">
                        <i data-lucide="${isAvailable ? 'shopping-cart' : 'slash'}" class="w-4 h-4"></i> 
                        ${isAvailable ? 'Agregar' : 'Producto Agotado'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Función para agregar al carrito usando los datos de la base de datos
function agregarAlCarritoBD(productId) {
    const product = allProductsFromDB.find(p => p.id === productId);
    if (!product) return;

    const cartItem = {
        id: product.id,
        name: product.nombre,
        price: product.precio,
        image: product.imagen,
        unit: product.categoria,
        quantity: 1
    };

    let cart = JSON.parse(localStorage.getItem('cart_items')) || [];
    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(cartItem);
    }

    // 1. Guardamos en localStorage
    localStorage.setItem('cart_items', JSON.stringify(cart));
    
    // 2. Actualizamos el carrito visualmente al instante llamando a la función global de script.js
    if (typeof window.actualizarCarritoGlobal === 'function') {
        window.actualizarCarritoGlobal();
    }
    
    // 3. Abrir el cajón del carrito
    if (typeof toggleCart === 'function') {
        toggleCart(true);
    }
}

// Filtros y Buscador conectados a la Base de Datos
document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogoDesdeBD();

    // Filtros por categoría
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('bg-brand-800', 'text-white');
                b.classList.add('bg-white', 'text-gray-600');
            });
            btn.classList.remove('bg-white', 'text-gray-600');
            btn.classList.add('bg-brand-800', 'text-white');

            const cat = btn.dataset.category;
            if (cat === 'all') {
                renderizarProductosDinamicos(allProductsFromDB);
            } else {
                const filtered = allProductsFromDB.filter(p => p.categoria.toLowerCase().includes(cat.toLowerCase()));
                renderizarProductosBuscados = filtered;
                renderizarProductosDinamicos(filtered);
            }
        });
    });

    // Buscador en tiempo real
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allProductsFromDB.filter(p => p.nombre.toLowerCase().includes(query));
            renderizarProductosDinamicos(filtered);
        });
    }
});