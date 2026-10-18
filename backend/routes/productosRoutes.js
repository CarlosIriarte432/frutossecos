const express = require('express');
const router = express.Router();

// Importamos las funciones desde el controlador
const { getProductos, crearProducto, actualizarProducto } = require('../controllers/productosController');

// Definimos las URLs de la API para Productos
router.get('/productos', getProductos);                  // Catálogo público
router.post('/admin/productos', crearProducto);          // Admin crea producto
router.patch('/admin/productos/:id', actualizarProducto);// Admin edita stock/precio

module.exports = router;