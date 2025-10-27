const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models/User");

const secret = process.env.JWT_SECRET;

exports.register = (req, res) => {
  const { username, email, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);

  const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
  db.run(query, [username, email, hashed], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, username, email });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) return res.status(404).json({ error: "User not found" });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
      expiresIn: "7d",
    });
    res.json({ token, username: user.username, email: user.email });
  });
};
