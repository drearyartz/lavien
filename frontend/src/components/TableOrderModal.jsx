import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../api/client';
import RoleTag from './RoleTag';
import { discountLabel } from '../utils/discount';
import { computeLineTotal } from '../utils/pricing';

function formatDateTime(value) {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

/**
 * Admin'in siparis ekranina gitmeden, acik bir masanin icerigini ve
 * toplam fiyatini salt-okunur olarak goruntulemesi icin kullanilir.
 */
export default function TableOrderModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    setOrder(null);
    api
      .get(`/orders/${orderId}`)
      .then((data) => setOrder(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <AnimatePresence>
      {orderId && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="modal-backdrop"
          style={{ padding: '1.5rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="card"
            style={{ width: 'min(420px, 92vw)', maxHeight: '85vh', overflowY: 'auto' }}
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {loading ? (
              <p>Yükleniyor…</p>
            ) : error ? (
              <div className="error-text">{error}</div>
            ) : order ? (
              <div className="stack gap-md">
                <div className="row space-between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem' }}>Adisyon #{order.id}</h3>
                    <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Masa içeriği</div>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={onClose}>
                    Kapat
                  </button>
                </div>

                <div className="stack gap-xs" style={{ fontSize: '0.82rem' }}>
                  <div className="row space-between text-secondary" style={{ alignItems: 'center' }}>
                    <span>Açan</span>
                    <span className="row gap-xs" style={{ alignItems: 'center' }}>
                      {order.openedByName || '—'}
                      <RoleTag role={order.openedByRole} channel={order.opened_channel} />
                      <span className="text-tertiary">{formatDateTime(order.created_at)}</span>
                    </span>
                  </div>
                </div>

                <hr className="divider" />

                {order.items.length === 0 ? (
                  <p className="text-secondary">Henüz ürün eklenmedi.</p>
                ) : (
                  <div className="stack gap-xs">
                    {order.items.map((item) => {
                      const lineTotal = computeLineTotal(
                        item.unit_price,
                        item.quantity,
                        item.half_portion,
                        item.extra_cheese_qty
                      );
                      const modifiers = [
                        ...(item.half_portion ? ['1.5 Porsiyon'] : []),
                        ...(item.extra_cheese_qty > 0 ? [`Ekstra Peynir x${item.extra_cheese_qty}`] : []),
                      ];
                      return (
                        <div key={item.id} className="stack" style={{ fontSize: '0.85rem' }}>
                          <div className="row space-between">
                            <span>{item.quantity} × {item.product_name_snapshot}</span>
                            <span>{lineTotal.toFixed(2)} TL</span>
                          </div>
                          {item.note && <div className="text-tertiary" style={{ fontSize: '0.75rem' }}>Not: {item.note}</div>}
                          {modifiers.length > 0 && (
                            <div className="text-tertiary" style={{ fontSize: '0.75rem' }}>{modifiers.join(', ')}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <hr className="divider" />

                <div className="stack gap-xs">
                  {order.discountAmount > 0 && (
                    <>
                      <div className="row space-between text-secondary" style={{ fontSize: '0.85rem' }}>
                        <span>Ara Toplam</span>
                        <span>{order.total.toFixed(2)} TL</span>
                      </div>
                      <div className="row space-between text-secondary" style={{ fontSize: '0.85rem' }}>
                        <span>İndirim ({discountLabel(order.discount_type, order.discount_value)})</span>
                        <span>−{order.discountAmount.toFixed(2)} TL</span>
                      </div>
                    </>
                  )}
                  <div className="row space-between" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                    <span>Toplam</span>
                    <span>{order.finalTotal.toFixed(2)} TL</span>
                  </div>
                </div>

                <button type="button" className="btn btn-block" onClick={() => navigate(`/adisyon/${order.id}`)}>
                  Sipariş Ekranına Git
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
