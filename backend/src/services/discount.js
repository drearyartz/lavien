const ALLOWED_PERCENTS = [5, 10, 15, 20, 25, 50];

/**
 * Verilen ara toplam uzerinden indirim tutarini ve indirimli toplami hesaplar.
 * discountType: 'amount' (sabit TL) | 'percent' (yuzde) | null (indirim yok)
 */
function computeDiscount(subtotal, discountType, discountValue) {
  if (!discountType || discountValue === null || discountValue === undefined) {
    return { discountAmount: 0, finalTotal: Number(subtotal.toFixed(2)) };
  }

  let amount = discountType === 'percent' ? subtotal * (discountValue / 100) : discountValue;
  amount = Math.min(Math.max(amount, 0), subtotal);
  const finalTotal = Math.max(subtotal - amount, 0);

  return { discountAmount: Number(amount.toFixed(2)), finalTotal: Number(finalTotal.toFixed(2)) };
}

function validateDiscountInput(type, value, subtotal) {
  if (type === 'percent') {
    if (!ALLOWED_PERCENTS.includes(Number(value))) {
      return { valid: false, error: 'İndirim yüzdesi şunlardan biri olmalı: %5, %10, %15, %20, %25, %50.' };
    }
    return { valid: true };
  }
  if (type === 'amount') {
    const v = Number(value);
    if (!(v > 0)) {
      return { valid: false, error: "İndirim tutarı 0'dan büyük olmalı." };
    }
    if (v > subtotal) {
      return { valid: false, error: 'İndirim tutarı toplam tutardan büyük olamaz.' };
    }
    return { valid: true };
  }
  return { valid: false, error: 'Geçersiz indirim tipi.' };
}

module.exports = { ALLOWED_PERCENTS, computeDiscount, validateDiscountInput };
