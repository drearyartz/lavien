const db = require('../db/connection');

const NAME_MAX_LENGTH = 60;

function list(req, res) {
  const { categoryId } = req.query;
  let rows;
  if (categoryId) {
    rows = db
      .prepare(
        'SELECT * FROM products WHERE is_active = 1 AND category_id = ? ORDER BY name ASC'
      )
      .all(categoryId);
  } else {
    rows = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY category_id ASC, name ASC').all();
  }
  res.json(rows);
}

function create(req, res) {
  const { categoryId, name, price } = req.body || {};
  if (!categoryId || !name || !name.trim() || price === undefined || price === null) {
    return res.status(400).json({ error: 'Kategori, ürün adı ve fiyat zorunludur.' });
  }
  if (name.trim().length > NAME_MAX_LENGTH) {
    return res.status(400).json({ error: `Ürün adı en fazla ${NAME_MAX_LENGTH} karakter olabilir.` });
  }
  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: 'Fiyat geçerli bir sayı olmalıdır.' });
  }

  const category = db.prepare('SELECT * FROM categories WHERE id = ? AND is_active = 1').get(categoryId);
  if (!category) {
    return res.status(400).json({ error: 'Geçersiz kategori.' });
  }

  const result = db
    .prepare('INSERT INTO products (category_id, name, price) VALUES (?, ?, ?)')
    .run(categoryId, name.trim(), numericPrice);

  const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
}

function update(req, res) {
  const { id } = req.params;
  const { name, price, categoryId } = req.body || {};

  const existing = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Ürün bulunamadı.' });
  }

  if (name !== undefined && name.trim().length > NAME_MAX_LENGTH) {
    return res.status(400).json({ error: `Ürün adı en fazla ${NAME_MAX_LENGTH} karakter olabilir.` });
  }

  const newName = name !== undefined && name.trim() ? name.trim() : existing.name;
  let newPrice = existing.price;
  if (price !== undefined && price !== null) {
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ error: 'Fiyat geçerli bir sayı olmalıdır.' });
    }
    newPrice = numericPrice;
  }
  const newCategoryId = categoryId !== undefined ? categoryId : existing.category_id;

  db.prepare('UPDATE products SET name = ?, price = ?, category_id = ? WHERE id = ?').run(
    newName,
    newPrice,
    newCategoryId,
    id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json(updated);
}

function remove(req, res) {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Ürün bulunamadı.' });
  }

  db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
