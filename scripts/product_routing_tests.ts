import * as fs from 'fs';
import * as path from 'path';

console.log('--- RUNNING PRODUCT NAVIGATION & PERSISTENCE CLARITY TESTS ---');

const detallePath = path.join(process.cwd(), 'ui', 'product', 'proyecto-detalle.html');
const proyectosPath = path.join(process.cwd(), 'ui/product/proyectos.html');
const indexPath = path.join(process.cwd(), 'ui/product/index.html');

// TEST 1: proyecto-detalle.html handles missing ID with stronger message
const detalleHtml = fs.readFileSync(detallePath, 'utf-8');
const hasStrongerMsg = detalleHtml.includes('Para ver el detalle debe seleccionar un proyecto');
console.log(`TEST N1: ${hasStrongerMsg ? 'PASSED' : 'FAILED'} (Detalle tiene mensaje reforzado para ID ausente)`);

// TEST 2: dashboard does not link directly to detalle without id
const indexHtml = fs.readFileSync(indexPath, 'utf-8');
const detailLinks = indexHtml.match(/href="proyecto-detalle\.html[^"]*"/g) || [];
const allHaveId = detailLinks.length === 0 || detailLinks.every(l => l.includes('?id='));
console.log(`TEST N2: ${allHaveId ? 'PASSED' : 'FAILED'} (Dashboard no linkea a detalle sin ID)`);

// TEST 3: proyectos.html has "Ver detalle" button in cards
const proyectosHtml = fs.readFileSync(proyectosPath, 'utf-8');
const hasDetailBtn = proyectosHtml.includes('Ver detalle →');
console.log(`TEST N3: ${hasDetailBtn ? 'PASSED' : 'FAILED'} (Cards de proyectos tienen botón "Ver detalle")`);

// TEST 4: creating project redirects to detalle with id
const hasRedirect = proyectosHtml.includes("window.location.href = `proyecto-detalle.html?id=${id}`");
console.log(`TEST N4: ${hasRedirect ? 'PASSED' : 'FAILED'} (Creación redirige a detalle con ID)`);

// TEST 5: persistence notice present in projects and dashboard
const hasNoticeInProyectos = proyectosHtml.includes('Modo local');
const hasNoticeInIndex = indexHtml.includes('Modo local');
console.log(`TEST N5: ${hasNoticeInProyectos && hasNoticeInIndex ? 'PASSED' : 'FAILED'} (Aviso de persistencia local visible en UI)`);

console.log('--- NAVIGATION & CLARITY TESTS COMPLETE ---');
