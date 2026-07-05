const bcrypt = require('bcrypt');
const db = require('../db/connection');

const SALT_ROUNDS = 10;
const CREATABLE_ROLES = ['personel', 'mobile'];

function serialize(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    isActive: !!user.is_active,
    createdAt: user.created_at,
  };
}

// Admin hesaplarini bu ekrandan yonetmiyoruz; sadece personel/mobil hesaplar listelenir.
function list(req, res) {
  const rows = db
    .prepare(
      "SELECT * FROM users WHERE is_active = 1 AND role IN ('personel', 'mobile') ORDER BY role ASC, display_name ASC"
    )
    .all();
  res.json(rows.map(serialize));
}

function create(req, res) {
  const { username, password, displayName, role } = req.body || {};

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Kullanıcı adı zorunludur.' });
  }
  if (!password || password.length < 3) {
    return res.status(400).json({ error: 'Şifre en az 3 karakter olmalıdır.' });
  }
  if (!displayName || !displayName.trim()) {
    return res.status(400).json({ error: 'Görünen ad zorunludur.' });
  }
  if (!CREATABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Kullanıcı tipi "personel" veya "mobil" olmalıdır.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
  if (existing) {
    return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' });
  }

  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  const result = db
    .prepare('INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)')
    .run(username.trim(), hash, role, displayName.trim());

  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(serialize(created));
}

function update(req, res) {
  const { id } = req.params;
  const { username, password, displayName, role } = req.body || {};

  const existing = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(id);
  if (!existing || existing.role === 'admin') {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }

  if (username !== undefined && username.trim() && username.trim() !== existing.username) {
    const clash = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username.trim(), id);
    if (clash) {
      return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' });
    }
  }
  if (role !== undefined && !CREATABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Kullanıcı tipi "personel" veya "mobil" olmalıdır.' });
  }
  if (password !== undefined && password !== '' && password.length < 3) {
    return res.status(400).json({ error: 'Şifre en az 3 karakter olmalıdır.' });
  }

  const newUsername = username !== undefined && username.trim() ? username.trim() : existing.username;
  const newDisplayName = displayName !== undefined && displayName.trim() ? displayName.trim() : existing.display_name;
  const newRole = role !== undefined ? role : existing.role;
  const newPasswordHash =
    password !== undefined && password !== '' ? bcrypt.hashSync(password, SALT_ROUNDS) : existing.password_hash;

  db.prepare(
    'UPDATE users SET username = ?, display_name = ?, role = ?, password_hash = ? WHERE id = ?'
  ).run(newUsername, newDisplayName, newRole, newPasswordHash, id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json(serialize(updated));
}

function remove(req, res) {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(id);
  if (!existing || existing.role === 'admin') {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }

  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
