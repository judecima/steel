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

// TEST 149: api.ts usa NEXT_PUBLIC_API_BASE_URL
const apiFile = path.join(nextDir, 'src/lib/api.ts');
const usesBaseUrl = checkInFile(apiFile, 'NEXT_PUBLIC_API_BASE_URL');
console.log(`TEST 149: ${usesBaseUrl ? 'PASSED' : 'FAILED'} (api.ts usa variable de entorno)`);

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

console.log('--- NEXT.JS PRODUCT UI TESTS COMPLETE ---');
