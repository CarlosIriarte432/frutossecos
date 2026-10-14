/**
 * NutraNuts - Catálogo Dinámico con SQLite, Modales y Alertas de Stock
 */

const API_BACKEND_URL = 'https://frutossecos.onrender.com/api';
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

// Función para pintar las tarjetas en el grid respetando stock, alertas y estado
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
        const isAvailable = p.disponible === 1 && p.stock_unidades > 0;

        // Insignia de stock dinámica
        let badgeStock = '';
        if (!isAvailable) {
            badgeStock = `<span class="absolute top-3 right-3 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">AGOTADO</span>`;
        } else if (p.stock_unidades <= 15) {
            badgeStock = `<span class="absolute top-3 right-3 bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow animate-pulse">🔥 ¡Últimas ${p.stock_unidades} unidades!</span>`;
        } else {
            badgeStock = `<span class="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">Stock: ${p.stock_unidades}</span>`;
        }

        return `
            <div class="product-card bg-white rounded-2xl border border-brand-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                <div class="relative overflow-hidden h-48 bg-gray-100 flex items-center justify-center cursor-pointer" onclick="abrirModalProducto(${p.id})">
                    <img src="${p.imagen}" alt="${p.nombre}" class="product-card-img w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isAvailable ? 'opacity-50 grayscale' : ''}">
                    <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-brand-900 text-xs font-bold px-2.5 py-1 rounded-full border border-brand-100 shadow-sm">
                        ${formatearCategoria(p.categoria)}
                    </span>
                    ${badgeStock}
                </div>
                <div class="p-5 flex flex-col flex-grow justify-between">
                    <div>
                        <h3 onclick="abrirModalProducto(${p.id})" class="font-bold text-gray-800 text-lg group-hover:text-brand-600 transition-colors cursor-pointer">${p.nombre}</h3>
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

// Función para abrir la ventana emergente (Modal) con los detalles del producto
function abrirModalProducto(productId) {
    const product = allProductsFromDB.find(p => p.id === productId);
    if (!product) return;

    // Verificar si el modal existe en el HTML, si no, lo creamos dinámicamente al vuelo
    let modalContainer = document.getElementById('product-modal');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'product-modal';
        modalContainer.className = 'fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center p-4 backdrop-blur-sm';
        modalContainer.innerHTML = `
            <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button onclick="cerrarModalProducto()" class="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors z-10">✕</button>
                <div id="modal-content" class="p-6 space-y-6"></div>
            </div>
        `;
        document.body.appendChild(modalContainer);
    }

    const isAvailable = product.disponible === 1 && product.stock_unidades > 0;
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
        <div class="space-y-4">
            <img src="${product.imagen}" alt="${product.nombre}" class="w-full h-64 object-cover rounded-2xl border" onerror="this.src='https://via.placeholder.com/400'">
            <div>
                <span class="text-xs font-bold text-amber-700 uppercase tracking-wider">${formatearCategoria(product.categoria)}</span>
                <h2 class="text-2xl font-black text-gray-900">${product.nombre}</h2>
                <p class="text-2xl font-bold text-amber-800 mt-1">$${Number(product.precio).toLocaleString('es-CL')}</p>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">${product.descripcion || 'Producto 100% natural seleccionado cuidadosamente en La Serena y Coquimbo para mantener toda su frescura y calidad.'}</p>
            
            <div class="bg-amber-50 p-3.5 rounded-xl flex items-center justify-between text-sm border border-amber-100">
                <span class="font-semibold text-brand-900">Disponibilidad en bodega:</span>
                <span class="font-bold ${product.stock_unidades <= 15 && product.stock_unidades > 0 ? 'text-amber-700' : 'text-emerald-700'}">
                    ${isAvailable ? `${product.stock_unidades} unidades disponibles` : 'Agotado'}
                </span>
            </div>

            <div class="pt-2 flex gap-3">
                <button onclick="agregarAlCarritoBD(${product.id}); cerrarModalProducto();" ${!isAvailable ? 'disabled' : ''} class="flex-grow bg-brand-800 hover:bg-brand-900 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                    🛒 Agregar al Carrito
                </button>
            </div>
        </div>
    `;

    modalContainer.classList.remove('hidden');
}

function cerrarModalProducto() {
    const modalContainer = document.getElementById('product-modal');
    if (modalContainer) {
        modalContainer.classList.add('hidden');
    }
}

// Función para agregar al carrito con validación estricta de stock
function agregarAlCarritoBD(productId) {
    const product = allProductsFromDB.find(p => p.id === productId);
    if (!product) return;

    if (product.disponible === 0 || product.stock_unidades <= 0) {
        alert('Lo sentimos, este producto se encuentra agotado.');
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart_items')) || [];
    const existingIndex = cart.findIndex(item => item.id === productId);

    let currentQtyInCart = existingIndex > -1 ? cart[existingIndex].quantity : 0;

    // Validar que no se supere el stock físico de la bodega
    if (currentQtyInCart + 1 > product.stock_unidades) {
        alert(`No puedes agregar más unidades. Stock máximo disponible: ${product.stock_unidades}`);
        return;
    }

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.nombre,
            price: product.precio,
            image: product.imagen,
            unit: product.categoria,
            quantity: 1
        });
    }

    // 1. Guardar en localStorage
    localStorage.setItem('cart_items', JSON.stringify(cart));
    
    // 2. Actualizar el carrito visualmente
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