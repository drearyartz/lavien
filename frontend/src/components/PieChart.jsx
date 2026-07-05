import { useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#78716c', '#64748b',
  '#0ea5e9', '#10b981', '#facc15',
];

const SIZE = 220;
const RADIUS = 80;
const STROKE = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut (yuvarlak dilim) grafik. data: [{ label, value }].
 */
export default function PieChart({ data, unit = '' }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return <p className="text-secondary">Bu aralıkta veri yok.</p>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) {
    return <p className="text-secondary">Bu aralıkta veri yok.</p>;
  }

  let offset = 0;
  const slices = data.map((d, i) => {
    const fraction = d.value / total;
    const dash = fraction * CIRCUMFERENCE;
    const slice = {
      ...d,
      color: COLORS[i % COLORS.length],
      dash,
      gap: CIRCUMFERENCE - dash,
      offset: -offset,
      percent: fraction * 100,
    };
    offset += dash;
    return slice;
  });

  return (
    <div className="row gap-lg wrap" style={{ alignItems: 'center' }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--surface-input)"
          strokeWidth={STROKE}
        />
        {slices.map((s) => (
          <motion.circle
            key={s.label}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={s.color}
            strokeWidth={hovered === s.label ? STROKE + 6 : STROKE}
            strokeDasharray={`${s.dash} ${s.gap}`}
            initial={{ strokeDashoffset: CIRCUMFERENCE, opacity: 0 }}
            animate={{ strokeDashoffset: s.offset, opacity: hovered && hovered !== s.label ? 0.35 : 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            strokeLinecap="butt"
            onMouseEnter={() => setHovered(s.label)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </svg>

      <div className="stack gap-xs" style={{ minWidth: 180, flex: '1 1 220px' }}>
        {slices.map((s) => (
          <div
            key={s.label}
            className="row space-between gap-sm"
            style={{
              fontSize: '0.82rem',
              cursor: 'pointer',
              opacity: hovered && hovered !== s.label ? 0.5 : 1,
            }}
            onMouseEnter={() => setHovered(s.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="row gap-xs" style={{ alignItems: 'center' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: s.color,
                  flexShrink: 0,
                }}
              />
              {s.label}
            </span>
            <span className="text-secondary">
              {s.value}{unit} · {s.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
