import { SceneBuilder } from '../src/modules/render/scene-builder';
import { ProjectResult } from '../src/core/types';
import { generateGeometry } from '../src/modules/geometry/engine';
import { GlobalArbiter } from '../src/modules/global-planning/global-arbiter';
import { panelizeHouse } from '../src/modules/construction/engine';
import { ENGINE_CONFIG } from '../src/core/config';
import { PanelizationCandidate } from '../src/modules/intelligence/types';
import { generateCandidates } from '../src/modules/intelligence/candidate-generator';
import { validateCandidate } from '../src/modules/intelligence/candidate-validator';
import { scoreCandidate } from '../src/modules/intelligence/candidate-scorer';

function mockProject(): ProjectResult {
    const input = { 
        width: 4.0, length: 4.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0,
        openings: [
            { wallId: 'wall_north', type: 'ventana', width: 1.5, height: 1.0, position: 1.0 },
            { wallId: 'wall_south', type: 'puerta', width: 0.9, height: 2.1, position: 1.5 }
        ]
    };
    const house = generateGeometry(input as any);
    const localMap = new Map<string, PanelizationCandidate[]>();
    for (const muro of house.muros) {
        const cands = generateCandidates(muro.id, muro.length, muro.aberturas);
        const context = { wallRole: muro.role };
        cands.forEach(c => {
            validateCandidate(c, muro.length, muro.aberturas);
            if (c.valid) scoreCandidate(c, context, muro.aberturas);
        });
        localMap.set(muro.id, cands.filter(c => c.valid).sort((a, b) => b.score!.total - a.score!.total));
    }
    const { winner, telemetry } = GlobalArbiter.planHouse(house, localMap, ENGINE_CONFIG.planning);
    const construction = panelizeHouse(house, winner, telemetry);

    return {
        input,
        house,
        construction,
        bom: { aggregated: [], cutList: [] },
        logs: [],
        status: 'success',
        assumptions: [],
        warnings: []
    } as any;
}

async function runLabelLocalizationAudit() {
    console.log("=== AUDITORÍA DE LOCALIZACIÓN DE ETIQUETAS VISUALES ===\n");
    
    const project = mockProject();
    const scene = SceneBuilder.buildScene(project);
    
    let passed = true;

    // 1. Check panel labels
    console.log("TEST 1: Etiquetas de panel localizadas");
    const panelLabels = scene.labels.filter(l => l.id.startsWith('label_panel_'));
    panelLabels.forEach(label => {
        const text = label.text;
        // No debe contener "wall", "north", "south", "east", "west" (en minúsculas/internos)
        const forbidden = ['wall', 'north', 'south', 'east', 'west'];
        forbidden.forEach(f => {
            if (text.toLowerCase().includes(f)) {
                console.log(`  ❌ Fallido: Etiqueta '${text}' contiene término técnico '${f}'`);
                passed = false;
            }
        });
        
        // Debe contener "Norte", "Sur", "Este" o "Oeste"
        const allowed = ['Norte', 'Sur', 'Este', 'Oeste'];
        if (!allowed.some(a => text.includes(a))) {
            console.log(`  ❌ Fallido: Etiqueta '${text}' no contiene orientación en español`);
            passed = false;
        }

        // Debe empezar con "Panel"
        if (!text.startsWith('Panel')) {
            console.log(`  ❌ Fallido: Etiqueta '${text}' no empieza con 'Panel'`);
            passed = false;
        }
    });
    if (passed) console.log("  ✅ Pasado: Etiquetas de panel cumplen con el dominio español.");

    // 2. Check metadata for localized label AND tech ID
    console.log("\nTEST 2: Metadatos contienen etiqueta y ID técnico por separado");
    scene.objects.filter(o => o.type === 'panel' || o.type === 'muro').forEach(obj => {
        if (!obj.metadata['Etiqueta']) {
            console.log(`  ❌ Fallido: Objeto ${obj.id} no tiene metadato 'Etiqueta'`);
            passed = false;
        }
        if (!obj.metadata['ID Técnico']) {
            console.log(`  ❌ Fallido: Objeto ${obj.id} no tiene metadato 'ID Técnico'`);
            passed = false;
        }
        
        const label = obj.metadata['Etiqueta'] as string;
        const techId = obj.metadata['ID Técnico'] as string;
        
        if (label === techId) {
            console.log(`  ❌ Fallido: Etiqueta es igual al ID Técnico en ${obj.id} (${label})`);
            passed = false;
        }
    });
    if (passed) console.log("  ✅ Pasado: Metadatos separan correctamente visual de técnico.");

    // 3. Check opening labels
    console.log("\nTEST 3: Etiquetas de abertura localizadas");
    const openingLabels = scene.labels.filter(l => l.id.startsWith('label_opening_'));
    openingLabels.forEach(label => {
        const text = label.text;
        if (!text.startsWith('Ventana') && !text.startsWith('Puerta')) {
            console.log(`  ❌ Fallido: Etiqueta de abertura '${text}' no está en español`);
            passed = false;
        }
    });
    if (passed) console.log("  ✅ Pasado: Etiquetas de abertura en español.");

    if (!passed) {
        throw new Error("Label Localization Audit Failed");
    } else {
        console.log("\n🏆 AUDITORÍA DE ETIQUETAS EXITOSA.");
    }
}

runLabelLocalizationAudit().catch(err => {
    console.error(err.message);
    // @ts-ignore
    if (typeof process !== 'undefined') process.exit(1);
});
