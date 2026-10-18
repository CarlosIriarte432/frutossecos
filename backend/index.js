/**
 * ============================================================================
 * NUTRANUTS - SERVIDOR BACKEND (BOILERPLATE MVC)
 * ============================================================================
 * Archivo principal. Configura Express, carga las variables de entorno (.env)
 * e inicializa las rutas separadas por módulos.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 1. Importar los módulos de rutas
const productosRoutes = require('./routes/productosRoutes');
const authRoutes      = require('./routes/authRoutes');
const ordenesRoutes   = require('./routes/ordenesRoutes');

// 2. Inicializar Express y Middlewares
const app = express();
app.use(express.json());
app.use(cors());

// 3. Conectar las rutas a la API bajo el prefijo '/api'
app.use('/api', productosRoutes);
app.use('/api', authRoutes);
app.use('/api', ordenesRoutes);

// 4. Levantar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
});