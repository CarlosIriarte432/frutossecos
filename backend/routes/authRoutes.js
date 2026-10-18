const express = require('express');
const router = express.Router();

const { register, login, updateProfile, getUsuariosAdmin } = require('../controllers/authController');

// Definimos las URLs de la API para Autenticación
router.post('/auth/register', register);         // Registro de cliente
router.post('/auth/login', login);               // Iniciar sesión
router.put('/auth/profile/:id', updateProfile);  // El cliente edita sus datos
router.get('/admin/usuarios', getUsuariosAdmin); // Admin ve lista de clientes

module.exports = router;