const db = require('../db');

// Aplica el saldo a favor del alumno a una deuda recién creada (item 15).
// Reduce el saldo pendiente de la deuda y actualiza su estado; devuelve cuánto se aplicó.
async function applySaldoToDebt(client, alumnoId, deudaId) {
  const [alumnoRows] = await client.query(
    'SELECT saldo_a_favor FROM perfiles WHERE id = ?',
    [alumnoId]
  );
  if (alumnoRows.length === 0) return 0;

  const saldo = Number(alumnoRows[0].saldo_a_favor);
  if (saldo <= 0) return 0;

  const [deudaRows] = await client.query(
    'SELECT monto, monto_pagado FROM deudas WHERE id = ?',
    [deudaId]
  );
  if (deudaRows.length === 0) return 0;

  const deuda = deudaRows[0];
  const pendiente = Number(deuda.monto) - Number(deuda.monto_pagado);
  if (pendiente <= 0) return 0;

  const aplicado = Math.min(saldo, pendiente);
  await client.query('UPDATE deudas SET monto_pagado = monto_pagado + ? WHERE id = ?', [aplicado, deudaId]);
  await client.query(
    `UPDATE deudas SET estado = CASE
       WHEN monto_pagado >= monto THEN 'pagada'
       ELSE 'parcial'
     END WHERE id = ?`,
    [deudaId]
  );
  await client.query('UPDATE perfiles SET saldo_a_favor = saldo_a_favor - ? WHERE id = ?', [aplicado, alumnoId]);

  return aplicado;
}

// Genera la deuda inmediata al inscribir a un alumno en una clase (fija/abierta/extra).
// Para fijas → mensualidad por la instancia. Para abierta/extra → por asistencia (clase_abierta/clase_extra).
async function ensureDebtForEnrollment(client, alumnoId, instanceId) {
  const [instRows] = await client.query(
    'SELECT id, modalidad, precio, fecha FROM instancias_clases WHERE id = ?',
    [instanceId]
  );
  if (instRows.length === 0) return;

  const inst = instRows[0];
  const mes = inst.fecha.slice(0, 7);

  if (inst.modalidad === 'fija') {
    // Mensualidad: una deuda por (alumno, instancia). Si ya existe, no duplicar.
    const [existing] = await client.query(
      "SELECT id FROM deudas WHERE alumno_id = ? AND instancia_id = ? AND tipo_deuda = 'mensualidad'",
      [alumnoId, instanceId]
    );
    if (existing.length === 0) {
      const [dRes] = await client.query(
        `INSERT INTO deudas (alumno_id, instancia_id, tipo_deuda, mes_facturacion, monto, monto_pagado, estado)
         VALUES (?, ?, 'mensualidad', ?, ?, 0, 'pendiente')`,
        [alumnoId, instanceId, mes, inst.precio]
      );
      // item 15: aplicar saldo a favor automáticamente
      await applySaldoToDebt(client, alumnoId, dRes.insertId);
    }
    return;
  }

  // abierta / extra → cobro por asistencia, se genera la deuda al registrar asistencia.
  return;
}

module.exports = { ensureDebtForEnrollment, applySaldoToDebt };