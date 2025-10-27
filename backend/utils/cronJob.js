const cron = require("node-cron");
const db = require("../db");
const sendEmail = require("./sendEmail");

const checkAndSendReminders = async () => {
  const now = new Date();
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const reminders = await db.all(
    `SELECT * FROM capsules WHERE openDate <= ? AND reminderSent = 0`,
    [oneDayLater.toISOString()]
  );

  for (let cap of reminders) {
    await sendEmail({
      to: cap.email,
      subject: "⏳ Your Time Capsule Unlocks Soon!",
      text: `Hi ${cap.name}, your time capsule titled "${cap.title}" unlocks in less than 24 hours!`,
    });

    await db.run(`UPDATE capsules SET reminderSent = 1 WHERE id = ?`, [cap.id]);
  }
};

const startCronJob = () => {
  cron.schedule("0 * * * *", checkAndSendReminders); // every hour
};

module.exports = startCronJob;
