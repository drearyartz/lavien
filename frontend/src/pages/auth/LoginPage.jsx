import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandHeader from '../../components/BrandHeader';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(username, password);
      navigate(user.role === 'admin' ? '/admin' : '/masalar', { replace: true });
    } catch (err) {
      setError(err.message || 'Giriş başarısız oldu.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="page-narrow" style={{ width: '100%' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <BrandHeader />
        </div>
        <form className="card stack gap-md" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Kullanıcı Adı</label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı Adı"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
