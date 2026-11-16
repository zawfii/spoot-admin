// plural(5, 'miejsce', 'miejsca', 'miejsc') → 'miejsc'
export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const d = n % 10, t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
}
