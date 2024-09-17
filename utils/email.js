// Mail Library
const nodemailer = require('nodemailer');
const { htmlToText } = require('html-to-text');

// Import HTML template function
const { generateEmailTemplate } = require('./emailTemplate');

// Email Service
class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.first_name || '';
    this.url = url;
    this.unsubscribeUrl = `${url}/unsubscribe`;
    this.from = `HexCode+ Company <${process.env.EMAIL_FROM}>`;
  }

  // Create Transporter
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send Email with Message Template
  async send(template, subject) {
    // Get the HTML template from emailTemplates.js
    const html = generateEmailTemplate(
      this.firstName,
      this.url,
      subject,
      this.unsubscribeUrl
    );
    const text = htmlToText(html);

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text,
    };

    try {
      await this.newTransport().sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Email sending failed');
    }
  }

  async sendVerification() {
    await this.send('emailVerification', 'Email Verification Link');
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Our Platform!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Password Reset Token');
  }
}

module.exports = Email;
