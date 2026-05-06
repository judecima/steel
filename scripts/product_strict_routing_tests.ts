import * as fs from 'fs';
import * as path from 'path';

console.log('--- RUNNING STRICT PRODUCT NAVIGATION TESTS ---');

const proyectosPath = path.join(process.cwd(), 'ui/product/proyectos.html');

// TEST 1: Inspect actual generated HTML string structure
const proyectosHtml = fs.readFileSync(proyectosPath, 'utf-8');

// Test that cards are generated as <a> tags and NOT with onclick for navigation
const hasCleanCard = proyectosHtml.includes('<a class="project-card" href="${url}"');
const hasNoMixedNav = !proyectosHtml.includes('onclick="window.location');
console.log(`TEST S1: ${hasCleanCard && hasNoMixedNav ? 'PASSED' : 'FAILED'} (Cards usan <a> puro sin onclick de navegación)`);

// TEST 2: Hard guard check
const hasHardGuard = proyectosHtml.includes('if (!p.id)') && proyectosHtml.includes('⚠️ Proyecto inválido: falta ID');
console.log(`TEST S2: ${hasHardGuard ? 'PASSED' : 'FAILED'} (Guardia dura para IDs faltantes presente)`);

// TEST 3: Ver detalle button is disabled/pointer-events: none
const hasPointerEventsNone = proyectosHtml.includes('pointer-events: none;') && proyectosHtml.includes('Ver detalle →');
console.log(`TEST S3: ${hasPointerEventsNone ? 'PASSED' : 'FAILED'} (Botón interno neutralizado para evitar burbujeo conflictivo)`);

// TEST 4: Creation redirect uses helper
const hasCorrectCreation = proyectosHtml.includes('window.location.href = getProyectoDetalleUrl(id)');
console.log(`TEST S4: ${hasCorrectCreation ? 'PASSED' : 'FAILED'} (Redirección tras creación usa helper seguro)`);

console.log('--- STRICT NAVIGATION TESTS COMPLETE ---');
