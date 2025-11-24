const nodemailer = require('nodemailer');

/**
 * Email Service for sending emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      // Check if SMTP is configured
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn('⚠️  Email service not configured. Set SMTP_* environment variables.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      this.initialized = true;
      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  /**
   * Send email
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.initialized) {
      console.warn('Email service not initialized. Email not sent.');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `"Myanmar POS" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html
      });

      console.log('✅ Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken) {
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Myanmar POS System</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
              ${resetLink}
            </p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            <p>Best regards,<br>Myanmar POS Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Myanmar POS System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request

Hello,

We received a request to reset your password. Click the link below to reset it:

${resetLink}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
Myanmar POS Team
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Myanmar POS',
      html,
      text
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, fullName) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Myanmar POS!</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName}!</h2>
            <p>Welcome to Myanmar POS System. Your account has been successfully created.</p>
            <p>You can now login and start using the system:</p>
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/login" class="button">Login Now</a>
            </p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>Myanmar POS Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Myanmar POS System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to Myanmar POS!

Hello ${fullName}!

Welcome to Myanmar POS System. Your account has been successfully created.

You can now login at: ${process.env.CLIENT_URL}/login

Best regards,
Myanmar POS Team
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Myanmar POS System',
      html,
      text
    });
  }

  /**
   * Send order notification email
   */
  async sendOrderNotification(email, orderDetails) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <h2>Thank you for your order!</h2>
            <div class="order-details">
              <p><strong>Order ID:</strong> ${orderDetails.id}</p>
              <p><strong>Total Amount:</strong> ${orderDetails.total_amount} Ks</p>
              <p><strong>Status:</strong> ${orderDetails.status}</p>
            </div>
            <p>We'll notify you when your order is ready.</p>
            <p>Best regards,<br>Myanmar POS Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Myanmar POS System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: `Order Confirmation #${orderDetails.id}`,
      html
    });
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    if (!this.initialized) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return { success: true, message: 'Email service is working' };
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const emailService = new EmailService();

module.exports = emailService;
