import * as fs from 'fs';
import * as path from 'path';

console.log('--- RUNNING FASE 9A NEXT.JS PRODUCT UI TESTS ---');

const nextDir = path.join(process.cwd(), 'apps/product-ui');
const rootDir = process.cwd();

// Helper to check content in file
const checkInFile = (filePath: string, query: string | RegExp) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (typeof query === 'string') return content.includes(query);
    return query.test(content);
  } catch (e) {
    return false;
  }
};

// TEST 148: Next app exists in apps/product-ui
const hasNextApp = fs.existsSync(nextDir) && fs.existsSync(path.join(nextDir, 'package.json'));
console.log(`TEST 148: ${hasNextApp ? 'PASSED' : 'FAILED'} (Next.js app existe)`);

// TEST 149: api.ts usa NEXT_PUBLIC_API_BASE_URL o ruta relativa /api
const apiFile = path.join(nextDir, 'src/lib/api.ts');
const usesCorrectBase = checkInFile(apiFile, 'NEXT_PUBLIC_API_BASE_URL') || checkInFile(apiFile, "const API_BASE_URL = '/api'");
console.log(`TEST 149: ${usesCorrectBase ? 'PASSED' : 'FAILED'} (api.ts usa base URL correcta)`);

// TEST 150: No hay uso de localStorage para proyectos
const forbidden = 'localStorage.getItem(\'steel_projects_v1\')';
const srcFiles = [
  'src/app/proyectos/page.tsx',
  'src/app/proyectos/nuevo/page.tsx',
  'src/app/proyectos/[id]/page.tsx'
];
let localStorageFound = false;
srcFiles.forEach(f => {
  if (checkInFile(path.join(nextDir, f), forbidden)) {
    console.log(`- FAILED: localStorage found in ${f}`);
    localStorageFound = true;
  }
});
console.log(`TEST 150: ${!localStorageFound ? 'PASSED' : 'FAILED'} (No hay localStorage para proyectos en Next.js)`);

// TEST 151: Rutas principales existen
const requiredPaths = [
  'src/app/page.tsx',
  'src/app/proyectos/page.tsx',
  'src/app/proyectos/nuevo/page.tsx',
  'src/app/proyectos/[id]/page.tsx'
];
const allPathsExist = requiredPaths.every(p => fs.existsSync(path.join(nextDir, p)));
console.log(`TEST 151: ${allPathsExist ? 'PASSED' : 'FAILED'} (Rutas 9A existen)`);

// TEST 152: Lista de proyectos consume getProjects
const hasGetProjects = checkInFile(path.join(nextDir, 'src/app/proyectos/page.tsx'), 'ApiClient.getProjects()');
console.log(`TEST 152: ${hasGetProjects ? 'PASSED' : 'FAILED'} (Lista consume getProjects)`);

// TEST 153: Crear proyecto usa createProject
const hasCreateProject = checkInFile(path.join(nextDir, 'src/app/proyectos/nuevo/page.tsx'), 'ApiClient.createProject(');
console.log(`TEST 153: ${hasCreateProject ? 'PASSED' : 'FAILED'} (Crear consume createProject)`);

// TEST 154: Detalle consume getProject(id)
const hasGetProject = checkInFile(path.join(nextDir, 'src/app/proyectos/[id]/page.tsx'), 'ApiClient.getProject(id)');
console.log(`TEST 154: ${hasGetProject ? 'PASSED' : 'FAILED'} (Detalle consume getProject)`);

// TEST 155: Detalle 404 muestra error controlado
const hasErrorHandling = checkInFile(path.join(nextDir, 'src/app/proyectos/[id]/page.tsx'), 'status === 404');
console.log(`TEST 155: ${hasErrorHandling ? 'PASSED' : 'FAILED'} (Manejo de 404 en detalle)`);

