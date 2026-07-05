const db = require('../../db/connection');
const { computeDiscount } = require('../discount');
const { computeLineTotal } = require('../pricing');

function buildModifiers(item) {
  const mods = [];
  if (item.half_portion) mods.push('1.5 Porsiyon');
  if (item.extra_cheese_qty > 0) mods.push(`Ekstra Peynir x${item.extra_cheese_qty}`);
  return mods;
}

/**
 * Bir adisyondan iki farkli amaca yonelik fis payload'i uretir:
 * - 'kitchen': mutfaga gonderilen bilgi fisi. Fiyat icermez, adisyonu kapatmaz.
 *   Bir onceki mutfak gonderiminden sonra eklenen kalemler isNew=true isaretlenir.
 * - 'register': sadece adisyon kapanisinda basilan kasa fisi. Fiyat/toplam/odeme icerir.
 */
function buildReceiptPayload(orderId, type) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    throw new Error('Adisyon bulunamadı.');
  }

  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(order.table_id);

  const items = db
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC')
    .all(orderId);

  const openedBy = order.opened_by
    ? db.prepare('SELECT display_name, role FROM users WHERE id = ?').get(order.opened_by)
    : null;
  const closedBy = order.closed_by
    ? db.prepare('SELECT display_name, role FROM users WHERE id = ?').get(order.closed_by)
    : null;

  const brand = { name: "LA'VIEN", subtitle: 'CAFE & RESTAURANT' };

  if (type === 'register') {
    const lineItems = items.map((item) => ({
      name: item.product_name_snapshot,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: computeLineTotal(item.unit_price, item.quantity, item.half_portion, item.extra_cheese_qty),
      note: item.note || null,
      modifiers: buildModifiers(item),
    }));
    const subtotal = Number(lineItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
    const { discountAmount, finalTotal } = computeDiscount(subtotal, order.discount_type, order.discount_value);

    return {
      type: 'register',
      brand,
      order: {
        id: order.id,
        tableName: table ? table.name : `Masa #${order.table_id}`,
        status: order.status,
        paymentType: order.payment_type,
        createdAt: order.created_at,
        closedAt: order.closed_at,
        staffName: closedBy ? closedBy.display_name : null,
        staffRole: closedBy ? closedBy.role : null,
      },
      items: lineItems,
      subtotal,
      discountType: order.discount_type,
      discountValue: order.discount_value,
      discountAmount,
      total: finalTotal,
      generatedAt: new Date().toISOString(),
    };
  }

  // 'kitchen' (varsayilan)
  const previousSentAt = order.kitchen_sent_at;
  const lineItems = items.map((item) => ({
    name: item.product_name_snapshot,
    quantity: item.quantity,
    note: item.note || null,
    isNew: previousSentAt ? item.created_at > previousSentAt : false,
    modifiers: buildModifiers(item),
  }));

  return {
    type: 'kitchen',
    brand,
    order: {
      id: order.id,
      tableName: table ? table.name : `Masa #${order.table_id}`,
      status: order.status,
      createdAt: order.created_at,
      staffName: openedBy ? openedBy.display_name : null,
      staffRole: openedBy ? openedBy.role : null,
      channel: order.opened_channel,
    },
    items: lineItems,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { buildReceiptPayload };
