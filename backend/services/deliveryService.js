const db = require('../db');
const { getPRCount } = require('./githubService');
const { sendCongratulatoryEmail } = require('./mailService');

async function checkGitHubMilestones() {
  db.all(
    `SELECT * FROM capsules WHERE triggerType = 'milestone' AND isDelivered = 0`,
    [],
    async (err, rows) => {
      if (err) {
        console.error(err.message);
        return;
      }

      for (const capsule of rows) {
        // Fetch user's GitHub token
        db.get('SELECT githubToken, email FROM users WHERE id = ?', [capsule.userId], async (userErr, user) => {
          if (userErr) {
            console.error('Error fetching user for capsule:', capsule.id, userErr);
            return;
          }
          if (!user || !user.githubToken) {
            console.warn(`No GitHub token for user ${capsule.userId}, skipping capsule ${capsule.id}`);
            return;
          }
          try {
            const currentPRs = await getPRCount(user.githubToken);
            const targetPRs = parseInt(capsule.triggerValue, 10);
            if (currentPRs >= targetPRs) {
              db.run(
                `UPDATE capsules SET isDelivered = 1, openedAt = datetime('now') WHERE id = ?`,
                [capsule.id],
                (err) => {
                  if (err) {
                    console.error(err.message);
                  } else {
                    console.log(`Capsule ID ${capsule.id} delivered (PR milestone met).`);
                    sendCongratulatoryEmail(user.email || capsule.userEmail);
                  }
                }
              );
            }
          } catch (apiErr) {
            console.error(`GitHub API error for capsule ${capsule.id}:`, apiErr.message);
          }
        });
      }
    }
  );
}

module.exports = { checkGitHubMilestones };
