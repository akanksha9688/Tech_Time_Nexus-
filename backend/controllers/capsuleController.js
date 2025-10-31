// const db = require("../models/Capsule");
// const { encrypt, decrypt } = require("../utils/crypto");
// const axios = require("axios");
// const nodemailer = require("nodemailer");

// const db = require('../models/Capsule');
// const { encrypt, decrypt } = require('../utils/crypto');
// const axios = require('axios');
// const nodemailer = require('nodemailer');
// const crypto = require("../utils/crypto");
// const { getPRCount } = require('../services/githubService');
// const sendEmail = require('../utils/sendEmail');
// const dbUser = require('../models/User');

// // POST /api/capsule → Create a new capsule
// exports.createCapsule = (req, res) => {
//   const { title, message, triggerType, triggerValue } = req.body;
//   // Get user email from req.user or fallback
//   const userEmail = req.user.email || req.user.username || "user@example.com";
//   const encryptedMsg = encrypt(message);

//   const query = `
//     INSERT INTO capsules (userId, title, message, triggerType, triggerValue, userEmail, createdAt)
//     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
//   `;
//   db.run(query, [req.user.id, title, encryptedMsg, triggerType, triggerValue, userEmail], function (err) {
//     if (err) return res.status(400).json({ error: err.message });
//     res.json({ id: this.lastID, title });
//   });
// };

// // GET /api/capsule/my → View user's capsules
// exports.getMyCapsules = (req, res) => {
//   console.log("Fetching capsules for user:", req.user.id); // Debugging log
//   db.all(`SELECT * FROM capsules WHERE userId = ?`, [req.user.id], async (err, rows) => {
//     if (err) {
//       console.error("Database error:", err); // Debugging log
//       return res.status(500).json({ error: err.message });
//     }

//     const now = new Date();
//     // For each capsule, check if it should be delivered (date trigger)
//     const updatePromises = rows.map(row => {
//       if (
//         row.triggerType === "date" &&
//         new Date(row.triggerValue).getTime() <= now.getTime() &&
//         !row.isDelivered
//       ) {
//         return new Promise((resolve) => {
//           db.run(
//             `UPDATE capsules SET isDelivered = 1, openedAt = datetime('now') WHERE id = ?`,
//             [row.id],
//             () => {
//               row.isDelivered = 1;
//               row.openedAt = now.toISOString();
//               resolve();
//             }
//           );
//         });
//       }
//       return Promise.resolve();
//     });

//     await Promise.all(updatePromises);

//     // Fetch updated capsules after any delivery
//     db.all(`SELECT * FROM capsules WHERE userId = ?`, [req.user.id], (err2, updatedRows) => {
//       if (err2) {
//         return res.status(500).json({ error: err2.message });
//       }
//       const decrypted = updatedRows.map(row => {
//         if (row.isDelivered) {
//           // Update openedAt if not already recorded
//           if (!row.openedAt) {
//             db.run(`UPDATE capsules SET openedAt = datetime('now') WHERE id = ?`, [row.id]);
//           }
//           // Decrypt message
//           try {
//             row.message = decrypt(row.message);
//           } catch (e) {
//             row.message = "[Error decrypting message]";
//           }
//           return row;
//         } else {
//           return { ...row, message: "🔒 Locked until trigger is met." };
//         }
//       });
//       res.json(decrypted);
//     });
//   });
// };

// // Update fetch logic to mark capsules as delivered
// exports.getCapsules = (req, res) => {
//   const userId = req.user.id;
//   const now = new Date().toISOString();

//   db.all(
//     `SELECT * FROM capsules WHERE userId = ?`,
//     [userId],
//     (err, capsules) => {
//       if (err) {
//         console.error("Error fetching capsules:", err);
//         return res.status(500).json({ error: "Failed to fetch capsules." });
//       }

//       const updatedCapsules = capsules.map((capsule) => {
//         const now = new Date();

//         // Adjust the comparison to handle exact matches and timezone differences
//         if (
//           capsule.triggerType === "date" &&
//           new Date(capsule.triggerValue).getTime() <= now.getTime() &&
//           !capsule.isDelivered
//         ) {
//           db.run(
//             `UPDATE capsules SET isDelivered = 1, openedAt = datetime('now') WHERE id = ?`,
//             [capsule.id]
//           );
//           capsule.isDelivered = 1;
//           capsule.openedAt = now.toISOString();
//         }

//         // Decrypt the message
//         if (capsule.message) {
//           const [iv, encrypted] = capsule.message.split(":");
//           capsule.message = crypto.decrypt(encrypted, iv);
//         }

//         return capsule;
//       });

//       res.json(updatedCapsules);
//     }
//   );
// };

