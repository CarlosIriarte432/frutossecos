/**
 * Sistema de Autenticación, Perfil de Usuario y Autocompletado
 */

// --- DICCIONARIO DE REGIONES Y COMUNAS DE CHILE ---
const CHILE_LOCATIONS = {
    "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
    "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"],
    "Antofagasta": ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"],
    "Atacama": ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"],
    "Coquimbo": ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paihuano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"],
    "Valparaíso": ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"],
    "Metropolitana": ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "Santiago", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"],
    "O'Higgins": ["Rancagua", "Machalí", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"],
    "Maule": ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"],
    "Ñuble": ["Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Quirihue", "Ránquil", "Treguaco", "Bulnes", "Chillán Viejo", "Chillán", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay", "Coihueco", "Ñiquén", "San Carlos", "San Fabián", "San Nicolás"],
    "Biobío": ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Alto Biobío"],
    "La Araucanía": ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"],
    "Los Ríos": ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"],
    "Los Lagos": ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"],
    "Aysén": ["Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"],
    "Magallanes": ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
};

document.addEventListener('DOMContentLoaded', () => {
    actualizarNavAuth();
    inyectarModalesAuth();
    
    setTimeout(() => {
        cargarRegionesEnSelect('reg-region');
        cargarRegionesEnSelect('chk-region');
        
        inicializarAutocompletado('reg-direccion', 'reg-numero', 'reg-comuna');
        inicializarAutocompletado('chk-direccion', 'chk-numero', 'chk-comuna');
    }, 500);
});

function cargarRegionesEnSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccione Región...</option>';
    Object.keys(CHILE_LOCATIONS).forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        select.appendChild(option);
    });
}

window.actualizarComunas = function(regionId, comunaId) {
    const region = document.getElementById(regionId).value;
    const selectComuna = document.getElementById(comunaId);
    if (!selectComuna) return;

    selectComuna.innerHTML = '<option value="">Seleccione Comuna...</option>';
    
    if (region && CHILE_LOCATIONS[region]) {
        CHILE_LOCATIONS[region].forEach(comuna => {
            const option = document.createElement('option');
            option.value = comuna;
            option.textContent = comuna;
            selectComuna.appendChild(option);
        });
    }
};

// --- VISIBILIDAD DE CONTRASEÑA ---
window.togglePassword = function(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) lucide.createIcons();
};

function obtenerUsuarioActual() {
    const userStr = localStorage.getItem('nutranuts_user');
    return userStr ? JSON.parse(userStr) : null;
}

