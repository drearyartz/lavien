import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useServerConfig } from '../context/ServerConfigContext';
import { checkServerReachable } from '../api/client';
import { colors, radius } from '../theme/colors';
import Button from '../components/Button';
import Card from '../components/Card';

export default function ServerSetupScreen() {
  const { saveServerUrl } = useServerConfig();
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');
    setWarning('');
    if (!address.trim()) {
      setError('Sunucu adresini girin.');
      return;
    }
    setSubmitting(true);
    try {
      const normalized = await saveServerUrl(address);
      const reachable = await checkServerReachable(normalized);
      if (!reachable) {
        setWarning('Sunucuya ulaşılamadı, IP adresini kontrol edin. Yine de devam edebilirsiniz.');
      }
      router.replace('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.center}>
        <Text style={styles.brandTitle}>LA'VIEN</Text>
        <Text style={styles.brandSubtitle}>CAFE & RESTAURANT</Text>

        <Card style={styles.card}>
          <Text style={styles.label}>Sunucu Adresi</Text>
          <Text style={styles.hint}>Örn. 192.168.1.50:3001</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="192.168.1.50:3001"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {warning ? <Text style={styles.warning}>{warning}</Text> : null}
          <Button
            label={submitting ? 'Bağlanıyor…' : 'Kaydet ve Devam Et'}
            variant="primary"
            onPress={handleSubmit}
            disabled={submitting}
            style={styles.submit}
          />
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  brandTitle: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 6,
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  brandSubtitle: {
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 3,
    color: colors.textTertiary,
    marginTop: 6,
    marginBottom: 36,
    textTransform: 'uppercase',
  },
  card: { gap: 8 },
  label: { fontSize: 13, color: colors.textSecondary },
  hint: { fontSize: 12, color: colors.textTertiary, marginBottom: 4 },
  input: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  error: {
    color: colors.textPrimary,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: 8,
    fontSize: 13,
    marginTop: 8,
  },
  warning: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  submit: { marginTop: 12 },
});