// // POST /api/capsule/simulate → Simulate all triggers
// exports.simulateTriggers = async (req, res) => {
//   db.all(`SELECT * FROM capsules WHERE isDelivered = 0`, [], async (err, capsules) => {
//     if (err) return res.status(500).json({ error: err.message });

//     const now = new Date();
//     let deliveredCount = 0;

//     for (const capsule of capsules) {
//       let shouldDeliver = false;

//       if (capsule.triggerType === "date") {
//         const triggerDate = new Date(capsule.triggerValue);
//         if (now >= triggerDate) shouldDeliver = true;
//       }

//       if (capsule.triggerType === "location" && capsule.triggerValue.toLowerCase() === "paris") {
//         shouldDeliver = true; // Simulated presence in Paris
//       }

//       if (capsule.triggerType === "milestone") {
//         // Fetch user's GitHub token
//         await new Promise((resolve) => {
//           db.get('SELECT githubToken FROM users WHERE id = ?', [capsule.userId], async (userErr, user) => {
//             if (userErr || !user || !user.githubToken) {
//               console.warn(`No GitHub token for user ${capsule.userId}, skipping capsule ${capsule.id}`);
//               resolve();
//               return;
//             }
//             try {
//               const currentPRs = await getPRCount(user.githubToken);
//               const target = parseInt(capsule.triggerValue);
//               if (currentPRs >= target) shouldDeliver = true;
//             } catch (apiErr) {
//               console.error(`GitHub API error for capsule ${capsule.id}:`, apiErr.message);
//             }
//             resolve();
//           });
//         });
//       }

//       if (shouldDeliver) {
//         db.run(
//           'UPDATE capsules SET isDelivered = 1, openedAt = datetime(\'now\') WHERE id = ?',
//           [capsule.id]
//         );
//         deliveredCount++;
//         if (capsule.triggerType === "milestone") {
//           sendCongratulatoryEmail(capsule.userId);
//         }
//         db.run('DELETE FROM capsules WHERE id = ?', [capsule.id], (deleteErr) => {
//           if (deleteErr) {
//             console.error("Error deleting capsule:", deleteErr);
//           } else {
//             console.log(`Capsule with ID ${capsule.id} deleted successfully.`);
//           }
//         });
//       }
//     }
//     res.json({ deliveredCount });
//   });
// };

// // Simulate GitHub PR milestone (for milestone-based capsules)
// exports.simulatePRMilestone = async (req, res) => {
//   const { userId, targetPRCount } = req.body;
//   db.all(`SELECT * FROM capsules WHERE userId = ? AND triggerType = 'milestone'`, [userId], async (err, capsules) => {
//     if (err) return res.status(500).json({ error: err.message });
//     let deliveredCount = 0;
//     for (const capsule of capsules) {
//       await new Promise((resolve) => {
//         db.get('SELECT githubToken FROM users WHERE id = ?', [userId], async (userErr, user) => {
//           if (userErr || !user || !user.githubToken) {
//             console.warn(`No GitHub token for user ${userId}, skipping capsule ${capsule.id}`);
//             resolve();
//             return;
//           }
//           try {
//             const currentPRs = await getPRCount(user.githubToken);
//             if (parseInt(capsule.triggerValue) <= currentPRs) {
//               db.run(
//                 'UPDATE capsules SET isDelivered = 1, openedAt = datetime(\'now\') WHERE id = ?',
//                 [capsule.id]
//               );
//               deliveredCount++;
//               sendCongratulatoryEmail(userId);
//             }
//           } catch (apiErr) {
//             console.error(`GitHub API error for capsule ${capsule.id}:`, apiErr.message);
//           }
//           resolve();
//         });
//       });
//     }
//     res.json({ deliveredCount });
//   });
// };

