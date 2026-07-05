import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import TopBar from '../../components/TopBar';
import RoleTag from '../../components/RoleTag';
import { useAuth } from '../../context/AuthContext';

export default function TableSelectPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/tables');
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSelect(table) {
    setError('');
    if (table.isOccupied && table.openOrderId) {
      navigate(`/adisyon/${table.openOrderId}`);
      return;
    }
    try {
      const order = await api.post('/orders', { tableId: table.id });
      navigate(`/adisyon/${order.id}`);
    } catch (err) {
      if (err.status === 409 && err.data?.order) {
        navigate(`/adisyon/${err.data.order.id}`);
        return;
      }
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <TopBar
        title="Masa Seçimi"
        actions={
          user?.role === 'admin' ? (
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin')}>
              Yönetim Paneli
            </button>
          ) : null
        }
      />
      {error && <div className="error-text" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {loading ? (
        <p>Yükleniyor…</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1rem',
          }}
        >
          {tables.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelect(t)}
              className="card"
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                padding: '2rem 1rem',
                background: t.isOccupied ? 'var(--surface-card-strong)' : 'var(--surface-card)',
                border: t.isOccupied ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t.name}</div>
              <div className={t.isOccupied ? 'text-secondary' : 'text-tertiary'} style={{ fontSize: '0.8rem', marginBottom: t.isOccupied ? '0.6rem' : 0 }}>
                {t.isOccupied ? 'Dolu · Adisyona git' : 'Boş'}
              </div>
              {t.isOccupied && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <RoleTag role={t.openedByRole} channel={t.openedChannel} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
