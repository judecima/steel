import * as fs from 'fs';
import * as path from 'path';

console.log('--- RUNNING PRODUCT GUARD LOGIC TESTS ---');

const detallePath = path.join(process.cwd(), 'ui/product/proyecto-detalle.html');
const content = fs.readFileSync(detallePath, 'utf-8');

// TEST 1: Presence of correct guard logic
const hasCorrectPathCheck = content.includes("path.endsWith('/proyecto-detalle')");
const hasSearchPreservation = content.includes("const fixedUrl = './proyecto-detalle.html' + search;");
const hasReplace = content.includes("window.location.replace(fixedUrl);");
console.log(`TEST G1: ${hasCorrectPathCheck && hasSearchPreservation && hasReplace ? 'PASSED' : 'FAILED'} (Guardia de ruta preserva query string y usa replace)`);

// TEST 2: Loop protection
const hasLoopProtection = content.includes("sessionStorage.getItem('detalle_route_guard_once')");
const hasSetFlag = content.includes("sessionStorage.setItem('detalle_route_guard_once', 'true')");
const hasRemoveFlag = content.includes("sessionStorage.removeItem('detalle_route_guard_once')");
console.log(`TEST G2: ${hasLoopProtection && hasSetFlag && hasRemoveFlag ? 'PASSED' : 'FAILED'} (Protección contra bucles infinidtos presente)`);

// TEST 3: Defensive relative paths (./)
const hasExplicitRelative = content.includes("'./proyecto-detalle.html'");
console.log(`TEST G3: ${hasExplicitRelative ? 'PASSED' : 'FAILED'} (Usa ruta relativa explícita ./)`);

console.log('--- PRODUCT GUARD TESTS COMPLETE ---');
