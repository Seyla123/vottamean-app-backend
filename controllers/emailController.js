const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to receive user support emails
exports.receiveEmailSupport = catchAsync(async (req, res, next) => {
  const { name, email, message } = req.body;
  console.log('Received email data:', req.body);

  if (!name || !email || !message) {
    return next(
      new AppError('All fields (name, email, message) are required', 400)
    );
  }

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: process.env.EMAIL_USERNAME,
    subject: `Support Request from ${name}`,
    html: `
      <h3>New Support Request</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  };

  // Send the email
  await transporter.sendMail(mailOptions);

  res.status(200).json({
    status: 'success',
    message: 'Message sent successfully',
  });
});

// Function for support team to send an email back to the user
exports.sendEmailSupport = catchAsync(async (req, res, next) => {
  const { userEmail, subject, replyMessage } = req.body;

  if (!userEmail || !subject || !replyMessage) {
    return next(
      new AppError(
        'All fields (userEmail, subject, replyMessage) are required',
        400
      )
    );
  }

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: userEmail,
    subject: subject,
    html: `
      <h3>Support Team Response</h3>
      <p>${replyMessage}</p>
    `,
  };

  // Send the email
  await transporter.sendMail(mailOptions);

  res.status(200).json({
    status: 'success',
    message: `Reply sent successfully to ${userEmail}`,
  });
});
