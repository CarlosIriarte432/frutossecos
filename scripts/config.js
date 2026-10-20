// scripts/config.js

// Verifica si la página se está ejecutando en local
const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

// Asigna la URL del backend dinámicamente
const API_URL = isLocalhost 
    ? 'http://localhost:3000/api' 
    : 'https://frutossecos.onrender.com/api';

// Configuración Global
const CONFIG = {
    API_URL: API_URL,
    // AQUÍ DEBES PEGAR TU TOKEN DE LOCATIONIQ
    LOCATIONIQ_API_KEY: 'pk.7d6d2ec03fd7203f1bf7ae10b670456a' // <--- Reemplaza por tu token real
};