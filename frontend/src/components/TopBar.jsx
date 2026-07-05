import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopBar({ title, actions }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div
      className="row space-between"
      style={{ marginBottom: '2rem', flexWrap: 'wrap', rowGap: '0.75rem' }}
    >
      <div className="stack gap-xs">
        <div className="row gap-sm" style={{ flexWrap: 'wrap', rowGap: '0.25rem' }}>
          <span style={{ letterSpacing: '0.18em', fontSize: '0.85rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            LA&apos;VIEN
          </span>
          <span className="text-tertiary">/</span>
          <span className="text-secondary" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{title}</span>
        </div>
      </div>
      <div className="row gap-sm" style={{ flexWrap: 'wrap', rowGap: '0.5rem' }}>
        {actions}
        <span className="text-secondary" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          {user?.displayName}
        </span>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
