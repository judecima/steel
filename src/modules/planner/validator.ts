import { Wall, Opening } from '../../core/types';
import { PanelizationCandidate } from '../intelligence/types';
import { round } from '../../utils/math';

export type ValidationVeto = {
    reason: string;
};

export type ValidationPenalty = {
    reason: string;
    points: number;
};

export class GlobalValidator {
  /**
   * Validates a partial or final house plan for cross-wall compatibility.
   */
  static validate(
    selections: Record<string, PanelizationCandidate>, 
    walls: Wall[]
  ): { valid: boolean; veto?: ValidationVeto; penalties: ValidationPenalty[] } {
    
    const penalties: ValidationPenalty[] = [];

    // 1. Cross-wall Continuity / Corner Compatibility
    // Currently, we verify shared vertices between walls.
    // If wall A ends where wall B starts, they share a corner.
    for (const wallA of walls) {
      for (const wallB of walls) {
        if (wallA.id === wallB.id) continue;
        if (!selections[wallA.id] || !selections[wallB.id]) continue;

        if (this.isSharedCorner(wallA, wallB)) {
            const veto = this.checkCornerCompatibility(wallA, selections[wallA.id], wallB, selections[wallB.id]);
            if (veto) return { valid: false, veto, penalties: [] };
        }
      }
    }

    // 2. Alignment Logic (Soft penalties)
    // e.g., if total house width repetition is low (handled by scorer)
    // or if corners are feasibly joined but suboptimal.

    return { valid: true, penalties };
  }

  private static isSharedCorner(a: Wall, b: Wall): boolean {
    const distEndStart = Math.sqrt(Math.pow(a.end.x - b.start.x, 2) + Math.pow(a.end.y - b.start.y, 2));
    const distEndEnd = Math.sqrt(Math.pow(a.end.x - b.end.x, 2) + Math.pow(a.end.y - b.end.y, 2));
    return distEndStart < 0.01 || distEndEnd < 0.01;
  }

  private static checkCornerCompatibility(wallA: Wall, candA: PanelizationCandidate, wallB: Wall, candB: PanelizationCandidate): ValidationVeto | null {
    // Veto if both walls end in very small panels that make corner assembly impossible
    const lastPanelA = candA.splits[candA.splits.length - 1];
    const firstPanelB = candB.splits[0];

    // Industrial rule: if both panels at a corner are < 0.6m, it's a structural death zone.
    if (lastPanelA < 0.6 && firstPanelB < 0.6) {
        return { reason: `CORNER_DEATH_ZONE: Panels at junction ${wallA.id}/${wallB.id} are too small (${lastPanelA}m, ${firstPanelB}m)` };
    }

    return null;
  }
}
