const express = require('express');
const router = express.Router();

// AQUÍ ESTÁ EL FIX: Agregamos 'reintentarPago' al final de esta lista de importación
const { 
    createPreference, 
    webhook, 
    getOrdenesAdmin, 
    actualizarDespacho, 
    getOrdenesUsuario, 
    reintentarPago 
} = require('../controllers/ordenesController');

// Definimos las URLs de la API para Órdenes y Pagos
router.post('/create-preference', createPreference);         
router.post('/webhook', webhook);                            
router.get('/admin/ordenes', getOrdenesAdmin);               
router.patch('/admin/ordenes/:id/despacho', actualizarDespacho); 
router.get('/usuarios/:email/ordenes', getOrdenesUsuario);   

// Nueva ruta para el flujo de "Pedro"
router.post('/reintentar-pago/:id', reintentarPago); 

module.exports = router;