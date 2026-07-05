import { View, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ServerConfigProvider } from '../context/ServerConfigContext';
import { AuthProvider } from '../context/AuthContext';
import { colors } from '../theme/colors';

if (Platform.OS === 'web') {
  require('../global.css');
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ServerConfigProvider>
        <AuthProvider>
          <View style={styles.fill}>
            <LinearGradient
              colors={[colors.bgTop, colors.bgMid, colors.bgBottom]}
              style={StyleSheet.absoluteFill}
            />
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </View>
        </AuthProvider>
      </ServerConfigProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
