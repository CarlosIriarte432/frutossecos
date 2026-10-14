/**
 * NutraNuts - Sistema de Autenticación y Perfil de Usuario
 */

const API_AUTH_URL = 'https://frutossecos.onrender.com/api';

// Comprobar estado de la sesión al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    actualizarNavAuth();
    inyectarModalesAuth();
});

function obtenerUsuarioActual() {
    const userStr = localStorage.getItem('nutranuts_user');
    return userStr ? JSON.parse(userStr) : null;
}

function actualizarNavAuth() {
    const container = document.getElementById('auth-nav-container');
    if (!container) return;

    const usuario = obtenerUsuarioActual();

    if (usuario) {
        // Verificamos si es admin (por correo o por la propiedad es_admin)
        const esAdmin = usuario.es_admin || usuario.email === 'admin@nutranuts.cl';

        container.innerHTML = `
            <div class="flex items-center gap-2">
                ${esAdmin ? `
                    <a href="admin.html" class="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl font-bold flex items-center gap-1 transition-colors shadow-sm" title="Panel de Administración">
                        ⚙️ Admin
                    </a>
                ` : ''}
                <button onclick="abrirModalPerfil()" class="text-xs bg-brand-50 hover:bg-brand-100 text-brand-900 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-colors border border-brand-200">
                    👤 Hola, ${usuario.nombre.split(' ')[0]}
                </button>
                <button onclick="cerrarSesion()" class="text-xs text-gray-500 hover:text-rose-600 px-2 py-1 font-semibold transition-colors" title="Cerrar Sesión">
                    Salir
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="flex items-center gap-2">
                <button onclick="abrirModalLogin()" class="text-xs font-bold text-brand-900 hover:text-brand-600 px-3 py-2 transition-colors">
                    Iniciar Sesión
                </button>
                <button onclick="abrirModalRegistro()" class="text-xs bg-brand-800 hover:bg-brand-900 text-white px-3.5 py-2 rounded-xl font-bold shadow-sm transition-all">
                    Registrarse
                </button>
            </div>
        `;
    }
}

