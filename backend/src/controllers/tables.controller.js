const db = require('../db/connection');

function list(req, res) {
  const rows = db.prepare('SELECT * FROM tables WHERE is_active = 1 ORDER BY id ASC').all();

  const withStatus = rows.map((table) => {
    const openOrder = db
      .prepare("SELECT id, opened_by, opened_channel FROM orders WHERE table_id = ? AND status = 'open'")
      .get(table.id);
    if (!openOrder) {
      return { ...table, isOccupied: false, openOrderId: null, openedByRole: null, openedByName: null, openedChannel: null };
    }

    // Icinde henuz hic urun olmayan acik adisyon "bos masa" gibi gosterilir
    // (kim actigi bilgisi de sifirlanir); masaya tekrar tiklaninca ayni bos
    // adisyona zaten geri donuluyor (create endpoint'i 409 ile mevcut adisyonu dondurur).
    const itemCount = db
      .prepare('SELECT COUNT(*) as c FROM order_items WHERE order_id = ?')
      .get(openOrder.id).c;
    if (itemCount === 0) {
      return { ...table, isOccupied: false, openOrderId: null, openedByRole: null, openedByName: null, openedChannel: null };
    }

    const opener = openOrder.opened_by
      ? db.prepare('SELECT display_name, role FROM users WHERE id = ?').get(openOrder.opened_by)
      : null;
    return {
      ...table,
      isOccupied: true,
      openOrderId: openOrder.id,
      openedByRole: opener ? opener.role : null,
      openedByName: opener ? opener.display_name : null,
      openedChannel: openOrder.opened_channel,
    };
  });

  // Acik (dolu) masalar listede daima once gelir; her grup icinde masa id sirasi korunur.
  withStatus.sort((a, b) => (b.isOccupied === a.isOccupied ? 0 : b.isOccupied ? 1 : -1));

  res.json(withStatus);
}

function create(req, res) {
  const { name } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Masa adı zorunludur.' });
  }

  const result = db.prepare('INSERT INTO tables (name) VALUES (?)').run(name.trim());
  const created = db.prepare('SELECT * FROM tables WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
}

function update(req, res) {
  const { id } = req.params;
  const { name } = req.body || {};

  const existing = db.prepare('SELECT * FROM tables WHERE id = ? AND is_active = 1').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Masa bulunamadı.' });
  }

  const newName = name !== undefined && name.trim() ? name.trim() : existing.name;
  db.prepare('UPDATE tables SET name = ? WHERE id = ?').run(newName, id);

  const updated = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
  res.json(updated);
}

function remove(req, res) {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM tables WHERE id = ? AND is_active = 1').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Masa bulunamadı.' });
  }

  const openOrder = db
    .prepare("SELECT id FROM orders WHERE table_id = ? AND status = 'open'")
    .get(id);
  if (openOrder) {
    return res.status(409).json({ error: 'Masada açık adisyon var, önce kapatılmalı.' });
  }

  db.prepare('UPDATE tables SET is_active = 0 WHERE id = ?').run(id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
