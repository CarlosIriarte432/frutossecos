const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const db = require('./database');

const app = express();
app.use(express.json());
app.use(cors());

const ACCESS_TOKEN_PRUEBA = 'APP_USR-3731722863549196-100210-c16d54920f70904960b97efd407d631b-3730766923';
const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN_PRUEBA });

// -------------------------------------------------------------
// ENDPOINTS DE PRODUCTOS
// -------------------------------------------------------------

app.get('/api/productos', (req, res) => {
    try {
        const productos = db.prepare('SELECT * FROM productos').all();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar la base de datos' });
    }
});

// Crear un nuevo producto desde el admin
app.post('/api/admin/productos', (req, res) => {
    try {
        const { nombre, precio, categoria, stock_unidades, imagen } = req.body;

        if (!nombre || !precio || !categoria) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, precio, categoría)' });
        }

        const stock = stock_unidades !== undefined ? Number(stock_unidades) : 10;
        const dispo = stock > 0 ? 1 : 0;
        const imgUrl = imagen || 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80';

        const stmt = db.prepare(`
            INSERT INTO productos (nombre, precio, categoria, stock_unidades, disponible, imagen) 
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(nombre, Number(precio), categoria, stock, dispo, imgUrl);

        res.json({ success: true, id: result.lastInsertRowid, message: 'Producto creado con éxito' });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear el producto' });
    }
});

// Actualizar stock, precio o disponibilidad desde el admin (CRUD parcial)
app.patch('/api/admin/productos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { disponible, stock_unidades, precio } = req.body;

        const prodActual = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
        if (!prodActual) return res.status(404).json({ error: 'Producto no encontrado' });

        const nuevoDisponible = disponible !== undefined ? disponible : prodActual.disponible;
        const nuevoStock = stock_unidades !== undefined ? Number(stock_unidades) : prodActual.stock_unidades;
        const nuevoPrecio = precio !== undefined ? Number(precio) : prodActual.precio;

       // Si el stock es mayor a 0, se habilita automáticamente (1). Si es 0 o menos, queda agotado (0).
        const estadoFinal = nuevoStock > 0 ? 1 : 0;

        const stmt = db.prepare(`
            UPDATE productos 
            SET disponible = ?, stock_unidades = ?, precio = ? 
            WHERE id = ?
        `);
        stmt.run(estadoFinal, nuevoStock, nuevoPrecio, id);

        res.json({ success: true, message: 'Producto actualizado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'No se pudo actualizar el producto' });
    }
});

// -------------------------------------------------------------
// CHECKOUT Y REGISTRO DE ORDEN
// -------------------------------------------------------------

app.post('/api/create-preference', async (req, res) => {
    try {
        const { items, cliente } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // Validar stock en tiempo real
        for (const item of items) {
            const prodDB = db.prepare('SELECT * FROM productos WHERE id = ?').get(item.id);
            if (!prodDB || prodDB.disponible === 0 || prodDB.stock_unidades < item.quantity) {
                return res.status(400).json({ 
                    error: `Lo sentimos, el producto "${item.name}" no tiene stock suficiente (Disponibles: ${prodDB ? prodDB.stock_unidades : 0})` 
                });
            }
        }

        const mpItems = items.map(item => ({
            title: item.name || 'Producto NutraNuts',
            unit_price: Number(item.price),
            quantity: Number(item.quantity || 1),
            currency_id: 'CLP'
        }));

        const body = {
            items: mpItems,
            back_urls: {
                success: 'http://127.0.0.1:5500/exito.html',
                failure: 'http://127.0.0.1:5500/fallo.html',
                pending: 'http://127.0.0.1:5500/pendiente.html'
            },
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        res.json({
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        });

    } catch (error) {
        console.error('Error al generar preferencia:', error);
        res.status(500).json({ error: 'Error al procesar la pasarela de pagos' });
    }
});

// Endpoint para registrar la orden y descontar stock al aprobarse el pago
app.post('/api/registrar-orden', (req, res) => {
    try {
        const { cliente, items, total } = req.body;

        const insertOrden = db.prepare(`
            INSERT INTO ordenes (cliente_nombre, cliente_telefono, cliente_direccion, cliente_email, total, items_json)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const transaccionCompra = db.transaction(() => {
            // 1. Guardar la orden
            insertOrden.run(
                cliente.nombre, 
                cliente.telefono, 
                cliente.direccion, 
                cliente.email || '', 
                total, 
                JSON.stringify(items)
            );

            // 2. Descontar stock y actualizar estado si llega a 0
            for (const item of items) {
                const producto = db.prepare('SELECT stock_unidades FROM productos WHERE id = ?').get(item.id);
                if (producto) {
                    const nuevoStock = Math.max(0, producto.stock_unidades - item.quantity);
                    const nuevoEstado = nuevoStock === 0 ? 0 : 1;

                    db.prepare(`
                        UPDATE productos 
                        SET stock_unidades = ?, disponible = ? 
                        WHERE id = ?
                    `).run(nuevoStock, nuevoEstado, item.id);
                }
            }
        });

        transaccionCompra();
        res.json({ success: true, message: 'Orden registrada y stock descontado exitosamente' });

    } catch (error) {
        console.error('Error al registrar orden:', error);
        res.status(500).json({ error: 'Error al registrar la orden en el sistema' });
    }
});

// Endpoint para que el Admin vea los pedidos registrados
app.get('/api/admin/ordenes', (req, res) => {
    try {
        const ordenes = db.prepare('SELECT * FROM ordenes ORDER BY fecha DESC').all();
        // Parseamos el JSON de los items para que sea fácil leerlos
        const ordenesFormateadas = ordenes.map(o => ({
            ...o,
            items: JSON.parse(o.items_json)
        }));
        res.json(ordenesFormateadas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});