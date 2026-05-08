import * as fs from 'fs';
import * as path from 'path';

/**
 * ARCHITECTURE INTEGRITY CHECK (Fase R6)
 * Detecta infracciones a los principios de arquitectura del proyecto.
 */

const BASE_PATH = 'd:/proyectos asistidos/steel';
const APP_PATH = path.join(BASE_PATH, 'apps/product-ui/src/app');

interface Violation {
    checkId: number;
    file: string;
    description: string;
}

const violations: Violation[] = [];

function checkFile(filePath: string, checkId: number, pattern: RegExp | string, description: string) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    if (typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content)) {
        violations.push({ checkId, file: filePath.replace(BASE_PATH, ''), description });
    }
}

function scanDirectory(dir: string, callback: (filePath: string) => void) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDirectory(fullPath, callback);
        } else {
            callback(fullPath);
        }
    }
}

async function runAudit() {
    console.log('--- INICIANDO AUDITORÍA DE INTEGRIDAD ARQUITECTÓNICA ---');

    // 1. Route handlers con require(
    scanDirectory(APP_PATH, (file) => {
        if (file.includes('route.ts')) {
            checkFile(file, 1, /require\s*\(/, 'Uso de require() en Route Handler (usar import)');
        }
    });

    // 2. EngineFacade.generate directo en handlers (excepto /regenerar)
    scanDirectory(APP_PATH, (file) => {
        if (file.includes('route.ts') && !file.includes('regenerar')) {
            checkFile(file, 2, 'EngineFacade.generate', 'EngineFacade.generate llamado directamente en handler (usar ProjectService)');
        }
    });

    // 3. Acceso directo a pg.Pool en handlers
    scanDirectory(APP_PATH, (file) => {
        if (file.includes('route.ts')) {
            checkFile(file, 3, /getPool\s*\(/, 'Acceso directo a pg.Pool en handler (usar StorageAdapter)');
        }
    });

    // 4. Rutas relativas tipo ../../tools/qa-viewer/exports
    scanDirectory(APP_PATH, (file) => {
        checkFile(file, 4, '../../tools/qa-viewer/exports', 'Uso de ruta relativa externa frágil para exportaciones');
    });

    // 5. saveProject antes de EngineFacade.generate (Inversión de lógica)
    scanDirectory(APP_PATH, (file) => {
        if (file.includes('route.ts')) {
            const content = fs.readFileSync(file, 'utf-8');
            const saveIndex = content.indexOf('storage.saveProject');
            const generateIndex = content.indexOf('EngineFacade.generate');
            if (saveIndex !== -1 && generateIndex !== -1 && saveIndex < generateIndex) {
                violations.push({ checkId: 5, file: file.replace(BASE_PATH, ''), description: 'storage.saveProject llamado antes de EngineFacade.generate' });
            }
        }
    });

    // 7. Duplicación de mapper UI->Engine
    const mappers: string[] = [];
    scanDirectory(APP_PATH, (file) => {
        if (file.includes('route.ts')) {
            const content = fs.readFileSync(file, 'utf-8');
            if (content.includes('width: config.') && content.includes('length: config.')) {
                mappers.push(file);
            }
        }
    });
    if (mappers.length > 1) {
        mappers.forEach(m => violations.push({ checkId: 7, file: m.replace(BASE_PATH, ''), description: 'Lógica de mapeo UI->Engine duplicada en handler' }));
    }

    // 8. viewer.js usando etiquetas humanas como wallId
    const viewerJs = path.join(BASE_PATH, 'apps/product-ui/public/qa-viewer/viewer.js');
    checkFile(viewerJs, 8, /"muro norte"|"muro sur"/, 'viewer.js contiene mapeo de etiquetas humanas a IDs (usar localizacion.js)');

    // 10. Tipos duplicados fuera de src/contracts
    // (Simulado buscando interfaces con nombres comunes en lugares incorrectos)
    scanDirectory(APP_PATH, (file) => {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            checkFile(file, 10, /interface\s+(ProjectOpening|ProjectConfig|AberturaInput)/, 'Definición de tipo/interfaz de contrato fuera de src/contracts');
        }
    });

    // Reporte de Resultados
    console.log(`\nAuditoría finalizada. Infracciones encontradas: ${violations.length}\n`);
    
    if (violations.length > 0) {
        const grouped = violations.reduce((acc, v) => {
            acc[v.checkId] = acc[v.checkId] || [];
            acc[v.checkId].push(v);
            return acc;
        }, {} as Record<number, Violation[]>);

        Object.keys(grouped).forEach(id => {
            console.log(`CHECK ${id}:`);
            grouped[Number(id)].forEach(v => console.log(`  - ${v.file}: ${v.description}`));
        });
    } else {
        console.log('✅ No se detectaron infracciones críticas.');
    }
}

runAudit();
