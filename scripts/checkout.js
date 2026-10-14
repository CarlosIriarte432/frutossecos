document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // 1. Leer el carrito
        const cartData = JSON.parse(localStorage.getItem('cart_items')) || [];

        if (cartData.length === 0) {
            mostrarToast('Tu carrito está vacío. Agrega productos antes de finalizar la compra.', 'warning');
            return;
        }

        // 2. Verificar si hay usuario logueado o pedir datos mediante el modal bonito
        const usuarioActivo = JSON.parse(localStorage.getItem('nutranuts_user'));
        let clienteData;

        if (usuarioActivo) {
            // Si está logueado, usamos sus datos automáticamente
            clienteData = {
                nombre: usuarioActivo.nombre,
                telefono: usuarioActivo.telefono || '',
                direccion: usuarioActivo.direccion || '',
                email: usuarioActivo.email
            };
        } else {
            // Si es invitado, mostramos el modal bonito y esperamos a que lo envíe
            try {
                clienteData = await obtenerDatosInvitadoPorModal();
            } catch (err) {
                return; // Si cerró el modal, se cancela la compra
            }
        }

        // 3. Feedback visual en el botón
        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = `⌛ Validando stock y conectando...`;

        try {
            // 4. Petición al backend pasando los ítems y los datos del cliente
            const response = await fetch('https://frutossecos.onrender.com/api/create-preference', {
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

            // Guardamos temporalmente los datos del cliente en sessionStorage 
            sessionStorage.setItem('pending_order_cliente', JSON.stringify(clienteData));
            sessionStorage.setItem('pending_order_items', JSON.stringify(cartData));

            // 5. Redirección a la pasarela de Mercado Pago
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

// Función auxiliar para manejar el modal de invitado mediante una Promesa
function obtenerDatosInvitadoPorModal() {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById('modal-checkout-invitado');
        if (!modal) {
            reject('Modal no encontrado');
            return;
        }

        modal.classList.remove('hidden');

        // Referencia al formulario
        const form = document.getElementById('form-checkout-invitado');
        
        // Limpiar eventos anteriores clonando el form o manejando un submit único
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

        // Si hace clic en la X o cierra el modal de alguna forma
        const cerrarBtn = modal.querySelector('button[onclick*="cerrarModalesAuth"]');
        if (cerrarBtn) {
            cerrarBtn.onclick = () => {
                modal.classList.add('hidden');
                reject('Cancelado por el usuario');
            };
        }
    });
}