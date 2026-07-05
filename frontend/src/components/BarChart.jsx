import { motion } from 'framer-motion';

/**
 * Basit yatay cubuk grafik. data: [{ label, value }], deger buyukten kucuge sirali gelmeli.
 */
export default function BarChart({ data, unit = '' }) {
  if (!data || data.length === 0) {
    return <p className="text-secondary">Bu aralıkta veri yok.</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="stack gap-sm">
      {data.map((d) => (
        <div key={d.label} className="stack gap-xs">
          <div className="row space-between" style={{ fontSize: '0.82rem' }}>
            <span>{d.label}</span>
            <span className="text-secondary">{d.value}{unit}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-input)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 999, background: 'rgba(255,255,255,0.75)' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
