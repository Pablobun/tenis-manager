const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Cálculo de la deuda mensual propuesta para un mes (sin escribir):
// para cada alumno inscripto en clases fijas del mes, la suma de precios de sus instancias.
function monthRange(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const start = `${yearMonth}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

async function computeMonthlyBilling(yearMonth) {
  const { start, end } = monthRange(yearMonth);
  const [rows] = await db.query(
    `SELECT a.id as alumno_id, a.nombre_completo as full_name,
            SUM(i.precio) as monto,
            COUNT(DISTINCT i.id) as clases
     FROM grupo_alumnos ga
     JOIN grupos g ON ga.grupo_id = g.id
     JOIN instancias_clases i ON g.instancia_id = i.id
     JOIN perfiles a ON ga.alumno_id = a.id
     WHERE i.modalidad = 'fija'
       AND i.fecha BETWEEN ? AND ?
       AND i.estado <> 'cancelada'
     GROUP BY a.id, a.nombre_completo
     ORDER BY a.nombre_completo`,
    [start, end]
  );
  return rows;
}

// GET /billing/preview?month=YYYY-MM — deuda propuesta del mes (semi-automática, profe aprueba/ajusta)
router.get('/preview', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ error: 'Parámetro month requerido (YYYY-MM)' });
  }
  try {
    const items = await computeMonthlyBilling(month);

    // Marcar cuáles alumnos ya tienen deuda generada para el mes (para no duplicar)
    const [existing] = await db.query(
      'SELECT alumno_id FROM deudas WHERE mes_facturacion = ?',
      [month]
    );
    const existingSet = new Set(existing.map((r) => String(r.alumno_id)));

    const preview = items.map((it) => ({
      alumno_id: it.alumno_id,
      full_name: it.full_name,
      clases: it.clases,
      monto: Number(it.monto),
      generated: existingSet.has(String(it.alumno_id))
    }));

    res.json({ month, items: preview });
  } catch (err) {
    console.error('Error calculando preview de facturación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /billing/debtors?month=YYYY-MM — alumnos con deuda sin pagar del mes (apertura de mes)
router.get('/debtors', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ error: 'Parámetro month requerido (YYYY-MM)' });
  }
  try {
    const [rows] = await db.query(
      `SELECT a.id as alumno_id, a.nombre_completo as full_name,
              COALESCE(SUM(d.monto - d.monto_pagado), 0) as balance
       FROM deudas d
       JOIN perfiles a ON d.alumno_id = a.id
       WHERE d.mes_facturacion = ? AND d.estado IN ('pendiente', 'parcial') AND d.estado <> 'anulada'
       GROUP BY a.id, a.nombre_completo
       HAVING balance > 0
       ORDER BY a.nombre_completo`,
      [month]
    );
    res.json({ month, debtors: rows });
  } catch (err) {
    console.error('Error listando deudores:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /billing/generate?month=YYYY-MM — genera deudas de mensualidad para el mes (solo alumnos aún sin deuda)
router.post('/generate', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ error: 'Parámetro month requerido (YYYY-MM)' });
  }

  try {
    const items = await computeMonthlyBilling(month);

    const [existing] = await db.query('SELECT alumno_id FROM deudas WHERE mes_facturacion = ?', [month]);
    const existingSet = new Set(existing.map((r) => String(r.alumno_id)));

    const [cicloRows] = await db.query('SELECT id FROM ciclos_facturacion WHERE mes_anio = ?', [month]);
    let cicloId = null;
    if (cicloRows.length === 0) {
      const [cRes] = await db.query(
        'INSERT INTO ciclos_facturacion (mes_anio, estado, abierto_en) VALUES (?, \'abierto\', NOW())',
        [month]
      );
      cicloId = cRes.insertId;
    } else {
      cicloId = cicloRows[0].id;
    }

    let created = 0;
    for (const item of items) {
      if (existingSet.has(String(item.alumno_id))) continue;
      // Deuda por mes (mensualidad). Se vincula al ciclo y grupo; sin instancia única (mes completo).
      await db.query(
        `INSERT INTO deudas (alumno_id, tipo_deuda, mes_facturacion, monto, monto_pagado, estado)
         VALUES (?, 'mensualidad', ?, ?, 0, 'pendiente')`,
        [item.alumno_id, month, item.monto]
      );
      created++;
    }

    res.json({ message: `Facturación generada para ${month}. Se crearon ${created} deudas nuevas.`, created });
  } catch (err) {
    console.error('Error generando facturación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /billing/adjust — ajustar monto de una deuda específica (profe ajusta antes/después de confirmar)
router.put('/adjust/:deudaId', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { monto } = req.body;
  if (monto === undefined || Number(monto) < 0) {
    return res.status(400).json({ error: 'Monto inválido' });
  }
  try {
    await db.query('UPDATE deudas SET monto = ? WHERE id = ?', [Number(monto), req.params.deudaId]);
    res.json({ message: 'Deuda ajustada exitosamente' });
  } catch (err) {
    console.error('Error ajustando deuda:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /billing/open?month=YYYY-MM — apertura de mes: cierra ciclo anterior y abre el nuevo
router.post('/open', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { month } = req.body;
  if (!month) {
    return res.status(400).json({ error: 'Mes requerido (YYYY-MM)' });
  }
  try {
    // Cerrar ciclos anteriores abiertos
    await db.query(
      "UPDATE ciclos_facturacion SET estado = 'cerrado', cerrado_en = NOW() WHERE estado = 'abierto' AND mes_anio < ?",
      [month]
    );

    // Abrir (o reabrir) el ciclo del mes
    const [cicloRows] = await db.query('SELECT id FROM ciclos_facturacion WHERE mes_anio = ?', [month]);
    if (cicloRows.length === 0) {
      await db.query(
        "INSERT INTO ciclos_facturacion (mes_anio, estado, abierto_en) VALUES (?, 'abierto', NOW())",
        [month]
      );
    } else {
      await db.query("UPDATE ciclos_facturacion SET estado = 'abierto', abierto_en = COALESCE(abierto_en, NOW()), cerrado_en = NULL WHERE mes_anio = ?", [month]);
    }

    // Traer los deudores para que la profe decida
    const debtors = await getDebtors(month);
    res.json({ message: `Mes ${month} abierto`, debtors });
  } catch (err) {
    console.error('Error abriendo mes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /billing/release-slots — liberar cupos de alumnos sin pagar: los quita de las instancias fijas del mes
router.post('/release-slots', authenticateToken, authorizeRoles('admin', 'profesor'), async (req, res) => {
  const { month, alumno_id } = req.body;
  if (!month || !alumno_id) {
    return res.status(400).json({ error: 'month y alumno_id requeridos' });
  }
  try {
    const { start, end } = monthRange(month);
    // Quitar al alumno de los grupos de todas las instancias fijas del mes
    const [result] = await db.query(
      `DELETE ga FROM grupo_alumnos ga
       JOIN grupos g ON ga.grupo_id = g.id
       JOIN instancias_clases i ON g.instancia_id = i.id
       WHERE ga.alumno_id = ? AND i.modalidad = 'fija' AND i.fecha BETWEEN ? AND ?`,
      [alumno_id, start, end]
    );

    // Anular las deudas de mensualidad del mes que quedan si el alumno ya no tiene clases (parcial)
    res.json({ message: 'Cupos liberados para el alumno. Revisá sus deudas del mes.', removed: result.affectedRows });
  } catch (err) {
    console.error('Error liberando cupos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

async function getDebtors(month) {
  const [rows] = await db.query(
    `SELECT a.id as alumno_id, a.nombre_completo as full_name,
            COALESCE(SUM(d.monto - d.monto_pagado), 0) as balance
     FROM deudas d
     JOIN perfiles a ON d.alumno_id = a.id
     WHERE d.mes_facturacion = ? AND d.estado IN ('pendiente', 'parcial')
     GROUP BY a.id, a.nombre_completo
     HAVING balance > 0`,
    [month]
  );
  return rows;
}

module.exports = router;