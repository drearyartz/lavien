const STYLES = {
  mobile: { label: 'MOBİL', color: '#60a5fa', background: 'rgba(96, 165, 250, 0.14)' },
  admin: { label: 'ADMIN', color: '#f87171', background: 'rgba(248, 113, 113, 0.14)' },
  personel: { label: 'PERSONEL', color: '#4ade80', background: 'rgba(74, 222, 128, 0.14)' },
};

/**
 * Bir islemi (adisyon acma/kapama) kimin yaptigini gosteren renkli etiket.
 * Kullanicinin hesap tipi 'mobile' ise ya da islem mobil kanaldan geldiyse MOBIL (mavi);
 * aksi halde role'e gore ADMIN (kirmizi) / PERSONEL (yesil).
 */
export default function RoleTag({ role, channel }) {
  if (!role && !channel) return null;
  const key = role === 'mobile' || channel === 'mobile' ? 'mobile' : role === 'admin' ? 'admin' : 'personel';
  const style = STYLES[key];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.15rem 0.5rem',
        borderRadius: 999,
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        color: style.color,
        background: style.background,
        border: `1px solid ${style.color}33`,
      }}
    >
      {style.label}
    </span>
  );
}
