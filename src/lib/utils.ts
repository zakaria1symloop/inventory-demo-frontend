/**
 * Format a quantity in pieces into a readable "cartons + pieces" format.
 * - If piecesPerPackage <= 1 or pieces divides evenly, just return the number.
 * - Otherwise: 64 pieces with ppp=12 → "5 + 4ق" (5 cartons + 4 pieces)
 */
export function formatQty(pieces: number | string, piecesPerPackage?: number): string {
  const qty = Math.floor(Number(pieces) || 0);
  const ppp = piecesPerPackage && piecesPerPackage > 1 ? piecesPerPackage : 1;

  if (ppp <= 1) return qty.toString();

  const cartons = Math.floor(qty / ppp);
  const remainder = qty % ppp;

  if (remainder === 0) return cartons.toString();
  if (cartons === 0) return `${remainder}ق`;
  return `${cartons} + ${remainder}ق`;
}

/**
 * Same as formatQty but returns a longer form for print/PDF contexts.
 * e.g. 64 pieces with ppp=12 → "5 كرتون + 4 قطعة"
 */
export function formatQtyLong(pieces: number | string, piecesPerPackage?: number): string {
  const qty = Math.floor(Number(pieces) || 0);
  const ppp = piecesPerPackage && piecesPerPackage > 1 ? piecesPerPackage : 1;

  if (ppp <= 1) return qty.toString();

  const cartons = Math.floor(qty / ppp);
  const remainder = qty % ppp;

  if (remainder === 0) return `${cartons}`;
  if (cartons === 0) return `${remainder} قطعة`;
  return `${cartons} كرتون + ${remainder} قطعة`;
}
