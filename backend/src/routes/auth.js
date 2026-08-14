const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'ts_riverside_2026_secret';

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM perfiles WHERE email = ? AND activo = 1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      nombre_completo: user.nombre_completo,
      rol: user.rol,
      nivel: user.nivel
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.nombre_completo,
        role: user.rol,
        level: user.nivel
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Sesión cerrada exitosamente' });
});

// Me (perfil propio)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, email, nombre_completo, telefono, rol, nivel, saldo_a_favor FROM perfiles WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = rows[0];
    res.json({
      id: user.id,
      email: user.email,
      full_name: user.nombre_completo,
      phone: user.telefono,
      role: user.rol,
      level: user.nivel,
      saldo_a_favor: Number(user.saldo_a_favor)
    });
  } catch (err) {
    console.error('Error en /me:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cambiar contraseña propia (item 11): requiere la actual, verifica y hashea la nueva.
router.post('/change-password', authenticateToken, async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  if (!current_password || !new_password || !confirm_password) {
    return res.status(400).json({ error: 'Contraseña actual, nueva y confirmación requeridas' });
  }
  if (new_password !== confirm_password) {
    return res.status(400).json({ error: 'La nueva contraseña y su confirmación no coinciden' });
  }
  if (new_password.length < 4) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres' });
  }

  try {
    const [rows] = await db.query('SELECT password_hash FROM perfiles WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const match = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE perfiles SET password_hash = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error('Error en change-password:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Register (admin o auto)
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone, role, level } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, contraseña y nombre completo requeridos' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM perfiles WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userRole = role || 'alumno';
    const userLevel = level || null;

    const [result] = await db.query(
      'INSERT INTO perfiles (email, password_hash, nombre_completo, telefono, rol, nivel) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashed, full_name, phone || null, userRole, userLevel]
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      id: result.insertId
    });
  } catch (err) {
    console.error('Error en register:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
