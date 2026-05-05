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

async function auditar() {
    console.log("=== AUDITORÍA DE LOCALIZACIÓN VISIBLE FINAL ===\n");
    
    const project = mockProject();
    const scene = SceneBuilder.buildScene(project);
    
    let failed = false;
    const forbidden = [
        'king', 'jack', 'cripple', 'sill', 'header', 
        'window', 'door', 'one_slope', 'two_slope',
        'north', 'south', 'east', 'west',
        'structural', 'loadbearing'
    ];

    const forbiddenIdPatterns = ['wall_', 'panel_', 'render_', 'abertura_'];

    // 1. Audit labels text
    console.log("AUDITORÍA 1: Etiquetas 3D");
    scene.labels.forEach(label => {
        const text = label.text.toLowerCase();
        
        // Términos prohibidos específicos
        forbidden.forEach(f => {
            if (f === 'one_slope' || f === 'king' || f === 'header') {
                if (text.includes(f)) {
                    console.log(`  ❌ Fallido: Etiqueta '${label.text}' contiene término prohibido '${f}'`);
                    failed = true;
                }
            }
        });

        // No deben contener patrones de IDs técnicos en etiquetas visibles
        forbiddenIdPatterns.forEach(p => {
            if (text.includes(p)) {
                console.log(`  ❌ Fallido: Etiqueta '${label.text}' parece ser un ID técnico '${p}...'`);
                failed = true;
            }
        });
    });
    if (!failed) console.log("  ✅ Pasado.");

    // 2. Audit metadata values
    console.log("\nAUDITORÍA 2: Valores de Metadatos");
    scene.objects.forEach(obj => {
        for (const [key, value] of Object.entries(obj.metadata)) {
            if (typeof value === 'string') {
                const lower = value.toLowerCase();
                
                // Claves que permiten IDs técnicos (para trazabilidad y depuración)
                const isTechnicalKey = [
                    'ID técnico', 'ID Técnico', 'ID fuente', 'ID de panel', 
                    'ID de muro', 'ID de abertura', 'ID de dintel', 'sourceId', 'id',
                    'ID interno', 'ID interno fuente', 'ID interno de panel', 'ID interno de muro', 'ID interno de abertura'
                ].some(tk => key.includes(tk));

                if (!isTechnicalKey) {
                    // Verificación de términos prohibidos
                    forbidden.forEach(f => {
                        if (lower === f || lower.includes('_' + f) || lower.includes(f + '_')) {
                            console.log(`  ❌ Fallido: Metadato '${key}=${value}' en objeto '${obj.id}' contiene '${f}'`);
                            failed = true;
                        }
                    });

                    // Verificación de patrones de ID en campos primarios
                    forbiddenIdPatterns.forEach(p => {
                        if (lower.includes(p)) {
                            console.log(`  ❌ Fallido: Metadato '${key}=${value}' parece un ID técnico '${p}...' no traducido en campo primario`);
                            failed = true;
                        }
                    });
                }
                
                // one_slope NUNCA debe estar presente como valor
                if (lower === 'one_slope') {
                    console.log(`  ❌ Fallido: Metadato '${key}' tiene valor 'one_slope' en objeto '${obj.id}'`);
                    failed = true;
                }
            }
        }
    });
    if (!failed) console.log("  ✅ Pasado.");

    // 3. Audit metadata keys
    console.log("\nAUDITORÍA 3: Claves de Metadatos (No deben ser en inglés técnico)");
    const forbiddenKeys = ['role', 'type', 'wallId', 'panelId', 'openingId', 'roofType', 'strategy'];
    scene.objects.forEach(obj => {
        for (const key of Object.keys(obj.metadata)) {
            if (forbiddenKeys.includes(key)) {
                console.log(`  ❌ Fallido: Clave de metadato técnica '${key}' encontrada en objeto '${obj.id}'`);
                failed = true;
            }
        }
    });
    if (!failed) console.log("  ✅ Pasado.");

    if (failed) {
        console.log("\n❌ AUDITORÍA FALLIDA: Se encontraron problemas de visibilidad.");
        throw new Error("Audit Failed");
    } else {
        console.log("\n🏆 CERTIFICACIÓN DE LOCALIZACIÓN EXITOSA.");
    }
}

auditar().catch(err => {
    console.error(err.message);
    // @ts-ignore
    if (typeof process !== 'undefined') process.exit(1);
});
