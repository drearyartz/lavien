import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

/**
 * BarChart.jsx'in (frontend) düz View genişlik-bazlı RN karşılığı.
 * data: [{ label, value }], deger buyukten kucuge sirali gelmeli.
 */
export default function BarRow({ data, unit = '' }) {
  if (!data || data.length === 0) {
    return <Text style={styles.empty}>Bu aralıkta veri yok.</Text>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={styles.wrap}>
      {data.map((d) => (
        <View key={d.label} style={styles.row}>
          <View style={styles.labelRow}>
            <Text style={styles.label} numberOfLines={1}>{d.label}</Text>
            <Text style={styles.value}>{d.value}{unit}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(d.value / max) * 100}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  label: { flex: 1, fontSize: 13, color: colors.textPrimary },
  value: { fontSize: 13, color: colors.textSecondary },
  track: { height: 8, borderRadius: 999, backgroundColor: colors.surfaceInput, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.75)' },
  empty: { color: colors.textSecondary, fontSize: 13 },
});
