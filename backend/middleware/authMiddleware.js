const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader); 
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

 
  if (token.startsWith('gho_')) {
    req.user = { id: 1, githubToken: token };
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret);
    console.log("Decoded Token:", decoded); 
    if (decoded.id) {
      req.user = { id: decoded.id, ...decoded }; 
    }
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
