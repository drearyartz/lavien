const db = require('../db/connection');
const { buildReceiptPayload } = require('../services/printing/receiptBuilder');
const { getPrinterAdapter } = require('../services/printing/printerFactory');
const { computeDiscount, validateDiscountInput } = require('../services/discount');
const { computeLineTotal } = require('../services/pricing');

/**
 * Adisyon acikken herkes duzenleyebilir. Kapali adisyonlarda sadece admin
 * duzeltme yapabilir (ornek: unutulan urun/not); tarih-saat alanlarina
 * (created_at/closed_at) hicbir sekilde dokunulmaz.
 */
function canModifyItems(order, user) {
  if (order.status === 'open') return true;
  return order.status === 'closed' && user.role === 'admin';
}

function userRef(userId) {
  if (!userId) return null;
  const u = db.prepare('SELECT display_name, role FROM users WHERE id = ?').get(userId);
  return u ? { name: u.display_name, role: u.role } : null;
}

function serializeOrder(orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;
  const items = db
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC')
    .all(orderId);
  const subtotal = items.reduce(
    (sum, item) => sum + computeLineTotal(item.unit_price, item.quantity, item.half_portion, item.extra_cheese_qty),
    0
  );
  const { discountAmount, finalTotal } = computeDiscount(subtotal, order.discount_type, order.discount_value);
  const openedByUser = userRef(order.opened_by);
  const closedByUser = userRef(order.closed_by);
  return {
    ...order,
    items,
    total: Number(subtotal.toFixed(2)),
    discountAmount,
    finalTotal,
    openedByName: openedByUser ? openedByUser.name : null,
    openedByRole: openedByUser ? openedByUser.role : null,
    closedByName: closedByUser ? closedByUser.name : null,
    closedByRole: closedByUser ? closedByUser.role : null,
  };
}

function list(req, res) {
  const { status } = req.query;
  let rows;
  if (status) {
    rows = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status);
  } else {
    rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  }
  const withItems = rows.map((o) => serializeOrder(o.id));
  res.json(withItems);
}

function getOne(req, res) {
  const { id } = req.params;
  const order = serializeOrder(id);
  if (!order) {
    return res.status(404).json({ error: 'Adisyon bulunamadı.' });
  }
  res.json(order);
}

const openOrderTx = db.transaction((tableId, userId, channel) => {
  const existing = db
    .prepare("SELECT id FROM orders WHERE table_id = ? AND status = 'open'")
    .get(tableId);
  if (existing) {
    return { created: false, orderId: existing.id };
  }
  const result = db
    .prepare('INSERT INTO orders (table_id, status, opened_by, opened_channel) VALUES (?, ?, ?, ?)')
    .run(tableId, 'open', userId || null, channel);
  return { created: true, orderId: result.lastInsertRowid };
});

function create(req, res) {
  const { tableId, channel } = req.body || {};
  if (!tableId) {
    return res.status(400).json({ error: 'Masa seçimi zorunludur.' });
  }

  const table = db.prepare('SELECT * FROM tables WHERE id = ? AND is_active = 1').get(tableId);
  if (!table) {
    return res.status(400).json({ error: 'Geçersiz masa.' });
  }

  const safeChannel = channel === 'mobile' ? 'mobile' : 'web';
  const { created, orderId } = openOrderTx(tableId, req.user.id, safeChannel);
  const order = serializeOrder(orderId);

  if (!created) {
    return res.status(409).json({ error: 'Bu masada zaten açık bir adisyon var.', order });
  }

  res.status(201).json(order);
}

function categoryAllowsModifiers(categoryId) {
  const cat = db.prepare('SELECT allow_modifiers FROM categories WHERE id = ?').get(categoryId);
  return !!(cat && cat.allow_modifiers);
}

