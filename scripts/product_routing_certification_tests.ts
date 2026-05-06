import * as fs from 'fs';
import * as path from 'path';

console.log('--- RUNNING FASE 7 PRODUCT UI CERTIFICATION TESTS ---');

const uiDir = path.join(process.cwd(), 'ui/product');

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

// TEST 1: proyecto-detalle.html guard
const guardValid = checkInFile('proyecto-detalle.html', "path.endsWith('/proyecto-detalle') && search");
console.log(`TEST R1: ${guardValid ? 'PASSED' : 'FAILED'} (Guardia de proyecto-detalle usa path && search)`);

// TEST 2: Creation redirect in proyectos.html (using RUTAS or absolute)
const creationValid = checkInFile('proyectos.html', "getProyectoDetalleUrl(proyectoParaGuardar.id)");
console.log(`TEST R2: ${creationValid ? 'PASSED' : 'FAILED'} (Creación usa helper de URL)`);

// TEST 3: Sidebar preservation in proyecto-detalle.html
const sidebarPreserves = checkInFile('proyecto-detalle.html', "if (id) {") && checkInFile('proyecto-detalle.html', "el.href.split('?')[0] + '?id=' + id;");
const sidebarFallback = checkInFile('proyecto-detalle.html', "else {") && checkInFile('proyecto-detalle.html', "el.href = './proyectos.html';");
console.log(`TEST R3: ${sidebarPreserves && sidebarFallback ? 'PASSED' : 'FAILED'} (Sidebar preserva ID o redirige a proyectos)`);

// TEST 4: Back links standard
const backLinksFixed = ['viewer.html', 'presupuesto.html', 'produccion.html', 'exportaciones.html'].every(f => 
    checkInFile(f, "./proyecto-detalle.html?id=") || checkInFile(f, "getProyectoDetalleUrl")
);
console.log(`TEST R4: ${backLinksFixed ? 'PASSED' : 'FAILED'} (Módulos tienen back links estandarizados)`);

// TEST 5: Top-level await check
const content = fs.readFileSync(path.join(uiDir, 'proyectos.html'), 'utf-8');
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
const scriptBody = scriptMatch ? scriptMatch[1] : '';

// More robust check: find all 'await' and verify they are inside an 'async' function
// We'll look for 'await' and then look backwards for 'async'
const awaitIndices = [];
let idx = scriptBody.indexOf('await ');
while (idx !== -1) {
    awaitIndices.push(idx);
    idx = scriptBody.indexOf('await ', idx + 1);
}

let topLevelAwaitFound = false;
for (const awaitIdx of awaitIndices) {
    // Check if this await is inside a function or at the top level
    // We'll count braces before it. This is still a heuristic but better.
    const beforeAwait = scriptBody.substring(0, awaitIdx);
    const openBraces = (beforeAwait.match(/\{/g) || []).length;
    const closeBraces = (beforeAwait.match(/\}/g) || []).length;
    
    if (openBraces <= closeBraces) {
        // More open braces than closed means we are likely inside a function/block
        // If they are equal or open < close, we are at top level
        topLevelAwaitFound = true;
        console.log(`[DEBUG] Potential top-level await found near: "${scriptBody.substring(awaitIdx, awaitIdx + 50).replace(/\n/g, ' ')}..."`);
        break;
    }
}
console.log(`TEST R5: ${!topLevelAwaitFound ? 'PASSED' : 'FAILED'} (No hay top-level await en proyectos.html)`);

// TEST 6: Window exposure check
const exposures = ['abrirModal', 'cerrarModal', 'crearProyecto', 'abrirProyecto'];
const allExposed = exposures.every(e => checkInFile('proyectos.html', `window.${e} = ${e}`));
console.log(`TEST R6: ${allExposed ? 'PASSED' : 'FAILED'} (Funciones expuestas en window)`);

// TEST 7: RUTAS constant check
const hasRutas = checkInFile('proyectos.html', 'const RUTAS = {');
console.log(`TEST R7: ${hasRutas ? 'PASSED' : 'FAILED'} (Constante RUTAS definida)`);

// TEST 8: Forbidden patterns
const forbidden = ['/ui/proyectos', '../proyectos', 'href="proyecto-detalle"'];
const hasForbidden = forbidden.some(p => checkInFile('proyectos.html', p));
console.log(`TEST R8: ${!hasForbidden ? 'PASSED' : 'FAILED'} (No hay rutas prohibidas)`);

console.log('--- ROUTING CERTIFICATION COMPLETE ---');
