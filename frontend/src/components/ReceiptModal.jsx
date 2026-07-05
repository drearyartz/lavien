import { AnimatePresence, motion } from 'framer-motion';
import RoleTag from './RoleTag';
import { discountLabel } from '../utils/discount';

function formatDateTime(value) {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

export default function ReceiptModal({ receipt, onClose }) {
  const isKitchen = receipt?.type === 'kitchen';
  const hasDiscount = receipt && !isKitchen && receipt.discountAmount > 0;

  return (
    <AnimatePresence>
      {receipt && (
        <ReceiptModalContent receipt={receipt} onClose={onClose} isKitchen={isKitchen} hasDiscount={hasDiscount} />
      )}
    </AnimatePresence>
  );
}

function ReceiptModalContent({ receipt, onClose, isKitchen, hasDiscount }) {
  const { brand, order, items, total, subtotal, discountAmount, discountType, discountValue } = receipt;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        className="card"
        style={{ width: 'min(360px, 92vw)', maxHeight: '85vh', overflowY: 'auto' }}
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div id="receipt-print" className="stack gap-sm">
          <div style={{ textAlign: 'center' }}>
            <div className="brand-title" style={{ fontSize: '1.4rem' }}>{brand.name}</div>
            <div className="brand-subtitle">{brand.subtitle}</div>
            <div className="text-tertiary" style={{ fontSize: '0.7rem', letterSpacing: '0.14em', marginTop: '0.35rem' }}>
              {isKitchen ? 'MUTFAK FİŞİ' : 'KASA FİŞİ'}
            </div>
          </div>

          <hr className="divider" />

          <div className="stack gap-xs" style={{ fontSize: '0.82rem' }}>
            <div className="row space-between text-secondary">
              <span>Masa</span>
              <span>{order.tableName}</span>
            </div>
            <div className="row space-between text-secondary">
              <span>Tarih</span>
              <span>{formatDateTime(isKitchen ? order.createdAt : order.closedAt)}</span>
            </div>
            <div className="row space-between text-secondary" style={{ alignItems: 'center' }}>
              <span>{isKitchen ? 'Gönderen' : 'Kapatan'}</span>
              <span className="row gap-xs" style={{ alignItems: 'center' }}>
                {order.staffName || '—'}
                <RoleTag role={order.staffRole} channel={isKitchen ? order.channel : null} />
              </span>
            </div>
          </div>

          <hr className="divider" />

          <div className="stack gap-xs">
            {items.map((item, idx) => (
              <div key={idx} className="stack" style={{ fontSize: '0.85rem' }}>
                <div className="row space-between">
                  <span>
                    {item.quantity} × {item.name}
                    {isKitchen && item.isNew && (
                      <span className="text-secondary" style={{ marginLeft: '0.35rem' }}>(+)</span>
                    )}
                  </span>
                  {!isKitchen && <span>{item.lineTotal.toFixed(2)} TL</span>}
                </div>
                {item.note && <div className="text-tertiary" style={{ fontSize: '0.75rem' }}>Not: {item.note}</div>}
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="text-tertiary" style={{ fontSize: '0.75rem' }}>{item.modifiers.join(', ')}</div>
                )}
              </div>
            ))}
          </div>

          {!isKitchen && (
            <>
              <hr className="divider" />
              {hasDiscount && (
                <div className="row space-between text-secondary" style={{ fontSize: '0.85rem' }}>
                  <span>Ara Toplam</span>
                  <span>{subtotal.toFixed(2)} TL</span>
                </div>
              )}
              {hasDiscount && (
                <div className="row space-between text-secondary" style={{ fontSize: '0.85rem' }}>
                  <span>İndirim ({discountLabel(discountType, discountValue)})</span>
                  <span>−{discountAmount.toFixed(2)} TL</span>
                </div>
              )}
              <div className="row space-between" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                <span>TOPLAM</span>
                <span>{total.toFixed(2)} TL</span>
              </div>
              {order.paymentType && (
                <div className="row space-between text-secondary" style={{ fontSize: '0.85rem' }}>
                  <span>Ödeme Tipi</span>
                  <span>{order.paymentType === 'nakit' ? 'Nakit' : 'Kart'}</span>
                </div>
              )}
            </>
          )}

          <div className="text-tertiary" style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            {isKitchen ? 'Adisyon açık kalmaya devam ediyor.' : 'Bizi tercih ettiğiniz için teşekkür ederiz.'}
          </div>
        </div>

        <div className="row gap-sm" style={{ marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Kapat
          </button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Yazdır
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
