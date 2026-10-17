// scripts/config.js

// 1. El navegador revisa en qué URL estás actualmente
const esLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

// 2. Creamos un objeto global de configuración
const CONFIG = {
    // Si estás en tu PC (local), usa el localhost. Si estás en internet, usa Render.
    API_URL: esLocal 
        ? 'http://localhost:3000/api' 
        : 'https://frutossecos.onrender.com/api'
};