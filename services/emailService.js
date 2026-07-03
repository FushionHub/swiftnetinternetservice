const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Decrypt function (same as encryption.js)
function decrypt(encryptedText) {
  if (!encryptedText) return '';
  try {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key-123456', 'utf8').slice(0, 32);
    const iv = Buffer.from(encryptedText.slice(0, 32), 'hex');
    const encrypted = Buffer.from(encryptedText.slice(32), 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

// Get email configuration from database
async function getEmailConfig() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'single-settings' }
  });
  
  if (!settings || !settings.emailEnabled) {
    return null;
  }
  
  return {
    host: settings.emailHost,
    port: settings.emailPort,
    user: settings.emailUser,
    password: decrypt(settings.emailPasswordEnc),
    from: settings.emailFrom,
    fromName: settings.emailFromName
  };
}

// Create transporter
async function createTransporter() {
  const config = await getEmailConfig();
  if (!config) return null;
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password
    }
  });
}

// Send receipt email
async function sendReceiptEmail(subscriber, transaction, plan) {
  const config = await getEmailConfig();
  if (!config) {
    console.log('Email not enabled or not configured');
    return false;
  }
  
  const transporter = await createTransporter();
  if (!transporter) return false;
  
  const expiryDate = new Date(subscriber.subscriptionExpiry).toLocaleString();
  
  const mailOptions = {
    from: `"${config.fromName}" <${config.from}>`,
    to: subscriber.email,
    subject: `Payment Receipt - ${plan.name} - SwiftNet`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .receipt-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .receipt-details p { margin: 10px 0; }
          .receipt-details strong { color: #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📧 Payment Receipt</h1>
          <p>SwiftNet WiFi Hotspot</p>
        </div>
        <div class="content">
          <h2>Thank you for your payment!</h2>
          <p>Dear ${subscriber.fullName},</p>
          <p>Your payment has been successfully processed. Here are your receipt details:</p>
          
          <div class="receipt-details">
            <p><strong>Transaction ID:</strong> ${transaction.id}</p>
            <p><strong>Plan:</strong> ${plan.name}</p>
            <p><strong>Amount:</strong> ₦${transaction.amount}</p>
            <p><strong>Payment Method:</strong> ${transaction.provider}</p>
            <p><strong>Payment Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
            <p><strong>Valid Until:</strong> ${expiryDate}</p>
          </div>
          
          <p><strong>Your Hotspot Credentials:</strong></p>
          <div class="receipt-details">
            <p><strong>Username:</strong> ${subscriber.username}</p>
            <p><strong>Password:</strong> [Check your SMS or contact support]</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal" class="button">Connect to WiFi</a>
          </p>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SwiftNet. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Receipt email sent to:', subscriber.email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send welcome email
async function sendWelcomeEmail(subscriber) {
  const config = await getEmailConfig();
  if (!config) {
    console.log('Email not enabled or not configured');
    return false;
  }
  
  const transporter = await createTransporter();
  if (!transporter) return false;
  
  const mailOptions = {
    from: `"${config.fromName}" <${config.from}>`,
    to: subscriber.email,
    subject: `Welcome to SwiftNet WiFi!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>👋 Welcome to SwiftNet!</h1>
        </div>
        <div class="content">
          <h2>Hi ${subscriber.fullName},</h2>
          <p>Welcome to SwiftNet WiFi Hotspot! We're excited to have you as our subscriber.</p>
          
          <p><strong>Your Account Details:</strong></p>
          <ul>
            <li><strong>Username:</strong> ${subscriber.username}</li>
            <li><strong>Phone:</strong> ${subscriber.phone}</li>
            <li><strong>Email:</strong> ${subscriber.email}</li>
          </ul>
          
          <p>You can now purchase internet plans and enjoy high-speed WiFi access.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal" class="button">Get Started</a>
          </p>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SwiftNet. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', subscriber.email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send subscription expiry reminder
async function sendExpiryReminderEmail(subscriber) {
  const config = await getEmailConfig();
  if (!config) return false;
  
  const transporter = await createTransporter();
  if (!transporter) return false;
  
  const expiryDate = new Date(subscriber.subscriptionExpiry).toLocaleString();
  
  const mailOptions = {
    from: `"${config.fromName}" <${config.from}>`,
    to: subscriber.email,
    subject: `Your Subscription is Expiring Soon - SwiftNet`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Expiry Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ Subscription Expiring Soon</h1>
        </div>
        <div class="content">
          <h2>Hi ${subscriber.fullName},</h2>
          <p>Your SwiftNet WiFi subscription is about to expire.</p>
          
          <p><strong>Expiry Date:</strong> ${expiryDate}</p>
          
          <p>To continue enjoying uninterrupted internet access, please renew your subscription before it expires.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal" class="button">Renew Now</a>
          </p>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SwiftNet. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Expiry reminder email sent to:', subscriber.email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

module.exports = {
  sendReceiptEmail,
  sendWelcomeEmail,
  sendExpiryReminderEmail,
  getEmailConfig
};
