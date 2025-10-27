require('dotenv').config(); // Load environment variables

const express = require('express');
const passport = require('passport'); // ✅ Only declare once

const app = require('./app');
const cronJob = require('./utils/cronJob');
const analyticsRoutes = require('./routes/analytics');
const capsuleRoutes = require('./routes/capsuleRoutes');

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session()); // Optional: only if you're using sessions

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/capsule', capsuleRoutes);

// Start cron job
cronJob(); // or cronJob.start() depending on how you exported it

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
