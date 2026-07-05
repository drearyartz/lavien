import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('lavien_user');
    const token = localStorage.getItem('lavien_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  async function login(username, password) {
    const result = await api.login(username, password);
    localStorage.setItem('lavien_token', result.token);
    localStorage.setItem('lavien_user', JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }

  function logout() {
    localStorage.removeItem('lavien_token');
    localStorage.removeItem('lavien_user');
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
