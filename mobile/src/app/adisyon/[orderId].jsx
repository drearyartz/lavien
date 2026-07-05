import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../api/client';
import { discountLabel } from '../../utils/discount';
import { computeLineTotal } from '../../utils/pricing';
import { colors, radius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ConfirmDialog from '../../components/ConfirmDialog';
import ReceiptModal from '../../components/ReceiptModal';
import RoleTag from '../../components/RoleTag';

export default function AdisyonScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [viewMode, setViewMode] = useState('menu'); // 'menu' | 'cart'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteItemTarget, setDeleteItemTarget] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [sending, setSending] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState({});

  const canEdit = order && order.status === 'open';

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
    try {
      const updated = await api.patch(`/orders/${orderId}/items/${item.id}`, { extraCheeseQty: newQty });
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleHalfPortionChange(item, checked) {
    setError('');
    try {
      const updated = await api.patch(`/orders/${orderId}/items/${item.id}`, { halfPortion: checked });
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleNoteChange(item, value) {
    setNoteDrafts((prev) => ({ ...prev, [item.id]: value }));
  }

  async function handleNoteSave(item) {
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
    try {
      const updated = await api.delete(`/orders/${orderId}/items/${deleteItemTarget.id}`);
      setOrder(updated);
      setDeleteItemTarget(null);
    } catch (err) {
      setError(err.message);
      setDeleteItemTarget(null);
    }
  }

  async function handlePrint() {
    setError('');
    setSending(true);
    try {
      await flushPendingNotes();
      const result = await api.post(`/orders/${orderId}/print`, {});
      setReceipt(result.receipt);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (authLoading) return null;
  if (!user) return <Redirect href="/login" />;

  if (loading) {
    return (
      <SafeAreaView style={styles.page} edges={['top', 'left', 'right', 'bottom']}>
        <Text style={styles.info}>Yükleniyor…</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.page} edges={['top', 'left', 'right', 'bottom']}>
        <Text style={styles.error}>{error || 'Adisyon bulunamadı.'}</Text>
      </SafeAreaView>
    );
  }

  const cartItems = Array.isArray(order.items) ? order.items : [];
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
  const discountAmount = order.discountAmount || 0;
  const finalTotal = order.finalTotal ?? subtotal;

  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Adisyon #{order.id}</Text>
          <RoleTag role={order.openedByRole} channel={order.opened_channel} />
        </View>
        <Button label="Masalara Dön" variant="ghost" small onPress={() => router.replace('/(tabs)/masalar')} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {order.status !== 'open' ? (
        <Card style={styles.notice}>
          <Text style={styles.noticeText}>Bu adisyon kapalı, sadece görüntülenebilir.</Text>
        </Card>
      ) : null}

      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segmentBtn, viewMode === 'menu' && styles.segmentBtnActive]}
          onPress={() => setViewMode('menu')}
        >
          <Text style={[styles.segmentLabel, viewMode === 'menu' && styles.segmentLabelActive]}>Menü</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, viewMode === 'cart' && styles.segmentBtnActive]}
          onPress={() => setViewMode('cart')}
        >
          <Text style={[styles.segmentLabel, viewMode === 'cart' && styles.segmentLabelActive]}>
            Sepet ({cartItems.length})
          </Text>
        </Pressable>
      </View>

      {viewMode === 'menu' ? (
        <View style={styles.fill}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setActiveCategoryId(cat.id)}
                style={[styles.categoryPill, activeCategoryId === cat.id && styles.categoryPillActive]}
              >
                <Text
                  style={[
                    styles.categoryLabel,
                    activeCategoryId === cat.id && styles.categoryLabelActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <FlatList
            data={categoryProducts}
            keyExtractor={(p) => String(p.id)}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productList}
            ListEmptyComponent={<Text style={styles.info}>Bu kategoride ürün yok.</Text>}
            renderItem={({ item: p }) => (
              <Pressable
                disabled={!canEdit}
                onPress={() => handleAddProduct(p)}
                style={[styles.productCard, !canEdit && styles.disabled]}
              >
                <Text style={styles.productName}>{p.name}</Text>
                <Text style={styles.secondary}>{p.price.toFixed(2)} TL</Text>
              </Pressable>
            )}
          />
        </View>
      ) : (
        <ScrollView style={styles.fill} contentContainerStyle={styles.cartScroll}>
          {cartItems.length === 0 ? (
            <Text style={styles.info}>Henüz ürün eklenmedi.</Text>
          ) : (
            cartItems.map((item) => {
              const lineTotal = computeLineTotal(item.unit_price, item.quantity, item.half_portion, item.extra_cheese_qty);
              const showModifiers = itemAllowsModifiers(item);
              return (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.row}>
                    <Text style={styles.itemName}>{item.product_name_snapshot}</Text>
                    <Text style={styles.itemName}>{lineTotal.toFixed(2)} TL</Text>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.qtyRow}>
                      <Button label="−" variant="ghost" small disabled={!canEdit} onPress={() => handleQuantityChange(item, -1)} />
                      <Text style={styles.qtyValue}>{item.quantity}</Text>
                      <Button label="+" variant="ghost" small disabled={!canEdit} onPress={() => handleQuantityChange(item, 1)} />
                    </View>
                    <Button label="Sil" variant="danger" small disabled={!canEdit} onPress={() => setDeleteItemTarget(item)} />
                  </View>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Not ekle (örn. az şekerli)"
                    placeholderTextColor={colors.textTertiary}
                    value={noteDrafts[item.id] !== undefined ? noteDrafts[item.id] : item.note || ''}
                    onChangeText={(v) => handleNoteChange(item, v)}
                    onBlur={() => handleNoteSave(item)}
                    editable={canEdit}
                  />
                  {showModifiers ? (
                    <View style={styles.row}>
                      <View style={styles.qtyRow}>
                        <Text style={styles.secondary}>Ekstra Peynir</Text>
                        <Button
                          label="−"
                          variant="ghost"
                          small
                          disabled={!canEdit || (item.extra_cheese_qty || 0) <= 0}
                          onPress={() => handleExtraCheeseChange(item, -1)}
                        />
                        <Text style={styles.qtyValue}>{item.extra_cheese_qty || 0}</Text>
                        <Button label="+" variant="ghost" small disabled={!canEdit} onPress={() => handleExtraCheeseChange(item, 1)} />
                      </View>
                      <Pressable
                        style={styles.halfPortionRow}
                        disabled={!canEdit}
                        onPress={() => handleHalfPortionChange(item, !item.half_portion)}
                      >
                        <View style={[styles.checkbox, item.half_portion && styles.checkboxChecked]} />
                        <Text style={styles.secondary}>1.5 Porsiyon</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}

          <View style={styles.totalsBlock}>
            {discountAmount > 0 ? (
              <View style={styles.row}>
                <Text style={styles.secondary}>Ara Toplam</Text>
                <Text style={styles.secondary}>{subtotal.toFixed(2)} TL</Text>
              </View>
            ) : null}
            {discountAmount > 0 ? (
              <View style={styles.row}>
                <Text style={styles.secondary}>İndirim ({discountLabel(order.discount_type, order.discount_value)})</Text>
                <Text style={styles.secondary}>−{discountAmount.toFixed(2)} TL</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.totalLabel}>Toplam</Text>
              <Text style={styles.totalLabel}>{finalTotal.toFixed(2)} TL</Text>
            </View>
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Pressable onPress={() => setViewMode('cart')} style={styles.summaryBar}>
          <Text style={styles.summaryText}>{cartItems.length} ürün</Text>
          <Text style={styles.summaryTotal}>{finalTotal.toFixed(2)} TL</Text>
        </Pressable>
        <Button
          label={sending ? 'Gönderiliyor…' : 'Mutfağa Gönder'}
          variant="primary"
          disabled={cartItems.length === 0 || order.status !== 'open' || sending}
          onPress={handlePrint}
        />
      </View>

      <ConfirmDialog
        open={!!deleteItemTarget}
        title="Kalemi sil"
        message={deleteItemTarget ? `"${deleteItemTarget.product_name_snapshot}" adisyondan kaldırılacak. Emin misiniz?` : ''}
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeleteItemTarget(null)}
      />

      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16 },
  fill: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  info: { color: colors.textSecondary, fontSize: 14, padding: 8 },
  error: {
    color: colors.textPrimary,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 10,
    fontSize: 13,
  },
  notice: { marginBottom: 12, paddingVertical: 10 },
  noticeText: { fontSize: 13, color: colors.textSecondary },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: colors.white, borderColor: colors.white },
  segmentLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  segmentLabelActive: { color: colors.black },
  categoryRow: { flexGrow: 0, marginBottom: 12 },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  categoryPillActive: { backgroundColor: colors.white, borderColor: colors.white },
  categoryLabel: { color: colors.textPrimary, fontSize: 13 },
  categoryLabelActive: { color: colors.black, fontWeight: '600' },
  productList: { paddingBottom: 24 },
  productRow: { gap: 10, marginBottom: 10 },
  productCard: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: 14,
  },
  disabled: { opacity: 0.4 },
  productName: { color: colors.textPrimary, fontWeight: '600', marginBottom: 6, fontSize: 14 },
  secondary: { color: colors.textSecondary, fontSize: 13 },
  cartScroll: { paddingBottom: 24, gap: 4 },
  cartItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 12,
    marginBottom: 12,
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyValue: { color: colors.textPrimary, minWidth: 20, textAlign: 'center', fontSize: 14 },
  noteInput: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    padding: 8,
    fontSize: 12,
    color: colors.textPrimary,
  },
  halfPortionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  checkboxChecked: { backgroundColor: colors.white, borderColor: colors.white },
  totalsBlock: { marginTop: 12, gap: 6 },
  totalLabel: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  footer: { gap: 10, paddingTop: 12 },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  summaryText: { color: colors.textSecondary, fontSize: 13 },
  summaryTotal: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
});
