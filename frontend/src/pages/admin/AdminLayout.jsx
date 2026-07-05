import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import TopBar from '../../components/TopBar';

const TABS = [
  { to: 'kategoriler', label: 'Kategoriler' },
  { to: 'urunler', label: 'Ürünler' },
  { to: 'masalar', label: 'Masa Yönetimi' },
  { to: 'kullanicilar', label: 'Kullanıcılar' },
  { to: 'raporlar', label: 'Raporlar' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="page">
      <TopBar
        title="Yönetim Paneli"
        actions={
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/masalar')}>
            Sipariş Al
          </button>
        }
      />

      <div className="row admin-tabs gap-xs" style={{ marginBottom: '1.75rem', borderBottom: '1px solid var(--divider)' }}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `btn btn-ghost${isActive ? ' nav-tab-active' : ''}`}
            style={({ isActive }) => ({
              borderRadius: 0,
              borderBottom: isActive ? '2px solid var(--accent-red)' : '2px solid transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              flexShrink: 0,
            })}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
