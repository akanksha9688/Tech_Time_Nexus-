const express = require("express");
const router = express.Router();
const {
  getAnalyticsSummary,
  getUserAnalytics,
} = require("../controllers/analyticsController");

// Route: GET /api/analytics/
// Purpose: Summary analytics including created, opened, and reminders
router.get("/", getAnalyticsSummary);

// Route: GET /api/analytics/user/:userId
// Purpose: Per-user analytics grouped by trigger type
router.get("/user/:userId", getUserAnalytics);

module.exports = router;
