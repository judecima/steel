import { PartialGlobalPlan } from './types';
import { PanelizationCandidate } from '../intelligence/types';
import { generateId } from '../../utils/ids';

export function expandPartialPlans(
    beam: PartialGlobalPlan[], 
    wallId: string, 
    topCandidates: PanelizationCandidate[],
    maxExpansions: number
): PartialGlobalPlan[] {
    const nextBeam: PartialGlobalPlan[] = [];
    let expansions = 0;

    for (const partialPlan of beam) {
        for (const localCandidate of topCandidates) {
            if (expansions >= maxExpansions) {
                break;
            }

            const newSelections = { ...partialPlan.wallSelections, [wallId]: localCandidate };
            
            const newPartialPlan: PartialGlobalPlan = {
                id: generateId('partial'),
                decidedWalls: [...partialPlan.decidedWalls, wallId],
                wallSelections: newSelections,
                valid: true,
                partialScore: { 
                    total: 0, 
                    components: { localQualityAccumulated: 0, partialContinuity: 0, partialOpeningSafety: 0, partialConstructability: 0 }, 
                    confidence: 0,
                    penalties: [],
                    bonuses: []
                },
                decisionTrace: [...partialPlan.decisionTrace, {
                    timestamp: Date.now(),
                    event: 'WALL_CANDIDATE_SELECTED',
                    entityId: wallId,
                    reason: `Selected local candidate ${localCandidate.id} using strategy ${localCandidate.strategy}`
                }]
            };

            nextBeam.push(newPartialPlan);
            expansions++;
        }
    }

    return nextBeam;
}
