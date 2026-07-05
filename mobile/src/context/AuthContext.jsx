import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['lavien_token', 'lavien_user']).then((pairs) => {
      const token = pairs.find(([key]) => key === 'lavien_token')?.[1];
      const storedUser = pairs.find(([key]) => key === 'lavien_user')?.[1];
      if (token && storedUser) {
        setToken(token);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    });
  }, []);

  async function login(username, password) {
    const result = await api.login(username, password);
    await AsyncStorage.multiSet([
      ['lavien_token', result.token],
      ['lavien_user', JSON.stringify(result.user)],
    ]);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }

  async function logout() {
    await AsyncStorage.multiRemove(['lavien_token', 'lavien_user']);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider icinde kullanilmalidir.');
  return ctx;
}
