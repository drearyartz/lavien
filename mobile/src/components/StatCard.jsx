import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { colors } from '../theme/colors';

export default function StatCard({ label, value }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140 },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  value: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
});
