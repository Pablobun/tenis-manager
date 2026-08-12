const db = require('../db');

// Genera la deuda inmediata al inscribir a un alumno en una clase (fija/abierta/extra).
// Para fijas → mensualidad por la instancia. Para abierta/extra → por asistencia (clase_abierta/clase_extra).
async function ensureDebtForEnrollment(client, alumnoId, instanceId) {
  const [instRows] = await client.query(
    'SELECT id, modalidad, precio, fecha FROM instancias_clases WHERE id = ?',
    [instanceId]
  );
  if (instRows.length === 0) return;

  const inst = instRows[0];
  const mes = inst.fecha.toISOString().slice(0, 7);

  if (inst.modalidad === 'fija') {
    // Mensualidad: una deuda por (alumno, instancia). Si ya existe, no duplicar.
    const [existing] = await client.query(
      "SELECT id FROM deudas WHERE alumno_id = ? AND instancia_id = ? AND tipo_deuda = 'mensualidad'",
      [alumnoId, instanceId]
    );
    if (existing.length === 0) {
      await client.query(
        `INSERT INTO deudas (alumno_id, instancia_id, tipo_deuda, mes_facturacion, monto, monto_pagado, estado)
         VALUES (?, ?, 'mensualidad', ?, ?, 0, 'pendiente')`,
        [alumnoId, instanceId, mes, inst.precio]
      );
    }
    return;
  }

  // abierta / extra → cobro por asistencia, se genera la deuda al registrar asistencia.
  return;
}

module.exports = { ensureDebtForEnrollment };