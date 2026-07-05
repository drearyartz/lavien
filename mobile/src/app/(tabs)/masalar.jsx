import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { colors, radius } from '../../theme/colors';
import RoleTag from '../../components/RoleTag';
import Button from '../../components/Button';

export default function MasalarScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/tables');
      setTables(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load({ silent: true });
    }, [])
  );

  useEffect(() => {
    load();
  }, []);

  async function handleSelect(table) {
    setError('');
    if (table.isOccupied && table.openOrderId) {
      router.push(`/adisyon/${table.openOrderId}`);
      return;
    }
    try {
      const order = await api.post('/orders', { tableId: table.id, channel: 'mobile' });
      router.push(`/adisyon/${order.id}`);
    } catch (err) {
      if (err.status === 409 && err.data?.order) {
        router.push(`/adisyon/${err.data.order.id}`);
        return;
      }
      setError(err.message);
    }
  }

  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Masa Seçimi</Text>
          <Text style={styles.subtitle}>{user?.displayName}</Text>
        </View>
        <Button label="Çıkış Yap" variant="ghost" small onPress={logout} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <Text style={styles.info}>Yükleniyor…</Text>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(t) => String(t.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.textSecondary}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              style={[
                styles.tableCard,
                {
                  backgroundColor: item.isOccupied ? colors.surfaceCardStrong : colors.surfaceCard,
                  borderColor: item.isOccupied ? colors.borderStrong : colors.borderSubtle,
                },
              ]}
            >
              <Text style={styles.tableName}>{item.name}</Text>
              <Text style={item.isOccupied ? styles.tableStatus : styles.tableStatusEmpty}>
                {item.isOccupied ? 'Dolu · Adisyona git' : 'Boş'}
              </Text>
              {item.isOccupied ? (
                <View style={styles.roleTagWrap}>
                  <RoleTag role={item.openedByRole} channel={item.openedChannel} />
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '600', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  info: { color: colors.textSecondary, fontSize: 14 },
  error: {
    color: colors.textPrimary,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 12,
    fontSize: 13,
  },
  list: { paddingBottom: 24 },
  row: { gap: 12, marginBottom: 12 },
  tableCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tableName: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  tableStatus: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  tableStatusEmpty: { fontSize: 12, color: colors.textTertiary },
  roleTagWrap: { marginTop: 2 },
});
