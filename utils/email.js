// Mail Library
const nodemailer = require('nodemailer');
const { htmlToText } = require('html-to-text');

// Import HTML template function
const { generateEmailTemplate } = require('../emails/emailTemplate');
const {
  attendanceStatusEmailTemplate,
} = require('../emails/attendanceStatusEmailTemaple');
const {
  forgotPasswordEmailTemplate,
} = require('../emails/forgotPasswordEmailTemplate');

// Email Service
class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.first_name || '';
    this.url = url;
    this.unsubscribeUrl = `${url}/unsubscribe`;
    this.from = `HexCode+ Company <${process.env.BREVO_EMAIL_FROM}>`;
  }

  // Create Transporter
  newTransport() {
    // For Future Paid Service
    // if (process.env.NODE_ENV === 'production') {
    //   return nodemailer.createTransport({
    //     host: process.env.BREVO_HOST,
    //     port: process.env.BREVO_PORT,
    //     secure: process.env.BREVO_PORT === '465',
    //     auth: {
    //       user: process.env.BREVO_USERNAME,
    //       pass: process.env.BREVO_PASSWORD,
    //     },
    //   });
    // }

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

  // Send Email with Dynamic Message Template
  async send(templateFunction, subject, templateData = {}) {
    // Get the HTML template using the passed template function
    const html = templateFunction({
      firstName: this.firstName,
      url: this.url,
      unsubscribeUrl: this.unsubscribeUrl,
      ...templateData,
    });
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

  // Send Email Verification Link
  async sendVerification() {
    const templateData = {
      message: 'Please verify your email using the link below:',
    };
    await this.send(
      generateEmailTemplate,
      'Email Verification Link',
      templateData
    );
  }

  // Send Welcome Email
  async sendWelcome() {
    const templateData = {
      message: 'Welcome to Our Platform! We are glad to have you with us.',
    };
    await this.send(
      generateEmailTemplate,
      'Welcome to Our Platform!',
      templateData
    );
  }

  // Method to Send the Forgot Password Email Template
  async sendForgotPassword() {
    const subject = 'Password Reset Token';
    await this.send(forgotPasswordEmailTemplate, subject, {});
  }

  // Method to Send Attendance Notification
  async sendAttendanceNotification(data, status_id) {
    const statusMap = {
      1: { text: 'Present', className: 'present' },
      2: { text: 'Late', className: 'late' },
      3: { text: 'Absent', className: 'absent' },
      4: { text: 'Absent with Permission', className: 'absent-permission' },
    };

    const statusInfo = statusMap[status_id] || {
      text: 'Unknown Status',
      className: '',
    };

    const subject = `${statusInfo.text} : Attendance Alert for ${data.studentName}`;
    await this.send(attendanceStatusEmailTemplate, subject, {
      studentName: data.studentName,
      statusText: statusInfo.text,
    });
  }

  // Send Teacher Verification Email
  async sendTeacherVerification() {
    const templateData = {
      message: 'Please verify your teacher account using the link below:',
    };
    await this.send(
      generateEmailTemplate,
      'Verify Your Teacher Account',
      templateData
    );
  }
}

module.exports = Email;