function actualizarNavAuth() {
    const container = document.getElementById('auth-nav-container');
    if (!container) return;

    const usuario = obtenerUsuarioActual();

    if (usuario) {
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
                        <div class="relative">
                            <input type="password" id="login-password" required class="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                            <button type="button" onclick="togglePassword('login-password', 'icon-login-pass')" class="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none">
                                <i data-lucide="eye" id="icon-login-pass" class="w-4 h-4 pointer-events-none"></i>
                            </button>
                        </div>
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
                <p class="text-xs text-gray-500 mb-5">Disfruta de beneficios y haz seguimiento a tus productos.</p>
                
                <form id="form-registro" onsubmit="manejarRegistro(event)" class="space-y-3">
                    
                    <!-- Fila 1: Nombre Completo -->
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label>
                        <input type="text" id="reg-nombre" required class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                    </div>

                    <!-- Fila 2: Correo -->
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico</label>
                        <input type="email" id="reg-email" required class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                    </div>

                    <!-- Fila 3: Contraseñas -->
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">Contraseña</label>
                            <div class="relative">
                                <input type="password" id="reg-password" required class="w-full pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                                <button type="button" onclick="togglePassword('reg-password', 'icon-reg-pass1')" class="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none">
                                    <i data-lucide="eye" id="icon-reg-pass1" class="w-4 h-4 pointer-events-none"></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">Repetir Contraseña</label>
                            <div class="relative">
                                <input type="password" id="reg-password-repeat" required class="w-full pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                                <button type="button" onclick="togglePassword('reg-password-repeat', 'icon-reg-pass2')" class="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none">
                                    <i data-lucide="eye" id="icon-reg-pass2" class="w-4 h-4 pointer-events-none"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Fila 4: Teléfono -->
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
                        <input type="text" id="reg-telefono" placeholder="+569..." required class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                    </div>
                    
                    <!-- Fila 5: Región y Comuna -->
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">Región</label>
                            <select id="reg-region" required onchange="actualizarComunas('reg-region', 'reg-comuna')" class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                                <option value="">Seleccione...</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">Comuna</label>
                            <select id="reg-comuna" required class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                                <option value="">Seleccione...</option>
                            </select>
                        </div>
                    </div>

                    <!-- Fila 6: Calle y Número -->
                    <div class="grid grid-cols-3 gap-2">
                        <div class="col-span-2">
                            <label class="block text-xs font-bold text-gray-700 mb-1">Calle</label>
                            <input type="text" id="reg-direccion" placeholder="Ej. Trans Ayquina" autocomplete="off" required class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                        </div>
                        <div class="col-span-1">
                            <label class="block text-xs font-bold text-gray-700 mb-1">Número</label>
                            <input type="text" id="reg-numero" placeholder="Ej. 1636" required class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full mt-3 bg-brand-800 hover:bg-brand-900 text-white py-3 rounded-xl font-bold shadow transition-all text-sm">Registrarse</button>
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
                <p class="text-xs text-gray-500 mb-6">Ingresa a dónde enviaremos tus productos.</p>
                
                <form id="form-checkout-invitado" class="space-y-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Nombre y Apellido</label>
                        <input type="text" id="chk-nombre" required class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800" placeholder="Ej. Juan Pérez">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
                            <input type="text" id="chk-telefono" required class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800" placeholder="+569...">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico</label>
                            <input type="email" id="chk-email" required class="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800" placeholder="correo@ejemplo.com">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">Región</label>
                            <select id="chk-region" required onchange="actualizarComunas('chk-region', 'chk-comuna')" class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                                <option value="">Seleccione...</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">Comuna</label>
                            <select id="chk-comuna" required class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800">
                                <option value="">Seleccione...</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                        <div class="col-span-2">
                            <label class="block text-xs font-bold text-gray-700 mb-1">Calle</label>
                            <input type="text" id="chk-direccion" required autocomplete="off" class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800" placeholder="Ej. Trans Ayquina">
                        </div>
                        <div class="col-span-1">
                            <label class="block text-xs font-bold text-gray-700 mb-1">Número</label>
                            <input type="text" id="chk-numero" required class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-800" placeholder="Ej. 1636">
                        </div>
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

async function manejarLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('nutranuts_user', JSON.stringify(data.usuario));
            cerrarModalesAuth();
            actualizarNavAuth();
            mostrarToast(`👋 ¡Bienvenido de nuevo, ${data.usuario.nombre}!`, 'success');
        } else {
            mostrarToast(data.error || 'Correo o Contraseña incorrectos.', 'error');
        }
    } catch (err) {
        mostrarToast('Error de conexión con el servidor', 'error');
    }
}

