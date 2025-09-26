import nodemailer from 'nodemailer';
import config from '../config/index.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) return null;
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) return { ok: false, skipped: true };
  const info = await t.sendMail({ from: config.smtp.from, to, subject, text, html });
  return { ok: true, messageId: info.messageId };
}

export default { sendEmail }; 