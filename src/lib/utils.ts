/**
 * Format a decimal quantity (e.g. 5.333) into a readable "cartons + pieces" format.
 * - If piecesPerPackage <= 1 or quantity is a whole number, just return the number.
 * - Otherwise: 5.333 with ppp=12 → "5 + 4ق" (5 cartons + 4 pieces)
 */
export function formatQty(quantity: number | string, piecesPerPackage?: number): string {
  const qty = Number(quantity);
  if (isNaN(qty)) return '0';

  const ppp = piecesPerPackage && piecesPerPackage > 1 ? piecesPerPackage : 1;

  // If no pieces system or quantity is a whole number
  if (ppp <= 1 || Number.isInteger(qty)) {
    return Number.isInteger(qty) ? qty.toString() : qty.toFixed(2);
  }

  const cartons = Math.floor(qty);
  const pieces = Math.round((qty - cartons) * ppp);

  if (pieces === 0) return cartons.toString();
  if (cartons === 0) return `${pieces}ق`;
  return `${cartons} + ${pieces}ق`;
}

/**
 * Same as formatQty but returns a longer form for print/PDF contexts.
 * e.g. "5 كرتون + 4 قطعة"
 */
export function formatQtyLong(quantity: number | string, piecesPerPackage?: number): string {
  const qty = Number(quantity);
  if (isNaN(qty)) return '0';

  const ppp = piecesPerPackage && piecesPerPackage > 1 ? piecesPerPackage : 1;

  if (ppp <= 1 || Number.isInteger(qty)) {
    return Number.isInteger(qty) ? qty.toString() : qty.toFixed(2);
  }

  const cartons = Math.floor(qty);
  const pieces = Math.round((qty - cartons) * ppp);

  if (pieces === 0) return `${cartons}`;
  if (cartons === 0) return `${pieces} قطعة`;
  return `${cartons} كرتون + ${pieces} قطعة`;
}
