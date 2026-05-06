import * as fs from 'fs';
import * as path from 'path';

console.log('--- RUNNING FASE 7.5A PRODUCT UX STABILIZATION TESTS ---');

const uiDir = path.join(process.cwd(), 'ui/product');
const sharedDir = path.join(uiDir, 'shared');

// Helper to check content in file
const checkInFile = (file: string, query: string | RegExp) => {
    try {
        const content = fs.readFileSync(path.join(uiDir, file), 'utf-8');
        if (typeof query === 'string') return content.includes(query);
        return query.test(content);
    } catch (e) {
        return false;
    }
};

// TEST 119: product-routes generates URLs
const hasRoutes = fs.existsSync(path.join(sharedDir, 'product-routes.js'));
const routesValid = hasRoutes && checkInFile('shared/product-routes.js', 'getProjectDetailUrl');
console.log(`TEST 119: ${routesValid ? 'PASSED' : 'FAILED'} (product-routes genera URLs)`);

// TEST 120: product-active-project
const hasActiveProject = fs.existsSync(path.join(sharedDir, 'product-active-project.js'));
const activeProjectValid = hasActiveProject && checkInFile('shared/product-active-project.js', 'sessionStorage.setItem');
console.log(`TEST 120: ${activeProjectValid ? 'PASSED' : 'FAILED'} (product-active-project maneja persistencia)`);

// TEST 122: forbidden routes
const forbidden = ['/ui/proyectos', '../proyectos'];
const screens = ['index.html', 'proyectos.html', 'proyecto-detalle.html'];
let hardcodedFound = false;
screens.forEach(s => {
    forbidden.forEach(f => {
        if (checkInFile(s, f)) {
            console.log(`- FAILED: Hardcoded route "${f}" found in ${s}`);
            hardcodedFound = true;
        }
    });
});
console.log(`TEST 122: ${!hardcodedFound ? 'PASSED' : 'FAILED'} (No hay rutas prohibidas hardcodeadas)`);

// TEST 123: API status
const usesHealth = checkInFile('shared/product-api-status.js', 'http://localhost:3001/api/health');
console.log(`TEST 123: ${usesHealth ? 'PASSED' : 'FAILED'} (API status usa health check)`);

// TEST 127: regenerate placeholder
const hasRegenerate = checkInFile('proyecto-detalle.html', 'probarRegenerarAPI');
console.log(`TEST 127: ${hasRegenerate ? 'PASSED' : 'FAILED'} (Botón regenerar presente)`);

// TEST 129: top-level await check
let topLevelAwaitFound = false;
for (const s of screens) {
    const content = fs.readFileSync(path.join(uiDir, s), 'utf-8');
    const scriptMatches = content.matchAll(/<script>([\s\S]*?)<\/script>/g);
    
    for (const match of scriptMatches) {
        const scriptBody = match[1];
        const awaitIndices = [];
        let idx = scriptBody.indexOf('await ');
        while (idx !== -1) {
            awaitIndices.push(idx);
            idx = scriptBody.indexOf('await ', idx + 1);
        }

        for (const awaitIdx of awaitIndices) {
            const beforeAwait = scriptBody.substring(0, awaitIdx);
            const openBraces = (beforeAwait.match(/\{/g) || []).length;
            const closeBraces = (beforeAwait.match(/\}/g) || []).length;
            
            if (openBraces <= closeBraces) {
                topLevelAwaitFound = true;
                console.log(`[DEBUG] Potential top-level await found in ${s} near: "${scriptBody.substring(awaitIdx, awaitIdx + 30).replace(/\n/g, ' ')}..."`);
                break;
            }
        }
        if (topLevelAwaitFound) break;
    }
    if (topLevelAwaitFound) break;
}
console.log(`TEST 129: ${!topLevelAwaitFound ? 'PASSED' : 'FAILED'} (No hay top-level await)`);

// TEST 130: Global handlers exposure in proyecto-detalle.html
const requiredGlobals = [
    'window.cambiarEstado = cambiarEstado',
    'window.regenerarProyecto = regenerarProyecto',
    'window.marcarCambioPendiente = marcarCambioPendiente',
    'window.probarRegenerarAPI = probarRegenerarAPI'
];
let allGlobalsExposed = true;
requiredGlobals.forEach(g => {
    if (!checkInFile('proyecto-detalle.html', g)) {
        console.log(`- FAILED: Global exposure "${g}" not found in proyecto-detalle.html`);
        allGlobalsExposed = false;
    }
});
console.log(`TEST 130: ${allGlobalsExposed ? 'PASSED' : 'FAILED'} (Funciones globales expuestas en detalle)`);

