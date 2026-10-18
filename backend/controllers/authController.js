/**
 * ============================================================================
 * CONTROLADOR DE AUTENTICACIÓN Y USUARIOS
 * ============================================================================
 * Maneja el registro de clientes, el inicio de sesión, la encriptación de 
 * contraseñas usando bcrypt y la actualización de los perfiles.
 */

const pool = require('../config/database');
const bcrypt = require('bcrypt');

// --- REGISTRAR NUEVO USUARIO ---
const register = async (req, res) => {
    try {
        const { nombre, email, password, telefono, direccion } = req.body;
        if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan campos obligatorios' });

        // Evitar correos duplicados
        const usuarioExistente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (usuarioExistente.rows.length > 0) return res.status(400).json({ error: 'El correo ya está registrado' });

        // Encriptar la contraseña antes de guardarla en PostgreSQL
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(`
            INSERT INTO usuarios (nombre, email, password, telefono, direccion) 
            VALUES ($1, $2, $3, $4, $5) RETURNING id
        `, [nombre, email, hashedPassword, telefono || '', direccion || '']);

        res.json({ success: true, usuario: { id: result.rows[0].id, nombre, email, telefono, direccion } });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar' });
    }
};

// --- INICIAR SESIÓN ---
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Buscamos al usuario por su correo
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuario = result.rows[0];

        if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas.' });

        // 2. Comparamos la contraseña enviada con la contraseña encriptada de la BD
        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) return res.status(401).json({ error: 'Credenciales incorrectas.' });

        // 3. Verificamos si es el administrador
        const esAdmin = email === 'admin@nutranuts.cl' || email === 'admin@nutranuts.cl';

        res.json({ success: true, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, telefono: usuario.telefono, direccion: usuario.direccion, es_admin: esAdmin } });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// --- ACTUALIZAR PERFIL DEL CLIENTE ---
const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, direccion, passwordActual, nuevoPassword } = req.body;
        
        const userRes = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        const usuario = userRes.rows[0];
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        let passwordFinal = usuario.password;
        
        // Si el cliente quiere cambiar su contraseña, primero validamos la antigua
        if (nuevoPassword) {
            const isValid = await bcrypt.compare(passwordActual, usuario.password);
            if (!isValid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
            
            // Encriptamos la nueva
            const salt = await bcrypt.genSalt(10);
            passwordFinal = await bcrypt.hash(nuevoPassword, salt);
        }

        await pool.query(`
            UPDATE usuarios SET nombre = $1, telefono = $2, direccion = $3, password = $4 WHERE id = $5
        `, [nombre || usuario.nombre, telefono ?? usuario.telefono, direccion ?? usuario.direccion, passwordFinal, id]);

        const updatedRes = await pool.query('SELECT id, nombre, email, telefono, direccion FROM usuarios WHERE id = $1', [id]);
        res.json({ success: true, usuario: updatedRes.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
};

// --- OBTENER TODOS LOS USUARIOS (Panel Admin) ---
const getUsuariosAdmin = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, email, telefono, direccion, fecha_registro FROM usuarios ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar' });
    }
};

module.exports = { register, login, updateProfile, getUsuariosAdmin };