import sgMail from '@sendgrid/mail';
import config from '../config/index.js';

// Initialize SendGrid
if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

export async function sendEmail({ to, subject, text, html, headers = {} }) {
  // Check if SendGrid is configured
  if (!config.sendgrid.apiKey) {
    console.log('SendGrid not configured - email sending skipped');
    return { ok: false, skipped: true };
  }
  
  try {
    const msg = {
      to,
      from: config.sendgrid.from || 'noreply@aiquizzer.com',
      subject,
      text,
      html,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'AI Quizzer',
        'X-Spam-Check': 'no',
        ...headers
      }
    };
    
    const response = await sgMail.send(msg);
    console.log('Email sent successfully via SendGrid');
    return { ok: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error('SendGrid email send failed:', error.message);
    return { ok: false, error: error.message };
  }
}

export default { sendEmail }; 