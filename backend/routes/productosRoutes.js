const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary'); 
const { getProductos, crearProducto, actualizarProducto } = require('../controllers/productosController');

router.get('/productos', getProductos);
router.post('/admin/productos', upload.single('imagen'), crearProducto);

// NUEVO: Ahora la ruta de edición también acepta imágenes de Multer
router.patch('/admin/productos/:id', upload.single('imagen'), actualizarProducto);

module.exports = router;