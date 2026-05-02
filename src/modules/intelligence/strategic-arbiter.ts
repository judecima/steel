import { Opening, Wall } from '../../core/types';
import { PanelizationCandidate, StrategicContext } from './types';
import { generateCandidates } from './candidate-generator';
import { validateCandidate } from './candidate-validator';
import { scoreCandidate } from './candidate-scorer';
import { logger } from '../../utils/logger';

export type ArbitrationResult = {
    winner: PanelizationCandidate;
    allEvaluated: Record<string, PanelizationCandidate>;
};

export class StrategicArbiter {
  static resolveBestPlan(wallId: string, wallLength: number, openings: Opening[], context: StrategicContext): ArbitrationResult {
    logger.log('STRATEGIC_ARBITRATION_STARTED', wallId, `Arbitrating candidates for ${wallId}`, { context });

    // 1. Generate Candidates
    const candidates = generateCandidates(wallId, wallLength, openings);
    const allEvaluated: Record<string, PanelizationCandidate> = {};

    // 2. Validate (Hard Veto)
    const validCandidates = candidates.filter(c => {
      validateCandidate(c, wallLength, openings);
      allEvaluated[c.id] = { ...c };
      if (!c.valid) {
        logger.log('CANDIDATE_VETOED', c.id, `Rejection: ${c.rejectionReason}`, { strategy: c.strategy });
      }
      return c.valid;
    });

    if (validCandidates.length === 0) {
      logger.log('STRATEGIC_ARBITRATION_FAILED', wallId, 'No valid candidates found.');
      throw new Error(`CRITICAL_STRATEGIC_FAILURE: No valid split plan for wall ${wallId}`);
    }

    // 3. Score only valid survivors
    validCandidates.forEach(c => {
        scoreCandidate(c, context, openings);
        allEvaluated[c.id].score = c.score; // Update registry with score
    });

    // 4. Select Winner with Deterministic Tie-Breakers
    const winner = validCandidates.sort((a, b) => {
      // 1. Total Score
      const scoreDiff = b.score!.total - a.score!.total;
      if (Math.abs(scoreDiff) > 0.001) return scoreDiff;

      // 2. Fewer Panels (Efficiency)
      const panelDiff = a.panelCount - b.panelCount;
      if (panelDiff !== 0) return panelDiff;

      // 3. Lower Opening Risk (Safety)
      const safetyDiff = b.score!.components.openingSafety - a.score!.components.openingSafety;
      if (Math.abs(safetyDiff) > 0.001) return safetyDiff;

      // 4. Better Width Balance (Harmony)
      const balanceDiff = b.score!.components.widthBalance - a.score!.components.widthBalance;
      if (Math.abs(balanceDiff) > 0.001) return balanceDiff;
      
      // 5. Simpler Constructability
      const constructDiff = b.score!.components.constructability - a.score!.components.constructability;
      if (Math.abs(constructDiff) > 0.001) return constructDiff;

      // 6. Strategy Name (Pure Determinism)
      return a.strategy.localeCompare(b.strategy);
    })[0];

    logger.log('STRATEGIC_WINNER_SELECTED', wallId, `Winner Strategy: ${winner.strategy}`, {
        totalScore: winner.score!.total,
        panelCount: winner.panelCount
    });

    return { 
        winner, 
        allEvaluated 
    };
  }
}
