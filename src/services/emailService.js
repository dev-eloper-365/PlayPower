import nodemailer from 'nodemailer';
import config from '../config/index.js';

let transporter = null;

function getTransporter() {
  if (transporter !== null) return transporter;
  
  // Check if SMTP is properly configured
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
    transporter = false; // Mark as disabled
    return null;
  }
  
  try {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
      connectionTimeout: 5000, // 5 second timeout
      greetingTimeout: 5000,   // 5 second timeout
      socketTimeout: 10000,    // 10 second timeout
    });
    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error.message);
    transporter = false; // Mark as disabled
    return null;
  }
}

export async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) return { ok: false, skipped: true };
  
  try {
    const info = await t.sendMail({ 
      from: config.smtp.from, 
      to, 
      subject, 
      text, 
      html 
    });
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { ok: false, error: error.message };
  }
}

export default { sendEmail }; 