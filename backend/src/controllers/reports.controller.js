const db = require('../db/connection');
const { computeDiscount } = require('../services/discount');
const { computeLineTotal } = require('../services/pricing');

function resolveRange(query) {
  const { from, to, groupBy } = query;

  if (from && to) {
    return { from, to: `${to} 23:59:59` };
  }

  const now = new Date();
  if (groupBy === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: start.toISOString().slice(0, 10),
      to: `${now.toISOString().slice(0, 10)} 23:59:59`,
    };
  }

  // varsayilan: gunluk (bugun)
  const today = now.toISOString().slice(0, 10);
  return { from: today, to: `${today} 23:59:59` };
}

function summary(req, res) {
  const { from, to } = resolveRange(req.query);

  const orders = db
    .prepare(`SELECT * FROM orders WHERE status = 'closed' AND closed_at BETWEEN ? AND ?`)
    .all(from, to);

  const byDayMap = new Map();
  let totalRevenue = 0;
  let totalDiscount = 0;

  for (const o of orders) {
    const items = db
      .prepare('SELECT unit_price, quantity, half_portion, extra_cheese_qty FROM order_items WHERE order_id = ?')
      .all(o.id);
    const subtotal = items.reduce(
      (sum, i) => sum + computeLineTotal(i.unit_price, i.quantity, i.half_portion, i.extra_cheese_qty),
      0
    );
    const { discountAmount, finalTotal } = computeDiscount(subtotal, o.discount_type, o.discount_value);

    totalRevenue += finalTotal;
    totalDiscount += discountAmount;

    const day = (o.closed_at || '').slice(0, 10);
    if (!byDayMap.has(day)) {
      byDayMap.set(day, { day, orderCount: 0, revenue: 0, discount: 0 });
    }
    const entry = byDayMap.get(day);
    entry.orderCount += 1;
    entry.revenue += finalTotal;
    entry.discount += discountAmount;
  }

  const byDay = Array.from(byDayMap.values())
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => ({ ...d, revenue: Number(d.revenue.toFixed(2)), discount: Number(d.discount.toFixed(2)) }));

  res.json({
    from,
    to,
    orderCount: orders.length,
    revenue: Number(totalRevenue.toFixed(2)),
    discountTotal: Number(totalDiscount.toFixed(2)),
    byDay,
  });
}

function byProduct(req, res) {
  const { from, to } = resolveRange(req.query);

  const rows = db
    .prepare(
      `SELECT oi.product_name_snapshot as productName,
              oi.quantity as quantity,
              oi.unit_price as unitPrice,
              oi.half_portion as halfPortion,
              oi.extra_cheese_qty as extraCheeseQty
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status = 'closed' AND o.closed_at BETWEEN ? AND ?`
    )
    .all(from, to);

  const byName = new Map();
  for (const r of rows) {
    const lineTotal = computeLineTotal(r.unitPrice, r.quantity, r.halfPortion, r.extraCheeseQty);
    if (!byName.has(r.productName)) {
      byName.set(r.productName, { productName: r.productName, totalQuantity: 0, totalRevenue: 0 });
    }
    const entry = byName.get(r.productName);
    entry.totalQuantity += r.quantity;
    entry.totalRevenue += lineTotal;
  }

  const normalized = Array.from(byName.values())
    .map((r) => ({ ...r, totalRevenue: Number(r.totalRevenue.toFixed(2)) }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  res.json({ from, to, products: normalized });
}

function byCategory(req, res) {
  const { from, to } = resolveRange(req.query);

  const rows = db
    .prepare(
      `SELECT COALESCE(c.name, 'Diğer') as categoryName,
              oi.quantity as quantity,
              oi.unit_price as unitPrice,
              oi.half_portion as halfPortion,
              oi.extra_cheese_qty as extraCheeseQty
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE o.status = 'closed' AND o.closed_at BETWEEN ? AND ?`
    )
    .all(from, to);

  const byName = new Map();
  for (const r of rows) {
    const lineTotal = computeLineTotal(r.unitPrice, r.quantity, r.halfPortion, r.extraCheeseQty);
    if (!byName.has(r.categoryName)) {
      byName.set(r.categoryName, { categoryName: r.categoryName, totalQuantity: 0, totalRevenue: 0 });
    }
    const entry = byName.get(r.categoryName);
    entry.totalQuantity += r.quantity;
    entry.totalRevenue += lineTotal;
  }

  const normalized = Array.from(byName.values())
    .map((r) => ({ ...r, totalRevenue: Number(r.totalRevenue.toFixed(2)) }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  res.json({ from, to, categories: normalized });
}

function ordersForDay(req, res) {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'date parametresi zorunludur (YYYY-MM-DD).' });
  }

  const orders = db
    .prepare(
      `SELECT o.*, t.name as table_name
       FROM orders o
       LEFT JOIN tables t ON t.id = o.table_id
       WHERE o.status = 'closed' AND date(o.closed_at) = ?
       ORDER BY o.closed_at ASC`
    )
    .all(date);

  const userRef = (userId) => {
    if (!userId) return null;
    return db.prepare('SELECT display_name, role FROM users WHERE id = ?').get(userId);
  };

  const result = orders.map((o) => {
    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC')
      .all(o.id);
    const subtotal = items.reduce(
      (sum, i) => sum + computeLineTotal(i.unit_price, i.quantity, i.half_portion, i.extra_cheese_qty),
      0
    );
    const { discountAmount, finalTotal } = computeDiscount(subtotal, o.discount_type, o.discount_value);
    const opener = userRef(o.opened_by);
    const closer = userRef(o.closed_by);

    return {
      id: o.id,
      tableName: o.table_name || `Masa #${o.table_id}`,
      createdAt: o.created_at,
      closedAt: o.closed_at,
      paymentType: o.payment_type,
      openedByName: opener ? opener.display_name : null,
      openedByRole: opener ? opener.role : null,
      openedChannel: o.opened_channel,
      closedByName: closer ? closer.display_name : null,
      closedByRole: closer ? closer.role : null,
      items: items.map((i) => ({
        name: i.product_name_snapshot,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        lineTotal: computeLineTotal(i.unit_price, i.quantity, i.half_portion, i.extra_cheese_qty),
        note: i.note || null,
        modifiers: [
          ...(i.half_portion ? ['1.5 Porsiyon'] : []),
          ...(i.extra_cheese_qty > 0 ? [`Ekstra Peynir x${i.extra_cheese_qty}`] : []),
        ],
      })),
      subtotal: Number(subtotal.toFixed(2)),
      discountType: o.discount_type,
      discountValue: o.discount_value,
      discountAmount,
      total: finalTotal,
    };
  });

  res.json({ date, orders: result });
}

module.exports = { summary, byProduct, byCategory, ordersForDay };
