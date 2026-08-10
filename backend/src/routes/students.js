const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/students — Listar alumnos (admin/profesora)
router.get('/', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, full_name, phone, level, is_active, created_at FROM profiles WHERE role = ? ORDER BY full_name ASC',
      ['alumno']
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al listar alumnos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/students/:id — Ver alumno específico (admin/profesora)
router.get('/:id', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, full_name, phone, level, is_active, created_at FROM profiles WHERE id = ? AND role = ?',
      [req.params.id, 'alumno']
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error al obtener alumno:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/students — Crear alumno (admin/profesora)
router.post('/', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  const { email, password, full_name, phone, level } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, contraseña y nombre completo son requeridos' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO profiles (email, password_hash, full_name, phone, role, level) VALUES (?, ?, ?, ?, ?, ?)',
      [email, password_hash, full_name, phone || null, 'alumno', level || null]
    );

    res.status(201).json({
      message: 'Alumno creado exitosamente',
      studentId: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    console.error('Error al crear alumno:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/students/:id — Editar alumno (admin/profesora)
router.put('/:id', authenticate, authorize('admin', 'profesor'), async (req, res) => {
  const { full_name, phone, level, is_active } = req.body;
  const studentId = req.params.id;

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM profiles WHERE id = ? AND role = ?',
      [studentId, 'alumno']
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    await pool.execute(
      'UPDATE profiles SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), level = COALESCE(?, level), is_active = COALESCE(?, is_active), updated_at = NOW() WHERE id = ?',
      [full_name || null, phone || null, level || null, is_active !== undefined ? is_active : null, studentId]
    );

    res.status(200).json({ message: 'Alumno actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar alumno:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/students/profile — Alumno edita su propio perfil (solo nombre y teléfono)
router.put('/profile', authenticate, authorize('alumno'), async (req, res) => {
  const { full_name, phone } = req.body;

  try {
    await pool.execute(
      'UPDATE profiles SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), updated_at = NOW() WHERE id = ?',
      [full_name || null, phone || null, req.user.id]
    );

    res.status(200).json({ message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
