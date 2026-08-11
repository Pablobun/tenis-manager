function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthDates(month) {
  const [year, monthIndex] = month.split('-').map(Number);
  const dates = [];
  const d = new Date(year, monthIndex - 1, 1);
  while (d.getMonth() === monthIndex - 1) {
    dates.push(formatDate(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function weekdayFor(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`);
  return (date.getDay() + 6) % 7;
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function generateForTemplate(connection, template, month) {
  const dates = getMonthDates(month).filter((d) => weekdayFor(d) === Number(template.day_of_week));

  for (const instance_date of dates) {
    await connection.execute(
      `INSERT IGNORE INTO class_instances
       (template_id, professor_id, instance_date, start_hour, end_hour, level, modality, max_students, price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [
        template.id,
        template.professor_id,
        instance_date,
        template.start_hour,
        template.end_hour,
        template.level || '',
        template.modality,
        template.max_students,
        template.price_per_class
      ]
    );
  }
}

async function updateFutureInPlace(connection, templateId, template) {
  await connection.execute(
    `UPDATE class_instances SET
       start_hour = ?, end_hour = ?, level = ?, modality = ?, max_students = ?, price = ?
     WHERE template_id = ? AND instance_date >= CURDATE()`,
    [
      template.start_hour,
      template.end_hour,
      template.level || '',
      template.modality,
      template.max_students,
      template.price_per_class,
      templateId
    ]
  );
}

async function cancelFuture(connection, templateId) {
  await connection.execute(
    `UPDATE class_instances SET status = 'cancelled'
     WHERE template_id = ? AND instance_date >= CURDATE() AND status = 'scheduled'`,
    [templateId]
  );
}

async function regenFuture(connection, template, month) {
  await connection.execute(
    `DELETE FROM class_instances
     WHERE template_id = ? AND instance_date >= CURDATE()`,
    [template.id]
  );
  await generateForTemplate(connection, template, month);
}

module.exports = {
  getMonthDates,
  weekdayFor,
  currentMonth,
  generateForTemplate,
  updateFutureInPlace,
  cancelFuture,
  regenFuture
};
