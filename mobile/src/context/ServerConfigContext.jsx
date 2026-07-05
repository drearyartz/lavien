import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBaseUrl } from '../api/client';

const STORAGE_KEY = 'lavien_server_url';
const ServerConfigContext = createContext(null);

function normalizeUrl(input) {
  let value = input.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }
  value = value.replace(/\/+$/, '');
  if (!/\/api$/i.test(value)) {
    value = `${value}/api`;
  }
  return value;
}

export function ServerConfigProvider({ children }) {
  const [serverUrl, setServerUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        setBaseUrl(stored);
        setServerUrl(stored);
      }
      setLoading(false);
    });
  }, []);

  async function saveServerUrl(input) {
    const normalized = normalizeUrl(input);
    if (!normalized) throw new Error('Geçerli bir sunucu adresi girin.');
    await AsyncStorage.setItem(STORAGE_KEY, normalized);
    setBaseUrl(normalized);
    setServerUrl(normalized);
    return normalized;
  }

  async function clearServerUrl() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setBaseUrl(null);
    setServerUrl(null);
  }

  return (
    <ServerConfigContext.Provider value={{ serverUrl, loading, saveServerUrl, clearServerUrl }}>
      {children}
    </ServerConfigContext.Provider>
  );
}

export function useServerConfig() {
  const ctx = useContext(ServerConfigContext);
  if (!ctx) throw new Error('useServerConfig, ServerConfigProvider icinde kullanilmalidir.');
  return ctx;
}
