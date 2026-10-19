function cambiarTab(tab) {
    const secPedidos = document.getElementById('seccion-pedidos');
    const secInventario = document.getElementById('seccion-inventario');
    const btnPedidos = document.getElementById('tab-pedidos-btn');
    const btnInventario = document.getElementById('tab-inventario-btn');

    if (tab === 'pedidos') {
        secPedidos.classList.remove('hidden');
        secInventario.classList.add('hidden');
        btnPedidos.className = "pb-3 font-bold border-b-2 border-brand-800 text-brand-900 flex items-center gap-2";
        btnInventario.className = "pb-3 font-semibold text-gray-500 hover:text-brand-800 border-b-2 border-transparent flex items-center gap-2";
        cargarPedidos();
    } else {
        secPedidos.classList.add('hidden');
        secInventario.classList.remove('hidden');
        btnInventario.className = "pb-3 font-bold border-b-2 border-brand-800 text-brand-900 flex items-center gap-2";
        btnPedidos.className = "pb-3 font-semibold text-gray-500 hover:text-brand-800 border-b-2 border-transparent flex items-center gap-2";
        cargarInventario();
    }
}

async function cargarPedidos() {
    try {
        const res = await fetch(`${CONFIG.API_URL}/admin/ordenes`);
        const ordenes = await res.json();
        const tbody = document.getElementById('tabla-pedidos-body');

        if (ordenes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-400">No hay pedidos registrados aún.</td></tr>`;
            return;
        }

        tbody.innerHTML = ordenes.map(o => {
            const listaProductos = o.items && o.items.length > 0 
                ? o.items.map(i => `<span class="inline-block bg-brand-50 text-brand-900 px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 border border-brand-100">📦 ${i.name || i.nombre} (x${i.quantity})</span>`).join('')
                : '<span class="text-gray-400 text-xs">Sin detalle</span>';

            const esDespachado = o.despachado === 1;

            return `
                <tr class="hover:bg-gray-50/50 ${esDespachado ? 'bg-emerald-50/30' : ''}">
                    <td class="p-4 font-medium text-gray-900">#${o.id}<br><span class="text-xs text-gray-400">${o.fecha || 'Reciente'}</span></td>
                    <td class="p-4 max-w-xs"><div class="flex flex-wrap">${listaProductos}</div></td>
                    <td class="p-4 font-semibold text-brand-900">${o.cliente_nombre || 'Invitado'}</td>
                    <td class="p-4 text-xs space-y-1">
                        <p>📞 ${o.cliente_telefono || 'Sin teléfono'}</p>
                        <p>✉️ ${o.cliente_email || 'Sin correo'}</p>
                        <p class="font-medium text-gray-700">📍 ${o.cliente_direccion || 'Sin dirección'}</p>
                    </td>
                    <td class="p-4 font-bold text-amber-800">$${Number(o.total).toLocaleString('es-CL')}</td>
                    <td class="p-4"><span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">${o.estado_pago || 'Pagado'}</span></td>
                    <td class="p-4 text-center">
                        <label class="inline-flex items-center cursor-pointer">
                            <input type="checkbox" ${esDespachado ? 'checked' : ''} onchange="toggleDespacho(${o.id}, this.checked)" class="w-5 h-5 text-brand-800 rounded focus:ring-amber-500 border-gray-300">
                            <span class="ml-2 text-xs font-bold ${esDespachado ? 'text-emerald-700' : 'text-gray-500'}">${esDespachado ? 'Despachado' : 'Pendiente'}</span>
                        </label>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Error cargando pedidos:', err);
    }
}

async function toggleDespacho(ordenId, estaDespachado) {
    try {
        const res = await fetch(`${CONFIG.API_URL}/admin/ordenes/${ordenId}/despacho`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ despachado: estaDespachado ? 1 : 0 })
        });
        const data = await res.json();
        if (data.success) cargarPedidos();
        else mostrarToast('No se pudo actualizar el estado', 'error');
    } catch (err) {
        mostrarToast('Error de conexión', 'error');
    }
}

async function cargarInventario() {
    try {
        const res = await fetch(`${CONFIG.API_URL}/productos`);
        const productos = await res.json();
        window.productosAdminDB = productos; // Lo guardamos para poder abrir el modal de edición
        const tbody = document.getElementById('tabla-inventario-body');

        tbody.innerHTML = productos.map(p => `
            <tr class="hover:bg-gray-50/50">
                <td class="p-4 flex items-center gap-3">
                    <img src="${p.imagen}" class="w-10 h-10 rounded-lg object-cover border" onerror="this.src='https://via.placeholder.com/40'">
                    <span class="font-semibold text-gray-900">${p.nombre}</span>
                </td>
                <td class="p-4 text-gray-600 capitalize">${p.categoria}</td>
                <td class="p-4"><input type="number" id="precio-${p.id}" value="${p.precio}" class="w-24 px-2 py-1 border rounded-lg text-sm"></td>
                <td class="p-4"><input type="number" id="stock-${p.id}" value="${p.stock_unidades}" class="w-20 px-2 py-1 border rounded-lg text-sm font-bold"></td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${p.disponible === 1 ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-800'}">
                        ${p.disponible === 1 ? 'Disponible' : 'Agotado'}
                    </span>
                </td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="guardarRapido(${p.id})" class="bg-brand-100 hover:bg-brand-800 hover:text-white text-brand-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all" title="Guardar stock y precio">Guardar</button>
                        <button onclick="abrirModalEditarProducto(${p.id})" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all" title="Editar todo (Foto, nombre...)">✏️ Editar</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error cargando inventario:', err);
    }
}

async function guardarRapido(id) {
    const nuevoPrecio = document.getElementById(`precio-${id}`).value;
    const nuevoStock = document.getElementById(`stock-${id}`).value;

    const formData = new FormData();
    formData.append('precio', nuevoPrecio);
    formData.append('stock_unidades', nuevoStock);

    try {
        const res = await fetch(`${CONFIG.API_URL}/admin/productos/${id}`, { method: 'PATCH', body: formData });
        const data = await res.json();
        if (res.ok && data.success) {
            mostrarToast('¡Valores actualizados!', 'success');
            cargarInventario();
        } else {
            mostrarToast('Error al actualizar', 'error');
        }
    } catch (err) {
        mostrarToast('Error de conexión', 'error');
    }
}

function crearHTMLModalProducto(prod = null) {
    const esEdicion = !!prod;
    return `
        <div class="bg-white rounded-3xl max-w-md w-full p-6 relative">
            <button onclick="document.getElementById('modal-producto-admin').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold">✕</button>
            <h2 class="text-xl font-black text-brand-900 mb-4">${esEdicion ? 'Editar' : 'Nuevo'} Producto</h2>
            <form id="form-producto-admin" onsubmit="${esEdicion ? `guardarEdicionCompleta(event, ${prod.id})` : 'guardarNuevoProducto(event)'}" class="space-y-3">
                <input type="text" id="np-nombre" placeholder="Nombre del producto" value="${esEdicion ? prod.nombre : ''}" required class="w-full px-3 py-2 border rounded-xl text-sm">
                <input type="number" id="np-precio" placeholder="Precio (CLP)" value="${esEdicion ? prod.precio : ''}" required class="w-full px-3 py-2 border rounded-xl text-sm">
                <textarea id="np-descripcion" placeholder="Descripción detallada del producto" required class="w-full px-3 py-2 border rounded-xl text-sm" rows="3">${esEdicion ? (prod.descripcion || '') : ''}</textarea>
                <div class="grid grid-cols-2 gap-2">
                    <select id="np-categoria" required class="w-full px-3 py-2 border rounded-xl text-sm">
                        <option value="">Selecciona categoría</option>
                        <option value="frutos-secos" ${esEdicion && prod.categoria === 'frutos-secos' ? 'selected' : ''}>Frutos Secos</option>
                        <option value="semillas" ${esEdicion && prod.categoria === 'semillas' ? 'selected' : ''}>Semillas</option>
                        <option value="mixes" ${esEdicion && prod.categoria === 'mixes' ? 'selected' : ''}>Mixes</option>
                        <option value="deshidratados" ${esEdicion && prod.categoria === 'deshidratados' ? 'selected' : ''}>Deshidratados</option>
                    </select>
                    <input type="number" id="np-stock" placeholder="Stock inicial" value="${esEdicion ? prod.stock_unidades : '20'}" required class="w-full px-3 py-2 border rounded-xl text-sm">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">${esEdicion ? 'Actualizar Imagen (Opcional)' : 'Imagen del Producto (Opcional)'}</label>
                    <input type="file" id="np-imagen" accept="image/*" class="w-full text-sm border p-1 rounded-lg bg-gray-50 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-100 file:text-brand-800 hover:file:bg-brand-200">
                </div>
                <button type="submit" class="w-full bg-brand-800 text-white py-2.5 rounded-xl font-bold mt-2 transition-colors hover:bg-brand-900 shadow-md">
                    Guardar Cambios
                </button>
            </form>
        </div>
    `;
}

function renderizarModalAdmin(html) {
    let modal = document.getElementById('modal-producto-admin');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-producto-admin';
        modal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
        document.body.appendChild(modal);
    }
    modal.innerHTML = html;
    modal.classList.remove('hidden');
}

function abrirModalNuevoProducto() {
    renderizarModalAdmin(crearHTMLModalProducto());
}

function abrirModalEditarProducto(id) {
    const prod = window.productosAdminDB.find(p => p.id === id);
    if(prod) renderizarModalAdmin(crearHTMLModalProducto(prod));
}

async function procesarFormularioProducto(e, url, method) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Guardando... ⏳';

    const formData = new FormData();
    formData.append('nombre', document.getElementById('np-nombre').value);
    formData.append('precio', document.getElementById('np-precio').value);
    formData.append('categoria', document.getElementById('np-categoria').value);
    formData.append('stock_unidades', document.getElementById('np-stock').value);
    formData.append('descripcion', document.getElementById('np-descripcion').value);
    
    const fileInput = document.getElementById('np-imagen');
    if (fileInput.files.length > 0) formData.append('imagen', fileInput.files[0]);

    try {
        const res = await fetch(url, { method, body: formData });
        const data = await res.json();
        
        if (res.ok && data.success) {
            mostrarToast('¡Producto guardado exitosamente!', 'success');
            document.getElementById('modal-producto-admin').classList.add('hidden');
            cargarInventario();
        } else {
            mostrarToast(data.error || 'Error al guardar', 'error');
        }
    } catch (err) {
        mostrarToast('Error de conexión', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar Cambios';
    }
}

function guardarNuevoProducto(e) { procesarFormularioProducto(e, `${CONFIG.API_URL}/admin/productos`, 'POST'); }
function guardarEdicionCompleta(e, id) { procesarFormularioProducto(e, `${CONFIG.API_URL}/admin/productos/${id}`, 'PATCH'); }

document.addEventListener('DOMContentLoaded', () => {
    cargarPedidos();
    if (window.lucide) lucide.createIcons();
});