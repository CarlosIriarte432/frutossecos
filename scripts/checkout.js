document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const cartData = JSON.parse(localStorage.getItem('cart_items')) || [];

        if (cartData.length === 0) {
            mostrarToast('Tu carrito está vacío. Agrega productos antes de finalizar la compra.', 'warning');
            return;
        }

        const usuarioActivo = JSON.parse(localStorage.getItem('nutranuts_user'));
        let clienteData;

        if (usuarioActivo) {
            clienteData = {
                nombre: usuarioActivo.nombre,
                telefono: usuarioActivo.telefono || '',
                direccion: usuarioActivo.direccion || '',
                email: usuarioActivo.email
            };
        } else {
            try {
                clienteData = await obtenerDatosInvitadoPorModal();
            } catch (err) {
                return; 
            }
        }

        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = `⌛ Validando stock y conectando...`;

        try {
            // CORRECCIÓN: Comillas inclinadas (backticks)
            const response = await fetch(`${CONFIG.API_URL}/create-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    items: cartData,
                    cliente: clienteData 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al procesar la compra');
            }

            sessionStorage.setItem('pending_order_cliente', JSON.stringify(clienteData));
            sessionStorage.setItem('pending_order_items', JSON.stringify(cartData));

            if (data.sandbox_init_point || data.init_point) {
                window.location.href = data.sandbox_init_point || data.init_point;
            } else {
                throw new Error('No se recibió la URL de pago de Mercado Pago');
            }

        } catch (error) {
            console.error('Error en checkout:', error);
            mostrarToast(error.message, 'error');
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalText;
        }
    });
});

function obtenerDatosInvitadoPorModal() {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById('modal-checkout-invitado');
        if (!modal) {
            reject('Modal no encontrado');
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