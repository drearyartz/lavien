import { useState } from 'react';
import { DISCOUNT_PERCENTS } from '../utils/discount';

/**
 * Tutar alanina "+50" gibi arti isaretiyle yazilirsa, mevcut indirim tutarinin
 * UZERINE eklenir (once yuzdeyse TL karsiligina cevrilip toplanir).
 * Arti isareti olmadan (orn. "50") yazilirsa, indirim tutari o degere SIFIRLANIR/AYARLANIR.
 */
export default function DiscountControl({ discountType, discountValue, currentDiscountAmount, disabled, onApply, onClear }) {
  const [customAmount, setCustomAmount] = useState('');

  function applyAmount() {
    const raw = customAmount.trim();
    if (!raw) return;
    const isIncrement = raw.startsWith('+');
    const numStr = isIncrement ? raw.slice(1) : raw;
    const v = Number(numStr);
    if (!(v > 0) || Number.isNaN(v)) return;

    const finalValue = isIncrement ? Number(((currentDiscountAmount || 0) + v).toFixed(2)) : v;
    onApply('amount', finalValue);
    setCustomAmount('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyAmount();
    }
  }

  return (
    <div className="stack gap-xs">
      <div className="text-secondary" style={{ fontSize: '0.8rem' }}>İndirim</div>
      <div className="row gap-xs wrap">
        {DISCOUNT_PERCENTS.map((p) => {
          const active = discountType === 'percent' && Number(discountValue) === p;
          return (
            <button
              key={p}
              type="button"
              className="btn btn-ghost"
              disabled={disabled}
              style={active ? { background: 'rgba(255,255,255,0.16)', borderColor: 'var(--border-strong)' } : undefined}
              onClick={() => onApply('percent', p)}
            >
              %{p}
            </button>
          );
        })}
      </div>
      <div className="row gap-xs">
        <input
          className="input"
          type="text"
          inputMode="decimal"
          placeholder="Tutar, veya +50 ile ekle"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{ maxWidth: 160, fontSize: '0.85rem' }}
        />
        <button type="button" className="btn" disabled={disabled || !customAmount} onClick={applyAmount}>
          Uygula
        </button>
        {discountType && (
          <button type="button" className="btn btn-ghost" disabled={disabled} onClick={onClear}>
            Kaldır
          </button>
        )}
      </div>
    </div>
  );
}
