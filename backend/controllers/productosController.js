const pool = require('../config/database');

// --- OBTENER TODOS LOS PRODUCTOS ---
const getProductos = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error en getProductos:', error);
        res.status(500).json({ error: 'Error al consultar productos' });
    }
};

// --- CREAR NUEVO PRODUCTO ---
const crearProducto = async (req, res) => {
    try {
        const { nombre, precio, categoria, stock_unidades, descripcion } = req.body;
        
        if (!nombre || !precio || !categoria) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const stock = stock_unidades !== undefined ? Number(stock_unidades) : 10;
        const dispo = stock > 0 ? 1 : 0;
        const imgUrl = req.file ? req.file.path : 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80';
        const desc = descripcion || 'Producto 100% natural seleccionado cuidadosamente para mantener toda su frescura y calidad.';

        const result = await pool.query(`
            INSERT INTO productos (nombre, precio, categoria, stock_unidades, disponible, imagen, descripcion) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
        `, [nombre, Number(precio), categoria, stock, dispo, imgUrl, desc]);

        res.json({ success: true, id: result.rows[0].id, message: 'Producto creado' });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear el producto' });
    }
};

// --- EDITAR PRODUCTO COMPLETO ---
const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, categoria, stock_unidades, descripcion } = req.body;

        const prodRes = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
        if (!prodRes.rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
        
        const p = prodRes.rows[0];

        // Mantenemos el dato antiguo si no se envió uno nuevo
        const nuevoNombre = nombre || p.nombre;
        const nuevoPrecio = precio !== undefined ? Number(precio) : p.precio;
        const nuevaCategoria = categoria || p.categoria;
        const nuevoStock = stock_unidades !== undefined ? Number(stock_unidades) : p.stock_unidades;
        const nuevaDesc = descripcion || p.descripcion;
        const nuevoEstado = nuevoStock > 0 ? 1 : 0;
        
        // Si hay archivo nuevo (Cloudinary), usamos esa URL. Si no, dejamos la que ya estaba.
        const nuevaImg = req.file ? req.file.path : p.imagen;

        await pool.query(`
            UPDATE productos 
            SET nombre = $1, precio = $2, categoria = $3, stock_unidades = $4, disponible = $5, imagen = $6, descripcion = $7 
            WHERE id = $8
        `, [nuevoNombre, nuevoPrecio, nuevaCategoria, nuevoStock, nuevoEstado, nuevaImg, nuevaDesc, id]);

        res.json({ success: true, message: 'Producto actualizado' });
    } catch (error) {
        console.error('Error al actualizar:', error);
        res.status(500).json({ error: 'Error al actualizar' });
    }
};

module.exports = { getProductos, crearProducto, actualizarProducto };