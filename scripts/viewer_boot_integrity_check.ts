import * as fs from 'fs';
import * as path from 'path';

/**
 * VIEWER BOOT INTEGRITY CHECK (P0)
 */

const BASE_PATH = 'd:/proyectos asistidos/steel';
const VIEWER_PATH = path.join(BASE_PATH, 'apps/product-ui/public/qa-viewer/viewer.js');

function checkFileContains(filePath: string, patterns: string[]): boolean {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Archivo no encontrado: ${filePath}`);
        return false;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
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
    console.log('--- VERIFICACIÓN DE BOOT INTEGRITY (P0) ---');

    const success = checkFileContains(VIEWER_PATH, [
        'const interiorPanelMeshes = []',
        'const floorMeshes = []',
        'function ensureInteractiveCollections',
        'function resetInteractiveCollections',
        'function safeIntersect',
        '[VIEWER_BOOT] Scene Stats'
    ]);

    if (success) {
        console.log('\n✅ VERIFICACIÓN EXITOSA: El viewer tiene todos los elementos defensivos para bootear.');
    } else {
        console.log('\n❌ VERIFICACIÓN FALLIDA: Faltan elementos críticos en viewer.js.');
        process.exit(1);
    }
}

runVerification();
