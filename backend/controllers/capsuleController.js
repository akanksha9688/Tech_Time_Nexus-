const db = require("../models/Capsule");
const { encrypt, decrypt } = require("../utils/crypto");
const axios = require("axios");
const nodemailer = require("nodemailer");
const crypto = require("../utils/crypto");
const { getPRCount } = require("../services/githubService");
const sendEmail = require("../utils/sendEmail");
const dbUser = require("../models/User");

// POST /api/capsule → Create a new capsule
exports.createCapsule = (req, res) => {
  const { title, message, triggerType, triggerValue, type } = req.body;
  // Get user email from req.user or fallback
  const userEmail = req.user.email || req.user.username || "user@example.com";
  const encryptedMsg = encrypt(message);

  const query = `
    INSERT INTO capsules (userId, title, message, type, triggerType, triggerValue, userEmail, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;
  db.run(
    query,
    [
      req.user.id,
      title,
      encryptedMsg,
      type || null,
      triggerType,
      triggerValue,
      userEmail,
    ],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      // Send creation email (title only) - log payload
      const creationMail = {
        to: userEmail,
        subject: `Your Time Capsule "${title}" has been created!`,
        text: `Hi! Your time capsule "${title}" was successfully created.\n\nYou will be notified when it is unlocked.`,
      };
      console.log("Creation email payload:", {
        to: creationMail.to,
        subject: creationMail.subject,
        textPreview: creationMail.text.slice(0, 200),
      });
      sendEmail(creationMail).catch((emailErr) => {
        console.error("Error sending creation email:", emailErr);
      });
      res.json({ id: this.lastID, title });
    }
  );
};

// GET /api/capsule/my → View user's capsules
exports.getMyCapsules = async (req, res) => {
  console.log("📦 Fetching capsules for user:", req.user.id);
  
  try {
    // Step 1: Fetch ALL user's capsules
    const allCapsules = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM capsules WHERE userId = ?`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    console.log(`📋 Found ${allCapsules.length} total capsules for user ${req.user.id}`);

    const nowMs = Date.now();
    const nowISO = new Date(nowMs).toISOString();
    
    // Step 2: Identify capsules that need to be unlocked
    const capsulesNeedingUnlock = allCapsules.filter((capsule) => {
      const needsUnlock = 
        capsule.triggerType === "date" &&
        capsule.isDelivered === 0 &&
        new Date(capsule.triggerValue).getTime() <= nowMs;
      
      if (needsUnlock) {
        console.log(`📅 Capsule ID ${capsule.id} "${capsule.title}" needs unlock:`, {
          triggerValue: capsule.triggerValue,
          triggerTime: new Date(capsule.triggerValue).getTime(),
          currentTime: nowMs,
          timeDiff: nowMs - new Date(capsule.triggerValue).getTime(),
          isDelivered: capsule.isDelivered
        });
      }
      
      return needsUnlock;
    });

    console.log(`🔓 Found ${capsulesNeedingUnlock.length} capsules to unlock`);

    // Step 3: Unlock each capsule SEQUENTIALLY with verification
    for (const capsule of capsulesNeedingUnlock) {
      console.log(`🔓 UNLOCKING CAPSULE ID ${capsule.id} "${capsule.title}"`);
      
      // Execute UPDATE
      const updateResult = await new Promise((resolve) => {
        db.run(
          `UPDATE capsules SET isDelivered = 1, openedAt = ? WHERE id = ?`,
          [nowISO, capsule.id],
          function(updateErr) {
            if (updateErr) {
              console.error(`❌ Database UPDATE error for capsule ${capsule.id}:`, updateErr);
              resolve({ success: false, changes: 0 });
            } else {
              console.log(`✅ Database UPDATE executed for capsule ${capsule.id}, changes:`, this.changes);
              resolve({ success: true, changes: this.changes });
            }
          }
        );
      });

      // Wait for disk write to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify the update persisted
      const verifyResult = await new Promise((resolve) => {
        db.get(
          `SELECT isDelivered, openedAt FROM capsules WHERE id = ?`,
          [capsule.id],
          (verifyErr, row) => {
            if (verifyErr) {
              console.error(`❌ Verification SELECT error for capsule ${capsule.id}:`, verifyErr);
              resolve({ verified: false });
            } else if (!row) {
              console.error(`❌ Capsule ${capsule.id} not found in verification SELECT`);
              resolve({ verified: false });
            } else {
              console.log(`🔍 VERIFICATION: Capsule ${capsule.id} isDelivered=${row.isDelivered}, openedAt=${row.openedAt}`);
              resolve({ verified: row.isDelivered === 1, row });
            }
          }
        );
      });

      // Send delivery email if update succeeded
      if (updateResult.success && verifyResult.verified) {
        console.log(`📧 Sending delivery email for capsule ${capsule.id}`);
        
        // Decrypt message
        let decryptedMsg = "";
        if (capsule.message) {
          try {
            decryptedMsg = decrypt(capsule.message);
          } catch (decryptErr) {
            console.error(`❌ Decryption error for capsule ${capsule.id}:`, decryptErr);
            decryptedMsg = "[Error decrypting message]";
          }
        }

        // Send email
        const mail = {
          to: capsule.userEmail || req.user.email,
          subject: `Your Time Capsule "${capsule.title}" has been unlocked!`,
          text: `Hi! Your time capsule "${capsule.title}" has been unlocked.\n\nMessage: ${decryptedMsg}\nType: ${capsule.type || capsule.triggerType}\nUnlocked at: ${nowISO}`,
        };

        console.log(`📧 Email details:`, {
          to: mail.to,
          subject: mail.subject,
          textPreview: mail.text.slice(0, 100) + "..."
        });

        try {
          await sendEmail(mail);
          console.log(`✅ Delivery email sent for capsule ${capsule.id}`);
        } catch (emailErr) {
          console.error(`❌ Email send error for capsule ${capsule.id}:`, emailErr);
        }
      } else {
        console.error(`❌ CRITICAL: Capsule ${capsule.id} update failed or not verified!`, {
          updateSuccess: updateResult.success,
          updateChanges: updateResult.changes,
          verified: verifyResult.verified
        });
      }
    }

    // Step 4: Wait before final fetch to ensure all writes are flushed
    if (capsulesNeedingUnlock.length > 0) {
      console.log(`⏳ Waiting 200ms for all database writes to flush...`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Step 5: Fetch FRESH data from database
    console.log(`🔄 Fetching fresh capsule data for user ${req.user.id}`);
    const freshCapsules = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM capsules WHERE userId = ?`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    console.log(`📋 Fresh fetch returned ${freshCapsules.length} capsules`);

    // Step 6: Prepare response with decrypted messages for delivered capsules
    const result = freshCapsules.map((capsule) => {
      if (capsule.isDelivered === 1) {
        try {
          capsule.message = decrypt(capsule.message);
          console.log(`🔓 Decrypted capsule ${capsule.id} for response`);
        } catch (decryptErr) {
          console.error(`❌ Decryption error for response capsule ${capsule.id}:`, decryptErr);
          capsule.message = "[Error decrypting message]";
        }
        return capsule;
      }
      return { ...capsule, message: "🔒 Locked until trigger is met." };
    });

    // Step 7: Set cache prevention headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    console.log(`✅ Returning ${result.length} capsules to client`);
    res.json(result);

  } catch (error) {
    console.error("❌ Error in getMyCapsules:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update fetch logic to mark capsules as delivered
exports.getCapsules = (req, res) => {
  const userId = req.user.id;
  const now = new Date().toISOString();

  db.all(
    `SELECT * FROM capsules WHERE userId = ?`,
    [userId],
    (err, capsules) => {
      if (err) {
        console.error("Error fetching capsules:", err);
        return res.status(500).json({ error: "Failed to fetch capsules." });
      }

      const updatedCapsules = capsules.map((capsule) => {
        const now = new Date();

        // Adjust the comparison to handle exact matches and timezone differences
        if (
          capsule.triggerType === "date" &&
          new Date(capsule.triggerValue).getTime() <= now.getTime() &&
          !capsule.isDelivered
        ) {
          db.run(
            `UPDATE capsules SET isDelivered = 1, openedAt = datetime('now') WHERE id = ?`,
            [capsule.id]
          );
          capsule.isDelivered = 1;
          capsule.openedAt = now.toISOString();

          // Decrypt the message before sending the email
          let decryptedMessage = "";
          if (capsule.message) {
            try {
              const [iv, encrypted] = capsule.message.split(":");
              decryptedMessage = crypto.decrypt(encrypted, iv);
            } catch (e) {
              decryptedMessage = "[Error decrypting message]";
            }
          }
          // Debug: Log decrypted message and capsule type before sending email
          console.log("[DEBUG] Capsule delivery:", {
            capsuleId: capsule.id,
            title: capsule.title,
            decryptedMessage,
            capsuleType: capsule.type,
            userEmail: capsule.userEmail,
          });
          // Send delivery email
          const deliveryMail = {
            to: capsule.userEmail,
            subject: `Your Time Capsule \"${capsule.title}\" has been unlocked!`,
            text: `Hi! Your time capsule \"${capsule.title}\" has been unlocked.\n\nMessage: ${decryptedMessage}\nType: ${capsule.type}`,
          };
          console.log("Delivery email payload:", {
            to: deliveryMail.to,
            subject: deliveryMail.subject,
            textPreview: deliveryMail.text.slice(0, 200),
          });
          sendEmail(deliveryMail).catch((emailErr) => {
            console.error("Error sending delivery email:", emailErr);
          });
        }

        // Decrypt the message
        if (capsule.message) {
          const [iv, encrypted] = capsule.message.split(":");
          capsule.message = crypto.decrypt(encrypted, iv);
        }

        return capsule;
      });

      res.json(updatedCapsules);
    }
  );
};

