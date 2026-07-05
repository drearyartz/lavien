import { Redirect } from 'expo-router';
import { useServerConfig } from '../context/ServerConfigContext';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { serverUrl, loading: serverLoading } = useServerConfig();
  const { user, loading: authLoading } = useAuth();

  if (serverLoading || authLoading) return null;
  if (!serverUrl) return <Redirect href="/server-setup" />;
  if (!user) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)/masalar" />;
}
