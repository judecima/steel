import { PartialGlobalPlan, GlobalPlanCandidate, PartialGlobalScore, GlobalPlanScore } from './types';
import { Wall } from '../../core/types';
import { resolvePanelFamilyKey } from './panel-family-key';

export function scorePartialGlobalPlan(plan: PartialGlobalPlan, walls: Wall[]): PartialGlobalScore {
    let localAccumulated = 0;
    
    for (const [wallId, candidate] of Object.entries(plan.wallSelections)) {
        localAccumulated += candidate.score?.total || 0;
    }

    // Calculate partial continuity
    const partialContinuity = 10; // Base score, could be dynamic
    const partialOpeningSafety = 10;
    const partialConstructability = 10;

    const total = localAccumulated + partialContinuity + partialOpeningSafety + partialConstructability;

    return {
        total,
        components: {
            localQualityAccumulated: localAccumulated,
            partialContinuity,
            partialOpeningSafety,
            partialConstructability
        },
        confidence: 0.8,
        penalties: [],
        bonuses: []
    };
}

export function scoreFinalGlobalPlan(candidate: GlobalPlanCandidate, walls: Wall[]): GlobalPlanScore {
    let localQuality = 0;
    const penalties: string[] = [];
    const bonuses: string[] = [];
    
    const families = new Map<string, number>();

    for (const [wallId, localCandidate] of Object.entries(candidate.wallSelections)) {
        localQuality += localCandidate.score?.total || 0;
        
        const wall = walls.find(w => w.id === wallId);
        if (wall) {
            const key = resolvePanelFamilyKey(wall, localCandidate);
            families.set(key, (families.get(key) || 0) + 1);
        }
    }

    // Repetition benefit
    let repetitionBenefit = 0;
    for (const [key, count] of families.entries()) {
        if (count > 1) {
            repetitionBenefit += count * 5; // 5 pts per repeated family
        }
    }

    if (repetitionBenefit > 0) {
        bonuses.push(`Standardization bonus applied: ${repetitionBenefit} pts`);
    }

    // Other global factors
    const continuity = 15;
    const jointAlignment = 10;
    const openingSafetyGlobal = 10;
    const constructabilityGlobal = 10;
    const transportSuitability = 10;

    let total = localQuality + continuity + jointAlignment + openingSafetyGlobal + constructabilityGlobal + transportSuitability + repetitionBenefit;

    // Apply soft penalties from somewhere if passed, for now we just use the raw score
    
    return {
        total,
        components: {
            localQuality,
            continuity,
            jointAlignment,
            openingSafetyGlobal,
            constructabilityGlobal,
            transportSuitability,
            repetitionBenefit
        },
        penalties,
        bonuses
    };
}
