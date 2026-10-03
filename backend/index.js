const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(express.json());
app.use(cors());

// Reemplaza con tu Access Token de prueba (Sandbox) de Mercado Pago
const ACCESS_TOKEN_PRUEBA = 'APP_USR-3731722863549196-100210-c16d54920f70904960b97efd407d631b-3730766923';

const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN_PRUEBA });

app.post('/api/create-preference', async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        const mpItems = items.map(item => ({
            title: item.name || item.title || 'Producto NutraNuts',
            unit_price: Number(item.price),
            quantity: Number(item.quantity || 1),
            currency_id: 'CLP'
        }));

        // Objeto de preferencia corregido para localhost
        const body = {
            items: mpItems,
            back_urls: {
                success: 'http://127.0.0.1:5500/exito.html',
                failure: 'http://127.0.0.1:5500/fallo.html',
                pending: 'http://127.0.0.1:5500/pendiente.html'
            }
            // Eliminamos 'auto_return' para evitar el error de validación en http local
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        res.json({
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        });

    } catch (error) {
        console.error('Error al generar la preferencia de Mercado Pago:', error);
        res.status(500).json({ error: 'No se pudo generar la transacción de pago' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});