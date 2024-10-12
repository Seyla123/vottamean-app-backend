// Mail Library
const nodemailer = require('nodemailer');
const { htmlToText } = require('html-to-text');

// Import HTML template function
const { generateEmailTemplate } = require('./emailTemplate');
const {
  attendanceStatusEmailTemplate,
} = require('../emails/attendanceStatusEmailTemaple');

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
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: process.env.BREVO_HOST,
        port: process.env.BREVO_PORT,
        secure: process.env.BREVO_PORT === '465',
        auth: {
          user: process.env.BREVO_USERNAME,
          pass: process.env.BREVO_PASSWORD,
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
  // New Method to Send Attendance Notification
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
    const html = attendanceStatusEmailTemplate(data, statusInfo.text);
    //const message = `Dear Guardian,\n\nThis is to inform you that your child, ${studentName}, is marked as ${statusText} in today's session.\n\nBest regards,\nSchool Administration`;
    const message = htmlToText(html);
    // Prepare mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: message,
      html: html,
    };

    try {
      await this.newTransport().sendMail(mailOptions);
      console.log(`Attendance email sent successfully to ${this.to}`);
    } catch (error) {
      console.error(`Error sending attendance email to ${this.to}:`, error);
      throw new Error('Attendance email sending failed :', error);
    }
  }

  // Send Teacher Verification Email
  async sendTeacherVerification() {
    await this.send('teacherVerification', 'Verify Your Teacher Account');
  }
}

module.exports = Email;
