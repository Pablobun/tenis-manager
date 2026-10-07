const nodemailer = require('nodemailer');

// =============================================
// Mailer — item 10 (cambios.txt): notificaciones por mail de subidas/bajas.
// Config por env: SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS,
// MAIL_FROM (default SMTP_USER). Sin configuración → envío desactivado
// silenciosamente (solo un log al arrancar, nunca rompe la respuesta).
// =============================================

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER;

const enabled = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
let warned = false;
let transporter = null;

if (enabled) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
} else if (!warned) {
  warned = true;
  console.log('[mailer] SMTP no configurado (SMTP_HOST/SMTP_USER/SMTP_PASS) — envío de mails desactivado.');
}

async function sendMail({ to, subject, text }) {
  if (!enabled || !to) return { skipped: true };
  try {
    await transporter.sendMail({ from: MAIL_FROM, to, subject, text });
    return { sent: true };
  } catch (err) {
    console.error('[mailer] Error enviando mail:', err.message);
    return { error: true };
  }
}

function fmtFecha(fecha) {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

function fmtHora(hora) {
  return (hora || '').slice(0, 5);
}

const MODALIDAD_LABEL = { fija: 'Clase fija', extra: 'Clase extra', abierta: 'Clase abierta' };

// Notificación de subida/baja de una clase.
// action: 'inscripcion' | 'baja'
// instance: { instance_date, start_hour, end_hour, nivel, modality, professor_name }
// student/profe: { email, nombre }
// actorEmail: quién ejecutó la acción (para no mandarle al profe aviso de su propia acción)
async function notifyClassChange({ action, instance, student, profe, actorEmail }) {
  if (!student || !student.email) return;
  const esBaja = action === 'baja';
  const titulo = esBaja ? 'Baja de clase' : 'Inscripción a clase';
  const clase = `${MODALIDAD_LABEL[instance.modality] || 'Clase'} · ${fmtFecha(instance.instance_date)} · ${fmtHora(instance.start_hour)}–${fmtHora(instance.end_hour)} hs · ${instance.professor_name || ''}`;

  await sendMail({
    to: student.email,
    subject: esBaja ? `Riverside Tenis — ${titulo}` : `Riverside Tenis — ${titulo}`,
    text: esBaja
      ? `Hola ${student.nombre},\n\nTu baja de la siguiente clase quedó registrada:\n${clase}\n\nSi fue un error, contactá a la profesora.\n\nTenis Riverside`
      : `Hola ${student.nombre},\n\nTu inscripción a la siguiente clase quedó confirmada:\n${clase}\n\nNos vemos en la cancha.\n\nTenis Riverside`
  });

  if (profe && profe.email && profe.email !== actorEmail) {
    await sendMail({
      to: profe.email,
      subject: `Riverside Tenis — ${esBaja ? 'Alumno se dio de baja' : 'Nueva inscripción'}`,
      text: esBaja
        ? `${student.nombre} se dio de baja de:\n${clase}\n`
        : `${student.nombre} fue inscripto/a en:\n${clase}\n`
    });
  }
}

module.exports = { sendMail, notifyClassChange };