// // POST /api/capsule/checkin → Simulate location check-in and deliver capsules
// exports.checkInLocation = (req, res) => {
//   const { userId, location } = req.body;
//   if (!userId || !location) {
//     return res.status(400).json({ error: 'userId and location are required.' });
//   }
//   const dbModel = require('../models/Capsule');
//   dbModel.all(
//     `SELECT * FROM capsules WHERE userId = ? AND triggerType = 'location' AND isDelivered = 0`,
//     [userId],
//     (err, rows) => {
//       if (err) {
//         return res.status(500).json({ error: err.message });
//       }
//       let deliveredCount = 0;
//       let emailPromises = [];
//       rows.forEach((capsule) => {
//         if (capsule.triggerValue && capsule.triggerValue.toLowerCase() === location.toLowerCase()) {
//           dbModel.run(
//             `UPDATE capsules SET isDelivered = 1, openedAt = datetime('now') WHERE id = ?`,
//             [capsule.id],
//             (err) => {
//               if (err) {
//                 console.error(err.message);
//               } else {
//                 deliveredCount++;
//                 // Send email to user
//                 emailPromises.push(new Promise((resolve) => {
//                   dbUser.get('SELECT email FROM users WHERE id = ?', [userId], async (userErr, user) => {
//                     const to = (user && user.email) || capsule.userEmail;
//                     if (to) {
//                       try {
//                         await sendEmail({
//                           to,
//                           subject: `🎉 Your Time Capsule is Unlocked at ${location}!`,
//                           text: `Hi! You have just unlocked your time capsule "${capsule.title}" by arriving at ${location}. Visit the app to view your message!`,
//                         });
//                         console.log(`Location delivery email sent for capsule ID: ${capsule.id}`);
//                       } catch (emailErr) {
//                         console.error(`Error sending location delivery email for capsule ID: ${capsule.id}`, emailErr);
//                       }
//                     }
//                     resolve();
//                   });
//                 }));
//               }
//             }
//           );
//         }
//       });
//       Promise.all(emailPromises).then(() => {
//         res.json({ delivered: deliveredCount > 0, count: deliveredCount, message: deliveredCount > 0 ? `Delivered ${deliveredCount} capsule(s) at ${location}.` : 'No capsules to deliver at this location.' });
//       });
//     }
//   );
// };




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
  
  console.log("📝 Creating capsule for user:", req.user.id, "| Email:", userEmail);
  
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
      if (err) {
        console.error("❌ Error creating capsule:", err);
        return res.status(400).json({ error: err.message });
      }
      
      console.log("✅ Capsule created, ID:", this.lastID);
      
      // Send creation email (title only) - log payload
      const creationMail = {
        to: userEmail,
        subject: `Your Time Capsule "${title}" has been created!`,
        text: `Hi! Your time capsule "${title}" was successfully created.\n\nYou will be notified when it is unlocked.`,
      };
      
      sendEmail(creationMail)
        .then(() => {
          console.log("✅ Creation email sent to:", userEmail);
        })
        .catch((emailErr) => {
          console.error("❌ Failed to send creation email:", emailErr.message);
        });
      
      res.json({ id: this.lastID, title });
    }
  );
};

