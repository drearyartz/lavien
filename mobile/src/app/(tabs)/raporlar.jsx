import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { colors, radius } from '../../theme/colors';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import BarRow from '../../components/BarRow';

const PRODUCT_CHART_LIMIT = 15;

const MODES = [
  { key: 'daily', label: 'Günlük' },
  { key: 'monthly', label: 'Aylık' },
  { key: 'range', label: 'Tarih Aralığı' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartStr() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function RaporlarScreen() {
  const [mode, setMode] = useState('daily');
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [summary, setSummary] = useState(null);
  const [byProduct, setByProduct] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function rangeForMode() {
    if (mode === 'daily') return { from: todayStr(), to: todayStr() };
    if (mode === 'monthly') return { from: monthStartStr(), to: todayStr() };
    return { from, to };
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const range = rangeForMode();
      const query = `?from=${range.from}&to=${range.to}`;
      const [summaryData, productData, categoryData] = await Promise.all([
        api.get(`/reports${query}`),
        api.get(`/reports/by-product${query}`),
        api.get(`/reports/by-category${query}`),
      ]);
      setSummary(summaryData);
      setByProduct(productData.products || []);
      setByCategory(categoryData.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Tarih araligi modunda, baslangic/bitis degisince kisa bir gecikmeyle otomatik yeniden yukler.
  useEffect(() => {
    if (mode !== 'range') return;
    const timer = setTimeout(() => load(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, mode]);

  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Raporlar</Text>

      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <Pressable
            key={m.key}
            onPress={() => setMode(m.key)}
            style={[styles.modeBtn, mode === m.key && styles.modeBtnActive]}
          >
            <Text style={[styles.modeLabel, mode === m.key && styles.modeLabelActive]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      {mode === 'range' ? (
        <View style={styles.rangeRow}>
          <View style={styles.rangeField}>
            <Text style={styles.rangeLabel}>Başlangıç</Text>
            <TextInput
              style={styles.rangeInput}
              value={from}
              onChangeText={setFrom}
              placeholder="YYYY-AA-GG"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.rangeField}>
            <Text style={styles.rangeLabel}>Bitiş</Text>
            <TextInput
              style={styles.rangeInput}
              value={to}
              onChangeText={setTo}
              placeholder="YYYY-AA-GG"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
            />
          </View>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading || !summary ? (
        <Text style={styles.info}>Yükleniyor…</Text>
      ) : (
        <View style={styles.stack}>
          <View style={styles.statsRow}>
            <StatCard label="Toplam Ciro" value={`${summary.revenue.toFixed(2)} TL`} />
            <StatCard label="Kapanan Adisyon" value={summary.orderCount} />
          </View>
          <StatCard label="Toplam İndirim" value={`${(summary.discountTotal || 0).toFixed(2)} TL`} />

          <Card>
            <Text style={styles.cardTitle}>Güne Göre Ciro</Text>
            {summary.byDay.length === 0 ? (
              <Text style={styles.info}>Bu aralıkta kapanan adisyon yok.</Text>
            ) : (
              <View style={styles.dayList}>
                {summary.byDay.map((d) => (
                  <View key={d.day} style={styles.dayRow}>
                    <Text style={styles.secondary}>{d.day}</Text>
                    <Text style={styles.secondary}>{d.orderCount} adisyon</Text>
                    <Text style={styles.dayRevenue}>{d.revenue.toFixed(2)} TL</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card>
            <Text style={styles.cardTitle}>Kategori Bazlı Satış Adedi</Text>
            <BarRow data={byCategory.map((c) => ({ label: c.categoryName, value: c.totalQuantity }))} unit=" adet" />
          </Card>

          <Card>
            <Text style={styles.cardTitle}>Ürün Bazlı Satış Adedi (İlk {PRODUCT_CHART_LIMIT})</Text>
            <BarRow
              data={[...byProduct]
                .sort((a, b) => b.totalQuantity - a.totalQuantity)
                .slice(0, PRODUCT_CHART_LIMIT)
                .map((p) => ({ label: p.productName, value: p.totalQuantity }))}
              unit=" adet"
            />
          </Card>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  title: { fontSize: 22, fontWeight: '600', color: colors.textPrimary },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeBtnActive: { borderColor: colors.accentRed },
  modeLabel: { color: colors.textSecondary, fontSize: 13 },
  modeLabelActive: { color: colors.textPrimary, fontWeight: '600' },
  rangeRow: { flexDirection: 'row', gap: 10 },
  rangeField: { flex: 1, gap: 4 },
  rangeLabel: { fontSize: 12, color: colors.textSecondary },
  rangeInput: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    padding: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  info: { color: colors.textSecondary, fontSize: 13 },
  error: {
    color: colors.textPrimary,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: 10,
    fontSize: 13,
  },
  stack: { gap: 16 },
  statsRow: { flexDirection: 'row', gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  dayList: { gap: 8 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  secondary: { fontSize: 13, color: colors.textSecondary },
  dayRevenue: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
});
