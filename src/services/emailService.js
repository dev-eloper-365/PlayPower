import nodemailer from 'nodemailer';
import config from '../config/index.js';

let transporter = null;

function getTransporter() {
  if (transporter !== null) return transporter;
  
  // Check if SMTP is configured
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
    console.log('SMTP not configured - email sending will be skipped');
    transporter = false; // Explicitly set to false to prevent retries
    return null;
  }
  
  try {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
      connectionTimeout: 5000, // 5 seconds
      greetingTimeout: 5000,   // 5 seconds
      socketTimeout: 10000,    // 10 seconds
      pool: false,             // Disable connection pooling
    });
    console.log('Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error.message);
    transporter = false; // Explicitly set to false to prevent retries
    return null;
  }
}

export async function sendEmail({ to, subject, text, html, headers = {} }) {
  // Check if SMTP is configured before attempting anything
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
    console.log('SMTP not configured - email sending skipped');
    return { ok: false, skipped: true };
  }
  
  const t = getTransporter();
  if (!t) return { ok: false, skipped: true };
  
  try {
    const info = await Promise.race([
      t.sendMail({ 
        from: config.smtp.from, 
        to, 
        subject, 
        text, 
        html,
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'AI Quizzer',
          'X-Spam-Check': 'no',
          ...headers
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout')), 8000)
      )
    ]);
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { ok: false, error: error.message };
  }
}

export default { sendEmail }; 