const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { applySaldoToDebt } = require('../services/billing');

const router = express.Router();

// GET /asistencias/:instanceId — listar asistencia de una instancia (todos los inscriptos + registro)
router.get('/:instanceId', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ga.alumno_id as student_id, p.nombre_completo as full_name,
              COALESCE(a.asistio, 0) as asistio
       FROM grupo_alumnos ga
       JOIN perfiles p ON ga.alumno_id = p.id
       JOIN grupos g ON ga.grupo_id = g.id
       LEFT JOIN asistencias a ON a.instancia_id = ? AND a.alumno_id = ga.alumno_id
       WHERE g.instancia_id = ?
       ORDER BY p.nombre_completo`,
      [req.params.instanceId, req.params.instanceId]
    );
    res.json({ attendance: rows });
  } catch (err) {
    console.error('Error listando asistencia:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /asistencias/:instanceId — registrar asistencia por lote [{student_id, asistio}]
// Para clases abiertas/extras: marcar "asistió" genera deuda pendiente (cobro por asistencia).
router.post('/:instanceId', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { attendance } = req.body;
  if (!Array.isArray(attendance) || attendance.length === 0) {
    return res.status(400).json({ error: 'Lista de asistencia requerida' });
  }

  try {
    // Obtener modalidad y precio de la instancia
    const [instRows] = await db.query('SELECT modalidad, precio FROM instancias_clases WHERE id = ?', [req.params.instanceId]);
    if (instRows.length === 0) {
      return res.status(404).json({ error: 'Instancia no encontrada' });
    }
    const { modalidad, precio } = instRows[0];

    for (const item of attendance) {
      if (!item.student_id) continue;
      await db.query(
        `INSERT INTO asistencias (alumno_id, instancia_id, asistio) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE asistio = VALUES(asistio), registrada_en = CURRENT_TIMESTAMP`,
        [item.student_id, req.params.instanceId, item.asistio ? 1 : 0]
      );

      // Deuda por asistencia si es clase abierta/extra y asistió
      if ((modalidad === 'abierta' || modalidad === 'extra') && item.asistio) {
        const tipo = modalidad === 'extra' ? 'clase_extra' : 'clase_abierta';
        const [existingDebt] = await db.query(
          'SELECT id FROM deudas WHERE alumno_id = ? AND instancia_id = ? AND tipo_deuda = ?',
          [item.student_id, req.params.instanceId, tipo]
        );
        if (existingDebt.length === 0) {
          const fechaStr = new Date().toISOString().slice(0, 7);
          const [dRes] = await db.query(
            `INSERT INTO deudas (alumno_id, instancia_id, tipo_deuda, mes_facturacion, monto, monto_pagado, estado)
             VALUES (?, ?, ?, ?, ?, 0, 'pendiente')`,
            [item.student_id, req.params.instanceId, tipo, fechaStr, precio]
          );
          // item 15: aplicar saldo a favor automáticamente
          await applySaldoToDebt(db, item.student_id, dRes.insertId);
        }
      }
    }
    res.json({ message: 'Asistencia registrada exitosamente' });
  } catch (err) {
    console.error('Error registrando asistencia:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;