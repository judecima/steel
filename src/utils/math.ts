export function round(value: number, decimals: number = 3): number {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