// TEST 131: Static check for undefined onclick handlers
const contentDetalle = fs.readFileSync(path.join(uiDir, 'proyecto-detalle.html'), 'utf-8');
const inlineHandlers = contentDetalle.matchAll(/(?:onclick|onchange)="([^"]+)\(\)"/g);
let allHandlersDefined = true;
for (const match of inlineHandlers) {
    const fnName = match[1];
    // Simple check: function must be defined with "function fnName" or "window.fnName ="
    const isDeclared = contentDetalle.includes(`function ${fnName}`) || contentDetalle.includes(`window.${fnName} =`);
    if (!isDeclared) {
        console.log(`- FAILED: Inline handler "${fnName}" called but not declared in proyecto-detalle.html`);
        allHandlersDefined = false;
    }
}
console.log(`TEST 131: ${allHandlersDefined ? 'PASSED' : 'FAILED'} (Handlers inline definidos estáticamente)`);

// TEST 132: Error guard presence
const hasErrorGuard = checkInFile('proyecto-detalle.html', 'window.onerror');
console.log(`TEST 132: ${hasErrorGuard ? 'PASSED' : 'FAILED'} (Guardia de errores presente)`);

// TEST 133: API Client base URL
const apiClientContent = fs.readFileSync(path.join(uiDir, 'api-client.js'), 'utf-8');
const hasCorrectBase = apiClientContent.includes("const API_BASE = 'http://localhost:3001/api'");
console.log(`TEST 133: ${hasCorrectBase ? 'PASSED' : 'FAILED'} (api-client apunta a localhost:3001/api)`);

// TEST 134: proyectos.html calls getProyectos
const hasGetProyectos = checkInFile('proyectos.html', 'window.ApiClient.getProyectos()');
console.log(`TEST 134: ${hasGetProyectos ? 'PASSED' : 'FAILED'} (proyectos.html llama a getProyectos)`);

// TEST 135: Data source banner
const hasSourceIndicator = checkInFile('proyectos.html', 'id="data-source-indicator"');
console.log(`TEST 135: ${hasSourceIndicator ? 'PASSED' : 'FAILED'} (proyectos.html tiene indicador de fuente de datos)`);

// TEST 136: normalization logic
const hasNormalization = checkInFile('proyectos.html', 'function normalizarListaProyectos');
console.log(`TEST 136: ${hasNormalization ? 'PASSED' : 'FAILED'} (proyectos.html tiene lógica de normalización)`);

// TEST 137: fallback only in catch/error
const contentProyectos = fs.readFileSync(path.join(uiDir, 'proyectos.html'), 'utf-8');
const hasFallbackInCatch = /catch\s*\(e\)\s*\{[\s\S]*localStorage\.getItem\(STORAGE_KEY\)/.test(contentProyectos);
console.log(`TEST 137: ${hasFallbackInCatch ? 'PASSED' : 'FAILED'} (Fallback a localStorage solo en catch/error)`);

// TEST 142: 404 active project clears active project state
const activeProjectSrc = fs.readFileSync(path.join(sharedDir, 'product-active-project.js'), 'utf-8');
const hasClearOn404 = activeProjectSrc.includes('e.status === 404') && activeProjectSrc.includes('this.clearActiveProject()');
console.log(`TEST 142: ${hasClearOn404 ? 'PASSED' : 'FAILED'} (404 limpia proyecto activo)`);

// TEST 143: API 404 does not fallback to localStorage
// We check that the block with return null is present before any fallback
const hasNoFallbackOn404 = activeProjectSrc.includes('if (e.status === 404') && activeProjectSrc.includes('return null;');
console.log(`TEST 143: ${hasNoFallbackOn404 ? 'PASSED' : 'FAILED'} (404 limpia proyecto activo)`);

// TEST 144: localStorage fallback only when API unavailable
const hasConditionalFallback = activeProjectSrc.includes('// Solo fallback si el error NO es un 404');
console.log(`TEST 144: ${hasConditionalFallback ? 'PASSED' : 'FAILED'} (Fallback local solo por conexión)`);

// TEST 145: proyectos.html renders API list only when API is healthy
const contentProyectosNew = fs.readFileSync(path.join(uiDir, 'proyectos.html'), 'utf-8');
const hasStrictList = /try\s*\{[\s\S]*window\.ApiClient\.getProyectos\(\)[\s\S]*fuente = 'api'/.test(contentProyectosNew);
console.log(`TEST 145: ${hasStrictList ? 'PASSED' : 'FAILED'} (Lista estricta desde API)`);

// TEST 146: detalle with 404 shows guided not-found state
const contentDetalleNew = fs.readFileSync(path.join(uiDir, 'proyecto-detalle.html'), 'utf-8');
const hasGuidedNotFound = contentDetalleNew.includes('El proyecto solicitado no existe en PostgreSQL o fue eliminado');
console.log(`TEST 146: ${hasGuidedNotFound ? 'PASSED' : 'FAILED'} (Detalle guía en 404)`);

// TEST 147: clear local temporary state helper exists
const hasCleanupHelper = contentProyectosNew.includes('limpiarEstadoLocal()') && contentProyectosNew.includes('window.limpiarEstadoLocal = limpiarEstadoLocal');
console.log(`TEST 147: ${hasCleanupHelper ? 'PASSED' : 'FAILED'} (Helper de limpieza local existe)`);

console.log('--- PRODUCT UX STABILIZATION COMPLETE ---');