// POST /api/capsule/simulate → Simulate all triggers
exports.simulateTriggers = async (req, res) => {
  db.all(
    `SELECT * FROM capsules WHERE isDelivered = 0`,
    [],
    async (err, capsules) => {
      if (err) return res.status(500).json({ error: err.message });

      const now = new Date();
      let deliveredCount = 0;

      for (const capsule of capsules) {
        let shouldDeliver = false;

        if (capsule.triggerType === "date") {
          const triggerDate = new Date(capsule.triggerValue);
          if (now >= triggerDate) shouldDeliver = true;
        }

        if (
          capsule.triggerType === "location" &&
          capsule.triggerValue.toLowerCase() === "paris"
        ) {
          shouldDeliver = true; // Simulated presence in Paris
        }

        if (capsule.triggerType === "milestone") {
          // Fetch user's GitHub token
          await new Promise((resolve) => {
            db.get(
              "SELECT githubToken FROM users WHERE id = ?",
              [capsule.userId],
              async (userErr, user) => {
                if (userErr || !user || !user.githubToken) {
                  console.warn(
                    `No GitHub token for user ${capsule.userId}, skipping capsule ${capsule.id}`
                  );
                  resolve();
                  return;
                }
                try {
                  const currentPRs = await getPRCount(user.githubToken);
                  const target = parseInt(capsule.triggerValue);
                  if (currentPRs >= target) shouldDeliver = true;
                } catch (apiErr) {
                  console.error(
                    `GitHub API error for capsule ${capsule.id}:`,
                    apiErr.message
                  );
                }
                resolve();
              }
            );
          });
        }

        if (shouldDeliver) {
          db.run(
            "UPDATE capsules SET isDelivered = 1, openedAt = datetime('now') WHERE id = ?",
            [capsule.id]
          );
          deliveredCount++;
          if (capsule.triggerType === "milestone") {
            dbUser.get(
              "SELECT email FROM users WHERE id = ?",
              [capsule.userId],
              async (userErr, userRow) => {
                const to = (userRow && userRow.email) || capsule.userEmail;
                if (to) {
                  try {
                    let decryptedMessage = "";
                    try {
                      if (capsule.message) {
                        const [iv, encrypted] = capsule.message.split(":");
                        decryptedMessage = crypto.decrypt(encrypted, iv);
                      }
                    } catch (dErr) {
                      decryptedMessage = "[Error decrypting message]";
                    }
                    await sendEmail({
                      to,
                      subject: `🎉 Your Time Capsule is Unlocked!`,
                      text: `Congrats! Your capsule "${
                        capsule.title
                      }" has been unlocked.\n\nMessage: ${decryptedMessage}\nCapsule Type: ${
                        capsule.type || capsule.triggerType
                      }\n\nVisit the app to view it.`,
                    });
                  } catch (emailErr) {
                    console.error(
                      `Error sending milestone email for capsule ID: ${capsule.id}`,
                      emailErr
                    );
                  }
                }
              }
            );
          }
          db.run(
            "DELETE FROM capsules WHERE id = ?",
            [capsule.id],
            (deleteErr) => {
              if (deleteErr) {
                console.error("Error deleting capsule:", deleteErr);
              } else {
                console.log(
                  `Capsule with ID ${capsule.id} deleted successfully.`
                );
              }
            }
          );
        }
      }
      res.json({ deliveredCount });
    }
  );
};

