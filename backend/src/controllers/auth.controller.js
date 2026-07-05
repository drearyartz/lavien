const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur.' });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE username = ? AND is_active = 1')
    .get(username);

  if (!user) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  const passwordOk = bcrypt.compareSync(password, user.password_hash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.display_name,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({ token, user: payload });
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, me };
