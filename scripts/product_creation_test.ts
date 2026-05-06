import * as fs from 'fs';
import * as path from 'path';

console.log('--- RUNNING PROJECT CREATION CONSISTENCY TESTS ---');

const proyectosPath = path.join(process.cwd(), 'ui/product/proyectos.html');

// TEST 1: Inspect actual code for consistency
const proyectosHtml = fs.readFileSync(proyectosPath, 'utf-8');

// Check that redirect uses nuevoProyecto.id
const usesNuevoId = proyectosHtml.includes('getProyectoDetalleUrl(nuevoProyecto.id)');
console.log(`TEST C1: ${usesNuevoId ? 'PASSED' : 'FAILED'} (Redirección usa nuevoProyecto.id)`);

// Check that console logs are present
const hasLogs = proyectosHtml.includes("[CREAR PROYECTO]");
console.log(`TEST C2: ${hasLogs ? 'PASSED' : 'FAILED'} (Logs de diagnóstico presentes)`);

// Check that saving happens BEFORE redirection
const saveIndex = proyectosHtml.indexOf('guardarProyectos(proyectos)');
const redirectIndex = proyectosHtml.indexOf('window.location.href = targetUrl');
const correctOrder = saveIndex !== -1 && redirectIndex !== -1 && saveIndex < redirectIndex;
console.log(`TEST C3: ${correctOrder ? 'PASSED' : 'FAILED'} (Guardado ocurre antes de redirección)`);

console.log('--- CREATION CONSISTENCY TESTS COMPLETE ---');
