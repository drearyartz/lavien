export const EXTRA_CHEESE_PRICE = 30;

/**
 * Bir adisyon kaleminin toplam tutarini hesaplar (backend/src/services/pricing.js ile birebir ayni).
 * Kalem Toplami = Adet x ( (Temel Fiyat x (1.5 Porsiyon ? 1.5 : 1)) + (Ekstra Peynir Adedi x 30) )
 */
export function computeLineTotal(unitPrice, quantity, halfPortion, extraCheeseQty) {
  const base = Number(unitPrice) * (halfPortion ? 1.5 : 1);
  const extras = Number(extraCheeseQty || 0) * EXTRA_CHEESE_PRICE;
  const lineTotal = Number(quantity) * (base + extras);
  return Number(lineTotal.toFixed(2));
}
