import { PartialGlobalPlan, GlobalPlanCandidate, PartialGlobalScore, GlobalPlanScore } from './types';
import { Muro } from '../../core/types';
import { resolvePanelFamilyKey } from './panel-family-key';

export function scorePartialGlobalPlan(plan: PartialGlobalPlan, muros: Muro[]): PartialGlobalScore {
    let localAccumulated = 0;
    
    for (const [wallId, candidate] of Object.entries(plan.wallSelections)) {
        localAccumulated += candidate.score?.total || 0;
    }

    // Calcular continuidad parcial
    const partialContinuity = 10;
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

export function scoreFinalGlobalPlan(candidate: GlobalPlanCandidate, muros: Muro[]): GlobalPlanScore {
    let localQuality = 0;
    const penalties: string[] = [];
    const bonuses: string[] = [];
    
    const families = new Map<string, number>();

    for (const [wallId, localCandidate] of Object.entries(candidate.wallSelections)) {
        localQuality += localCandidate.score?.total || 0;
        
        const muro = muros.find(w => w.id === wallId);
        if (muro) {
            const key = resolvePanelFamilyKey(muro, localCandidate);
            families.set(key, (families.get(key) || 0) + 1);
        }
    }

    // Beneficio por repetición (estandarización)
    let repetitionBenefit = 0;
    for (const [key, count] of families.entries()) {
        if (count > 1) {
            repetitionBenefit += count * 5; // 5 pts por familia repetida
        }
    }

    if (repetitionBenefit > 0) {
        bonuses.push(`Bono por estandarización aplicado: ${repetitionBenefit} pts`);
    }

    const continuity = 15;
    const jointAlignment = 10;
    const openingSafetyGlobal = 10;
    const constructabilityGlobal = 10;
    const transportSuitability = 10;

    let total = localQuality + continuity + jointAlignment + openingSafetyGlobal + constructabilityGlobal + transportSuitability + repetitionBenefit;
    
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
