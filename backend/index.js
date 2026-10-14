const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const pool = require('./database');

const app = express();
app.use(express.json());
app.use(cors());

const ACCESS_TOKEN_PRUEBA = 'APP_USR-3731722863549196-100210-c16d54920f70904960b97efd407d631b-3730766923';
const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN_PRUEBA });

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
            const prodRes = await pool.query('SELECT * FROM productos WHERE id = $1', [item.id]);
            const prodDB = prodRes.rows[0];

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
                success: 'https://carlosiriarte432.github.io/frutossecos/exito.html',
                failure: 'https://carlosiriarte432.github.io/frutossecos/fallo.html',
                pending: 'https://carlosiriarte432.github.io/frutossecos/pendiente.html'
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

// Endpoint para registrar la orden y descontar stock con Transacción Segura
app.post('/api/registrar-orden', async (req, res) => {
    const dbClient = await pool.connect();
    try {
        const { cliente, items, total } = req.body;

        await dbClient.query('BEGIN');

        // 1. Guardar la orden
        await dbClient.query(`
            INSERT INTO ordenes (cliente_nombre, cliente_telefono, cliente_direccion, cliente_email, total, items_json)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            cliente.nombre, 
            cliente.telefono, 
            cliente.direccion, 
            cliente.email || '', 
            total, 
            JSON.stringify(items)
        ]);

        // 2. Descontar stock
        for (const item of items) {
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

        await dbClient.query('COMMIT');
        res.json({ success: true, message: 'Orden registrada y stock descontado exitosamente' });

    } catch (error) {
        await dbClient.query('ROLLBACK');
        console.error('Error al registrar orden:', error);
        res.status(500).json({ error: 'Error al registrar la orden en el sistema' });
    } finally {
        dbClient.release();
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

        const result = await pool.query(`
            INSERT INTO usuarios (nombre, email, password, telefono, direccion) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [nombre, email, password, telefono || '', direccion || '']);

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

        if (!usuario || usuario.password !== password) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
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
            if (passwordActual !== usuario.password) {
                return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
            }
            passwordFinal = nuevoPassword;
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend con PostgreSQL corriendo en http://localhost:${PORT}`);
});