// TEST 156: AppShell contiene navegación consistente
const hasAppShell = fs.existsSync(path.join(nextDir, 'src/components/AppShell.tsx'));
const hasNav = hasAppShell && checkInFile(path.join(nextDir, 'src/components/AppShell.tsx'), '/proyectos');
console.log(`TEST 156: ${hasNav ? 'PASSED' : 'FAILED'} (AppShell con navegación)`);

// TEST 157: Legacy dashboard muestra banner hacia Next.js
const legacyIndex = path.join(rootDir, 'ui/product/index.html');
const hasBanner = checkInFile(legacyIndex, 'http://localhost:3002');
console.log(`TEST 157: ${hasBanner ? 'PASSED' : 'FAILED'} (Legacy dashboard tiene banner)`);

// --- FASE 9B TESTS ---
const projId = 'test_proj_9b';

// TEST 168: viewer page existe y usa iframe
const viewerFile = path.join(nextDir, 'src/app/proyectos/[id]/viewer/page.tsx');
const hasIframe = checkInFile(viewerFile, '<iframe') && checkInFile(viewerFile, 'viewer.html');
console.log(`TEST 168: ${hasIframe ? 'PASSED' : 'FAILED'} (viewer page usa iframe)`);

// TEST 169: viewer no duplica Three.js
const hasThree = checkInFile(viewerFile, "import * as THREE") || checkInFile(viewerFile, "from 'three'");
console.log(`TEST 169: ${!hasThree ? 'PASSED' : 'FAILED'} (viewer no duplica Three.js)`);

// TEST 170: viewer postMessage modos
const hasPostMessage = checkInFile(viewerFile, 'postMessage') && checkInFile(viewerFile, 'CHANGE_MODE');
console.log(`TEST 170: ${hasPostMessage ? 'PASSED' : 'FAILED'} (viewer postMessage modos)`);

// TEST 171: exportaciones page existe
const exportFile = path.join(nextDir, 'src/app/proyectos/[id]/exportaciones/page.tsx');
const exportExists = fs.existsSync(exportFile);
console.log(`TEST 171: ${exportExists ? 'PASSED' : 'FAILED'} (exportaciones page existe)`);

// TEST 172: exportaciones llama generateAllExports
const callsExport = checkInFile(exportFile, 'generateAllExports');
console.log(`TEST 172: ${callsExport ? 'PASSED' : 'FAILED'} (exportaciones llama generateAllExports)`);

// TEST 173: presupuesto page existe
const budgetFile = path.join(nextDir, 'src/app/proyectos/[id]/presupuesto/page.tsx');
const budgetExists = fs.existsSync(budgetFile);
console.log(`TEST 173: ${budgetExists ? 'PASSED' : 'FAILED'} (presupuesto page existe)`);

// TEST 174: presupuesto muestra precio pendiente
const hasPricePending = checkInFile(budgetFile, 'Precio Pendiente');
console.log(`TEST 174: ${hasPricePending ? 'PASSED' : 'FAILED'} (presupuesto muestra precio pendiente)`);

// TEST 175: produccion page existe
const prodFile = path.join(nextDir, 'src/app/proyectos/[id]/produccion/page.tsx');
const prodExists = fs.existsSync(prodFile);
console.log(`TEST 175: ${prodExists ? 'PASSED' : 'FAILED'} (produccion page existe)`);

// TEST 176: produccion muestra aviso de persistencia persistente
const hasPersistOk = checkInFile(prodFile, 'Control de Producción Persistente') || checkInFile(prodFile, 'PostgreSQL');
console.log(`TEST 176: ${hasPersistOk ? 'PASSED' : 'FAILED'} (produccion muestra aviso persistente)`);

// TEST 177: no hay localStorage para proyectos (re-check)
const hasForbidden9B = checkInFile(viewerFile, forbidden) || checkInFile(exportFile, forbidden) || checkInFile(budgetFile, forbidden) || checkInFile(prodFile, forbidden);
console.log(`TEST 177: ${!hasForbidden9B ? 'PASSED' : 'FAILED'} (no hay localStorage para proyectos en 9B)`);

console.log('--- NEXT.JS PRODUCT UI TESTS COMPLETE ---');