// Simulate GitHub PR milestone (for milestone-based capsules)
exports.simulatePRMilestone = async (req, res) => {
  const { userId, targetPRCount } = req.body;
  db.all(
    `SELECT * FROM capsules WHERE userId = ? AND triggerType = 'milestone'`,
    [userId],
    async (err, capsules) => {
      if (err) return res.status(500).json({ error: err.message });
      let deliveredCount = 0;
      for (const capsule of capsules) {
        await new Promise((resolve) => {
          db.get(
            "SELECT githubToken FROM users WHERE id = ?",
            [userId],
            async (userErr, user) => {
              if (userErr || !user || !user.githubToken) {
                console.warn(
                  `No GitHub token for user ${userId}, skipping capsule ${capsule.id}`
                );
                resolve();
                return;
              }
              try {
                const currentPRs = await getPRCount(user.githubToken);
                if (parseInt(capsule.triggerValue) <= currentPRs) {
                  db.run(
                    "UPDATE capsules SET isDelivered = 1, openedAt = datetime('now') WHERE id = ?",
                    [capsule.id]
                  );
                  deliveredCount++;
                  // Send delivery email with decrypted message and type
                  dbUser.get(
                    "SELECT email FROM users WHERE id = ?",
                    [capsule.userId],
                    async (userErr, userRow) => {
                      const to =
                        (userRow && userRow.email) || capsule.userEmail;
                      if (to) {
                        try {
                          let decryptedMessage = "";
                          try {
                            if (capsule.message) {
                              const [iv, encrypted] =
                                capsule.message.split(":");
                              decryptedMessage = crypto.decrypt(encrypted, iv);
                            }
                          } catch (dErr) {
                            decryptedMessage = "[Error decrypting message]";
                          }
                          const deliveryMail = {
                            to,
                            subject: `🎉 Your Time Capsule is Unlocked at ${location}!`,
                            text: `Hi! You have just unlocked your time capsule "${
                              capsule.title
                            }" by arriving at ${location}.\n\nMessage: ${decryptedMessage}\nCapsule Type: ${
                              capsule.type || capsule.triggerType
                            }\n\nVisit the app to view more.`,
                          };
                          console.log("Delivery email payload:", {
                            to: deliveryMail.to,
                            subject: deliveryMail.subject,
                            textPreview: deliveryMail.text.slice(0, 200),
                          });
                          await sendEmail({
                            to,
                            subject: `🎉 Your Time Capsule is Unlocked!`,
                            text: `Congrats! Your capsule "${
                              capsule.title
                            }" has been unlocked.\n\nMessage: ${decryptedMessage}\nCapsule Type: ${
                              capsule.type || capsule.triggerType
                            }\n\nVisit the app to view it.`,
                          });
                          console.log(
                            `Milestone delivery email sent for capsule ID: ${capsule.id}`
                          );
                        } catch (emailErr) {
                          console.error(
                            `Error sending milestone email for capsule ID: ${capsule.id}`,
                            emailErr
                          );
                        }
                      }
                    }
                  );
                }
              } catch (apiErr) {
                console.error(
                  `GitHub API error for capsule ${capsule.id}:`,
                  apiErr.message
                );
              }
              resolve();
            }
          );
        });
      }
      res.json({ deliveredCount });
    }
  );
};

