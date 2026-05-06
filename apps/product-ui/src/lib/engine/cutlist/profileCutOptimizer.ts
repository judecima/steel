export interface OptimizedProfileBar {
  id: string;
  stockLengthMm: number;
  cutsMm: number[];
  usedMm: number;
  wasteMm: number;
}

export function optimizeProfileCuts(
  lengthsMm: number[],
  stockLengthMm = 6000
): OptimizedProfileBar[] {
  const sorted = [...lengthsMm]
    .filter(v => Number.isFinite(v) && v > 0)
    .sort((a, b) => b - a);

  const bars: number[][] = [];

  for (const len of sorted) {
    let placed = false;

    for (const bar of bars) {
      const used = bar.reduce((sum, v) => sum + v, 0);

      if (used + len <= stockLengthMm) {
        bar.push(len);
        placed = true;
        break;
      }
    }

    if (!placed) {
      bars.push([len]);
    }
  }

  return bars.map((cuts, index) => {
    const used = cuts.reduce((sum, v) => sum + v, 0);

    return {
      id: `bar_${index + 1}`,
      stockLengthMm,
      cutsMm: cuts,
      usedMm: used,
      wasteMm: stockLengthMm - used,
    };
  });
}
