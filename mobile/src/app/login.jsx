import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useServerConfig } from '../context/ServerConfigContext';
import { colors, radius } from '../theme/colors';
import Button from '../components/Button';
import Card from '../components/Card';

export default function LoginScreen() {
  const { login } = useAuth();
  const { clearServerUrl } = useServerConfig();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      router.replace('/(tabs)/masalar');
    } catch (err) {
      setError(err.message || 'Giriş başarısız oldu.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangeServer() {
    await clearServerUrl();
    router.replace('/server-setup');
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
          <View style={styles.field}>
            <Text style={styles.label}>Kullanıcı Adı</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Kullanıcı Adı"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            variant="primary"
            onPress={handleSubmit}
            disabled={submitting}
            style={styles.submit}
          />
        </Card>

        <Button
          label="Sunucuyu Değiştir"
          variant="ghost"
          onPress={handleChangeServer}
          style={styles.changeServer}
        />
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
  card: { gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, color: colors.textSecondary },
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
  },
  submit: { marginTop: 4 },
  changeServer: { marginTop: 16, alignSelf: 'center' },
});
