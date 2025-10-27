const cron = require('node-cron');
const db = require('../models/Capsule');
const sendEmail = require("../utils/sendEmail");
const moment = require('moment');
const { getPRCount } = require('../services/githubService');
const dbUser = require('../models/User');

// Promisify db.all and db.run for better async/await usage
const dbAll = (query, params = []) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});
const dbRun = (query, params = []) => new Promise((resolve, reject) => {
  db.run(query, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const sendReminderEmails = async () => {
  try {
    // 7 days before
    const sevenDaysQuery = `SELECT * FROM capsules WHERE triggerType = 'date' AND reminder7Sent = 0 AND isDelivered = 0 AND userEmail IS NOT NULL AND DATE(triggerValue) = DATE('now', '+7 days')`;
    const sevenDayRows = await dbAll(sevenDaysQuery);
    for (const capsule of sevenDayRows) {
      const emailContent = {
        to: capsule.userEmail,
        subject: "⏳ 7 Days Left: Your Time Capsule Unlocks Soon!",
        text: `Hi, your time capsule titled "${capsule.title}" will unlock in 7 days on ${capsule.triggerValue}. Get ready!`,
      };
      try {
        await sendEmail(emailContent);
        await dbRun(`UPDATE capsules SET reminder7Sent = 1 WHERE id = ?`, [capsule.id]);
        console.log(`7-day reminder email sent for capsule ID: ${capsule.id}`);
      } catch (emailErr) {
        console.error("Error sending 7-day reminder for capsule ID:", capsule.id, emailErr);
      }
    }

    // 1 day before
    const oneDayQuery = `SELECT * FROM capsules WHERE triggerType = 'date' AND reminder1Sent = 0 AND isDelivered = 0 AND userEmail IS NOT NULL AND DATE(triggerValue) = DATE('now', '+1 day')`;
    const oneDayRows = await dbAll(oneDayQuery);
    for (const capsule of oneDayRows) {
      const emailContent = {
        to: capsule.userEmail,
        subject: "⏳ 1 Day Left: Your Time Capsule Unlocks Tomorrow!",
        text: `Hi, your time capsule titled "${capsule.title}" will unlock tomorrow on ${capsule.triggerValue}. Get excited!`,
      };
      try {
        await sendEmail(emailContent);
        await dbRun(`UPDATE capsules SET reminder1Sent = 1 WHERE id = ?`, [capsule.id]);
        console.log(`1-day reminder email sent for capsule ID: ${capsule.id}`);
      } catch (emailErr) {
        console.error("Error sending 1-day reminder for capsule ID:", capsule.id, emailErr);
      }
    }

    // On the day (existing logic, but now only for the day of unlock)
    const openQuery = `SELECT * FROM capsules WHERE triggerType = 'date' AND isDelivered = 0 AND userEmail IS NOT NULL AND DATE(triggerValue) = DATE('now') AND reminderSent = 0`;
    const openRows = await dbAll(openQuery);
    for (const capsule of openRows) {
      const emailContent = {
        to: capsule.userEmail,
        subject: "🎉 Your Time Capsule is Ready to Open!",
        text: `Hi, your time capsule titled "${capsule.title}" is now ready to open! Visit the app to view it.`,
      };
      try {
        await sendEmail(emailContent);
        await dbRun(`UPDATE capsules SET reminderSent = 1 WHERE id = ?`, [capsule.id]);
        console.log(`Open-day reminder email sent for capsule ID: ${capsule.id}`);
      } catch (emailErr) {
        console.error("Error sending open-day reminder for capsule ID:", capsule.id, emailErr);
      }
    }

    // --- GitHub PR milestone capsules ---
    const milestoneCapsules = await dbAll(`SELECT * FROM capsules WHERE triggerType = 'milestone' AND isDelivered = 0`);
    for (const capsule of milestoneCapsules) {
      // Fetch user's GitHub token
      await new Promise((resolve) => {
        dbUser.get('SELECT githubToken, email FROM users WHERE id = ?', [capsule.userId], async (userErr, user) => {
          if (userErr || !user || !user.githubToken) {
            console.warn(`No GitHub token for user ${capsule.userId}, skipping milestone capsule ${capsule.id}`);
            resolve();
            return;
          }
          try {
            const currentPRs = await getPRCount(user.githubToken);
            const target = parseInt(capsule.triggerValue);
            if (currentPRs >= target) {
              await dbRun('UPDATE capsules SET isDelivered = 1, openedAt = datetime(\'now\') WHERE id = ?', [capsule.id]);
              // Send congratulatory email
              const emailContent = {
                to: user.email || capsule.userEmail,
                subject: '🎉 GitHub PR Milestone Achieved!',
                text: `Congrats! You reached your PR milestone (${target}) and unlocked your capsule: "${capsule.title}"! Visit the app to view it.`
              };
              try {
                await sendEmail(emailContent);
                console.log(`Milestone capsule delivered and email sent for capsule ID: ${capsule.id}`);
              } catch (emailErr) {
                console.error(`Error sending milestone email for capsule ID: ${capsule.id}`, emailErr);
              }
            }
          } catch (apiErr) {
            console.error(`GitHub API error for capsule ${capsule.id}:`, apiErr.message);
          }
          resolve();
        });
      });
    }
  } catch (err) {
    console.error("Error fetching capsules for reminders:", err);
  }
};

cron.schedule('0 9 * * *', () => {
  sendReminderEmails();
});
