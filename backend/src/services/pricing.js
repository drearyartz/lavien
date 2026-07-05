const EXTRA_CHEESE_PRICE = 30;

/**
 * Bir adisyon kaleminin toplam tutarini hesaplar.
 * Kalem Toplami = Adet x ( (Temel Fiyat x (1.5 Porsiyon ? 1.5 : 1)) + (Ekstra Peynir Adedi x 30) )
 */
function computeLineTotal(unitPrice, quantity, halfPortion, extraCheeseQty) {
  const base = Number(unitPrice) * (halfPortion ? 1.5 : 1);
  const extras = Number(extraCheeseQty || 0) * EXTRA_CHEESE_PRICE;
  const lineTotal = Number(quantity) * (base + extras);
  return Number(lineTotal.toFixed(2));
}

module.exports = { EXTRA_CHEESE_PRICE, computeLineTotal };
