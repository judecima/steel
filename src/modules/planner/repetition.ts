import { PanelizationCandidate } from '../intelligence/types';
import { round } from '../../utils/math';

export class RepetitionEngine {
  /**
   * Generates a signature for a panel width that considers industrial equivalence.
   * e.g. 2.39m and 2.40m panels might belong to the same 'standard-240' family.
   */
  static getPanelFamilyKey(width: number): string {
    // Round to nearest 0.1m for industrial "family" grouping
    const normalizedWidth = round(Math.round(width * 10) / 10);
    return `family_${normalizedWidth.toFixed(1)}`;
  }

  /**
   * Calculates a score based on how many identical panel families are used in the house.
   */
  static calculateRepetitionBenefit(selections: Record<string, PanelizationCandidate>): number {
    const familyCounts: Record<string, number> = {};
    let totalPanels = 0;

    Object.values(selections).forEach(candidate => {
      candidate.splits.forEach(w => {
        const key = this.getPanelFamilyKey(w);
        familyCounts[key] = (familyCounts[key] || 0) + 1;
        totalPanels++;
      });
    });

    if (totalPanels === 0) return 0;

    // Repetition Score: ratio of repeated families to total panels
    // A house with 10 panels and only 1 family gets 100 points.
    // A house with 10 panels and 10 distinct families gets ~0 points.
    const distinctFamilies = Object.keys(familyCounts).length;
    
    // Simple heuristic: (1 - (distinct / total)) * 100
    const benefit = round((1 - (distinctFamilies / totalPanels)) * 100);
    return Math.max(0, benefit);
  }

  /**
   * Generates a structural signature for a partial house plan to detect equivalent branches.
   */
  static getPartialPlanSignature(decidedWalls: string[], selections: Record<string, PanelizationCandidate>): string {
    const wallKeys = decidedWalls.sort().map(id => {
        const candidate = selections[id];
        const familyPattern = candidate.splits.map(w => this.getPanelFamilyKey(w)).join(',');
        return `${id}:${candidate.strategy}:${familyPattern}`;
    });
    return wallKeys.join('|');
  }
}
