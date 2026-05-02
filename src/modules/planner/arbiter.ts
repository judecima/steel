import { HouseModel, Wall } from '../../core/types';
import { 
    GlobalPlanningConfig, 
    PartialGlobalPlan, 
    GlobalPlanCandidate, 
    PlannerTelemetry,
    PartialPlanSignature 
} from './types';
import { resolveWallPriority } from './priority-resolver';
import { generateCandidates } from '../intelligence/candidate-generator';
import { validateCandidate } from '../intelligence/candidate-validator';
import { scoreCandidate } from '../intelligence/candidate-scorer';
import { StrategicArbiter } from '../intelligence/strategic-arbiter';
import { GlobalValidator } from './validator';
import { GlobalScorer } from './scoring';
import { RepetitionEngine } from './repetition';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/ids';

export class GlobalArbiter {
  static planHouse(house: HouseModel, config: GlobalPlanningConfig): { winner: GlobalPlanCandidate; telemetry: PlannerTelemetry } {
    const startTime = Date.now();
    const telemetry: PlannerTelemetry = { steps: [], totalPlanningTimeMs: 0 };
    
    // 1. Prioritize Walls
    const priorityIds = resolveWallPriority(house.walls);
    logger.log('PLANNING_PRIORITY_RESOLVED', 'house', `Planning sequence: ${priorityIds.join(' -> ')}`);

    // 2. BFS / Beam Search
    // Initial beam: empty plan
    let beam: PartialGlobalPlan[] = [{
        id: generateId('partial'),
        decidedWalls: [],
        wallSelections: {},
        valid: true,
        partialScore: { total: 0, components: { localQualityAccumulated: 0, partialContinuity: 0, partialOpeningSafety: 0, partialConstructability: 0 }, confidence: 0 },
        decisionTrace: []
    }];

    for (const wallId of priorityIds) {
      const stepStartTime = Date.now();
      const nextBeam: PartialGlobalPlan[] = [];
      const wall = house.walls.find(w => w.id === wallId)!;
      
      let stepVetoed = 0;
      let stepGenerated = 0;

      // Local Generation for this wall
      const localCandidates = generateCandidates(wallId, wall.length, wall.openings);
      // Prune local: keep only Top-K local
      const context = { wallRole: wall.role };
      localCandidates.forEach(lc => {
         validateCandidate(lc, wall.length, wall.openings);
         if (lc.valid) scoreCandidate(lc, context, wall.openings);
      });
      const topLocal = localCandidates
        .filter(lc => lc.valid)
        .sort((a, b) => b.score!.total - a.score!.total)
        .slice(0, config.topKLocalCandidates);

      // Expand Beam
      for (const partialPlan of beam) {
        for (const localCandidate of topLocal) {
          stepGenerated++;
          
          const newSelections = { ...partialPlan.wallSelections, [wallId]: localCandidate };
          const validation = GlobalValidator.validate(newSelections, house.walls);

          if (!validation.valid) {
            stepVetoed++;
            continue;
          }

          const newPartialPlan: PartialGlobalPlan = {
            id: generateId('partial'),
            decidedWalls: [...partialPlan.decidedWalls, wallId],
            wallSelections: newSelections,
            valid: true,
            partialScore: { total: 0, components: { localQualityAccumulated: 0, partialContinuity: 0, partialOpeningSafety: 0, partialConstructability: 0 }, confidence: 0 },
            decisionTrace: [...partialPlan.decisionTrace]
          };

          newPartialPlan.partialScore = GlobalScorer.scorePartial(newPartialPlan);
          nextBeam.push(newPartialPlan);
        }
      }

      // Pruning Policy: Diversity & Equivalence
      const prunedBeam = this.pruneBeam(nextBeam, config);
      
      telemetry.steps.push({
        wallId,
        generatedCount: stepGenerated,
        vetoedCount: stepVetoed,
        prunedCount: nextBeam.length - prunedBeam.length,
        retainedCount: prunedBeam.length,
        stepTimeMs: Date.now() - stepStartTime
      });

      beam = prunedBeam;

      if (beam.length === 0) {
          throw new Error(`CRITICAL_PLANNING_FAILURE: Beam collapsed at wall ${wallId}. No valid global combinations found.`);
      }
    }

    // 3. Final selection from completed beam
    const finalCandidates: GlobalPlanCandidate[] = beam.map(p => {
        const candidate: GlobalPlanCandidate = {
            id: generateId('global'),
            wallSelections: p.wallSelections,
            valid: true,
            score: { total: 0, components: { localQuality: 0, continuity: 0, jointAlignment: 0, openingSafetyGlobal: 0, constructabilityGlobal: 0, transportSuitability: 0, repetitionBenefit: 0 }, penalties: [], bonuses: [] },
            decisionTrace: p.decisionTrace
        };
        candidate.score = GlobalScorer.scoreFinal(candidate);
        return candidate;
    });

    const winner = finalCandidates.sort((a, b) => b.score.total - a.score.total)[0];
    telemetry.totalPlanningTimeMs = Date.now() - startTime;

    return { winner, telemetry };
  }

  private static pruneBeam(candidates: PartialGlobalPlan[], config: GlobalPlanningConfig): PartialGlobalPlan[] {
    if (candidates.length === 0) return [];

    // 1. Equivalency Collapse
    const uniquePlans: Map<string, PartialGlobalPlan> = new Map();
    candidates.forEach(c => {
        const sig = RepetitionEngine.getPartialPlanSignature(c.decidedWalls, c.wallSelections);
        const existing = uniquePlans.get(sig);
        if (!existing || c.partialScore.total > existing.partialScore.total) {
            uniquePlans.set(sig, c);
        }
    });

    // 2. Score & Width Pruning
    return Array.from(uniquePlans.values())
        .sort((a, b) => b.partialScore.total - a.partialScore.total)
        .slice(0, config.beamWidth);
  }
}
