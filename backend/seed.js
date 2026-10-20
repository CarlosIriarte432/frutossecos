require('dotenv').config();
const pool = require('./config/database');
const bcrypt = require('bcrypt');

async function ejecutarSeeder() {
    const client = await pool.connect();
    try {
        console.log('🌱 Iniciando la configuración de la Base de Datos...');
        await client.query('BEGIN');

        // 1. Crear Tablas
        console.log('📦 Creando tablas...');
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

        // 2. Insertar Administrador por defecto
        const adminEmail = 'admin@tienda.cl';
        const adminCheck = await client.query('SELECT id FROM usuarios WHERE email = $1', [adminEmail]);
        
        if (adminCheck.rows.length === 0) {
            console.log('👤 Creando usuario administrador por defecto...');
            const salt = await bcrypt.genSalt(10);
            const hashedPass = await bcrypt.hash('Admin123!', salt);
            
            await client.query(`
                INSERT INTO usuarios (nombre, email, password, telefono, direccion) 
                VALUES ($1, $2, $3, $4, $5)
            `, ['Administrador', adminEmail, hashedPass, '+56900000000', 'Sede Central']);
        }

        // 3. Insertar Productos de prueba
        const resCount = await client.query('SELECT COUNT(*) as count FROM productos');
        if (parseInt(resCount.rows[0].count, 10) === 0) {
            console.log('🛒 Insertando productos de prueba...');
            const productosIniciales = [
                ['Semillas de Chía', 'semillas', 2490, 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=600&q=80', 1, 15, 'Semillas orgánicas seleccionadas.'],
                ['Mix Energía', 'mixes', 3990, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80', 1, 8, 'Combinación perfecta para potenciar tu día.']
            ];

            for (const p of productosIniciales) {
                await client.query(
                    `INSERT INTO productos (nombre, categoria, precio, imagen, disponible, stock_unidades, descripcion) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    p
                );
            }
        }

        await client.query('COMMIT');
        console.log('✅ Base de datos configurada exitosamente.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error durante el Seeder:', e);
    } finally {
        client.release();
        process.exit(0); // Detenemos el script automáticamente al terminar
    }
}

ejecutarSeeder();