import { PartialGlobalPlan, PartialGlobalScore, GlobalPlanCandidate, GlobalPlanScore } from './types';
import { PanelizationCandidate } from '../intelligence/types';
import { RepetitionEngine } from './repetition';
import { round } from '../../utils/math';

export class GlobalScorer {
  /**
   * Scores a partial house plan to guide the Beam Search.
   */
  static scorePartial(plan: PartialGlobalPlan): PartialGlobalScore {
    const candidates = Object.values(plan.wallSelections);
    const wallCount = plan.decidedWalls.length;

    // 1. Accumulated Local Quality
    const localQuality = candidates.reduce((acc, c) => acc + (c.score?.total || 0), 0) / wallCount;

    // 2. Partial Continuity & Safety (Simplified for now)
    const partialContinuity = 70; // Hardcoded baseline for now
    const partialOpeningSafety = 80;

    // 3. Partial Constructability
    const partialConstructability = 75;

    const total = round(
        (localQuality * 0.60) +
        (partialContinuity * 0.20) +
        (partialOpeningSafety * 0.10) +
        (partialConstructability * 0.10)
    );

    return {
      total,
      components: {
        localQualityAccumulated: round(localQuality),
        partialContinuity,
        partialOpeningSafety,
        partialConstructability
      },
      confidence: round(wallCount / 4) // Placeholder for maturity
    };
  }

  /**
   * Scores a completed house plan with high-fidelity industrial metrics.
   */
  static scoreFinal(plan: GlobalPlanCandidate): GlobalPlanScore {
    const candidates = Object.values(plan.wallSelections);
    
    // 1. Final Local Quality
    const localQuality = candidates.reduce((acc, c) => acc + (c.score?.total || 0), 0) / candidates.length;

    // 2. Repetition Benefit
    const repetitionBenefit = RepetitionEngine.calculateRepetitionBenefit(plan.wallSelections);

    // 3. Global Logic (Baseline values for Phase 2)
    const components = {
        localQuality: round(localQuality),
        continuity: 85,
        jointAlignment: 70,
        openingSafetyGlobal: 90,
        constructabilityGlobal: 80,
        transportSuitability: 75,
        repetitionBenefit
    };

    const penalties: string[] = [];
    const bonuses: string[] = [];

    // Global Bonuses
    if (repetitionBenefit > 80) bonuses.push('GLOBAL_BONUS_HIGH_STANDARDIZATION');

    const total = round(
        (components.localQuality * 0.40) +
        (components.repetitionBenefit * 0.20) +
        (components.continuity * 0.10) +
        (components.jointAlignment * 0.10) +
        (components.openingSafetyGlobal * 0.10) +
        (components.constructabilityGlobal * 0.05) +
        (components.transportSuitability * 0.05)
    );

    return {
      total,
      components,
      penalties,
      bonuses
    };
  }
}
