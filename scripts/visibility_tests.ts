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

async function runVisibilityAudit() {
    console.log("=== AUDITORÍA DE VISIBILIDAD DE LENGUAJE DE DOMINIO ===\n");
    
    const project = mockProject();
    const scene = SceneBuilder.buildScene(project);
    
    let failedCount = 0;
    const forbidden = ['king', 'jack', 'cripple', 'sill', 'header', 'door', 'window', 'opening'];
    const forbiddenKeys = ['role', 'type', 'strategy', 'openingId'];

    // 1. Check for forbidden values in metadata
    console.log("TEST 1: No hay valores de dominio en inglés en metadatos");
    scene.objects.forEach(obj => {
        for (const [key, value] of Object.entries(obj.metadata)) {
            if (typeof value === 'string') {
                const lower = value.toLowerCase();
                forbidden.forEach(f => {
                    if (lower.includes(f)) {
                        console.log(`  ❌ Fallido: Término prohibido '${f}' encontrado en objeto ${obj.id} (metadata: ${key}=${value})`);
                        failedCount++;
                    }
                });
            }
        }
    });
    if (failedCount === 0) console.log("  ✅ Pasado: No se encontraron valores prohibidos.");

    // 2. Check for forbidden keys in metadata
    console.log("\nTEST 2: No hay claves de metadatos en inglés");
    const test2Failures = failedCount;
    scene.objects.forEach(obj => {
        for (const key of Object.keys(obj.metadata)) {
            if (forbiddenKeys.includes(key)) {
                console.log(`  ❌ Fallido: Clave prohibida '${key}' encontrada en objeto ${obj.id}`);
                failedCount++;
            }
        }
    });
    if (failedCount === test2Failures) console.log("  ✅ Pasado: Claves de metadatos localizadas.");

    // 3. Check for localized layer names
    console.log("\nTEST 3: Nombres de capas localizados");
    const test3Failures = failedCount;
    scene.layers.forEach(layer => {
        const lower = layer.name.toLowerCase();
        // Permite "Paneles" porque es español, aunque contenga "panel"
        if (lower === 'paneles') return;
        
        const hasEnglish = ['wall', 'opening', 'header', 'foundation', 'anchor'].some(f => lower.includes(f));
        if (hasEnglish) {
            console.log(`  ❌ Fallido: Capa '${layer.id}' tiene nombre en inglés: '${layer.name}'`);
            failedCount++;
        }
    });
    if (failedCount === test3Failures) console.log("  ✅ Pasado: Nombres de capas en español.");

    if (failedCount > 0) {
        console.log(`\n❌ AUDITORÍA FALLIDA: Se encontraron ${failedCount} problemas de visibilidad.`);
        throw new Error("Visibility Audit Failed");
    } else {
        console.log("\n🏆 AUDITORÍA DE VISIBILIDAD EXITOSA. Todo el contenido visible está en español.");
    }
}

runVisibilityAudit().catch(err => {
    console.error(err.message);
    // @ts-ignore
    if (typeof process !== 'undefined') process.exit(1);
});
