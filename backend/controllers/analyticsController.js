const db = require("../db");

// GET /api/analytics/ → General analytics summary (created, opened, reminders)
const getAnalyticsSummary = (req, res) => {
  const data = {};

  db.serialize(() => {
    // Count of capsules created per day
    db.all(
      `SELECT DATE(createdAt) as date, COUNT(*) as count FROM capsules GROUP BY date`,
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        data.created = rows;

        // Count of capsules opened per day
        db.all(
          `SELECT DATE(openedAt) as date, COUNT(*) as count FROM capsules WHERE openedAt IS NOT NULL GROUP BY date`,
          (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            data.opened = rows;

            // Count of reminders sent (all types)
            db.all(
              `SELECT DATE(triggerValue) as date, 
                SUM(CASE WHEN reminder7Sent = 1 THEN 1 ELSE 0 END) as reminder7,
                SUM(CASE WHEN reminder1Sent = 1 THEN 1 ELSE 0 END) as reminder1,
                SUM(CASE WHEN reminderSent = 1 THEN 1 ELSE 0 END) as openDay
               FROM capsules WHERE triggerType = 'date' GROUP BY date`,
              (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                data.reminders = rows;

                // Optional: count of overdue capsules (triggerValue < now and not opened)
                db.all(
                  `SELECT COUNT(*) as count FROM capsules WHERE triggerType = 'date' AND triggerValue < datetime('now') AND openedAt IS NULL`,
                  (err, rows) => {
                    if (err) return res.status(500).json({ error: err.message });
                    data.overdue = rows[0]?.count || 0;
                    res.json(data);
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};

// GET /api/analytics/user/:userId → User-specific analytics by triggerType
const getUserAnalytics = (req, res) => {
  const userId = req.params.userId;

  db.all(
    `SELECT triggerType, COUNT(*) as count FROM capsules WHERE userId = ? GROUP BY triggerType`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ userId, triggerBreakdown: rows });
    }
  );
};

module.exports = {
  getAnalyticsSummary,
  getUserAnalytics,
};
