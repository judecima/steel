import { generateCandidates } from '../src/modules/intelligence/candidate-generator';
import { CandidateStrategy } from '../src/modules/intelligence/types';

async function runTests() {
    console.log('--- TESTING OPENING DODGE STRATEGY ---');

    const wallId = 'wall_south';
    const wallLength = 5.0;
    const rules = {
        maxWidth: 4.0,
        preferredWidth: 3.0,
        minWidth: 1.0,
        openingClearance: 0.2
    };

    // Escenario: Abertura en la junta estándar (3.0m)
    // Una abertura de 0.4m centrada en 3.0m (pos 2.8)
    // Zona prohibida: [2.8 - 0.2, 2.8 + 0.4 + 0.2] = [2.6, 3.4]
    const aberturas: any[] = [{
        id: 'op_test',
        position: 2.8,
        width: 0.4,
        type: 'ventana'
    }];

    const candidates = generateCandidates(wallId, wallLength, aberturas, { 
        panelMaxLength: rules.maxWidth, 
        panelPreferredLength: rules.preferredWidth 
    } as any);

    const openingAware = candidates.find(c => c.strategy === CandidateStrategy.OPENING_AWARE);
    
    if (!openingAware) {
        console.error('FAIL: No se generó estrategia OPENING_AWARE');
        return;
    }

    console.log('Candidates splits:', openingAware.splits);
    
    let currentOffset = 0;
    let hasConflict = false;
    for (let i = 0; i < openingAware.splits.length - 1; i++) {
        const joint = currentOffset + openingAware.splits[i];
        if (joint > 2.6 && joint < 3.4) {
            hasConflict = true;
            console.error(`FAIL: Junta en ${joint}m está dentro de la zona prohibida [2.6, 3.4]`);
        }
        currentOffset = joint;
    }

    if (!hasConflict) {
        console.log('PASS: El generador esquivó la abertura exitosamente.');
    }

    console.log('\n--- DODGE TESTS COMPLETED ---');
}

runTests().catch(console.error);
