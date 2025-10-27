const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, text }) => {
  const mailOptions = {
    from: `"Time Capsule" <${process.env.EMAIL}>`,
    to,
    subject,
    text,
  };

  // Debugging: log mail options so we can see exactly what is sent
  try {
    console.log("sendEmail ->", {
      to: mailOptions.to,
      subject: mailOptions.subject,
      textPreview: (mailOptions.text || "").slice(0, 500),
    });
  } catch (e) {
    // ignore logging errors
  }

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
