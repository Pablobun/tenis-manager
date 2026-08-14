const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET /pagos/student/:id — historial de pagos de un alumno + desglose de deuda por mes.
// Accesible para el propio alumno o admin/profesor.
function canViewStudent(req, studentId) {
  return req.user.rol === 'alumno' ? Number(req.user.id) === Number(studentId) : true;
}

// Pago individual: más reciente deuda pendiente del alumno, o deuda_id explícito.
// item 15: si el pago supera el saldo de la deuda, el excedente va a saldo_a_favor del alumno.
async function applyPayment(alumnoId, monto, fecha, deudaId, registradoPor, nota, client = db) {
  // Determinar deuda a la que aplicar
  let targetDeudaId = deudaId || null;
  if (!targetDeudaId) {
    const [rd] = await client.query(
      `SELECT id FROM deudas WHERE alumno_id = ? AND estado IN ('pendiente', 'parcial')
       ORDER BY mes_facturacion ASC, id ASC LIMIT 1`,
      [alumnoId]
    );
    if (rd.length > 0) targetDeudaId = rd[0].id;
  }

  let aplicado = Number(monto);
  let saldoAFavor = 0;

  if (targetDeudaId) {
    const [deudaRows] = await client.query('SELECT monto, monto_pagado FROM deudas WHERE id = ?', [targetDeudaId]);
    if (deudaRows.length > 0) {
      const pendiente = Number(deudaRows[0].monto) - Number(deudaRows[0].monto_pagado);
      if (aplicado > pendiente) {
        saldoAFavor = aplicado - pendiente;
        aplicado = pendiente;
      }
    }
  } else {
    // Sin deuda pendiente: el pago completo es saldo a favor (no hay pago huérfano)
    saldoAFavor = aplicado;
    aplicado = 0;
  }

  // Insertar pago (monto total registrado; el excedente va al saldo a favor)
  const [pRes] = await client.query(
    'INSERT INTO pagos (alumno_id, deuda_id, monto, fecha_pago, nota, registrado_por) VALUES (?, ?, ?, ?, ?, ?)',
    [alumnoId, targetDeudaId, monto, fecha, nota || null, registradoPor]
  );

  // Actualizar monto_pagado de la deuda y su estado
  if (aplicado > 0 && targetDeudaId) {
    await client.query('UPDATE deudas SET monto_pagado = monto_pagado + ? WHERE id = ?', [aplicado, targetDeudaId]);
    await client.query(
      `UPDATE deudas SET estado = CASE
         WHEN monto_pagado >= monto THEN 'pagada'
         ELSE 'parcial'
       END WHERE id = ?`,
      [targetDeudaId]
    );
  }

  // Sumar el excedente al saldo a favor
  if (saldoAFavor > 0) {
    await client.query('UPDATE perfiles SET saldo_a_favor = saldo_a_favor + ? WHERE id = ?', [saldoAFavor, alumnoId]);
  }

  return { paymentId: pRes.insertId, deudaId: targetDeudaId, saldo_a_favor: saldoAFavor };
}

// POST /pagos — pago individual { alumno_id, monto, fecha, deuda_id?, nota? }
router.post('/', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { alumno_id, monto, fecha, deuda_id, nota } = req.body;
  if (!alumno_id || monto === undefined || Number(monto) <= 0) {
    return res.status(400).json({ error: 'alumno_id y monto (mayor a 0) requeridos' });
  }
  if (!fecha) {
    return res.status(400).json({ error: 'Fecha de pago requerida (YYYY-MM-DD)' });
  }

  try {
    const result = await applyPayment(alumno_id, Number(monto), fecha, deuda_id, req.user.id, nota);
    res.status(201).json({ message: 'Pago registrado exitosamente', ...result });
  } catch (err) {
    console.error('Error registrando pago:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /pagos/batch — pago por lote { items: [{ alumno_id, monto }], fecha, nota? }
// mismo monto por defecto: si se manda monto global y lista de alumno_ids.
router.post('/batch', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { fecha, nota, monto_global, alumno_ids, items } = req.body;
  if (!fecha) {
    return res.status(400).json({ error: 'Fecha de pago requerida (YYYY-MM-DD)' });
  }

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    let batch = [];
    if (Array.isArray(items) && items.length > 0) {
      batch = items;
    } else if (monto_global !== undefined && Array.isArray(alumno_ids) && alumno_ids.length > 0) {
      batch = alumno_ids.map((id) => ({ alumno_id: id, monto: Number(monto_global) }));
    } else {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Enviá items (lista) o monto_global + alumno_ids' });
    }

    const results = [];
    for (const item of batch) {
      if (!item.alumno_id || item.monto === undefined || Number(item.monto) <= 0) continue;
      const r = await applyPayment(item.alumno_id, Number(item.monto), fecha, item.deuda_id, req.user.id, nota || item.nota, connection);
      results.push({ alumno_id: item.alumno_id, ...r });
    }

    await connection.commit();
    connection.release();
    res.status(201).json({ message: `Se registraron ${results.length} pagos`, results });
  } catch (err) {
    console.error('Error registrando pagos por lote:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /pagos/student/:id?month=YYYY-MM — historial de pagos de un alumno + desglose de deuda por mes
router.get('/student/:id', authenticateToken, async (req, res) => {
  try {
    if (!canViewStudent(req, req.params.id)) {
      return res.status(403).json({ error: 'No podés ver la información de otro alumno' });
    }

    const [payments] = await db.query(
      `SELECT id, deuda_id, monto, fecha_pago as fecha, nota, creado_en as registrada_en
       FROM pagos WHERE alumno_id = ? ORDER BY fecha_pago DESC`,
      [req.params.id]
    );

    const [debts] = await db.query(
      `SELECT id, tipo_deuda as tipo, mes_facturacion as mes, monto, monto_pagado,
              (monto - monto_pagado) as saldo, estado as status
       FROM deudas WHERE alumno_id = ?
       ORDER BY mes_facturacion DESC, id DESC`,
      [req.params.id]
    );

    const [perfilRows] = await db.query(
      'SELECT COALESCE(saldo_a_favor, 0) as saldo FROM perfiles WHERE id = ?',
      [req.params.id]
    );
    const saldoAFavor = Number(perfilRows[0].saldo);

    const totalBruto = debts.reduce((acc, d) => acc + Number(d.saldo), 0);
    const total = totalBruto - saldoAFavor;

    res.json({ payments, debts, total, saldo_a_favor: saldoAFavor });
  } catch (err) {
    console.error('Error obteniendo pagos del alumno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /pagos/summary?date=YYYY-MM-DD — resumen global de pagos por día
router.get('/summary', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { date } = req.query; // opcional: filtra por día
  try {
    let query = `
      SELECT p.fecha_pago as fecha, a.nombre_completo as full_name, a.id as alumno_id,
             p.monto, p.nota
      FROM pagos p
      JOIN perfiles a ON p.alumno_id = a.id
    `;
    const params = [];
    if (date) {
      query += ' WHERE p.fecha_pago = ?';
      params.push(date);
    }
    query += ' ORDER BY p.fecha_pago DESC, p.id DESC';
    const [rows] = await db.query(query, params);

    const byDate = {};
    for (const r of rows) {
      if (!byDate[r.fecha]) byDate[r.fecha] = { total: 0, payments: [] };
      byDate[r.fecha].total += Number(r.monto);
      byDate[r.fecha].payments.push(r);
    }

    res.json({ summary: byDate });
  } catch (err) {
    console.error('Error en resumen de pagos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;