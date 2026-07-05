import { View, Text, StyleSheet } from 'react-native';

const STYLES = {
  mobile: { label: 'MOBİL', color: '#60a5fa', background: 'rgba(96, 165, 250, 0.14)' },
  admin: { label: 'ADMIN', color: '#f87171', background: 'rgba(248, 113, 113, 0.14)' },
  personel: { label: 'PERSONEL', color: '#4ade80', background: 'rgba(74, 222, 128, 0.14)' },
};

/**
 * Bir islemi (adisyon acma) kimin yaptigini gosteren etiket.
 * Web'deki RoleTag.jsx ile ayni mantik: mobile kanal/rol -> MOBIL, aksi halde ADMIN/PERSONEL.
 */
export default function RoleTag({ role, channel }) {
  if (!role && !channel) return null;
  const key = role === 'mobile' || channel === 'mobile' ? 'mobile' : role === 'admin' ? 'admin' : 'personel';
  const style = STYLES[key];

  return (
    <View style={[styles.tag, { backgroundColor: style.background, borderColor: `${style.color}55` }]}>
      <Text style={[styles.label, { color: style.color }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
