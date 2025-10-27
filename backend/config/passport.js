const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
  // Here, you would typically find or create a user in your database
  const user = {
    githubId: profile.id,
    username: profile.username,
    token: accessToken,
  };
  return done(null, user);
}));

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.githubId); // Store the GitHub ID in the session
});

// Deserialize user from the session
passport.deserializeUser((id, done) => {
  // In a real app, you would fetch the user from the database using the ID
  const user = { githubId: id }; // Mock user object for now
  done(null, user);
});
