import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/colors';
import RoleTag from './RoleTag';
import Button from './Button';

function formatDateTime(value) {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

// Mobilde hesap kapatma olmadigi icin receipt her zaman type==='kitchen' (mutfak fisi) olur.
export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;
  const { brand, order, items } = receipt;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <ScrollView>
            <Text style={styles.brand}>{brand.name}</Text>
            <Text style={styles.brandSubtitle}>{brand.subtitle}</Text>
            <Text style={styles.receiptType}>MUTFAK FİŞİ</Text>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.secondary}>Masa</Text>
              <Text style={styles.secondary}>{order.tableName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.secondary}>Tarih</Text>
              <Text style={styles.secondary}>{formatDateTime(order.createdAt)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.secondary}>Gönderen</Text>
              <View style={styles.staffWrap}>
                <Text style={styles.secondary}>{order.staffName || '—'}</Text>
                <RoleTag role={order.staffRole} channel={order.channel} />
              </View>
            </View>

            <View style={styles.divider} />

            {items.map((item, idx) => (
              <View key={idx} style={styles.itemBlock}>
                <Text style={styles.itemLine}>
                  {item.quantity} × {item.name}
                  {item.isNew ? <Text style={styles.secondary}> (+)</Text> : null}
                </Text>
                {item.note ? <Text style={styles.tertiary}>Not: {item.note}</Text> : null}
                {item.modifiers && item.modifiers.length > 0 ? (
                  <Text style={styles.tertiary}>{item.modifiers.join(', ')}</Text>
                ) : null}
              </View>
            ))}

            <Text style={styles.footer}>Adisyon açık kalmaya devam ediyor.</Text>
          </ScrollView>

          <Button label="Kapat" variant="ghost" onPress={onClose} style={styles.closeBtn} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 4, 5, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: colors.bgMid,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: 20,
  },
  brand: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 4,
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  brandSubtitle: {
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  receiptType: {
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textTertiary,
    marginTop: 8,
  },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  secondary: { fontSize: 13, color: colors.textSecondary },
  tertiary: { fontSize: 12, color: colors.textTertiary },
  staffWrap: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  itemBlock: { marginBottom: 8 },
  itemLine: { fontSize: 14, color: colors.textPrimary },
  footer: { textAlign: 'center', fontSize: 12, color: colors.textTertiary, marginTop: 12 },
  closeBtn: { marginTop: 16 },
});