// POST /api/capsule/checkin → Simulate location check-in and deliver capsules
exports.checkInLocation = (req, res) => {
  const { userId, location } = req.body;
  if (!userId || !location) {
    return res.status(400).json({ error: "userId and location are required." });
  }
  const dbModel = require("../models/Capsule");
  dbModel.all(
    `SELECT * FROM capsules WHERE userId = ? AND triggerType = 'location' AND isDelivered = 0`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      let deliveredCount = 0;
      let emailPromises = [];
      rows.forEach((capsule) => {
        if (
          capsule.triggerValue &&
          capsule.triggerValue.toLowerCase() === location.toLowerCase()
        ) {
          dbModel.run(
            `UPDATE capsules SET isDelivered = 1, openedAt = datetime('now') WHERE id = ?`,
            [capsule.id],
            (err) => {
              if (err) {
                console.error(err.message);
              } else {
                deliveredCount++;
                // Send email to user
                emailPromises.push(
                  new Promise((resolve) => {
                    dbUser.get(
                      "SELECT email FROM users WHERE id = ?",
                      [userId],
                      async (userErr, user) => {
                        const to = (user && user.email) || capsule.userEmail;
                        if (to) {
                          try {
                            // Decrypt stored message
                            let decryptedMessage = "";
                            try {
                              if (capsule.message) {
                                const [iv, encrypted] =
                                  capsule.message.split(":");
                                decryptedMessage = crypto.decrypt(
                                  encrypted,
                                  iv
                                );
                              }
                            } catch (dErr) {
                              decryptedMessage = "[Error decrypting message]";
                            }

                            await sendEmail({
                              to,
                              subject: `🎉 Your Time Capsule is Unlocked at ${location}!`,
                              text: `Hi! You have just unlocked your time capsule "${
                                capsule.title
                              }" by arriving at ${location}.\n\nMessage: ${decryptedMessage}\nCapsule Type: ${
                                capsule.type || capsule.triggerType
                              }\n\nVisit the app to view more.`,
                            });
                            console.log(
                              `Location delivery email sent for capsule ID: ${capsule.id}`
                            );
                          } catch (emailErr) {
                            console.error(
                              `Error sending location delivery email for capsule ID: ${capsule.id}`,
                              emailErr
                            );
                          }
                        }
                        resolve();
                      }
                    );
                  })
                );
              }
            }
          );
        }
      });
      Promise.all(emailPromises).then(() => {
        res.json({
          delivered: deliveredCount > 0,
          count: deliveredCount,
          message:
            deliveredCount > 0
              ? `Delivered ${deliveredCount} capsule(s) at ${location}.`
              : "No capsules to deliver at this location.",
        });
      });
    }
  );
};