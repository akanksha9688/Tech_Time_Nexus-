const nodemailer = require('nodemailer');
require('dotenv').config();

// Set up the nodemailer transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,      // Your Gmail address from .env
    pass: process.env.EMAIL_PASSWORD,  // Password from .env
  }
});

// Function to send a congratulatory email
exports.sendCongratulatoryEmail = (userEmail) => {
  const mailOptions = {
    from: process.env.EMAIL, // Your Gmail address
    to: userEmail,                // The recipient's email
    subject: 'Congratulations on Achieving Your PR Milestone!',
    text: 'Dear user, congratulations! You have successfully achieved your PR milestone on GitHub. Keep up the great work!',
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};
