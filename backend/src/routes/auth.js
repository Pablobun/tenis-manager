const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, email, password_hash, full_name, role FROM profiles WHERE email = ? AND is_active = 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout exitoso' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, full_name, phone, role, level FROM profiles WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/register (solo admin puede crear usuarios)
router.post('/register', authenticate, authorize('admin'), async (req, res) => {
  const { email, password, full_name, phone, role, level } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Email, contraseña, nombre completo y rol son requeridos' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO profiles (email, password_hash, full_name, phone, role, level) VALUES (?, ?, ?, ?, ?, ?)',
      [email, password_hash, full_name, phone || null, role, level || null]
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      userId: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/auth/password (cambiar contraseña propia)
router.put('/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Contraseña actual y nueva contraseña son requeridas' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT password_hash FROM profiles WHERE id = ?',
      [req.user.id]
    );

    const validPassword = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE profiles SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [newHash, req.user.id]
    );

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
