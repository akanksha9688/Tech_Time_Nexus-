router.post('/checkin', (req, res) => {
    const { userId, location } = req.body;
  
    db.all(
      `SELECT * FROM capsules WHERE userId = ? AND triggerType = 'location' AND isDelivered = 0`,
      [userId],
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
  
        rows.forEach((capsule) => {
          if (capsule.triggerValue.toLowerCase() === location.toLowerCase()) {
            // Deliver the capsule
            db.run(
              `UPDATE capsules SET isDelivered = 1, openedAt = datetime('now') WHERE id = ?`,
              [capsule.id],
              (err) => {
                if (err) {
                  console.error(err.message);
                } else {
                  console.log(`Capsule ID ${capsule.id} delivered.`);
                }
              }
            );
          }
        });
  
        res.json({ message: 'Check-in processed.' });
      }
    );
  });
  