const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify configuration on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ EMAIL CONFIG ERROR:", error.message);
    console.error("Check your .env file: EMAIL and EMAIL_PASSWORD");
  } else {
    console.log("✅ Email server is ready to send emails");
  }
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
    console.log("📧 Sending email ->", {
      to: mailOptions.to,
      subject: mailOptions.subject,
      textPreview: (mailOptions.text || "").slice(0, 100) + "...",
    });
  } catch (e) {
    // ignore logging errors
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to:", to);
    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", {
      to: to,
      error: error.message,
      code: error.code
    });
    throw error;
  }
};

module.exports = sendEmail;
