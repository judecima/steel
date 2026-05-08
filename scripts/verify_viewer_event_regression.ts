import * as fs from 'fs';
import * as path from 'path';

/**
 * Script de verificación de regresión para eventos del viewer.
 * Valida la integridad del fix quirúrgico mediante análisis de archivos.
 */

const BASE_PATH = 'd:/proyectos asistidos/steel';

function checkFileContains(filePath: string, patterns: string[]): boolean {
    const fullPath = path.join(BASE_PATH, filePath);
    if (!fs.existsSync(fullPath)) {
        console.error(`❌ Archivo no encontrado: ${filePath}`);
        return false;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    let allFound = true;
    for (const pattern of patterns) {
        if (!content.includes(pattern)) {
            console.error(`❌ Patrón no encontrado en ${filePath}: "${pattern}"`);
            allFound = false;
        }
    }
    return allFound;
}

async function runVerification() {
    console.log('--- VERIFICACIÓN DE REGRESIÓN DE EVENTOS ---');

    const viewerChecks = checkFileContains('apps/product-ui/public/qa-viewer/viewer.js', [
        'ID interno de muro',
        'type === "panel"',
        'type === "montante"',
        'VIEWER_EXTERNAL_WALL_DBLCLICK',
        'VIEWER_FLOOR_DBLCLICK',
        'calculateWallLocalPosition',
        'sceneBounds'
    ]);

    const floorBuilderCheck = fs.existsSync(path.join(BASE_PATH, 'src/modules/render/floor-mesh-builder.ts'));
    if (floorBuilderCheck) console.log('✅ floor-mesh-builder.ts existe');
    else console.error('❌ floor-mesh-builder.ts no existe');

    const sceneBuilderCheck = checkFileContains('src/modules/render/scene-builder.ts', [
        'buildFloorMesh',
        'floor-mesh-builder'
    ]);

    const pageCheck = checkFileContains('apps/product-ui/src/app/proyectos/[id]/viewer/page.tsx', [
        'wallLocalPosition',
        'VIEWER_EXTERNAL_WALL_DBLCLICK',
        'VIEWER_FLOOR_DBLCLICK',
        'calculateOpeningPosition(draft'
    ]);

    const apiCheck = checkFileContains('apps/product-ui/src/app/api/proyectos/[id]/aberturas/route.ts', [
        'getWallLengthMeters',
        'OPENING_OUT_OF_WALL_BOUNDS',
        'OPENING_HEIGHT_OUT_OF_BOUNDS'
    ]);

    const success = viewerChecks && floorBuilderCheck && sceneBuilderCheck && pageCheck && apiCheck;

    if (success) {
        console.log('\n✅ VERIFICACIÓN EXITOSA: Todas las reglas del fix quirúrgico están presentes.');
    } else {
        console.log('\n❌ VERIFICACIÓN FALLIDA: Algunos componentes faltan o son incorrectos.');
        process.exit(1);
    }
}

runVerification();