// GET /api/capsule/my → View user's capsules
exports.getMyCapsules = (req, res) => {
  console.log("========================================");
  console.log("📦 FETCHING CAPSULES FOR USER:", req.user.id);
  console.log("========================================");
  
  // Prevent caching - force fresh data every time
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Fetch user's capsules, deliver due date-based ones, send emails, then return updated list
  db.all(
    `SELECT * FROM capsules WHERE userId = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ error: err.message });
      }
      
      const nowMs = Date.now();
      const nowDate = new Date(nowMs);
      console.log("📅 Current server time:", nowDate.toISOString());
      console.log("📦 Found", rows.length, "total capsules");
      
      if (rows.length === 0) {
        console.log("⚠️ No capsules found for this user");
        return res.json([]);
      }
      
      // Log each capsule's status
      rows.forEach((row, index) => {
        console.log(`\n--- Capsule ${index + 1} ---`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Title: "${row.title}"`);
        console.log(`  Trigger Type: ${row.triggerType}`);
        console.log(`  Trigger Value: ${row.triggerValue}`);
        console.log(`  Is Delivered: ${row.isDelivered}`);
        console.log(`  User Email: ${row.userEmail}`);
        
        if (row.triggerType === "date") {
          const triggerTime = new Date(row.triggerValue).getTime();
          const isPast = triggerTime <= nowMs;
          const diff = nowMs - triggerTime;
          const minutesAgo = Math.floor(diff / 1000 / 60);
          
          console.log(`  Trigger Time: ${new Date(row.triggerValue).toISOString()}`);
          console.log(`  Is Past Due: ${isPast} (${isPast ? minutesAgo + ' minutes ago' : 'future'})`);
          console.log(`  Should Unlock: ${isPast && !row.isDelivered ? 'YES ✓' : 'NO'}`);
        }
      });
      
      // Prepare update and email promises for rows due
      const promises = rows.map((row) => {
        if (
          row.triggerType === "date" &&
          !row.isDelivered &&
          new Date(row.triggerValue).getTime() <= nowMs
        ) {
          console.log(`\n🔓 UNLOCKING CAPSULE ${row.id}: "${row.title}"`);
          return new Promise((resolve) => {
            // Step 1: Update database with EXPLICIT error handling
            console.log(`  Step 1: Updating database for capsule ${row.id}...`);
            
            const updateSQL = `UPDATE capsules SET isDelivered = 1, openedAt = ? WHERE id = ?`;
            const updateParams = [new Date().toISOString(), row.id];
            
            console.log(`  SQL: ${updateSQL}`);
            console.log(`  Params:`, updateParams);
            
            db.run(updateSQL, updateParams, function(updateErr) {
                if (updateErr) {
                  console.error(`  ❌ DATABASE UPDATE FAILED for capsule ${row.id}:`, updateErr.message);
                  console.error(`  Error details:`, updateErr);
                  resolve();
                  return;
                }
                
                console.log(`  ✅ Database UPDATE command executed (changes: ${this.changes})`);
                
                if (this.changes === 0) {
                  console.error(`  ⚠️⚠️⚠️ WARNING: UPDATE affected 0 rows! Capsule ${row.id} may not exist!`);
                }
                
                // Step 2: VERIFY the update immediately
                db.get(`SELECT id, isDelivered, openedAt FROM capsules WHERE id = ?`, [row.id], (verifyErr, verifyRow) => {
                  if (verifyErr) {
                    console.error(`  ❌ VERIFICATION FAILED:`, verifyErr.message);
                  } else if (!verifyRow) {
                    console.error(`  ❌ CAPSULE ${row.id} NOT FOUND after update!`);
                  } else {
                    console.log(`  🔍 VERIFICATION: Capsule ${row.id} isDelivered=${verifyRow.isDelivered}, openedAt=${verifyRow.openedAt}`);
                    if (verifyRow.isDelivered !== 1) {
                      console.error(`  ⚠️⚠️⚠️ CRITICAL: Database update did NOT persist! isDelivered is still ${verifyRow.isDelivered}`);
                    }
                  }
                });
                
                // Step 3: Decrypt message
                console.log(`  Step 3: Decrypting message...`);
                let decryptedMsg = "";
                if (row.message) {
                  try {
                    decryptedMsg = decrypt(row.message);
                    console.log(`  ✅ Message decrypted (length: ${decryptedMsg.length} chars)`);
                  } catch (decryptErr) {
                    console.error(`  ❌ Decryption error:`, decryptErr.message);
                    decryptedMsg = "[Error decrypting message]";
                  }
                } else {
                  console.warn(`  ⚠️ No message found for capsule ${row.id}`);
                }
                
                // Step 4: Send delivery email
                console.log(`  Step 4: Sending unlock email to ${row.userEmail}...`);
                if (!row.userEmail) {
                  console.error(`  ❌ No email address for capsule ${row.id}!`);
                  resolve();
                  return;
                }
                
                const mail = {
                  to: row.userEmail,
                  subject: `Your Time Capsule "${row.title}" has been unlocked! 🎉`,
                  text: `Hi! Your time capsule "${row.title}" has been unlocked.\n\nMessage: ${decryptedMsg}\n\nType: ${row.type || row.triggerType}\n\nView it now at: ${process.env.CLIENT_URL || 'your dashboard'}`,
                };
                
                console.log(`  📧 Sending unlock email to: ${mail.to}`);
                sendEmail(mail)
                  .then(() => {
                    console.log(`  ✅ Email sent successfully for capsule ${row.id}`);
                    resolve();
                  })
                  .catch((mailErr) => {
                    console.error(`  ❌ Email failed for capsule ${row.id}:`, mailErr.message);
                    resolve(); // Don't block on email failure
                  });
              }
            );
          });
        }
        return Promise.resolve();
      });
      // Wait for all updates/emails to complete
      Promise.all(promises).then(() => {
        console.log("\n✅ All capsule updates completed, fetching fresh data...");
        
        // CRITICAL: Small delay to ensure database writes are committed to disk
        setTimeout(() => {
          // Fetch updated capsules and decrypt for response
          db.all(
            `SELECT * FROM capsules WHERE userId = ?`,
            [req.user.id],
            (err2, updatedRows) => {
              if (err2) {
                console.error("❌ Error fetching updated capsules:", err2);
                return res.status(500).json({ error: err2.message });
              }
              
              console.log(`\n📦 Fetched ${updatedRows.length} capsules after updates`);
              
              // Log delivered status for debugging
              updatedRows.forEach((r, i) => {
                console.log(`  Capsule ${i+1} (ID: ${r.id}): isDelivered=${r.isDelivered}, title="${r.title}"`);
              });
              
              const result = updatedRows.map((r) => {
                if (r.isDelivered) {
                  try {
                    r.message = decrypt(r.message);
                  } catch {
                    r.message = "[Error decrypting message]";
                  }
                  return r;
                }
                return { ...r, message: "🔒 Locked until trigger is met." };
              });
              
              console.log("✅ Sending response to client\n========================================");
              res.json(result);
            }
          );
        }, 100); // 100ms delay to ensure disk write completes
      });
    }
  );
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