function addItem(req, res) {
  const { id } = req.params;
  const { productId, quantity, note, extraCheeseQty, halfPortion } = req.body || {};

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: 'Adisyon bulunamadı.' });
  }
  if (!canModifyItems(order, req.user)) {
    return res.status(409).json({ error: 'Kapalı adisyona ürün eklenemez.' });
  }

  if (!productId) {
    return res.status(400).json({ error: 'Ürün seçimi zorunludur.' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(productId);
  if (!product) {
    return res.status(400).json({ error: 'Geçersiz ürün.' });
  }

  const qty = quantity && Number(quantity) > 0 ? Number(quantity) : 1;
  const cheeseQty = extraCheeseQty && Number(extraCheeseQty) > 0 ? Math.round(Number(extraCheeseQty)) : 0;
  const half = !!halfPortion;

  if ((cheeseQty > 0 || half) && !categoryAllowsModifiers(product.category_id)) {
    return res.status(400).json({ error: 'Bu ürün için ekstra peynir/1.5 porsiyon seçeneği yok.' });
  }

  db.prepare(
    `INSERT INTO order_items (order_id, product_id, product_name_snapshot, unit_price, quantity, note, extra_cheese_qty, half_portion, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now'))`
  ).run(id, product.id, product.name, product.price, qty, note || null, cheeseQty, half ? 1 : 0);

  res.status(201).json(serializeOrder(id));
}

function updateItem(req, res) {
  const { id, itemId } = req.params;
  const { quantity, note, extraCheeseQty, halfPortion } = req.body || {};

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: 'Adisyon bulunamadı.' });
  }
  if (!canModifyItems(order, req.user)) {
    return res.status(409).json({ error: 'Kapalı adisyonda değişiklik yapılamaz.' });
  }

  const item = db.prepare('SELECT * FROM order_items WHERE id = ? AND order_id = ?').get(itemId, id);
  if (!item) {
    return res.status(404).json({ error: 'Adisyon kalemi bulunamadı.' });
  }

  const newQuantity = quantity !== undefined && Number(quantity) > 0 ? Number(quantity) : item.quantity;
  const newNote = note !== undefined ? note : item.note;
  const newCheeseQty =
    extraCheeseQty !== undefined && Number(extraCheeseQty) >= 0
      ? Math.round(Number(extraCheeseQty))
      : item.extra_cheese_qty;
  const newHalf = halfPortion !== undefined ? !!halfPortion : !!item.half_portion;

  if (newCheeseQty > 0 || newHalf) {
    const product = item.product_id
      ? db.prepare('SELECT category_id FROM products WHERE id = ?').get(item.product_id)
      : null;
    if (!product || !categoryAllowsModifiers(product.category_id)) {
      return res.status(400).json({ error: 'Bu ürün için ekstra peynir/1.5 porsiyon seçeneği yok.' });
    }
  }

  db.prepare('UPDATE order_items SET quantity = ?, note = ?, extra_cheese_qty = ?, half_portion = ? WHERE id = ?').run(
    newQuantity,
    newNote,
    newCheeseQty,
    newHalf ? 1 : 0,
    itemId
  );

  res.json(serializeOrder(id));
}

function removeItem(req, res) {
  const { id, itemId } = req.params;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: 'Adisyon bulunamadı.' });
  }
  if (!canModifyItems(order, req.user)) {
    return res.status(409).json({ error: 'Kapalı adisyondan kalem silinemez.' });
  }

  const item = db.prepare('SELECT * FROM order_items WHERE id = ? AND order_id = ?').get(itemId, id);
  if (!item) {
    return res.status(404).json({ error: 'Adisyon kalemi bulunamadı.' });
  }

  db.prepare('DELETE FROM order_items WHERE id = ?').run(itemId);

  res.json(serializeOrder(id));
}

