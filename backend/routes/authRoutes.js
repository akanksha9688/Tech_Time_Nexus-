const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const passport = require("passport");

router.post('/register', register);
router.post('/login', login);

// GitHub OAuth initiation
router.get('/auth/github', passport.authenticate('github', {
  scope: ['repo'], // Request necessary scopes
}));

// GitHub OAuth callback
router.get("/github/auth/github/callback", passport.authenticate("github", {
  failureRedirect: `${process.env.CLIENT_URL}/login`,
}), (req, res) => {
  const token = req.user.token; // Assuming token is attached to the user object
  res.redirect(`${process.env.CLIENT_URL}/github-capsule?token=${token}&username=${req.user.username}`);
});

// Endpoint to check GitHub connection status
router.get('/github/status', (req, res) => {
  if (req.user && req.user.githubId) {
    res.json({ connected: true });
  } else {
    res.json({ connected: false });
  }
});

module.exports = router;
