const db = require('../db');

// Genera instancias para un mes dado (YYYY-MM) basándose en las plantillas activas
async function generateInstancesForMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  if (!year || !month) throw new Error('Formato de mes inválido (YYYY-MM)');

  // Obtener todas las plantillas activas
  const [templates] = await db.query(
    'SELECT * FROM plantillas_clases WHERE activa = 1'
  );

  let generatedCount = 0;

  // Calcular días del mes
  const daysInMonth = new Date(year, month, 0).getDate();

  for (const t of templates) {
    // dia_semana: 0 = Lunes, ..., 6 = Domingo en nuestra convención (ver dayOfweek)
    // En JS Date: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    // Mapeo JS day to nuestra convención (0=Lunes..6=Domingo): (jsDay + 6) % 7
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const jsDay = dateObj.getDay();
      const ourDay = (jsDay + 6) % 7;

      if (ourDay === t.dia_semana) {
        const yyyy = year;
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        try {
          const [res] = await db.query(
            `INSERT IGNORE INTO instancias_clases 
            (plantilla_id, profesor_id, fecha, hora_inicio, hora_fin, nivel, modalidad, cupo_maximo, precio, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'programada')`,
            [
              t.id,
              t.profesor_id,
              dateStr,
              t.hora_inicio,
              t.hora_fin,
              t.nivel || 'intermedio',
              t.modalidad,
              t.cupo_maximo,
              t.precio_por_clase
            ]
          );
          if (res.affectedRows > 0) {
            generatedCount++;
          }
        } catch (err) {
          console.error(`Error generando instancia para plantilla ${t.id} en fecha ${dateStr}:`, err);
        }
      }
    }
  }

  return generatedCount;
}

// Cancelar futuras instancias de una plantilla desactivada
async function cancelFutureInstances(templateId) {
  const today = new Date().toISOString().split('T')[0];
  await db.query(
    "UPDATE instancias_clases SET estado = 'cancelada' WHERE plantilla_id = ? AND fecha >= ? AND estado = 'programada'",
    [templateId, today]
  );
}

module.exports = {
  generateInstancesForMonth,
  cancelFutureInstances
};
