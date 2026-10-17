       const API_URL = CONFIG.API_URL;

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
                const res = await fetch(`${API_URL}/admin/ordenes`);
                const ordenes = await res.json();
                const tbody = document.getElementById('tabla-pedidos-body');

                if (ordenes.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-400">No hay pedidos registrados aún.</td></tr>`;
                    return;
                }

                tbody.innerHTML = ordenes.map(o => {
                    // Formatear los productos comprados como lista legible
                    const listaProductos = o.items && o.items.length > 0 
                        ? o.items.map(i => `<span class="inline-block bg-brand-50 text-brand-900 px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 border border-brand-100">📦 ${i.name || i.nombre} (x${i.quantity})</span>`).join('')
                        : '<span class="text-gray-400 text-xs">Sin detalle</span>';

                    const esDespachado = o.despachado === 1;

                    return `
                        <tr class="hover:bg-gray-50/50 ${esDespachado ? 'bg-emerald-50/30' : ''}">
                            <td class="p-4 font-medium text-gray-900">#${o.id}<br><span class="text-xs text-gray-400">${o.fecha || 'Reciente'}</span></td>
                            <td class="p-4 max-w-xs">
                                <div class="flex flex-wrap">${listaProductos}</div>
                            </td>
                            <td class="p-4 font-semibold text-brand-900">${o.cliente_nombre || 'Invitado'}</td>
                            <td class="p-4 text-xs space-y-1">
                                <p>📞 ${o.cliente_telefono || 'Sin teléfono'}</p>
                                <p>✉️ ${o.cliente_email || 'Sin correo'}</p>
                                <p class="font-medium text-gray-700">📍 ${o.cliente_direccion || 'Sin dirección'}</p>
                            </td>
                            <td class="p-4 font-bold text-amber-800">$${Number(o.total).toLocaleString('es-CL')}</td>
                            <td class="p-4">
                                <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">${o.estado_pago || 'Pagado'}</span>
                            </td>
                            <td class="p-4 text-center">
                                <label class="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" ${esDespachado ? 'checked' : ''} onchange="toggleDespacho(${o.id}, this.checked)" class="w-5 h-5 text-brand-800 rounded focus:ring-amber-500 border-gray-300">
                                    <span class="ml-2 text-xs font-bold ${esDespachado ? 'text-emerald-700' : 'text-gray-500'}">
                                        ${esDespachado ? 'Despachado' : 'Pendiente'}
                                    </span>
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
                const res = await fetch(`${API_URL}/admin/ordenes/${ordenId}/despacho`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ despachado: estaDespachado ? 1 : 0 })
                });
                const data = await res.json();
                if (data.success) {
                    cargarPedidos(); // Recargar la tabla para reflejar colores y estados
                } else {
                    mostrarToast('No se pudo actualizar el estado', 'error');
                }
            } catch (err) {
                console.error('Error de red:', err);
                mostrarToast('Error de conexión', 'error');
            }
        }

        async function cargarInventario() {
            try {
                const res = await fetch(`${API_URL}/productos`);
                const productos = await res.json();
                const tbody = document.getElementById('tabla-inventario-body');

                tbody.innerHTML = productos.map(p => `
                    <tr class="hover:bg-gray-50/50">
                        <td class="p-4 flex items-center gap-3">
                            <img src="${p.imagen}" class="w-10 h-10 rounded-lg object-cover border" onerror="this.src='https://via.placeholder.com/40'">
                            <span class="font-semibold text-gray-900">${p.nombre}</span>
                        </td>
                        <td class="p-4 text-gray-600 capitalize">${p.categoria}</td>
                        <td class="p-4">
                            <input type="number" id="precio-${p.id}" value="${p.precio}" class="w-28 px-2 py-1 border rounded-lg text-sm">
                        </td>
                        <td class="p-4">
                            <input type="number" id="stock-${p.id}" value="${p.stock_unidades}" class="w-20 px-2 py-1 border rounded-lg text-sm font-bold">
                        </td>
                        <td class="p-4">
                            <span class="px-2 py-1 rounded-full text-xs font-bold ${p.disponible === 1 ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-800'}">
                                ${p.disponible === 1 ? 'Disponible' : 'Agotado'}
                            </span>
                        </td>
                        <td class="p-4 text-center">
                            <button onclick="guardarCambiosProducto(${p.id})" class="bg-brand-100 hover:bg-brand-800 hover:text-white text-brand-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
                                Guardar
                            </button>
                        </td>
                    </tr>
                `).join('');
            } catch (err) {
                console.error('Error cargando inventario:', err);
            }
        }

        async function guardarCambiosProducto(id) {
            const nuevoPrecio = document.getElementById(`precio-${id}`).value;
            const nuevoStock = document.getElementById(`stock-${id}`).value;

            try {
                const res = await fetch(`${API_URL}/admin/productos/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ precio: Number(nuevoPrecio), stock_unidades: Number(nuevoStock) })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    mostrarToast('¡Producto actualizado con éxito!', 'success');
                    cargarInventario();
                } else {
                    mostrarToast('Error al actualizar el producto', 'error');
                }
            } catch (err) {
                console.error('Error:', err);
                mostrarToast('Error de conexión', 'error');
            }
        }

        async function abrirModalNuevoProducto() {
            const nombre = prompt('Nombre del nuevo producto:');
            if (!nombre) return;
            const precio = prompt('Precio en CLP (ej: 3500):');
            if (!precio) return;
            const categoria = prompt('Categoría (frutos-secos, semillas, mixes, deshidratados):');
            if (!categoria) return;
            const stock = prompt('Stock inicial en unidades (ej: 20):', '20');

            try {
                const res = await fetch(`${API_URL}/admin/productos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, precio, categoria, stock_unidades: stock })
                });
                const data = await res.json();
                if (data.success) {
                    mostrarToast('¡Nuevo producto agregado exitosamente!', 'success');
                    cargarInventario();
                }
            } catch (err) {
                console.error('Error:', err);
            }
        }

        // Cargar pedidos al iniciar
        document.addEventListener('DOMContentLoaded', () => {
            cargarPedidos();
            if (window.lucide) lucide.createIcons();
        });