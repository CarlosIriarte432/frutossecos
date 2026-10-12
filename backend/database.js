const { Pool } = require('pg');

// Tu cadena de conexión directa de Neon
const connectionString = 'postgresql://neondb_owner:npg_80ZzScgRiEBe@ep-wild-base-b4qvvbuf-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});
// Función para inicializar las tablas y datos iniciales de forma asincrónica
async function inicializarBD() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Tabla de Usuarios
        await client.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                telefono TEXT,
                direccion TEXT,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Tabla de Productos
        await client.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id SERIAL PRIMARY KEY,
                nombre TEXT NOT NULL,
                categoria TEXT DEFAULT 'Snacks',
                precio INTEGER NOT NULL,
                imagen TEXT,
                disponible INTEGER DEFAULT 1,
                stock_unidades INTEGER DEFAULT 10,
                descripcion TEXT
            );
        `);

        // 3. Tabla de Órdenes (Incluye columna despachado por defecto)
        await client.query(`
            CREATE TABLE IF NOT EXISTS ordenes (
                id SERIAL PRIMARY KEY,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                cliente_nombre TEXT NOT NULL,
                cliente_telefono TEXT NOT NULL,
                cliente_direccion TEXT NOT NULL,
                cliente_email TEXT,
                total INTEGER NOT NULL,
                estado TEXT DEFAULT 'PAGADO',
                despachado INTEGER DEFAULT 0,
                items_json TEXT NOT NULL
            );
        `);

        await client.query('COMMIT');
        console.log('✅ Base de datos PostgreSQL verificada e inicializada.');

        // 4. Poblar datos iniciales si la tabla de productos está vacía
        const resCount = await pool.query('SELECT COUNT(*) as count FROM productos');
        if (parseInt(resCount.rows[0].count, 10) === 0) {
            const productosIniciales = [
                ['Semillas de Chía Orgánica 250g', 'semillas', 2490, 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=600&q=80', 1, 15, 'Semillas de chía orgánica seleccionada, alta en Omega 3 y fibra.'],
                ['Mix Energía Vital 400g', 'mixes', 3990, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80', 1, 8, 'Combinación perfecta de frutos secos y arándanos para potenciar tu día.'],
                ['Nueces Mariposa Premium 500g', 'frutos-secos', 5490, 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80', 1, 5, 'Nueces extra light de gran tamaño y frescura garantizada.'],
                ['Almendras Tostadas Nonpareil 500g', 'frutos-secos', 6200, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80', 1, 3, 'Almendras tostadas sin sal añadida, crujientes y deliciosas.']
            ];

            for (const p of productosIniciales) {
                await pool.query(
                    `INSERT INTO productos (nombre, categoria, precio, imagen, disponible, stock_unidades, descripcion) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    p
                );
            }
            console.log('📦 Productos iniciales cargados en PostgreSQL.');
        }

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error al inicializar PostgreSQL:', e);
    } finally {
        client.release();
    }
}

inicializarBD();

module.exports = pool;