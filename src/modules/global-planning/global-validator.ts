import { Muro } from '../../core/types';
import { PanelizationCandidate } from '../intelligence/types';
import { GlobalValidationResult } from './types';

export function validateGlobalPlan(wallSelections: Record<string, PanelizationCandidate>, muros: Muro[]): GlobalValidationResult {
    const hardVetoReasons: string[] = [];
    const softPenaltyReasons: string[] = [];

    const entries = Object.entries(wallSelections);
    
    // Ejemplo de veto: conflicto en esquina
    if (entries.length > 1) {
        // Regla estructural de ejemplo: no queremos dos muros encontrándose en una esquina 
        // donde ambos tengan paneles muy pequeños < 0.6m en la junta, ya que crea una "zona de muerte" para tornillos.
        
        let tinyEnds = 0;
        for (const [wallId, candidate] of entries) {
            const first = candidate.splits[0];
            const last = candidate.splits[candidate.splits.length - 1];
            if (first < 2.5 || last < 2.5) tinyEnds++;
        }
        
        if (tinyEnds >= 2) {
            hardVetoReasons.push('Zona de muerte en esquina detectada: múltiples muros tienen paneles finales estrechos en las juntas.');
        }
    }

    // Ejemplo de penalizaciones suaves
    for (const [wallId, candidate] of entries) {
        if (candidate.splits.length > 5) {
            softPenaltyReasons.push(`El muro ${wallId} tiene demasiados paneles, reduciendo la constructibilidad.`);
        }
    }

    return {
        valid: hardVetoReasons.length === 0,
        hardVetoReasons,
        softPenaltyReasons
    };
}
