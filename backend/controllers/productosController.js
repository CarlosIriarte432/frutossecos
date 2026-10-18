/**
 * ============================================================================
 * CONTROLADOR DE PRODUCTOS
 * ============================================================================
 * Aquí se concentra toda la lógica relacionada con el inventario y el catálogo.
 * Este archivo se encarga de leer, crear y editar los frutos secos (o cualquier producto).
 */

const pool = require('../config/database');

// --- OBTENER TODOS LOS PRODUCTOS (Para la tienda pública) ---
const getProductos = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error en getProductos:', error);
        res.status(500).json({ error: 'Error al consultar productos' });
    }
};

// --- CREAR NUEVO PRODUCTO (Panel de Admin) ---
const crearProducto = async (req, res) => {
    try {
        const { nombre, precio, categoria, stock_unidades, imagen } = req.body;
        
        // Validación básica de seguridad
        if (!nombre || !precio || !categoria) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Lógica por defecto: Si no mandan stock, se asume 10. Si el stock es > 0, está disponible.
        const stock = stock_unidades !== undefined ? Number(stock_unidades) : 10;
        const dispo = stock > 0 ? 1 : 0;
        const imgUrl = imagen || 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80';

        const result = await pool.query(`
            INSERT INTO productos (nombre, precio, categoria, stock_unidades, disponible, imagen) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `, [nombre, Number(precio), categoria, stock, dispo, imgUrl]);

        res.json({ success: true, id: result.rows[0].id, message: 'Producto creado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el producto' });
    }
};

// --- ACTUALIZAR PRECIO/STOCK DE UN PRODUCTO (Panel de Admin) ---
const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { disponible, stock_unidades, precio } = req.body;

        // 1. Buscamos el producto actual para no sobreescribir datos en blanco
        const prodRes = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
        if (!prodRes.rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });

        // 2. Definimos los nuevos valores
        const nuevoStock = stock_unidades !== undefined ? Number(stock_unidades) : prodRes.rows[0].stock_unidades;
        const nuevoPrecio = precio !== undefined ? Number(precio) : prodRes.rows[0].precio;
        const estadoFinal = nuevoStock > 0 ? 1 : 0;

        // 3. Guardamos los cambios
        await pool.query(`
            UPDATE productos SET disponible = $1, stock_unidades = $2, precio = $3 WHERE id = $4
        `, [estadoFinal, nuevoStock, nuevoPrecio, id]);

        res.json({ success: true, message: 'Producto actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
};

// Exportamos las funciones para poder usarlas en las rutas
module.exports = { getProductos, crearProducto, actualizarProducto };