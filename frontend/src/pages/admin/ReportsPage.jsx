import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../api/client';
import DayOrdersModal from '../../components/DayOrdersModal';
import BarChart from '../../components/BarChart';
import PieChart from '../../components/PieChart';

const PRODUCT_CHART_LIMIT = 15;

const MODES = [
  { key: 'daily', label: 'Günlük' },
  { key: 'monthly', label: 'Aylık' },
  { key: 'range', label: 'Tarih Aralığı' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartStr() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [mode, setMode] = useState('daily');
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [summary, setSummary] = useState(null);
  const [byProduct, setByProduct] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [chartsOpen, setChartsOpen] = useState(false);

  function rangeForMode() {
    if (mode === 'daily') return { from: todayStr(), to: todayStr() };
    if (mode === 'monthly') return { from: monthStartStr(), to: todayStr() };
    return { from, to };
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const range = rangeForMode();
      const query = `?from=${range.from}&to=${range.to}`;
      const [summaryData, productData, categoryData] = await Promise.all([
        api.get(`/reports${query}`),
        api.get(`/reports/by-product${query}`),
        api.get(`/reports/by-category${query}`),
      ]);
      setSummary(summaryData);
      setByProduct(productData.products);
      setByCategory(categoryData.categories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Tarih araligi modunda, kullanici baslangic/bitis tarihini degistirince
  // "Uygula"ya basmadan otomatik olarak yeniden yuklenir (kisa bir gecikmeyle).
  useEffect(() => {
    if (mode !== 'range') return;
    const timer = setTimeout(() => load(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, mode]);

  return (
    <div className="stack gap-lg">
      <h2>Raporlar</h2>
      {error && <div className="error-text">{error}</div>}

      <div className="row gap-xs" style={{ borderBottom: '1px solid var(--divider)' }}>
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`btn btn-ghost${mode === m.key ? ' nav-tab-active' : ''}`}
            style={{
              borderRadius: 0,
              borderBottom: mode === m.key ? '2px solid var(--accent-red)' : '2px solid transparent',
              color: mode === m.key ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {mode === 'range' && (
          <motion.div
            className="row gap-sm wrap"
            style={{ alignItems: 'flex-end' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="field">
              <label htmlFor="from">Başlangıç</label>
              <input id="from" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="to">Bitiş</label>
              <input id="to" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary" onClick={load}>
              Uygula
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <p>Yükleniyor…</p>
      ) : summary ? (
        <>
          <div className="row gap-md wrap">
            <div className="card" style={{ minWidth: 220 }}>
              <p className="text-secondary" style={{ marginBottom: '0.5rem' }}>Toplam Ciro</p>
              <div style={{ fontSize: '2rem', fontWeight: 600 }}>{summary.revenue.toFixed(2)} TL</div>
            </div>
            <div className="card" style={{ minWidth: 220 }}>
              <p className="text-secondary" style={{ marginBottom: '0.5rem' }}>Kapanan Adisyon</p>
              <div style={{ fontSize: '2rem', fontWeight: 600 }}>{summary.orderCount}</div>
            </div>
            <div className="card" style={{ minWidth: 220 }}>
              <p className="text-secondary" style={{ marginBottom: '0.5rem' }}>Toplam İndirim</p>
              <div style={{ fontSize: '2rem', fontWeight: 600 }}>{(summary.discountTotal || 0).toFixed(2)} TL</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '1.25rem 1.5rem 0.5rem' }}>
              <h3 style={{ fontSize: '1rem' }}>Güne Göre Ciro</h3>
            </div>
            {summary.byDay.length === 0 ? (
              <p style={{ padding: '1.5rem' }}>Bu aralıkta kapanan adisyon yok.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Adisyon Sayısı</th>
                    <th>İndirim</th>
                    <th>Ciro</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byDay.map((d) => (
                    <tr
                      key={d.day}
                      onClick={() => setSelectedDay(d.day)}
                      style={{ cursor: 'pointer' }}
                      title="Bu güne ait adisyonları görüntüle"
                    >
                      <td>{d.day}</td>
                      <td>{d.orderCount}</td>
                      <td>{d.discount > 0 ? `−${d.discount.toFixed(2)} TL` : '—'}</td>
                      <td>{d.revenue.toFixed(2)} TL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="row gap-md wrap" style={{ alignItems: 'stretch' }}>
            <div className="card" style={{ flex: '1 1 320px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Kategori Bazlı Satış Adedi</h3>
              <BarChart
                data={byCategory.map((c) => ({ label: c.categoryName, value: c.totalQuantity }))}
                unit=" adet"
              />
            </div>
            <div className="card" style={{ flex: '1 1 320px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Ürün Bazlı Satış Adedi (İlk {PRODUCT_CHART_LIMIT})</h3>
              <BarChart
                data={[...byProduct]
                  .sort((a, b) => b.totalQuantity - a.totalQuantity)
                  .slice(0, PRODUCT_CHART_LIMIT)
                  .map((p) => ({ label: p.productName, value: p.totalQuantity }))}
                unit=" adet"
              />
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <button
              type="button"
              className="btn btn-ghost row space-between"
              style={{ width: '100%', padding: '1.25rem 1.5rem', borderRadius: 0 }}
              onClick={() => setChartsOpen((v) => !v)}
            >
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Ürün ve Kategori Dağılım Grafiği</h3>
              <span className="text-secondary">{chartsOpen ? '▲' : '▼'}</span>
            </button>
            <AnimatePresence initial={false}>
              {chartsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="row gap-md wrap" style={{ padding: '0 1.5rem 1.5rem', alignItems: 'stretch' }}>
                    <div className="card" style={{ flex: '1 1 380px' }}>
                      <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Kategoriye Göre Satış Adedi</h3>
                      <PieChart
                        data={byCategory.map((c) => ({ label: c.categoryName, value: c.totalQuantity }))}
                        unit=" adet"
                      />
                    </div>
                    <div className="card" style={{ flex: '1 1 380px' }}>
                      <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Ürüne Göre Satış Adedi (İlk {PRODUCT_CHART_LIMIT})</h3>
                      <PieChart
                        data={[...byProduct]
                          .sort((a, b) => b.totalQuantity - a.totalQuantity)
                          .slice(0, PRODUCT_CHART_LIMIT)
                          .map((p) => ({ label: p.productName, value: p.totalQuantity }))}
                        unit=" adet"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '1.25rem 1.5rem 0.5rem' }}>
              <h3 style={{ fontSize: '1rem' }}>Ürün Bazlı Kırılım</h3>
            </div>
            {byProduct.length === 0 ? (
              <p style={{ padding: '1.5rem' }}>Bu aralıkta satış yok.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Adet</th>
                    <th>Ciro</th>
                  </tr>
                </thead>
                <tbody>
                  {byProduct.map((p) => (
                    <tr key={p.productName}>
                      <td>{p.productName}</td>
                      <td>{p.totalQuantity}</td>
                      <td>{p.totalRevenue.toFixed(2)} TL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}

      <DayOrdersModal date={selectedDay} onClose={() => setSelectedDay(null)} onChanged={load} />
    </div>
  );
}
