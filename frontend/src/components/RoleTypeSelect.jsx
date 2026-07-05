const OPTIONS = [
  { value: 'personel', label: 'Personel', color: '#4ade80' },
  { value: 'mobile', label: 'Mobil', color: '#60a5fa' },
];

/**
 * Personel/Mobil hesap tipini secmek icin, RoleTag ile ayni renk dilini
 * kullanan belirgin iki-secenekli bir toggle (duz <select>'ten daha net).
 */
export default function RoleTypeSelect({ value, onChange, disabled }) {
  return (
    <div className="row gap-xs">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className="btn"
            style={{
              padding: '0.5rem 0.9rem',
              fontSize: '0.82rem',
              borderColor: active ? opt.color : 'var(--border-subtle)',
              color: active ? opt.color : 'var(--text-secondary)',
              background: active ? `${opt.color}1f` : 'transparent',
              boxShadow: active ? `0 0 0 1px ${opt.color}55, 0 0 14px ${opt.color}40` : 'none',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: opt.color,
                display: 'inline-block',
                marginRight: '0.4rem',
                opacity: active ? 1 : 0.5,
              }}
            />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
