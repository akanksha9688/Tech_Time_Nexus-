// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const session = require("express-session");
// const passport = require("passport");
// require('./config/passport');

// const capsuleRoutes = require('./routes/capsuleRoutes');
// const authRoutes = require('./routes/authRoutes');
// const analyticsRoutes = require('./routes/analytics');

// const startCronJob = require('./utils/cronJob');

// const app = express();

// // Start scheduled jobs (e.g., reminder notifications)
// startCronJob();

// // Middleware
// app.use(cors({
//   origin: process.env.CLIENT_URL || "http://localhost:3000",
//   credentials: true,
// }));
// app.use(express.json()); // Replaces body-parser

// // Add session middleware
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "default_secret", // Use a secure secret in production
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: false }, // Set to true if using HTTPS
//   })
// );

// // Initialize Passport and restore authentication state, if any
// app.use(passport.initialize());
// app.use(passport.session());

// // Routes
// app.use('/api/capsule', capsuleRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/analytics', analyticsRoutes);

// // Optional: Catch-all route or error handler can go here

// module.exports = app;

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require("express-session");
const passport = require("passport");
require('./config/passport');

const capsuleRoutes = require('./routes/capsuleRoutes');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analytics');

const startCronJob = require('./utils/cronJob');

const app = express();

// Start scheduled jobs (e.g., reminder notifications)
startCronJob();

// ✅ Allowed origins (localhost + production Vercel + preview Vercel)
const allowedOrigins = [
  "http://localhost:3000",
  "https://time-jar-running-mail.vercel.app",
];

// ✅ CORS setup
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin || // allow Postman/cURL (no origin header)
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(new URL(origin).hostname) // allow preview URLs
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
  })
);

// ✅ Middleware for JSON
app.use(express.json());

// ✅ Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret", // strong secret in prod
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      httpOnly: true, // prevent JS access
      sameSite: "none", // needed for cross-domain cookies
    },
  })
);

// ✅ Passport setup
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use('/api/capsule', capsuleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message);
  res.status(500).json({ error: err.message });
});

module.exports = app;

