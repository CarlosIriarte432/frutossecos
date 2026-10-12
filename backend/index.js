const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const db = require('./database');

// -------------------------------------------------------------
// MIGRACIÓN DE BASE DE DATOS (Asegura columna 'despachado')
// -------------------------------------------------------------
try {
    db.prepare("ALTER TABLE ordenes ADD COLUMN despachado INTEGER DEFAULT 0").run();
    console.log("✅ Columna 'despachado' verificada/creada en la tabla ordenes.");
} catch (e) {
    // Si la columna ya existe, SQLite genera este error y lo ignoramos de forma segura
}

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

// -------------------------------------------------------------
// ENDPOINTS DE ADMINISTRACIÓN - ÓRDENES
// -------------------------------------------------------------

// Endpoint para que el Admin vea los pedidos con todos los nuevos campos
app.get('/api/admin/ordenes', (req, res) => {
    try {
        const ordenes = db.prepare('SELECT * FROM ordenes ORDER BY fecha DESC').all();
        const ordenesFormateadas = ordenes.map(o => {
            let itemsParsed = [];
            try {
                itemsParsed = JSON.parse(o.items_json || '[]');
            } catch (e) {
                itemsParsed = [];
            }
            return {
                ...o,
                items: itemsParsed,
                estado_pago: o.estado_pago || 'Pagado',
                despachado: o.despachado || 0
            };
        });
        res.json(ordenesFormateadas);
    } catch (error) {
        console.error('Error al obtener las órdenes:', error);
        res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
});

// Endpoint para marcar un pedido como despachado/realizado
app.patch('/api/admin/ordenes/:id/despacho', (req, res) => {
    try {
        const { id } = req.params;
        const { despachado } = req.body; // 1 o 0

        const stmt = db.prepare('UPDATE ordenes SET despachado = ? WHERE id = ?');
        stmt.run(despachado, id);

        res.json({ success: true, message: 'Estado de despacho actualizado' });
    } catch (error) {
        console.error('Error al actualizar despacho:', error);
        res.status(500).json({ error: 'No se pudo actualizar el estado' });
    }
});

// -------------------------------------------------------------
// ENDPOINTS DE AUTENTICACIÓN Y USUARIOS
// -------------------------------------------------------------

// Registro de nuevo usuario
app.post('/api/auth/register', (req, res) => {
    try {
        const { nombre, email, password, telefono, direccion } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, contraseña)' });
        }

        // Verificar si el correo ya está registrado
        const usuarioExistente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // Nota: Para simplicidad local usamos texto plano o puedes aplicar un hash si prefieres
        const stmt = db.prepare(`
            INSERT INTO usuarios (nombre, email, password, telefono, direccion) 
            VALUES (?, ?, ?, ?, ?)
        `);
        const result = stmt.run(nombre, email, password, telefono || '', direccion || '');

        const nuevoUsuario = {
            id: result.lastInsertRowid,
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

// Inicio de sesión (Login)
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;

        // Aquí buscas el usuario en la base de datos...
        const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

        if (!usuario || usuario.password !== password) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // <--- AQUÍ ES DONDE LO COLOCAS --->
        const esAdmin = email === 'admin@nutranuts.cl' || email === 'contacto@nutranuts.cl'; // Puedes cambiar o agregar tu correo aquí

        res.json({
            success: true,
            message: 'Login exitoso',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                telefono: usuario.telefono,
                direccion: usuario.direccion,
                es_admin: esAdmin // <--- Esto le envía la propiedad al navegador
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Actualizar perfil de usuario / cambiar contraseña
app.put('/api/auth/profile/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, direccion, passwordActual, nuevoPassword } = req.body;

        const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        let passwordFinal = usuario.password;

        // Si quiere cambiar contraseña, validamos la actual
        if (nuevoPassword) {
            if (passwordActual !== usuario.password) {
                return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
            }
            passwordFinal = nuevoPassword;
        }

        const nuevoNombre = nombre || usuario.nombre;
        const nuevoTelefono = telefono !== undefined ? telefono : usuario.telefono;
        const NuevaDireccion = direccion !== undefined ? direccion : usuario.direccion;

        db.prepare(`
            UPDATE usuarios 
            SET nombre = ?, telefono = ?, direccion = ?, password = ? 
            WHERE id = ?
        `).run(nuevoNombre, nuevoTelefono, NuevaDireccion, passwordFinal, id);

        const usuarioActualizado = db.prepare('SELECT id, nombre, email, telefono, direccion FROM usuarios WHERE id = ?').get(id);

        res.json({ success: true, message: 'Perfil actualizado con éxito', usuario: usuarioActualizado });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'No se pudo actualizar el perfil' });
    }
});

// Obtener los pedidos específicos de un usuario logueado (para "Mis Pedidos")
app.get('/api/usuarios/:email/ordenes', (req, res) => {
    try {
        const { email } = req.params;
        const ordenes = db.prepare('SELECT * FROM ordenes WHERE cliente_email = ? ORDER BY fecha DESC').all(email);
        
        const ordenesFormateadas = ordenes.map(o => ({
            ...o,
            items: JSON.parse(o.items_json || '[]')
        }));

        res.json(ordenesFormateadas);
    } catch (error) {
        console.error('Error al obtener pedidos del usuario:', error);
        res.status(500).json({ error: 'Error al consultar los pedidos' });
    }
});

// Endpoint temporal para ver todos los usuarios registrados
app.get('/api/admin/usuarios', (req, res) => {
    try {
        const usuarios = db.prepare('SELECT id, nombre, email, telefono, direccion, fecha_registro FROM usuarios').all();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar los usuarios' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});