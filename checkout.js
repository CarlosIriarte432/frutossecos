document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // 1. Leer la clave exacta que usan tus amigos: 'cart_items'
        const cartData = JSON.parse(localStorage.getItem('cart_items')) || [];

        if (cartData.length === 0) {
            alert('🛒 Tu carrito está vacío. Agrega productos antes de finalizar la compra.');
            return;
        }

        // 2. Feedback visual en el botón
        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = `⌛ Conectando a Mercado Pago...`;

        try {
            // 3. Petición al backend local
            const response = await fetch('http://localhost:3000/api/create-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items: cartData })
            });

            if (!response.ok) {
                throw new Error('Error al conectar con el servidor backend');
            }

            const data = await response.json();

            // 4. Redirección a la pasarela
            if (data.sandbox_init_point || data.init_point) {
                window.location.href = data.sandbox_init_point || data.init_point;
            } else {
                throw new Error('No se recibió la URL de pago de Mercado Pago');
            }

        } catch (error) {
            console.error('Error en checkout:', error);
            alert('⚠️ No se pudo iniciar el pago. Revisa que "node index.js" esté corriendo en la terminal.');
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalText;
        }
    });
});