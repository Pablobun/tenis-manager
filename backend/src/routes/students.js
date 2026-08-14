const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Listar alumnos (admin/profesor)
router.get('/', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, email, nombre_completo as full_name, telefono as phone, rol as role, nivel as level, activo as active, saldo_a_favor as balance_favor FROM perfiles WHERE rol = 'alumno' ORDER BY nombre_completo"
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando alumnos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Listar profesores (para el selector "Profesor/a" — item 6). El admin no figura.
router.get('/profesores', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nombre_completo as full_name FROM perfiles WHERE rol = 'profesor' AND activo = 1 ORDER BY nombre_completo"
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando profesores:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener un alumno por id
router.get('/:id', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, email, nombre_completo as full_name, telefono as phone, rol as role, nivel as level, activo as active, saldo_a_favor as balance_favor FROM perfiles WHERE id = ? AND rol = 'alumno'",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error obteniendo alumno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear alumno
router.post('/', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { email, password, full_name, phone, level } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, contraseña y nombre completo son requeridos' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM perfiles WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO perfiles (email, password_hash, nombre_completo, telefono, rol, nivel) VALUES (?, ?, ?, ?, 'alumno', ?)",
      [email, hashed, full_name, phone || null, level || null]
    );

    res.status(201).json({
      message: 'Alumno creado exitosamente',
      id: result.insertId
    });
  } catch (err) {
    console.error('Error creando alumno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar perfil propio (alumno) — ANTES de /:id para no chocar con la ruta paramétrica
router.put('/profile', authenticateToken, async (req, res) => {
  const { full_name, phone } = req.body;
  try {
    await db.query(
      'UPDATE perfiles SET nombre_completo = COALESCE(?, nombre_completo), telefono = COALESCE(?, telefono) WHERE id = ?',
      [full_name, phone, req.user.id]
    );
    res.json({ message: 'Perfil actualizado exitosamente' });
  } catch (err) {
    console.error('Error actualizando perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar alumno (admin/profesor). Acepta password opcional (reset — item 11).
// Si cambia el nivel, informa las clases futuras con nivel discrepante (item 12, solo informa).
router.put('/:id', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { full_name, phone, level, active, password } = req.body;
  const alumnoId = req.params.id;
  try {
    const [rows] = await db.query(
      "SELECT nivel, activo FROM perfiles WHERE id = ? AND rol = 'alumno'",
      [alumnoId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    const currentLevel = rows[0].nivel;
    const nivelNuevo = level !== undefined ? level : null;

    await db.query(
      'UPDATE perfiles SET nombre_completo = COALESCE(?, nombre_completo), telefono = COALESCE(?, telefono), nivel = COALESCE(?, nivel), activo = COALESCE(?, activo) WHERE id = ? AND rol = \'alumno\'',
      [full_name, phone, level, active, alumnoId]
    );

    // Reset de contraseña (hasheada, sin pedir la actual) — item 11
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await db.query('UPDATE perfiles SET password_hash = ? WHERE id = ?', [hashed, alumnoId]);
    }

    // item 12: si cambió el nivel, listar clases futuras inscriptas con nivel discrepante (solo informa)
    let warning = null;
    if (level !== undefined && String(currentLevel) !== String(nivelNuevo)) {
      const [discrepantes] = await db.query(
        `SELECT i.id, i.fecha as instance_date, i.hora_inicio as start_hour, i.nivel as class_level
         FROM grupo_alumnos ga
         JOIN grupos g ON ga.grupo_id = g.id
         JOIN instancias_clases i ON g.instancia_id = i.id
         WHERE ga.alumno_id = ? AND i.fecha >= CURDATE() AND i.estado = 'programada'
           AND NOT (i.nivel <=> ?)`,
        [alumnoId, nivelNuevo]
      );
      warning = {
        message: `Se cambiaron ${discrepantes.length} clases donde el alumno queda con nivel discrepante.`,
        classes: discrepantes
      };
    }

    res.json({ message: 'Alumno actualizado exitosamente', warning });
  } catch (err) {
    console.error('Error actualizando alumno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
