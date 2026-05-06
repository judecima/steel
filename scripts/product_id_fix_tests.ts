import * as fs from 'fs';
import * as path from 'path';

console.log('--- RUNNING PRODUCT NAVIGATION ID FIX TESTS ---');

const proyectosPath = path.join(process.cwd(), 'ui/product/proyectos.html');

// TEST 1: getProyectoDetalleUrl exists and uses encodeURIComponent
const proyectosHtml = fs.readFileSync(proyectosPath, 'utf-8');
const hasHelper = proyectosHtml.includes('function getProyectoDetalleUrl(projectId)') && proyectosHtml.includes('encodeURIComponent(projectId)');
console.log(`TEST ID1: ${hasHelper ? 'PASSED' : 'FAILED'} (Helper getProyectoDetalleUrl con encoding presente)`);

// TEST 2: project card uses the helper
const hasCardHelper = proyectosHtml.includes('href="${getProyectoDetalleUrl(p.id)}"');
console.log(`TEST ID2: ${hasCardHelper ? 'PASSED' : 'FAILED'} (Card de proyecto usa el helper)`);

// TEST 3: project card has defensive check
const hasDefensiveCheck = proyectosHtml.includes('alert(\'No se puede abrir el proyecto porque no tiene ID.\')');
console.log(`TEST ID3: ${hasDefensiveCheck ? 'PASSED' : 'FAILED'} (Check defensivo para ID ausente presente)`);

// TEST 4: creation redirect uses the helper
const hasCreationHelper = proyectosHtml.includes('window.location.href = getProyectoDetalleUrl(id)');
console.log(`TEST ID4: ${hasCreationHelper ? 'PASSED' : 'FAILED'} (Redirección tras creación usa el helper)`);

console.log('--- ID FIX TESTS COMPLETE ---');