function setDiscount(req, res) {
  const { id } = req.params;
  const { type, value } = req.body || {};

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: 'Adisyon bulunamadı.' });
  }
  if (!canModifyItems(order, req.user)) {
    return res.status(409).json({ error: 'Bu adisyonda indirim değiştirilemez.' });
  }

  if (type === null || type === undefined) {
    db.prepare('UPDATE orders SET discount_type = NULL, discount_value = NULL WHERE id = ?').run(id);
    return res.json(serializeOrder(id));
  }

  const items = db
    .prepare('SELECT unit_price, quantity, half_portion, extra_cheese_qty FROM order_items WHERE order_id = ?')
    .all(id);
  const subtotal = items.reduce(
    (sum, item) => sum + computeLineTotal(item.unit_price, item.quantity, item.half_portion, item.extra_cheese_qty),
    0
  );

  const { valid, error } = validateDiscountInput(type, value, subtotal);
  if (!valid) {
    return res.status(400).json({ error });
  }

  db.prepare('UPDATE orders SET discount_type = ?, discount_value = ? WHERE id = ?').run(
    type,
    Number(value),
    id
  );

  res.json(serializeOrder(id));
}

function close(req, res) {
  const { id } = req.params;
  const { paymentType } = req.body || {};

  if (!paymentType || !['nakit', 'kart'].includes(paymentType)) {
    return res.status(400).json({ error: 'Ödeme tipi "nakit" veya "kart" olmalıdır.' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: 'Adisyon bulunamadı.' });
  }
  if (order.status !== 'open') {
    return res.status(409).json({ error: 'Adisyon zaten kapalı.' });
  }

  const itemCount = db
    .prepare('SELECT COUNT(*) as c FROM order_items WHERE order_id = ?')
    .get(id).c;
  if (itemCount === 0) {
    return res.status(400).json({ error: 'Boş adisyon kapatılamaz. Önce ürün ekleyin.' });
  }

  db.prepare(
    `UPDATE orders SET status = 'closed', payment_type = ?, closed_at = datetime('now'), closed_by = ?
     WHERE id = ?`
  ).run(paymentType, req.user.id, id);

  db.prepare('INSERT INTO order_status_history (order_id, status, changed_by) VALUES (?, ?, ?)').run(
    id,
    'closed',
    req.user.id
  );

  // Adisyon kapanisi SADECE kasaya fis gonderir (mutfaga tekrar gonderilmez).
  const registerReceipt = buildReceiptPayload(id, 'register');
  getPrinterAdapter()
    .print(registerReceipt)
    .catch(() => {});
  db.prepare("UPDATE orders SET printed_at = datetime('now') WHERE id = ?").run(id);

  res.json({ ...serializeOrder(id), receipt: registerReceipt });
}

/**
 * Mutfaga bilgi fisi gonderir. Adisyonu KAPATMAZ, sistemde acik kalir.
 * Web/kasadan self-siparis sirasinda VE (ileride) mobil uygulamadan cagrilir.
 */
async function print(req, res) {
  const { id } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: 'Adisyon bulunamadı.' });
  }
  if (order.status !== 'open') {
    return res.status(409).json({ error: 'Kapalı adisyon için mutfağa gönderim yapılamaz.' });
  }

  const payload = buildReceiptPayload(id, 'kitchen');
  const adapter = getPrinterAdapter();
  const result = await adapter.print(payload);

  db.prepare("UPDATE orders SET kitchen_sent_at = strftime('%Y-%m-%d %H:%M:%f', 'now') WHERE id = ?").run(id);

  res.json({ receipt: payload, printResult: result });
}

/**
 * Adisyonu (fisi) siler. Fiziksel silme yerine 'cancelled' durumuna gecirilir
 * (order_items snapshot'lari ve gecmis kayitlarla ilgili referanslar korunur);
 * raporlar/gunluk ciro sorgulari zaten sadece status='closed' filtreledigi
 * icin iptal edilen adisyon otomatik olarak raporlardan ve ciro toplaminden dusuyor.
 */
function remove(req, res) {
  const { id } = req.params;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: 'Adisyon bulunamadı.' });
  }
  if (order.status === 'cancelled') {
    return res.status(404).json({ error: 'Adisyon zaten silinmiş.' });
  }

  db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(id);
  db.prepare('INSERT INTO order_status_history (order_id, status, changed_by) VALUES (?, ?, ?)').run(
    id,
    'cancelled',
    req.user.id
  );

  res.status(204).send();
}

module.exports = { list, getOne, create, addItem, updateItem, removeItem, setDiscount, close, print, remove };
