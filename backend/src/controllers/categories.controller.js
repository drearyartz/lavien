const db = require('../db/connection');

const NAME_MAX_LENGTH = 40;

function list(req, res) {
  const rows = db
    .prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC')
    .all();
  res.json(rows);
}

function create(req, res) {
  const { name, sortOrder, allowModifiers } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Kategori adı zorunludur.' });
  }
  if (name.trim().length > NAME_MAX_LENGTH) {
    return res.status(400).json({ error: `Kategori adı en fazla ${NAME_MAX_LENGTH} karakter olabilir.` });
  }

  const result = db
    .prepare('INSERT INTO categories (name, sort_order, allow_modifiers) VALUES (?, ?, ?)')
    .run(name.trim(), sortOrder || 0, allowModifiers ? 1 : 0);

  const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
}

function update(req, res) {
  const { id } = req.params;
  const { name, sortOrder, allowModifiers } = req.body || {};

  const existing = db.prepare('SELECT * FROM categories WHERE id = ? AND is_active = 1').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Kategori bulunamadı.' });
  }

  if (name !== undefined && name.trim().length > NAME_MAX_LENGTH) {
    return res.status(400).json({ error: `Kategori adı en fazla ${NAME_MAX_LENGTH} karakter olabilir.` });
  }

  const newName = name !== undefined && name.trim() ? name.trim() : existing.name;
  const newSortOrder = sortOrder !== undefined ? sortOrder : existing.sort_order;
  const newAllowModifiers = allowModifiers !== undefined ? (allowModifiers ? 1 : 0) : existing.allow_modifiers;

  db.prepare('UPDATE categories SET name = ?, sort_order = ?, allow_modifiers = ? WHERE id = ?').run(
    newName,
    newSortOrder,
    newAllowModifiers,
    id
  );

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json(updated);
}

function remove(req, res) {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM categories WHERE id = ? AND is_active = 1').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Kategori bulunamadı.' });
  }

  db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').run(id);
  // Kategori altındaki urunleri de pasif hale getir.
  db.prepare('UPDATE products SET is_active = 0 WHERE category_id = ?').run(id);

  res.status(204).send();
}

module.exports = { list, create, update, remove };
