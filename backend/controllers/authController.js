/**
 * ============================================================================
 * CONTROLADOR DE AUTENTICACIÓN Y USUARIOS (BACKEND)
 * ============================================================================
 * Maneja el registro, inicio de sesión y perfiles en la base de datos.
 */

const pool = require('../config/database');
const bcrypt = require('bcrypt');

// --- REGISTRAR NUEVO USUARIO ---
const register = async (req, res) => {
    try {
        const { nombre, email, password, telefono, direccion } = req.body;
        if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan campos obligatorios' });

        const usuarioExistente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (usuarioExistente.rows.length > 0) return res.status(400).json({ error: 'El correo ya está registrado' });

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
        
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuario = result.rows[0];

        if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas.' });

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) return res.status(401).json({ error: 'Credenciales incorrectas.' });

        const esAdmin = email === 'admin@nutranuts.cl' || email === 'contacto@nutranuts.cl';

        res.json({ success: true, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, telefono: usuario.telefono, direccion: usuario.direccion, es_admin: esAdmin } });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// --- ACTUALIZAR PERFIL ---
const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, direccion, passwordActual, nuevoPassword } = req.body;
        
        const userRes = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        const usuario = userRes.rows[0];
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        let passwordFinal = usuario.password;
        
        if (nuevoPassword) {
            const isValid = await bcrypt.compare(passwordActual, usuario.password);
            if (!isValid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
            
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

// --- OBTENER USUARIOS (Panel Admin) ---
const getUsuariosAdmin = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, email, telefono, direccion, fecha_registro FROM usuarios ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar' });
    }
};

module.exports = { register, login, updateProfile, getUsuariosAdmin };