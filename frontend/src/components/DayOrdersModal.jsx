import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../api/client';
import RoleTag from './RoleTag';
import ConfirmDialog from './ConfirmDialog';
import { discountLabel } from '../utils/discount';

function formatDateTime(value) {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

export default function DayOrdersModal({ date, onClose, onChanged }) {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  function load() {
    if (!date) return;
    setLoading(true);
    setError('');
    api
      .get(`/reports/orders?date=${date}`)
      .then((data) => setOrders(Array.isArray(data.orders) ? data.orders : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function confirmDeleteOrder() {
    if (!deleteTarget) return;
    setError('');
    try {
      await api.delete(`/orders/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
      if (onChanged) onChanged();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  return (
    <AnimatePresence>
      {date && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="modal-backdrop"
          style={{ padding: '2rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
      <motion.div
        className="card"
        style={{ width: 'min(640px, 92vw)', maxHeight: '85vh', overflowY: 'auto' }}
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row space-between" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>{date} Tarihli Adisyonlar</h3>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Kapat
          </button>
        </div>

        {error && <div className="error-text" style={{ marginBottom: '1rem' }}>{error}</div>}

        {loading ? (
          <p>Yükleniyor…</p>
        ) : !orders || orders.length === 0 ? (
          <p className="text-secondary">Bu tarihte kapanan adisyon yok.</p>
        ) : (
          <div className="stack gap-md">
            {orders.map((o) => (
              <div key={o.id} className="card" style={{ background: 'var(--surface-card-strong)' }}>
                <div className="row space-between" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', rowGap: '0.5rem' }}>
                  <div style={{ fontWeight: 600 }}>
                    Adisyon #{o.id} · {o.tableName}
                  </div>
                  <div className="row gap-sm" style={{ alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{o.total.toFixed(2)} TL</div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }}
                      onClick={() => navigate(`/adisyon/${o.id}`)}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }}
                      onClick={() => setDeleteTarget(o)}
                    >
                      Sil
                    </button>
                  </div>
                </div>

                <div className="stack gap-xs" style={{ fontSize: '0.82rem', marginBottom: '0.85rem' }}>
                  <div className="row space-between text-secondary" style={{ alignItems: 'center' }}>
                    <span>Açan</span>
                    <span className="row gap-xs" style={{ alignItems: 'center' }}>
                      {o.openedByName || '—'}
                      <RoleTag role={o.openedByRole} channel={o.openedChannel} />
                      <span className="text-tertiary">{formatDateTime(o.createdAt)}</span>
                    </span>
                  </div>
                  <div className="row space-between text-secondary" style={{ alignItems: 'center' }}>
                    <span>Kapatan</span>
                    <span className="row gap-xs" style={{ alignItems: 'center' }}>
                      {o.closedByName || '—'}
                      <RoleTag role={o.closedByRole} />
                      <span className="text-tertiary">{formatDateTime(o.closedAt)}</span>
                    </span>
                  </div>
                  <div className="row space-between text-secondary">
                    <span>Ödeme Tipi</span>
                    <span>{o.paymentType === 'nakit' ? 'Nakit' : o.paymentType === 'kart' ? 'Kart' : '—'}</span>
                  </div>
                </div>

                <hr className="divider" style={{ marginBottom: '0.6rem' }} />

                <div className="stack gap-xs">
                  {o.items.map((item, idx) => (
                    <div key={idx} className="stack" style={{ fontSize: '0.85rem' }}>
                      <div className="row space-between">
                        <span>{item.quantity} × {item.name}</span>
                        <span>{item.lineTotal.toFixed(2)} TL</span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="text-tertiary" style={{ fontSize: '0.75rem' }}>{item.modifiers.join(', ')}</div>
                      )}
                    </div>
                  ))}
                </div>

                {o.discountAmount > 0 && (
                  <>
                    <hr className="divider" style={{ margin: '0.6rem 0' }} />
                    <div className="stack gap-xs" style={{ fontSize: '0.82rem' }}>
                      <div className="row space-between text-secondary">
                        <span>Ara Toplam</span>
                        <span>{o.subtotal.toFixed(2)} TL</span>
                      </div>
                      <div className="row space-between text-secondary">
                        <span>İndirim ({discountLabel(o.discountType, o.discountValue)})</span>
                        <span>−{o.discountAmount.toFixed(2)} TL</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
        </motion.div>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Fişi sil"
        message={
          deleteTarget
            ? `Adisyon #${deleteTarget.id} (${deleteTarget.tableName}) fişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
            : ''
        }
        onConfirm={confirmDeleteOrder}
        onCancel={() => setDeleteTarget(null)}
      />
    </AnimatePresence>
  );
}