async function manejarRegistro(e) {
    e.preventDefault();
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const passwordRepeat = document.getElementById('reg-password-repeat').value;
    const telefono = document.getElementById('reg-telefono').value;
    
    // Validación de confirmación de contraseña
    if (password !== passwordRepeat) {
        mostrarToast('Las contraseñas no coinciden', 'warning');
        return;
    }

    const region = document.getElementById('reg-region').value;
    const comuna = document.getElementById('reg-comuna').value;
    const calle = document.getElementById('reg-direccion').value;
    const numero = document.getElementById('reg-numero').value;
    
    const direccionFinal = `${calle} #${numero}, ${comuna}, ${region}`;

    try {
        const res = await fetch(`${CONFIG.API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password, telefono, direccion: direccionFinal })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('nutranuts_user', JSON.stringify(data.usuario));
            cerrarModalesAuth();
            actualizarNavAuth();
            mostrarToast('🎉 ¡Cuenta creada con éxito!', 'success');
        } else {
            mostrarToast(data.error || 'No se pudo registrar', 'error');
        }
    } catch (err) {
        mostrarToast('Error de conexión', 'error');
    }
}

function cerrarSesion() {
    localStorage.removeItem('nutranuts_user');
    actualizarNavAuth();
    mostrarToast('Has cerrado sesión correctamente.', 'info');
}

async function abrirModalPerfil() {
    const usuario = obtenerUsuarioActual();
    if (!usuario) return;

    cerrarModalesAuth();
    const modalPerfil = document.getElementById('modal-perfil');
    const bodyContainer = document.getElementById('perfil-content-body');

    bodyContainer.innerHTML = `<p class="text-center py-6 text-gray-400">Cargando tus datos...</p>`;
    modalPerfil.classList.remove('hidden');

    try {
        const res = await fetch(`${CONFIG.API_URL}/usuarios/${usuario.email}/ordenes`);
        const ordenes = await res.json();

        let htmlOrdenes = '<p class="text-xs text-gray-400 py-4 text-center bg-gray-50 rounded-xl">Aún no has registrado compras con este correo.</p>';
        
        if (ordenes && ordenes.length > 0) {
            htmlOrdenes = ordenes.map(o => {
                let itemsList = [];
                try { itemsList = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch (e) {}

                const productosHTML = itemsList.map(i => 
                    `<span class="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">${i.name || i.nombre || 'Producto'} (x${i.quantity || 1})</span>`
                ).join('');

                const totalFormateado = Number(o.total || 0).toLocaleString('es-CL');
                const esDespachado = o.despachado === 1;
                
                let badgeEstado = '';
                let btnReintentar = '';

                if (o.estado === 'PAGADO') {
                    badgeEstado = `<span class="font-bold ${esDespachado ? 'text-emerald-600' : 'text-amber-600'}">
                                     ${esDespachado ? '✓ Despachado' : '⌛ En preparación'}
                                   </span>`;
                } else {
                    badgeEstado = `<span class="font-bold text-rose-600">❌ Pago Incompleto</span>`;
                    btnReintentar = `<button onclick="reintentarPago(${o.id})" class="mt-3 w-full bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2">
                                        💳 Reintentar Pago
                                     </button>`;
                }

                return `
                    <div class="bg-white border rounded-xl p-4 text-xs space-y-2 shadow-sm">
                        <div class="flex justify-between items-center font-bold border-b pb-2">
                            <span class="text-brand-900">Orden #${o.id} <span class="text-gray-400 font-normal">(${o.fecha ? o.fecha.substring(0,10) : 'Reciente'})</span></span>
                            <span class="text-amber-800 text-sm">$${totalFormateado}</span>
                        </div>
                        <div class="text-gray-600">
                            <p class="font-medium text-gray-700">Productos:</p>
                            <div class="flex flex-wrap gap-1 mt-1">${productosHTML}</div>
                        </div>
                        <div class="flex justify-between pt-1 text-gray-500 items-center">
                            <span>📍 ${o.cliente_direccion || 'Sin dirección'}</span>
                            ${badgeEstado}
                        </div>
                        ${btnReintentar}
                    </div>
                `;
            }).join('');
        }

        bodyContainer.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h2 class="text-2xl font-black text-brand-900">Mi Cuenta & Mis Pedidos</h2>
                    <p class="text-xs text-gray-500">Revisa el historial de tus compras y tus datos actuales.</p>
                </div>

                <form onsubmit="actualizarPerfilUsuario(event, ${usuario.id})" class="bg-brand-50/50 p-4 rounded-2xl border border-brand-100 space-y-3">
                    <h3 class="font-bold text-sm text-brand-900">Actualizar Datos</h3>
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
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Dirección Registrada</label>
                        <input type="text" id="perfil-direccion" value="${usuario.direccion || ''}" class="w-full px-3 py-1.5 bg-white rounded-lg border text-sm text-gray-500" readonly title="Para cambiar la dirección completa, comunícate con soporte.">
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

        inicializarAutocompletado('perfil-direccion', null, null);

    } catch (err) {
        bodyContainer.innerHTML = `<p class="text-center py-6 text-rose-500">Error al cargar la información.</p>`;
    }
}

async function actualizarPerfilUsuario(e, userId) {
    e.preventDefault();
    const nombre = document.getElementById('perfil-nombre').value;
    const telefono = document.getElementById('perfil-telefono').value;

    try {
        const res = await fetch(`${CONFIG.API_URL}/auth/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('nutranuts_user', JSON.stringify(data.usuario));
            mostrarToast('¡Perfil actualizado!', 'success');
            actualizarNavAuth();
            cerrarModalesAuth();
        } else {
            mostrarToast(data.error || 'Error al actualizar', 'error');
        }
    } catch (err) {
        mostrarToast('Error de conexión', 'error');
    }
}

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
            
            const region = document.getElementById('chk-region').value;
            const comuna = document.getElementById('chk-comuna').value;
            const calle = document.getElementById('chk-direccion').value;
            const numero = document.getElementById('chk-numero').value;
            
            const direccionFinal = `${calle} #${numero}, ${comuna}, ${region}`;

            const cliente = {
                nombre: document.getElementById('chk-nombre').value,
                telefono: document.getElementById('chk-telefono').value,
                direccion: direccionFinal,
                email: document.getElementById('chk-email').value || ''
            };

            modal.classList.add('hidden');
            resolve(cliente);
        });

        const cerrarBtn = modal.querySelector('button[onclick*="cerrarModalesAuth"]');
        if (cerrarBtn) {
            cerrarBtn.onclick = () => {
                modal.classList.add('hidden');
                reject('Cancelado');
            };
        }
    });
}

