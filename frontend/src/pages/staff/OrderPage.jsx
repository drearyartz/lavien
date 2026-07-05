import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../api/client';
import TopBar from '../../components/TopBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import ReceiptModal from '../../components/ReceiptModal';
import RoleTag from '../../components/RoleTag';
import DiscountControl from '../../components/DiscountControl';
import { computeDiscount, discountLabel } from '../../utils/discount';
import { computeLineTotal } from '../../utils/pricing';
import { useAuth } from '../../context/AuthContext';

function itemKey(item) {
  return item.id ?? item.tempId;
}

export default function OrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteItemTarget, setDeleteItemTarget] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState({});

  // Kapali adisyonu admin duzenlerken kullanilan taslak (kaydet'e basana kadar backend'e gitmez).
  const [draftItems, setDraftItems] = useState(null);
  const [draftDiscount, setDraftDiscount] = useState({ type: null, value: null });
  const [saving, setSaving] = useState(false);
  const [showEmptyDeleteConfirm, setShowEmptyDeleteConfirm] = useState(false);

  const isClosedAdminEdit = order && order.status === 'closed' && user?.role === 'admin';
  const canEdit = order && (order.status === 'open' || isClosedAdminEdit);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [orderData, catsRaw, prodsRaw] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get('/categories'),
        api.get('/products'),
      ]);
      const cats = Array.isArray(catsRaw) ? catsRaw : [];
      const prods = Array.isArray(prodsRaw) ? prodsRaw : [];
      setOrder(orderData);
      setCategories(cats);
      setProducts(prods);
      if (!activeCategoryId && cats.length > 0) {
        setActiveCategoryId(cats[0].id);
      }
      if (orderData && orderData.status === 'closed' && user?.role === 'admin') {
        setDraftItems((orderData.items || []).map((i) => ({ ...i })));
        setDraftDiscount({ type: orderData.discount_type || null, value: orderData.discount_value ?? null });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function handleAddProduct(product) {
    setError('');
    if (isClosedAdminEdit) {
      setDraftItems((prev) => [
        ...prev,
        {
          tempId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          product_id: product.id,
          product_name_snapshot: product.name,
          unit_price: product.price,
          quantity: 1,
          note: '',
          extra_cheese_qty: 0,
          half_portion: 0,
        },
      ]);
      return;
    }
    try {
      const updated = await api.post(`/orders/${orderId}/items`, { productId: product.id, quantity: 1 });
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleQuantityChange(item, delta) {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    setError('');
    if (isClosedAdminEdit) {
      setDraftItems((prev) => prev.map((i) => (itemKey(i) === itemKey(item) ? { ...i, quantity: newQty } : i)));
      return;
    }
    try {
      const updated = await api.patch(`/orders/${orderId}/items/${item.id}`, { quantity: newQty });
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExtraCheeseChange(item, delta) {
    const newQty = (item.extra_cheese_qty || 0) + delta;
    if (newQty < 0) return;
    setError('');
    if (isClosedAdminEdit) {
      setDraftItems((prev) => prev.map((i) => (itemKey(i) === itemKey(item) ? { ...i, extra_cheese_qty: newQty } : i)));
      return;
    }
    try {
      const updated = await api.patch(`/orders/${orderId}/items/${item.id}`, { extraCheeseQty: newQty });
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleHalfPortionChange(item, checked) {
    setError('');
    if (isClosedAdminEdit) {
      setDraftItems((prev) => prev.map((i) => (itemKey(i) === itemKey(item) ? { ...i, half_portion: checked ? 1 : 0 } : i)));
      return;
    }
    try {
      const updated = await api.patch(`/orders/${orderId}/items/${item.id}`, { halfPortion: checked });
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleNoteChange(item, value) {
    if (isClosedAdminEdit) {
      setDraftItems((prev) => prev.map((i) => (itemKey(i) === itemKey(item) ? { ...i, note: value } : i)));
      return;
    }
    setNoteDrafts((prev) => ({ ...prev, [item.id]: value }));
  }

  async function handleNoteSave(item) {
    if (isClosedAdminEdit) return; // taslak modunda not zaten anlik yaziliyor
    const draft = noteDrafts[item.id];
    if (draft === undefined || draft === (item.note || '')) return;
    setError('');
    try {
      const updated = await api.patch(`/orders/${orderId}/items/${item.id}`, { note: draft });
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  // Mutfağa gönder / hesabı kapat öncesi, henüz kaydedilmemiş (blur olmamış)
  // not taslaklarının kaybolmaması için hepsini bekleyerek kaydeder. (sadece canlı mod)
  async function flushPendingNotes() {
    const items = Array.isArray(order?.items) ? order.items : [];
    const dirty = items.filter((item) => {
      const draft = noteDrafts[item.id];
      return draft !== undefined && draft !== (item.note || '');
    });
    for (const item of dirty) {
      try {
        const updated = await api.patch(`/orders/${orderId}/items/${item.id}`, { note: noteDrafts[item.id] });
        setOrder(updated);
      } catch (err) {
        setError(err.message);
      }
    }
  }

  async function confirmDeleteItem() {
    if (!deleteItemTarget) return;
    setError('');
    if (isClosedAdminEdit) {
      setDraftItems((prev) => prev.filter((i) => itemKey(i) !== itemKey(deleteItemTarget)));
      setDeleteItemTarget(null);
      return;
    }
    try {
      const updated = await api.delete(`/orders/${orderId}/items/${deleteItemTarget.id}`);
      setOrder(updated);
      setDeleteItemTarget(null);
    } catch (err) {
      setError(err.message);
      setDeleteItemTarget(null);
    }
  }

  async function handleApplyDiscount(type, value) {
    setError('');
    if (isClosedAdminEdit) {
      setDraftDiscount({ type, value });
      return;
    }
    try {
      const updated = await api.patch(`/orders/${orderId}/discount`, { type, value });
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearDiscount() {
    setError('');
    if (isClosedAdminEdit) {
      setDraftDiscount({ type: null, value: null });
      return;
    }
    try {
      const updated = await api.patch(`/orders/${orderId}/discount`, { type: null, value: null });
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDiscardDraft() {
    if (!order) return;
    setDraftItems((order.items || []).map((i) => ({ ...i })));
    setDraftDiscount({ type: order.discount_type || null, value: order.discount_value ?? null });
  }

  async function handleSaveDraft() {
    if (!order || !draftItems) return;

    const draftSubtotal = draftItems.reduce(
      (sum, item) => sum + computeLineTotal(item.unit_price, item.quantity, item.half_portion, item.extra_cheese_qty),
      0
    );
    const { finalTotal: draftFinalTotal } = computeDiscount(draftSubtotal, draftDiscount.type, draftDiscount.value);

    if (draftItems.length === 0 || draftFinalTotal <= 0) {
      setShowEmptyDeleteConfirm(true);
      return;
    }

    await performSaveDraft();
  }

  async function confirmDeleteEmptyOrder() {
    setSaving(true);
    setError('');
    try {
      await api.delete(`/orders/${orderId}`);
      setShowEmptyDeleteConfirm(false);
      navigate('/admin/raporlar');
    } catch (err) {
      setError(err.message);
      setShowEmptyDeleteConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  async function performSaveDraft() {
    setSaving(true);
    setError('');
    try {
      const originalItems = order.items || [];
      const draftIds = new Set(draftItems.filter((i) => i.id).map((i) => i.id));

      const toDelete = originalItems.filter((i) => !draftIds.has(i.id));
      for (const item of toDelete) {
        await api.delete(`/orders/${orderId}/items/${item.id}`);
      }

      for (const di of draftItems) {
        if (!di.id) continue;
        const orig = originalItems.find((i) => i.id === di.id);
        if (
          orig &&
          (orig.quantity !== di.quantity ||
            (orig.note || '') !== (di.note || '') ||
            (orig.extra_cheese_qty || 0) !== (di.extra_cheese_qty || 0) ||
            !!orig.half_portion !== !!di.half_portion)
        ) {
          await api.patch(`/orders/${orderId}/items/${di.id}`, {
            quantity: di.quantity,
            note: di.note || '',
            extraCheeseQty: di.extra_cheese_qty || 0,
            halfPortion: !!di.half_portion,
          });
        }
      }

      for (const di of draftItems) {
        if (di.id) continue;
        await api.post(`/orders/${orderId}/items`, {
          productId: di.product_id,
          quantity: di.quantity,
          note: di.note || '',
          extraCheeseQty: di.extra_cheese_qty || 0,
          halfPortion: !!di.half_portion,
        });
      }

      const origType = order.discount_type || null;
      const origValue = order.discount_value ?? null;
      if (draftDiscount.type !== origType || Number(draftDiscount.value || 0) !== Number(origValue || 0)) {
        await api.patch(`/orders/${orderId}/discount`, { type: draftDiscount.type, value: draftDiscount.value });
      }

      navigate('/admin/raporlar');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePrint() {
    setError('');
    try {
      await flushPendingNotes();
      const result = await api.post(`/orders/${orderId}/print`, {});
      setReceipt(result.receipt);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClose(paymentType) {
    setClosing(true);
    setError('');
    try {
      await flushPendingNotes();
      const closedOrder = await api.patch(`/orders/${orderId}/close`, { paymentType });
      setOrder(closedOrder);
      setShowPaymentModal(false);
      setReceipt(closedOrder.receipt);
    } catch (err) {
      setError(err.message);
    } finally {
      setClosing(false);
    }
  }

  function handleReceiptClose() {
    const shouldNavigateAway = order && order.status === 'closed' && !isClosedAdminEdit;
    setReceipt(null);
    if (shouldNavigateAway) {
      navigate('/masalar');
    }
  }

  if (loading) {
    return (
      <div className="page">
        <TopBar title="Adisyon" />
        <p>Yükleniyor…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page">
        <TopBar title="Adisyon" />
        <div className="error-text">{error || 'Adisyon bulunamadı.'}</div>
      </div>
    );
  }

  const cartItems = isClosedAdminEdit ? draftItems || [] : Array.isArray(order.items) ? order.items : [];
  const categoryProducts = products.filter((p) => p.category_id === activeCategoryId);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + computeLineTotal(item.unit_price, item.quantity, item.half_portion, item.extra_cheese_qty),
    0
  );
  const categoryAllowsModifiers = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return !!(cat && cat.allow_modifiers);
  };
  const itemAllowsModifiers = (item) => {
    const product = products.find((p) => p.id === item.product_id);
    return product ? categoryAllowsModifiers(product.category_id) : false;
  };

  const activeDiscountType = isClosedAdminEdit ? draftDiscount.type : order.discount_type;
  const activeDiscountValue = isClosedAdminEdit ? draftDiscount.value : order.discount_value;
  const { discountAmount, finalTotal } = isClosedAdminEdit
    ? computeDiscount(subtotal, draftDiscount.type, draftDiscount.value)
    : { discountAmount: order.discountAmount || 0, finalTotal: order.finalTotal ?? subtotal };

  return (
    <div className="page">
      <TopBar
        title={`Adisyon #${order.id}`}
        actions={
          <>
            <RoleTag role={order.openedByRole} channel={order.opened_channel} />
            {user?.role === 'admin' && (
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin')}>
                Yönetim Paneli
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/masalar')}>
              Masalara Dön
            </button>
          </>
        }
      />

      {error && <div className="error-text" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {isClosedAdminEdit && (
        <div
          className="card"
          style={{ marginBottom: '1.5rem', padding: '0.85rem 1.1rem', fontSize: '0.85rem' }}
        >
          Bu adisyon kapalı. Yönetici olarak içeriğini düzenleyebilirsiniz; değişiklikler{' '}
          <strong>sadece "Kaydet"e bastığınızda</strong> kaydedilir, açılış/kapanış tarih-saatleri değişmez.
        </div>
      )}
      {order.status === 'closed' && !isClosedAdminEdit && (
        <div
          className="card"
          style={{ marginBottom: '1.5rem', padding: '0.85rem 1.1rem', fontSize: '0.85rem' }}
        >
          Bu adisyon kapalı, sadece görüntülenebilir.
        </div>
      )}

      <div className="order-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Sol: kategori sekmeleri + urun grid */}
        <div className="stack gap-md">
          <div className="row gap-xs wrap">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="btn"
                style={{
                  background: activeCategoryId === cat.id ? 'rgba(255,255,255,0.96)' : 'transparent',
                  color: activeCategoryId === cat.id ? '#0a0a0b' : 'var(--text-primary)',
                }}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {categoryProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                className="card"
                style={{ cursor: canEdit ? 'pointer' : 'not-allowed', textAlign: 'left', padding: '1.25rem', opacity: canEdit ? 1 : 0.5 }}
                onClick={() => handleAddProduct(p)}
                disabled={!canEdit}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{p.name}</div>
                <div className="text-secondary">{p.price.toFixed(2)} TL</div>
              </button>
            ))}
            {categoryProducts.length === 0 && (
              <p className="text-secondary">Bu kategoride ürün yok.</p>
            )}
          </div>
        </div>

        {/* Sag: sepet */}
        <div className="card cart-panel stack gap-md" style={{ position: 'sticky', top: '1rem' }}>
          <h3>Sepet</h3>
          {cartItems.length === 0 ? (
            <p className="text-secondary">Henüz ürün eklenmedi.</p>
          ) : (
            <div className="stack gap-md">
              {cartItems.map((item) => {
                const key = itemKey(item);
                const lineTotal = computeLineTotal(item.unit_price, item.quantity, item.half_portion, item.extra_cheese_qty);
                const showModifiers = itemAllowsModifiers(item);
                return (
                  <div key={key} className="stack gap-xs" style={{ borderBottom: '1px solid var(--divider)', paddingBottom: '0.85rem' }}>
                    <div className="row space-between">
                      <span style={{ fontWeight: 500 }}>{item.product_name_snapshot}</span>
                      <span>{lineTotal.toFixed(2)} TL</span>
                    </div>
                    <div className="row space-between">
                      <div className="row gap-xs">
                        <button type="button" className="btn btn-ghost" onClick={() => handleQuantityChange(item, -1)} disabled={!canEdit}>
                          −
                        </button>
                        <span style={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                        <button type="button" className="btn btn-ghost" onClick={() => handleQuantityChange(item, 1)} disabled={!canEdit}>
                          +
                        </button>
                      </div>
                      <button type="button" className="btn btn-danger" onClick={() => setDeleteItemTarget(item)} disabled={!canEdit}>
                        Sil
                      </button>
                    </div>
                    <input
                      className="input"
                      placeholder="Not ekle (örn. az şekerli)"
                      value={
                        isClosedAdminEdit
                          ? item.note || ''
                          : noteDrafts[item.id] !== undefined
                          ? noteDrafts[item.id]
                          : item.note || ''
                      }
                      onChange={(e) => handleNoteChange(item, e.target.value)}
                      onBlur={() => handleNoteSave(item)}
                      disabled={!canEdit}
                      style={{ fontSize: '0.8rem' }}
                    />
                    {showModifiers && (
                      <div className="row space-between" style={{ fontSize: '0.8rem', alignItems: 'center' }}>
                        <div className="row gap-xs" style={{ alignItems: 'center' }}>
                          <span className="text-secondary">Ekstra Peynir</span>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => handleExtraCheeseChange(item, -1)}
                            disabled={!canEdit || (item.extra_cheese_qty || 0) <= 0}
                          >
                            −
                          </button>
                          <span style={{ minWidth: 18, textAlign: 'center' }}>{item.extra_cheese_qty || 0}</span>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => handleExtraCheeseChange(item, 1)}
                            disabled={!canEdit}
                          >
                            +
                          </button>
                        </div>
                        <label className="row gap-xs" style={{ alignItems: 'center', cursor: canEdit ? 'pointer' : 'default' }}>
                          <input
                            type="checkbox"
                            checked={!!item.half_portion}
                            onChange={(e) => handleHalfPortionChange(item, e.target.checked)}
                            disabled={!canEdit}
                          />
                          <span className="text-secondary">1.5 Porsiyon</span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <DiscountControl
            discountType={activeDiscountType}
            discountValue={activeDiscountValue}
            currentDiscountAmount={discountAmount}
            disabled={!canEdit || cartItems.length === 0}
            onApply={handleApplyDiscount}
            onClear={handleClearDiscount}
          />

          <div className="stack gap-xs">
            {discountAmount > 0 && (
              <div className="row space-between text-secondary" style={{ fontSize: '0.85rem' }}>
                <span>Ara Toplam</span>
                <span>{subtotal.toFixed(2)} TL</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="row space-between text-secondary" style={{ fontSize: '0.85rem' }}>
                <span>İndirim ({discountLabel(activeDiscountType, activeDiscountValue)})</span>
                <span>−{discountAmount.toFixed(2)} TL</span>
              </div>
            )}
            <div className="row space-between" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              <span>Toplam</span>
              <span>{finalTotal.toFixed(2)} TL</span>
            </div>
          </div>

          {isClosedAdminEdit ? (
            <div className="stack gap-sm">
              <button type="button" className="btn btn-primary btn-block" onClick={handleSaveDraft} disabled={saving}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={handleDiscardDraft} disabled={saving}>
                Değişiklikleri Geri Al
              </button>
            </div>
          ) : (
            <div className="stack gap-sm">
              <button
                type="button"
                className="btn btn-block"
                onClick={handlePrint}
                disabled={cartItems.length === 0 || order.status !== 'open'}
              >
                Mutfağa Gönder
              </button>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => setShowPaymentModal(true)}
                disabled={cartItems.length === 0 || order.status !== 'open'}
              >
                Hesabı Kapat
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteItemTarget}
        title="Kalemi sil"
        message={deleteItemTarget ? `"${deleteItemTarget.product_name_snapshot}" adisyondan kaldırılacak. Emin misiniz?` : ''}
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeleteItemTarget(null)}
      />

      <ConfirmDialog
        open={showEmptyDeleteConfirm}
        title="Fişi sil"
        message="Bu adisyonda ürün kalmadı, toplam 0 TL. Kaydetmek yerine fiş tamamen silinecek. Onaylıyor musunuz?"
        onConfirm={confirmDeleteEmptyOrder}
        onCancel={() => setShowEmptyDeleteConfirm(false)}
      />

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            role="dialog"
            aria-modal="true"
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !closing && setShowPaymentModal(false)}
          >
            <motion.div
              className="card stack gap-md"
              style={{ width: 'min(320px, 92vw)' }}
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Ödeme Tipi Seçin</h3>
              <div className="row gap-sm">
                <button type="button" className="btn btn-block btn-lg" disabled={closing} onClick={() => handleClose('nakit')}>
                  Nakit
                </button>
                <button type="button" className="btn btn-block btn-lg" disabled={closing} onClick={() => handleClose('kart')}>
                  Kart
                </button>
              </div>
              <button type="button" className="btn btn-ghost" disabled={closing} onClick={() => setShowPaymentModal(false)}>
                Vazgeç
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReceiptModal receipt={receipt} onClose={handleReceiptClose} />
    </div>
  );
}
