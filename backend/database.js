const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'nutranuts.db'));
db.pragma('foreign_keys = ON');

// 1. Tabla de Productos con stock numérico real
db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT DEFAULT 'Snacks',
        precio INTEGER NOT NULL,
        imagen TEXT,
        disponible INTEGER DEFAULT 1,
        stock_unidades INTEGER DEFAULT 10,
        descripcion TEXT
    );
`);

// 2. Tabla de Órdenes / Ventas con datos del cliente invitado
db.exec(`
    CREATE TABLE IF NOT EXISTS ordenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        cliente_nombre TEXT NOT NULL,
        cliente_telefono TEXT NOT NULL,
        cliente_direccion TEXT NOT NULL,
        cliente_email TEXT,
        total INTEGER NOT NULL,
        estado TEXT DEFAULT 'PAGADO',
        items_json TEXT NOT NULL
    );
`);

// 3. Poblar datos iniciales si la tabla está vacía
const checkProducts = db.prepare('SELECT COUNT(*) as count FROM productos').get();

if (checkProducts.count === 0) {
    const insertProduct = db.prepare(`
        INSERT INTO productos (nombre, categoria, precio, imagen, disponible, stock_unidades, descripcion)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const productosIniciales = [
        {
            nombre: 'Semillas de Chía Orgánica 250g',
            categoria: 'semillas',
            precio: 2490,
            imagen: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=600&q=80',
            disponible: 1,
            stock_unidades: 15,
            descripcion: 'Semillas de chía orgánica seleccionada, alta en Omega 3 y fibra.'
        },
        {
            nombre: 'Mix Energía Vital 400g',
            categoria: 'mixes',
            precio: 3990,
            imagen: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
            disponible: 1,
            stock_unidades: 8,
            descripcion: 'Combinación perfecta de frutos secos y arándanos para potenciar tu día.'
        },
        {
            nombre: 'Nueces Mariposa Premium 500g',
            categoria: 'frutos-secos',
            precio: 5490,
            imagen: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80',
            disponible: 1,
            stock_unidades: 5,
            descripcion: 'Nueces extra light de gran tamaño y frescura garantizada.'
        },
        {
            nombre: 'Almendras Tostadas Nonpareil 500g',
            categoria: 'frutos-secos',
            precio: 6200,
            imagen: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80',
            disponible: 1,
            stock_unidades: 3, // Poquitas para probar el auto-agotado
            descripcion: 'Almendras tostadas sin sal añadida, crujientes y deliciosas.'
        }
    ];

    const insertMany = db.transaction((items) => {
        for (const item of items) {
            insertProduct.run(
                item.nombre, 
                item.categoria, 
                item.precio, 
                item.imagen, 
                item.disponible, 
                item.stock_unidades, 
                item.descripcion
            );
        }
    });

    insertMany(productosIniciales);
    console.log('📦 Base de datos inicializada con stock numérico.');
}

module.exports = db;