window.reintentarPago = async function(ordenId) {
    mostrarToast('Conectando con Mercado Pago...', 'info');
    try {
        const res = await fetch(`${CONFIG.API_URL}/reintentar-pago/${ordenId}`, { method: 'POST' });
        const data = await res.json();
        if (res.ok && (data.init_point || data.sandbox_init_point)) {
            window.location.href = data.sandbox_init_point || data.init_point;
        } else {
            mostrarToast(data.error || 'Error. Revisa el stock.', 'error');
        }
    } catch (err) {
        mostrarToast('Error de conexión', 'error');
    }
};

// --- CONFIGURACIÓN DE AUTOCOMPLETADO (LOCATIONIQ) ---
function inicializarAutocompletado(inputId, numeroInputId, comunaInputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const sugerenciasContainer = document.createElement('div');
    sugerenciasContainer.className = "absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 hidden overflow-hidden max-h-48 overflow-y-auto";
    
    input.parentNode.style.position = "relative";
    input.parentNode.appendChild(sugerenciasContainer);

    let timeoutId = null;

    input.addEventListener('input', (e) => {
        clearTimeout(timeoutId);
        const query = e.target.value;

        if (query.length < 3) {
            sugerenciasContainer.classList.add('hidden');
            return;
        }

        timeoutId = setTimeout(async () => {
            try {
                const comunaValue = comunaInputId ? document.getElementById(comunaInputId)?.value : '';
                const searchStr = comunaValue ? `${query}, ${comunaValue}, Chile` : `${query}, Chile`;

                const url = `https://api.locationiq.com/v1/autocomplete?key=${CONFIG.LOCATIONIQ_API_KEY}&q=${encodeURIComponent(searchStr)}&countrycodes=cl&limit=5`;
                
                const res = await fetch(url);
                const data = await res.json();

                sugerenciasContainer.innerHTML = '';

                if (data && data.length > 0 && !data.error) {
                    data.forEach(item => {
                        const div = document.createElement('div');
                        div.className = "px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-900 cursor-pointer border-b border-gray-100 last:border-0 transition-colors";
                        
                        const partes = item.display_name.split(', ');
                        const callePrincipal = partes[0];
                        const detalleCiudad = partes.slice(1, 3).join(', '); 

                        div.innerHTML = `
                            <span class="font-bold text-brand-900">${callePrincipal}</span><br>
                            <span class="text-xs text-gray-500">${detalleCiudad}</span>
                        `;
                        
                        div.addEventListener('click', () => {
                            input.value = callePrincipal;
                            sugerenciasContainer.classList.add('hidden');
                            
                            if (numeroInputId) {
                                document.getElementById(numeroInputId)?.focus();
                            }
                        });

                        sugerenciasContainer.appendChild(div);
                    });
                    
                    sugerenciasContainer.classList.remove('hidden');
                } else {
                    sugerenciasContainer.classList.add('hidden');
                }
            } catch (err) {
                console.error("Error buscando dirección:", err);
            }
        }, 300); 
    });

    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== sugerenciasContainer) {
            sugerenciasContainer.classList.add('hidden');
        }
    });
}