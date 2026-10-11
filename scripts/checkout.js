document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // 1. Leer el carrito
        const cartData = JSON.parse(localStorage.getItem('cart_items')) || [];

        if (cartData.length === 0) {
            alert('🛒 Tu carrito está vacío. Agrega productos antes de finalizar la compra.');
            return;
        }

        // 2. Solicitar datos de envío del cliente invitado (Rápido y efectivo para La Serena / Coquimbo)
        const nombre = prompt('Ingresa tu Nombre y Apellido para el despacho:');
        if (!nombre) return; // Si cancela, se detiene

        const telefono = prompt('Ingresa tu Teléfono de contacto (Ej: +569...):');
        if (!telefono) return;

        const direccion = prompt('Ingresa tu Dirección de despacho (Calle, número, comuna):');
        if (!direccion) return;

        const email = prompt('Ingresa tu Correo electrónico (opcional):') || '';

        const clienteData = { nombre, telefono, direccion, email };

        // 3. Feedback visual en el botón
        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = `⌛ Validando stock y conectando...`;

        try {
            // 4. Petición al backend pasando los ítems y los datos del cliente
            const response = await fetch('http://localhost:3000/api/create-preference', {
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
            // para registrarlos en la BD cuando vuelva de la página de exito.html
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
            alert(`⚠️ ${error.message}`);
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalText;
        }
    });
});