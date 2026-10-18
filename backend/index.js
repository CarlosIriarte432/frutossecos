require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const pool = require('./database');

const app = express();
app.use(express.json());
app.use(cors());

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// -------------------------------------------------------------
// ENDPOINTS DE PRODUCTOS
// -------------------------------------------------------------

app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al consultar productos:', error);
        res.status(500).json({ error: 'Error al consultar la base de datos' });
    }
});

// Crear un nuevo producto desde el admin
app.post('/api/admin/productos', async (req, res) => {
    try {
        const { nombre, precio, categoria, stock_unidades, imagen } = req.body;

        if (!nombre || !precio || !categoria) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, precio, categoría)' });
        }

        const stock = stock_unidades !== undefined ? Number(stock_unidades) : 10;
        const dispo = stock > 0 ? 1 : 0;
        const imgUrl = imagen || 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80';

        const result = await pool.query(`
            INSERT INTO productos (nombre, precio, categoria, stock_unidades, disponible, imagen) 
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [nombre, Number(precio), categoria, stock, dispo, imgUrl]);

        res.json({ success: true, id: result.rows[0].id, message: 'Producto creado con éxito' });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear el producto' });
    }
});

// Actualizar stock, precio o disponibilidad desde el admin
app.patch('/api/admin/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { disponible, stock_unidades, precio } = req.body;

        const prodRes = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
        const prodActual = prodRes.rows[0];

        if (!prodActual) return res.status(404).json({ error: 'Producto no encontrado' });

        const nuevoStock = stock_unidades !== undefined ? Number(stock_unidades) : prodActual.stock_unidades;
        const nuevoPrecio = precio !== undefined ? Number(precio) : prodActual.precio;
        const estadoFinal = nuevoStock > 0 ? 1 : 0;

        await pool.query(`
            UPDATE productos 
            SET disponible = $1, stock_unidades = $2, precio = $3 
            WHERE id = $4
        `, [estadoFinal, nuevoStock, nuevoPrecio, id]);

        res.json({ success: true, message: 'Producto actualizado con éxito' });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'No se pudo actualizar el producto' });
    }
});

// -------------------------------------------------------------
// CHECKOUT, CREACIÓN DE ORDEN PENDIENTE Y WEBHOOK
// -------------------------------------------------------------

app.post('/api/create-preference', async (req, res) => {
    const dbClient = await pool.connect();
    try {
        const { items, cliente } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        await dbClient.query('BEGIN');

        let totalReal = 0;
        const mpItems = [];
        const itemsParaGuardar = [];

        // 1. Validar stock y calcular el precio real desde la Base de Datos (Seguridad)
        for (const item of items) {
            const prodRes = await dbClient.query('SELECT * FROM productos WHERE id = $1', [item.id]);
            const prodDB = prodRes.rows[0];

            if (!prodDB || prodDB.disponible === 0 || prodDB.stock_unidades < item.quantity) {
                await dbClient.query('ROLLBACK');
                return res.status(400).json({ 
                    error: `El producto "${item.name}" no tiene stock suficiente (Disponibles: ${prodDB ? prodDB.stock_unidades : 0})` 
                });
            }

            // Calculamos el total usando el precio de la BD, no el del frontend
            totalReal += prodDB.precio * item.quantity;

            mpItems.push({
                title: prodDB.nombre,
                unit_price: Number(prodDB.precio),
                quantity: Number(item.quantity),
                currency_id: 'CLP'
            });

            itemsParaGuardar.push({
                id: prodDB.id,
                name: prodDB.nombre,
                price: prodDB.precio,
                quantity: item.quantity
            });
        }

        // 2. Crear la orden en estado PENDIENTE antes de ir a pagar
        const insertRes = await dbClient.query(`
            INSERT INTO ordenes (cliente_nombre, cliente_telefono, cliente_direccion, cliente_email, total, estado, items_json)
            VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', $6)
            RETURNING id
        `, [cliente.nombre, cliente.telefono, cliente.direccion, cliente.email || '', totalReal, JSON.stringify(itemsParaGuardar)]);

        const ordenId = insertRes.rows[0].id;
        await dbClient.query('COMMIT');

        // 3. Generar la preferencia de Mercado Pago vinculada a nuestra Orden (external_reference)
        const body = {
            items: mpItems,
            external_reference: ordenId.toString(), // <-- Vinculamos el pago a nuestra BD
            back_urls: {
                success: `${process.env.FRONTEND_URL}/exito.html`,
                failure: `${process.env.FRONTEND_URL}/fallo.html`,
                pending: `${process.env.FRONTEND_URL}/pendiente.html`
            },
            auto_return: "approved",
            // URL a la que MP enviará el aviso silencioso de pago (Debe ser HTTPS)
            notification_url: "https://frutossecos.onrender.com/api/webhook" 
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        res.json({
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        });

    } catch (error) {
        await dbClient.query('ROLLBACK');
        console.error('Error al generar preferencia:', error);
        res.status(500).json({ error: 'Error al procesar la pasarela de pagos' });
    } finally {
        dbClient.release();
    }
});

// -------------------------------------------------------------
// WEBHOOK: ESCUCHADOR DE PAGOS DE MERCADO PAGO
// -------------------------------------------------------------
app.post('/api/webhook', async (req, res) => {
    // Mercado Pago envía el ID del pago en diferentes partes según el evento
    const paymentId = req.query['data.id'] || req.query.id || (req.body && req.body.data && req.body.data.id);

    if (!paymentId) {
        return res.status(400).send('No payment ID found');
    }

    try {
        // Consultar a Mercado Pago el estado real de este pago
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });

        // Si el pago fue aprobado exitosamente
        if (paymentInfo.status === 'approved') {
            const ordenId = paymentInfo.external_reference; // El ID de nuestra base de datos

            if (ordenId) {
                const dbClient = await pool.connect();
                try {
                    await dbClient.query('BEGIN');

                    // Verificar que la orden esté PENDIENTE (evita descontar stock 2 veces si MP envía el aviso repetido)
                    const ordenRes = await dbClient.query('SELECT estado, items_json FROM ordenes WHERE id = $1', [ordenId]);
                    const orden = ordenRes.rows[0];

                    if (orden && orden.estado === 'PENDIENTE') {
                        // 1. Marcar como PAGADO
                        await dbClient.query('UPDATE ordenes SET estado = $1 WHERE id = $2', ['PAGADO', ordenId]);

                        // 2. Descontar el stock
                        const itemsComprados = JSON.parse(orden.items_json);
                        for (const item of itemsComprados) {
                            const prodRes = await dbClient.query('SELECT stock_unidades FROM productos WHERE id = $1', [item.id]);
                            const producto = prodRes.rows[0];

                            if (producto) {
                                const nuevoStock = Math.max(0, producto.stock_unidades - item.quantity);
                                const nuevoEstado = nuevoStock === 0 ? 0 : 1;

                                await dbClient.query(`
                                    UPDATE productos 
                                    SET stock_unidades = $1, disponible = $2 
                                    WHERE id = $3
                                `, [nuevoStock, nuevoEstado, item.id]);
                            }
                        }
                    }
                    await dbClient.query('COMMIT');
                } catch (dbError) {
                    await dbClient.query('ROLLBACK');
                    console.error('Error en DB al procesar webhook:', dbError);
                } finally {
                    dbClient.release();
                }
            }
        }

        // Siempre debemos responder 200 OK rápido a Mercado Pago
        res.sendStatus(200);

    } catch (error) {
        console.error('Error procesando el webhook:', error);
        res.sendStatus(500);
    }
});

// -------------------------------------------------------------
// ENDPOINTS DE ADMINISTRACIÓN - ÓRDENES
// -------------------------------------------------------------

app.get('/api/admin/ordenes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ordenes ORDER BY fecha DESC');
        const ordenesFormateadas = result.rows.map(o => {
            let itemsParsed = [];
            try {
                itemsParsed = JSON.parse(o.items_json || '[]');
            } catch (e) {
                itemsParsed = [];
            }
            return {
                ...o,
                items: itemsParsed,
                estado_pago: o.estado || 'Pagado',
                despachado: o.despachado || 0
            };
        });
        res.json(ordenesFormateadas);
    } catch (error) {
        console.error('Error al obtener las órdenes:', error);
        res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
});

app.patch('/api/admin/ordenes/:id/despacho', async (req, res) => {
    try {
        const { id } = req.params;
        const { despachado } = req.body;

        await pool.query('UPDATE ordenes SET despachado = $1 WHERE id = $2', [despachado, id]);

        res.json({ success: true, message: 'Estado de despacho actualizado' });
    } catch (error) {
        console.error('Error al actualizar despacho:', error);
        res.status(500).json({ error: 'No se pudo actualizar el estado' });
    }
});

// -------------------------------------------------------------
// ENDPOINTS DE AUTENTICACIÓN Y USUARIOS
// -------------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
    try {
        const { nombre, email, password, telefono, direccion } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, contraseña)' });
        }

        const usuarioExistente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // 1. Encriptar la contraseña (10 es el "salt rounds", un estándar seguro y rápido)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(`
            INSERT INTO usuarios (nombre, email, password, telefono, direccion) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [nombre, email, hashedPassword, telefono || '', direccion || '']);

        const nuevoUsuario = {
            id: result.rows[0].id,
            nombre,
            email,
            telefono: telefono || '',
            direccion: direccion || ''
        };

        res.json({ success: true, message: 'Usuario registrado con éxito', usuario: nuevoUsuario });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuario = result.rows[0];

        // Validar si el usuario no existe en la base de datos
        if (!usuario) {
            return res.status(401).json({ error: 'Correo o Contraseña incorrectos. Por favor, inténtelo de nuevo.' });
        }

        // 2. Comparar la contraseña ingresada con el hash de la base de datos
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({ error: 'Correo o Contraseña incorrectos. Por favor, inténtelo de nuevo.' });
        }

        const esAdmin = email === 'admin@nutranuts.cl' || email === 'contacto@nutranuts.cl';

        res.json({
            success: true,
            message: 'Login exitoso',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                telefono: usuario.telefono,
                direccion: usuario.direccion,
                es_admin: esAdmin
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.put('/api/auth/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, direccion, passwordActual, nuevoPassword } = req.body;

        const userRes = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        const usuario = userRes.rows[0];

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        let passwordFinal = usuario.password;

        if (nuevoPassword) {
            // Comparar la contraseña actual con el hash antes de permitir el cambio
            const passwordActualValida = await bcrypt.compare(passwordActual, usuario.password);
            if (!passwordActualValida) {
                return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
            }
            // Encriptar la nueva contraseña
            const salt = await bcrypt.genSalt(10);
            passwordFinal = await bcrypt.hash(nuevoPassword, salt);
        }

        const nuevoNombre = nombre || usuario.nombre;
        const nuevoTelefono = telefono !== undefined ? telefono : usuario.telefono;
        const NuevaDireccion = direccion !== undefined ? direccion : usuario.direccion;

        await pool.query(`
            UPDATE usuarios 
            SET nombre = $1, telefono = $2, direccion = $3, password = $4 
            WHERE id = $5
        `, [nuevoNombre, nuevoTelefono, NuevaDireccion, passwordFinal, id]);

        const updatedRes = await pool.query('SELECT id, nombre, email, telefono, direccion FROM usuarios WHERE id = $1', [id]);

        res.json({ success: true, message: 'Perfil actualizado con éxito', usuario: updatedRes.rows[0] });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'No se pudo actualizar el perfil' });
    }
});

app.get('/api/usuarios/:email/ordenes', async (req, res) => {
    try {
        const { email } = req.params;
        const result = await pool.query('SELECT * FROM ordenes WHERE cliente_email = $1 ORDER BY fecha DESC', [email]);
        
        const ordenesFormateadas = result.rows.map(o => ({
            ...o,
            items: JSON.parse(o.items_json || '[]')
        }));

        res.json(ordenesFormateadas);
    } catch (error) {
        console.error('Error al obtener pedidos del usuario:', error);
        res.status(500).json({ error: 'Error al consultar los pedidos' });
    }
});

app.get('/api/admin/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, email, telefono, direccion, fecha_registro FROM usuarios ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar los usuarios' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
});