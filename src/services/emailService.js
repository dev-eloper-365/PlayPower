import sgMail from '@sendgrid/mail';
import config from '../config/index.js';
import { EMAIL_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';

class EmailService {
  constructor() {
    this.isInitialized = false;
    this.initializeSendGrid();
  }

  initializeSendGrid() {
    if (config.sendgrid.apiKey) {
      sgMail.setApiKey(config.sendgrid.apiKey);
      this.isInitialized = true;
    }
  }

  isConfigured() {
    return this.isInitialized && config.sendgrid.apiKey;
  }

  createEmailMessage({ to, subject, text, html, headers = {} }) {
    return {
      to,
      from: config.sendgrid.from || EMAIL_CONFIG.DEFAULT_FROM,
      subject,
      text,
      html,
      headers: {
        ...EMAIL_CONFIG.HEADERS,
        ...headers
      }
    };
  }

  async sendEmail({ to, subject, text, html, headers = {} }) {
    if (!this.isConfigured()) {
      console.log(ERROR_MESSAGES.SENDGRID_NOT_CONFIGURED);
      return this.createSkippedResponse();
    }
    
    try {
      const message = this.createEmailMessage({ to, subject, text, html, headers });
      const response = await sgMail.send(message);
      
      console.log(SUCCESS_MESSAGES.EMAIL_SENT);
      return this.createSuccessResponse(response);
    } catch (error) {
      console.error(ERROR_MESSAGES.EMAIL_SEND_FAILED, error.message);
      return this.createErrorResponse(error.message);
    }
  }

  createSkippedResponse() {
    return { ok: false, skipped: true };
  }

  createSuccessResponse(response) {
    return { 
      ok: true, 
      messageId: response[0].headers['x-message-id'] 
    };
  }

  createErrorResponse(errorMessage) {
    return { 
      ok: false, 
      error: errorMessage 
    };
  }
}

const emailService = new EmailService();

export const sendEmail = (params) => emailService.sendEmail(params);
export default { sendEmail }; 