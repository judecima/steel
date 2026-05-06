import { HouseModel, Muro } from '../../core/types';
import { PanelizationCandidate } from '../intelligence/types';
import { 
    GlobalPlanningConfig, 
    PartialGlobalPlan, 
    GlobalPlanCandidate, 
    PlannerTelemetry 
} from './types';
import { resolveWallPriority } from './wall-priority-resolver';
import { PlannerTelemetryCollector } from './planner-telemetry';
import { expandPartialPlans } from './global-candidate-generator';
import { validateGlobalPlan } from './global-validator';
import { scorePartialGlobalPlan, scoreFinalGlobalPlan } from './global-scorer';
import { resolvePanelFamilyKey } from './panel-family-key';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/ids';

export class GlobalArbiter {
  static planHouse(
      house: HouseModel, 
      localCandidatesPerWall: Map<string, PanelizationCandidate[]>,
      config: GlobalPlanningConfig
  ): { winner: GlobalPlanCandidate; telemetry: PlannerTelemetry } {
    const startTime = Date.now();
    const collector = new PlannerTelemetryCollector();
    
    // 1. Resolver Prioridad de Muros
    const priorityIds = resolveWallPriority(house.muros);
    logger.log('PLANNING_PRIORITY_RESOLVED', 'house', `Secuencia de planificación: ${priorityIds.join(' -> ')}`);

    // 2. Beam inicial
    let beam: PartialGlobalPlan[] = [{
        id: generateId('partial'),
        decidedWalls: [],
        wallSelections: {},
        valid: true,
        partialScore: { total: 0, components: { localQualityAccumulated: 0, partialContinuity: 0, partialOpeningSafety: 0, partialConstructability: 0 }, confidence: 0, penalties: [], bonuses: [] },
        decisionTrace: []
    }];

    for (const wallId of priorityIds) {
      const topLocal = localCandidatesPerWall.get(wallId) || [];
      if (topLocal.length === 0) {
          throw new Error(`CRITICAL_PLANNING_FAILURE: No se proporcionaron candidatos locales válidos para el muro ${wallId}.`);
      }
      
      const candidatesToUse = topLocal.slice(0, config.topKLocalCandidates);
      
      collector.recordGeneration(beam.length * candidatesToUse.length);

      // 3. Expandir Beam
      const nextBeam = expandPartialPlans(beam, wallId, candidatesToUse, config.maxExpansionsPerStep);
      const validNextBeam: PartialGlobalPlan[] = [];

      // 4 & 5. Validar & Veto Fuerte
      for (const partialPlan of nextBeam) {
          const validation = validateGlobalPlan(partialPlan.wallSelections, house.muros);
          if (!validation.valid) {
              collector.recordVeto(1);
              continue;
          }
          
          // 6. Puntuar planes válidos
          partialPlan.partialScore = scorePartialGlobalPlan(partialPlan, house.muros);
          validNextBeam.push(partialPlan);
      }

      // 7 & 8. Podar planes débiles & Colapsar equivalentes
      const prunedBeam = this.pruneBeam(validNextBeam, config, collector, house.muros);
      
      collector.recordRetained(prunedBeam.length);
      beam = prunedBeam;

      if (beam.length === 0) {
          throw new Error(`CRITICAL_PLANNING_FAILURE: El Beam colapsó en el muro ${wallId}. No se encontraron combinaciones globales válidas.`);
      }
    }

    // 11. Puntuación final
    const finalCandidates: GlobalPlanCandidate[] = beam.map(p => {
        const candidate: GlobalPlanCandidate = {
            id: generateId('global'),
            decidedWalls: p.decidedWalls,
            wallSelections: p.wallSelections,
            valid: true,
            score: { total: 0, components: { localQuality: 0, continuity: 0, jointAlignment: 0, openingSafetyGlobal: 0, constructabilityGlobal: 0, transportSuitability: 0, repetitionBenefit: 0 }, penalties: [], bonuses: [] },
            decisionTrace: p.decisionTrace
        };
        candidate.score = scoreFinalGlobalPlan(candidate, house.muros);
        return candidate;
    });

    // 12. Seleccionar ganador
    const winner = finalCandidates.sort((a, b) => {
        if (b.score.total !== a.score.total) return b.score.total - a.score.total;
        return a.id.localeCompare(b.id);
    })[0];

    collector.finalize(startTime);

    return { winner, telemetry: collector.getTelemetry() };
  }

  private static pruneBeam(
      candidates: PartialGlobalPlan[], 
      config: GlobalPlanningConfig,
      collector: PlannerTelemetryCollector,
      muros: Muro[]
  ): PartialGlobalPlan[] {
    if (candidates.length === 0) return [];

    // Colapso de Equivalencias
    const uniquePlans: Map<string, PartialGlobalPlan> = new Map();
    candidates.forEach(c => {
        const sigParts = c.decidedWalls.map(wid => {
            const wall = muros.find(w => w.id === wid)!;
            return resolvePanelFamilyKey(wall, c.wallSelections[wid]);
        });
        const sig = sigParts.join('||');
        
        const existing = uniquePlans.get(sig);
        if (!existing || c.partialScore.total > existing.partialScore.total) {
            if (existing) {
                collector.recordPrune('EQUIVALENCY_COLLAPSE', 1);
            }
            uniquePlans.set(sig, c);
        } else {
            collector.recordPrune('EQUIVALENCY_COLLAPSE', 1);
        }
    });

    const sorted = Array.from(uniquePlans.values()).sort((a, b) => b.partialScore.total - a.partialScore.total);
    const kept = sorted.slice(0, config.beamWidth);
    
    if (sorted.length > config.beamWidth) {
        collector.recordPrune('BEAM_WIDTH_EXCEEDED', sorted.length - config.beamWidth);
    }

    return kept;
  }
}