// Inyectar estructuras HTML de los Modales de Login, Registro, Perfil y Checkout Invitado
function inyectarModalesAuth() {
    if (document.getElementById('auth-modals-root')) return;

    const root = document.createElement('div');
    root.id = 'auth-modals-root';
    root.innerHTML = `
        <!-- MODAL LOGIN -->
        <div id="modal-login" class="fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                <button onclick="cerrarModalesAuth()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold">✕</button>
                <h2 class="text-2xl font-black text-brand-900 mb-1">¡Bienvenido de nuevo!</h2>
                <p class="text-xs text-gray-500 mb-6">Ingresa a tu cuenta para ver tus pedidos y agilizar tus compras.</p>
                
                <form id="form-login" onsubmit="manejarLogin(event)" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico</label>
                        <input type="email" id="login-email" required class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Contraseña</label>
                        <input type="password" id="login-password" required class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                    </div>
                    <button type="submit" class="w-full bg-brand-800 hover:bg-brand-900 text-white py-3 rounded-xl font-bold shadow transition-all text-sm">Entrar</button>
                </form>
            </div>
        </div>

        <!-- MODAL REGISTRO -->
        <div id="modal-registro" class="fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                <button onclick="cerrarModalesAuth()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold">✕</button>
                <h2 class="text-2xl font-black text-brand-900 mb-1">Crea tu cuenta</h2>
                <p class="text-xs text-gray-500 mb-6">Disfruta de beneficios y haz seguimiento a tus frutos secos.</p>
                
                <form id="form-registro" onsubmit="manejarRegistro(event)" class="space-y-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label>
                        <input type="text" id="reg-nombre" required class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico</label>
                        <input type="email" id="reg-email" required class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Contraseña</label>
                        <input type="password" id="reg-password" required class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
                            <input type="text" id="reg-telefono" placeholder="+569..." class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">Dirección (La Serena/Coquimbo)</label>
                            <input type="text" id="reg-direccion" placeholder="Calle y número" class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                        </div>
                    </div>
                    <button type="submit" class="w-full mt-2 bg-brand-800 hover:bg-brand-900 text-white py-3 rounded-xl font-bold shadow transition-all text-sm">Registrarse</button>
                </form>
            </div>
        </div>

        <!-- MODAL PERFIL Y MIS PEDIDOS -->
        <div id="modal-perfil" class="fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onclick="cerrarModalesAuth()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold">✕</button>
                <div id="perfil-content-body">
                    <!-- Se carga dinámicamente -->
                </div>
            </div>
        </div>

        <!-- MODAL CHECKOUT / DATOS DE INVITADO -->
        <div id="modal-checkout-invitado" class="fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                <button onclick="cerrarModalesAuth()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold">✕</button>
                <h2 class="text-2xl font-black text-brand-900 mb-1">Datos de Despacho</h2>
                <p class="text-xs text-gray-500 mb-6">Ingresa a dónde enviaremos tus frutos secos.</p>
                
                <form id="form-checkout-invitado" class="space-y-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Nombre y Apellido</label>
                        <input type="text" id="chk-nombre" required class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800" placeholder="Ej. Juan Pérez">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Teléfono de contacto</label>
                        <input type="text" id="chk-telefono" required class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800" placeholder="+569...">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Dirección de despacho</label>
                        <input type="text" id="chk-direccion" required class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800" placeholder="Calle, número, comuna">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico (Opcional)</label>
                        <input type="email" id="chk-email" class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800" placeholder="correo@ejemplo.com">
                    </div>
                    <button type="submit" class="w-full mt-3 bg-brand-800 hover:bg-brand-900 text-white py-3 rounded-xl font-bold shadow transition-all text-sm">Continuar al Pago</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(root);
}

function abrirModalLogin() {
    cerrarModalesAuth();
    document.getElementById('modal-login').classList.remove('hidden');
}

function abrirModalRegistro() {
    cerrarModalesAuth();
    document.getElementById('modal-registro').classList.remove('hidden');
}

function cerrarModalesAuth() {
    document.getElementById('modal-login')?.classList.add('hidden');
    document.getElementById('modal-registro')?.classList.add('hidden');
    document.getElementById('modal-perfil')?.classList.add('hidden');
    document.getElementById('modal-checkout-invitado')?.classList.add('hidden');
}

// Lógica de Peticiones Backend
async function manejarLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_AUTH_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('nutranuts_user', JSON.stringify(data.usuario));
            cerrarModalesAuth();
            actualizarNavAuth();
            alert('👋 ¡Bienvenido de nuevo, ' + data.usuario.nombre + '!');
        } else {
            alert('❌ ' + (data.error || 'Credenciales incorrectas'));
        }
    } catch (err) {
        console.error('Error de red:', err);
        alert('Error de conexión con el servidor');
    }
}

async function manejarRegistro(e) {
    e.preventDefault();
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const telefono = document.getElementById('reg-telefono').value;
    const direccion = document.getElementById('reg-direccion').value;

    try {
        const res = await fetch(`${API_AUTH_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password, telefono, direccion })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('nutranuts_user', JSON.stringify(data.usuario));
            cerrarModalesAuth();
            actualizarNavAuth();
            alert('🎉 ¡Cuenta creada con éxito! Ya estás conectado.');
        } else {
            alert('❌ ' + (data.error || 'No se pudo registrar'));
        }
    } catch (err) {
        console.error('Error de red:', err);
        alert('Error de conexión con el servidor');
    }
}

function cerrarSesion() {
    localStorage.removeItem('nutranuts_user');
    actualizarNavAuth();
    alert('Has cerrado sesión correctamente.');
}

