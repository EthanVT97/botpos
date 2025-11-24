const nodemailer = require('nodemailer');
const twilio = require('twilio');

class NotificationService {
  constructor() {
    // Email transporter (using Gmail as example)
    this.emailTransporter = null;
    this.initializeEmail();

    // SMS client (Twilio)
    this.smsClient = null;
    this.initializeSMS();
  }

  initializeEmail() {
    try {
      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      if (emailConfig.auth.user && emailConfig.auth.pass) {
        this.emailTransporter = nodemailer.createTransporter(emailConfig);
        console.log('✅ Email service initialized');
      } else {
        console.warn('⚠️  Email credentials not configured');
      }
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
    }
  }

  initializeSMS() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (accountSid && authToken) {
        this.smsClient = twilio(accountSid, authToken);
        console.log('✅ SMS service initialized');
      } else {
        console.warn('⚠️  Twilio credentials not configured');
      }
    } catch (error) {
      console.error('❌ SMS service initialization failed:', error.message);
    }
  }

  /**
   * Send email
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.emailTransporter) {
      console.warn('Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const info = await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text
      });

      console.log('✅ Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS
   */
  async sendSMS({ to, message }) {
    if (!this.smsClient) {
      console.warn('SMS service not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const result = await this.smsClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });

      console.log('✅ SMS sent:', result.sid);
      return { success: true, sid: result.sid };
    } catch (error) {
      console.error('❌ SMS send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(order, customer) {
    const notifications = [];

    // Email notification
    if (customer.email) {
      const emailResult = await this.sendEmail({
        to: customer.email,
        subject: 'Order Confirmation - Myanmar POS',
        html: this.getOrderConfirmationHTML(order, customer),
        text: this.getOrderConfirmationText(order, customer)
      });
      notifications.push({ type: 'email', ...emailResult });
    }

    // SMS notification
    if (customer.phone) {
      const smsResult = await this.sendSMS({
        to: customer.phone,
        message: this.getOrderConfirmationSMS(order, customer)
      });
      notifications.push({ type: 'sms', ...smsResult });
    }

    return notifications;
  }

  /**
   * Send order status update
   */
  async sendOrderStatusUpdate(order, customer, newStatus) {
    const notifications = [];

    // Email notification
    if (customer.email) {
      const emailResult = await this.sendEmail({
        to: customer.email,
        subject: `Order ${newStatus} - Myanmar POS`,
        html: this.getOrderStatusHTML(order, customer, newStatus),
        text: this.getOrderStatusText(order, customer, newStatus)
      });
      notifications.push({ type: 'email', ...emailResult });
    }

    // SMS notification
    if (customer.phone) {
      const smsResult = await this.sendSMS({
        to: customer.phone,
        message: this.getOrderStatusSMS(order, newStatus)
      });
      notifications.push({ type: 'sms', ...smsResult });
    }

    return notifications;
  }

  /**
   * Send low stock alert
   */
  async sendLowStockAlert(products, adminEmail) {
    if (!adminEmail) return { success: false, error: 'No admin email configured' };

    return await this.sendEmail({
      to: adminEmail,
      subject: '⚠️ Low Stock Alert - Myanmar POS',
      html: this.getLowStockHTML(products),
      text: this.getLowStockText(products)
    });
  }

  /**
   * Send daily sales report
   */
  async sendDailySalesReport(summary, adminEmail) {
    if (!adminEmail) return { success: false, error: 'No admin email configured' };

    return await this.sendEmail({
      to: adminEmail,
      subject: `Daily Sales Report - ${new Date().toLocaleDateString()}`,
      html: this.getDailySalesHTML(summary),
      text: this.getDailySalesText(summary)
    });
  }

  // Template methods
  getOrderConfirmationHTML(order, customer) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your order!</p>
          </div>
          <div class="content">
            <p>Dear ${customer.name},</p>
            <p>Your order has been confirmed and is being processed.</p>
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> ${order.id.substring(0, 8).toUpperCase()}</p>
              <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
              <p><strong>Total:</strong> ${order.total_amount.toLocaleString()} Ks</p>
              <p><strong>Payment:</strong> ${order.payment_method?.toUpperCase()}</p>
            </div>
            <p>We'll notify you when your order is ready.</p>
          </div>
          <div class="footer">
            <p>Myanmar POS System</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getOrderConfirmationText(order, customer) {
    return `
Order Confirmation

Dear ${customer.name},

Your order has been confirmed!

Order ID: ${order.id.substring(0, 8).toUpperCase()}
Date: ${new Date(order.created_at).toLocaleString()}
Total: ${order.total_amount.toLocaleString()} Ks
Payment: ${order.payment_method?.toUpperCase()}

Thank you for your business!

Myanmar POS System
    `.trim();
  }

  getOrderConfirmationSMS(order, customer) {
    return `Myanmar POS: Your order ${order.id.substring(0, 8)} has been confirmed. Total: ${order.total_amount.toLocaleString()} Ks. Thank you!`;
  }

  getOrderStatusHTML(order, customer, status) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .status { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; text-align: center; }
          .status h2 { color: #10b981; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
          </div>
          <div class="content">
            <p>Dear ${customer.name},</p>
            <div class="status">
              <h2>${status.toUpperCase()}</h2>
              <p>Order ID: ${order.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <p>Your order status has been updated.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getOrderStatusText(order, customer, status) {
    return `Order Status Update\n\nDear ${customer.name},\n\nYour order ${order.id.substring(0, 8)} is now ${status}.\n\nMyanmar POS System`;
  }

  getOrderStatusSMS(order, status) {
    return `Myanmar POS: Your order ${order.id.substring(0, 8)} is now ${status}.`;
  }

  getLowStockHTML(products) {
    const rows = products.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.stock_quantity}</td>
        <td>${p.sku || 'N/A'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f59e0b; color: white; }
        </style>
      </head>
      <body>
        <h2>⚠️ Low Stock Alert</h2>
        <p>The following products are running low on stock:</p>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Stock</th>
              <th>SKU</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <p>Please reorder these items soon.</p>
      </body>
      </html>
    `;
  }

  getLowStockText(products) {
    const list = products.map(p => `- ${p.name}: ${p.stock_quantity} units`).join('\n');
    return `Low Stock Alert\n\nThe following products are running low:\n\n${list}\n\nPlease reorder soon.`;
  }

  getDailySalesHTML(summary) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .metric { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 8px; }
          .metric h3 { margin: 0 0 5px 0; color: #666; font-size: 14px; }
          .metric p { margin: 0; font-size: 24px; font-weight: bold; color: #1a1a1a; }
        </style>
      </head>
      <body>
        <h2>Daily Sales Report - ${new Date().toLocaleDateString()}</h2>
        <div class="metric">
          <h3>Total Sales</h3>
          <p>${summary.total_sales?.toLocaleString() || 0} Ks</p>
        </div>
        <div class="metric">
          <h3>Total Orders</h3>
          <p>${summary.total_orders || 0}</p>
        </div>
        <div class="metric">
          <h3>Average Order Value</h3>
          <p>${summary.avg_order_value?.toLocaleString() || 0} Ks</p>
        </div>
      </body>
      </html>
    `;
  }

  getDailySalesText(summary) {
    return `
Daily Sales Report - ${new Date().toLocaleDateString()}

Total Sales: ${summary.total_sales?.toLocaleString() || 0} Ks
Total Orders: ${summary.total_orders || 0}
Average Order Value: ${summary.avg_order_value?.toLocaleString() || 0} Ks
    `.trim();
  }
}

module.exports = new NotificationService();
