const express = require('express');
const router = express.Router();

const { createPreference, webhook, getOrdenesAdmin, actualizarDespacho, getOrdenesUsuario } = require('../controllers/ordenesController');

// Definimos las URLs de la API para Órdenes y Pagos
router.post('/create-preference', createPreference);         // Inicia el pago
router.post('/webhook', webhook);                            // MP avisa que se pagó
router.get('/admin/ordenes', getOrdenesAdmin);               // Admin ve todos los pedidos
router.patch('/admin/ordenes/:id/despacho', actualizarDespacho); // Marcar como enviado
router.get('/usuarios/:email/ordenes', getOrdenesUsuario);   // Cliente ve sus pedidos pasados

module.exports = router;