import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarStyle: { backgroundColor: colors.bgMid, borderTopColor: colors.borderSubtle },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
      }}
    >
      <Tabs.Screen name="masalar" options={{ title: 'Masalar' }} />
      <Tabs.Screen
        name="raporlar"
        options={{ title: 'Raporlar', href: user?.role === 'admin' ? undefined : null }}
      />
    </Tabs>
  );
}
