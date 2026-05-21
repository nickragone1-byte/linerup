// Expected Value utility for Linerup predictions.
// Formula: EV = (p × profit) − ((1 − p) × 100)
// where profit = 10000/|ML| for favorites (negative ML), or ML for underdogs (positive ML).
// Result is EV per $100 wagered.

export function computeEV(modelProbPct: number, moneyline: number | null | undefined): number | null {
  if (moneyline == null || moneyline === 0) return null;
  const p = modelProbPct / 100;
  const profit = moneyline < 0 ? (10000 / Math.abs(moneyline)) : moneyline;
  return p * profit - (1 - p) * 100;
}

export function fmtEV(ev: number): string {
  const sign = ev >= 0 ? "+" : "−";
  return `${sign}$${Math.abs(ev).toFixed(2)}`;
}

export function evColor(ev: number): string {
  return ev >= 0 ? "#00e088" : "#fb923c";
}