async function abrirModalPerfil() {
    const usuario = obtenerUsuarioActual();
    if (!usuario) return;

    cerrarModalesAuth();
    const modalPerfil = document.getElementById('modal-perfil');
    const bodyContainer = document.getElementById('perfil-content-body');

    bodyContainer.innerHTML = `<p class="text-center py-6 text-gray-400">Cargando tus datos y pedidos...</p>`;
    modalPerfil.classList.remove('hidden');

    try {
        const res = await fetch(`${API_AUTH_URL}/usuarios/${usuario.email}/ordenes`);
        const ordenes = await res.json();

        let htmlOrdenes = '<p class="text-xs text-gray-400 py-4 text-center bg-gray-50 rounded-xl">Aún no has registrado compras con este correo.</p>';
        
        if (ordenes && ordenes.length > 0) {
            htmlOrdenes = ordenes.map(o => {
                let itemsList = [];
                try {
                    itemsList = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
                } catch (e) {
                    itemsList = [];
                }

                const productosHTML = itemsList.map(i => 
                    `<span class="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">${i.name || i.nombre || 'Producto'} (x${i.quantity || 1})</span>`
                ).join('');

                const totalFormateado = Number(o.total || 0).toLocaleString('es-CL');
                const esDespachado = o.despachado === 1;

                return `
                    <div class="bg-white border rounded-xl p-4 text-xs space-y-2 shadow-sm">
                        <div class="flex justify-between items-center font-bold border-b pb-2">
                            <span class="text-brand-900">Orden #${o.id} <span class="text-gray-400 font-normal">(${o.fecha || 'Reciente'})</span></span>
                            <span class="text-amber-800 text-sm">$${totalFormateado}</span>
                        </div>
                        <div class="text-gray-600">
                            <p class="font-medium text-gray-700">Productos:</p>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${productosHTML}
                            </div>
                        </div>
                        <div class="flex justify-between pt-1 text-gray-500">
                            <span>📍 ${o.cliente_direccion || 'Sin dirección'}</span>
                            <span class="font-bold ${esDespachado ? 'text-emerald-600' : 'text-amber-600'}">
                                ${esDespachado ? '✓ Despachado' : '⌛ En preparación'}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        bodyContainer.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h2 class="text-2xl font-black text-brand-900">Mi Cuenta & Mis Pedidos</h2>
                    <p class="text-xs text-gray-500">Administra tus datos personales y revisa el historial de tus compras.</p>
                </div>

                <form onsubmit="actualizarPerfilUsuario(event, ${usuario.id})" class="bg-brand-50/50 p-4 rounded-2xl border border-brand-100 space-y-3">
                    <h3 class="font-bold text-sm text-brand-900">Ajustes de Perfil</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                            <input type="text" id="perfil-nombre" value="${usuario.nombre}" class="w-full px-3 py-1.5 bg-white rounded-lg border text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
                            <input type="text" id="perfil-telefono" value="${usuario.telefono || ''}" class="w-full px-3 py-1.5 bg-white rounded-lg border text-sm">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Dirección de Despacho</label>
                        <input type="text" id="perfil-direccion" value="${usuario.direccion || ''}" class="w-full px-3 py-1.5 bg-white rounded-lg border text-sm">
                    </div>
                    <button type="submit" class="bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm">Guardar Cambios</button>
                </form>

                <div>
                    <h3 class="font-bold text-base text-brand-900 mb-3">Historial de Mis Compras</h3>
                    <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
                        ${htmlOrdenes}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Error cargando perfil:', err);
        bodyContainer.innerHTML = `<p class="text-center py-6 text-rose-500">Error al cargar la información del usuario.</p>`;
    }
}

async function actualizarPerfilUsuario(e, userId) {
    e.preventDefault();
    const nombre = document.getElementById('perfil-nombre').value;
    const telefono = document.getElementById('perfil-telefono').value;
    const direccion = document.getElementById('perfil-direccion').value;

    try {
        const res = await fetch(`${API_AUTH_URL}/auth/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono, direccion })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('nutranuts_user', JSON.stringify(data.usuario));
            alert('✅ ¡Perfil actualizado correctamente!');
            actualizarNavAuth();
            cerrarModalesAuth();
        } else {
            alert('❌ ' + (data.error || 'Error al actualizar'));
        }
    } catch (err) {
        console.error('Error de red:', err);
        alert('Error de conexión');
    }
}

// Función auxiliar para obtener datos de invitado mediante el modal bonito
function obtenerDatosInvitadoPorModal() {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById('modal-checkout-invitado');
        if (!modal) {
            reject('Modal de checkout no encontrado');
            return;
        }

        modal.classList.remove('hidden');

        const form = document.getElementById('form-checkout-invitado');
        const nuevoForm = form.cloneNode(true);
        form.parentNode.replaceChild(nuevoForm, form);

        nuevoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cliente = {
                nombre: document.getElementById('chk-nombre').value,
                telefono: document.getElementById('chk-telefono').value,
                direccion: document.getElementById('chk-direccion').value,
                email: document.getElementById('chk-email').value || ''
            };

            modal.classList.add('hidden');
            resolve(cliente);
        });

        const cerrarBtn = modal.querySelector('button[onclick*="cerrarModalesAuth"]');
        if (cerrarBtn) {
            cerrarBtn.onclick = () => {
                modal.classList.add('hidden');
                reject('Cancelado por el usuario');
            };
        }
    });
}