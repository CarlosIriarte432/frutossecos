/**
 * ============================================================================
 * CONTROLADOR DE ÓRDENES Y PASARELA DE PAGOS
 * ============================================================================
 * Maneja el checkout, la creación de la preferencia con Ticket Detallado,
 * el Webhook de confirmación y el historial de compras.
 */

const pool = require('../config/database');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// --- INICIAR EL PROCESO DE COMPRA (CHECKOUT) ---
const createPreference = async (req, res) => {
    const dbClient = await pool.connect();
    try {
        const { items, cliente } = req.body;
        if (!items || items.length === 0) return res.status(400).json({ error: 'Carrito vacío' });

        await dbClient.query('BEGIN'); // Transacción segura
        let totalReal = 0;
        let descripcionPedido = ""; // Aquí guardaremos el texto: "2x Nueces, 1x Mix..."
        const itemsParaGuardar = [];

        // 1. Validar stock, calcular total y armar el texto del resumen
        for (const item of items) {
            const prodRes = await dbClient.query('SELECT * FROM productos WHERE id = $1', [item.id]);
            const prodDB = prodRes.rows[0];

            if (!prodDB || prodDB.disponible === 0 || prodDB.stock_unidades < item.quantity) {
                await dbClient.query('ROLLBACK');
                return res.status(400).json({ error: `Sin stock suficiente para ${item.name}` });
            }

            totalReal += prodDB.precio * item.quantity;
            
            // Vamos sumando el texto para la descripción de Mercado Pago
            descripcionPedido += `${item.quantity}x ${prodDB.nombre}, `;

            // Guardamos el detalle real para nuestra propia Base de Datos
            itemsParaGuardar.push({ 
                id: prodDB.id, 
                name: prodDB.nombre, 
                price: prodDB.precio, 
                quantity: item.quantity 
            });
        }

// Limpiamos la última coma y espacio del texto
        descripcionPedido = descripcionPedido.slice(0, -2);

        // Mercado Pago tiene un límite de caracteres para el título, lo cortamos si es muy largo
        let tituloFinal = `Pedido: ${descripcionPedido}`;
        if (tituloFinal.length > 250) {
            tituloFinal = tituloFinal.substring(0, 247) + "...";
        }

        // 2. Crear la orden PENDIENTE en nuestra BD
        const insertRes = await dbClient.query(`
            INSERT INTO ordenes (cliente_nombre, cliente_telefono, cliente_direccion, cliente_email, total, estado, items_json)
            VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', $6) RETURNING id
        `, [cliente.nombre, cliente.telefono, cliente.direccion, cliente.email || '', totalReal, JSON.stringify(itemsParaGuardar)]);

        const ordenId = insertRes.rows[0].id;
        await dbClient.query('COMMIT');

        let urlBase = process.env.FRONTEND_URL;
        if (!urlBase || !urlBase.trim().startsWith('http')) {
            urlBase = "http://localhost:5500";
        } else {
            urlBase = urlBase.trim();
        }

        // --- TRUCO DEL ITEM ÚNICO PARA MERCADO PAGO ---
        const mpItems = [{
            id: ordenId.toString(),
            title: tituloFinal, // <-- AHORA LA LISTA APARECERÁ COMO EL TÍTULO DE LA COMPRA
            picture_url: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80",
            category_id: "others",
            unit_price: Number(totalReal), 
            quantity: 1, 
            currency_id: 'CLP'
        }];

        // 3. Crear Preferencia en Mercado Pago
        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items: mpItems,
                external_reference: ordenId.toString(),
                back_urls: {
                    success: `${urlBase}/exito.html`,
                    failure: `${urlBase}/fallo.html`,
                    pending: `${urlBase}/pendiente.html`
                },
                auto_return: "approved", 
                notification_url: "https://frutossecos.onrender.com/api/webhook"
            }
        });

        res.json({ init_point: result.init_point, sandbox_init_point: result.sandbox_init_point });
    } catch (error) {
        await dbClient.query('ROLLBACK');
        console.error('Error al generar preferencia:', error);
        res.status(500).json({ error: 'Error al procesar pago' });
    } finally {
        dbClient.release();
    }
};

// --- WEBHOOK: ESCUCHADOR DE PAGOS DE MERCADO PAGO ---
const webhook = async (req, res) => {
    const paymentId = req.query['data.id'] || req.query.id || (req.body && req.body.data && req.body.data.id);
    if (!paymentId) return res.status(400).send('No ID');

    try {
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });

        if (paymentInfo.status === 'approved') {
            const ordenId = paymentInfo.external_reference;
            if (ordenId) {
                const dbClient = await pool.connect();
                try {
                    await dbClient.query('BEGIN');
                    const orden = (await dbClient.query('SELECT estado, items_json FROM ordenes WHERE id = $1', [ordenId])).rows[0];

                    if (orden && orden.estado === 'PENDIENTE') {
                        // Cambiamos a PAGADO
                        await dbClient.query('UPDATE ordenes SET estado = $1 WHERE id = $2', ['PAGADO', ordenId]);
                        
                        // Descontamos Stock
                        const items = JSON.parse(orden.items_json);
                        for (const item of items) {
                            const p = (await dbClient.query('SELECT stock_unidades FROM productos WHERE id = $1', [item.id])).rows[0];
                            if (p) {
                                const nStock = Math.max(0, p.stock_unidades - item.quantity);
                                await dbClient.query('UPDATE productos SET stock_unidades = $1, disponible = $2 WHERE id = $3', [nStock, nStock === 0 ? 0 : 1, item.id]);
                            }
                        }
                    }
                    await dbClient.query('COMMIT');
                } catch (e) {
                    await dbClient.query('ROLLBACK');
                    console.error('Error procesando DB en webhook:', e);
                } finally {
                    dbClient.release();
                }
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Error en webhook:', error);
        res.sendStatus(500);
    }
};

// --- OBTENER TODAS LAS ÓRDENES (Panel Admin) ---
const getOrdenesAdmin = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ordenes ORDER BY fecha DESC');
        res.json(result.rows.map(o => ({ ...o, items: JSON.parse(o.items_json || '[]'), estado_pago: o.estado || 'Pagado', despachado: o.despachado || 0 })));
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener órdenes' });
    }
};

// --- MARCAR ORDEN COMO DESPACHADA (Panel Admin) ---
const actualizarDespacho = async (req, res) => {
    try {
        await pool.query('UPDATE ordenes SET despachado = $1 WHERE id = $2', [req.body.despachado, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
};

// --- OBTENER EL HISTORIAL DE COMPRAS DE UN CLIENTE (Perfil) ---
const getOrdenesUsuario = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ordenes WHERE cliente_email = $1 ORDER BY fecha DESC', [req.params.email]);
        res.json(result.rows.map(o => ({ ...o, items: JSON.parse(o.items_json || '[]') })));
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
};

module.exports = { createPreference, webhook, getOrdenesAdmin, actualizarDespacho, getOrdenesUsuario };