export const DISCOUNT_PERCENTS = [5, 10, 15, 20, 25, 50];

export function computeDiscount(subtotal, type, value) {
  if (!type || value === null || value === undefined || value === '') {
    return { discountAmount: 0, finalTotal: Number(subtotal.toFixed(2)) };
  }
  let amount = type === 'percent' ? subtotal * (Number(value) / 100) : Number(value);
  amount = Math.min(Math.max(amount, 0), subtotal);
  const finalTotal = Math.max(subtotal - amount, 0);
  return { discountAmount: Number(amount.toFixed(2)), finalTotal: Number(finalTotal.toFixed(2)) };
}

export function discountLabel(type, value) {
  if (!type) return '';
  return type === 'percent' ? `%${value}` : `${Number(value).toFixed(2)} TL`;
}
