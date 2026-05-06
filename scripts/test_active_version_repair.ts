import { PostgresStorageAdapter } from '../src/modules/product/storage/postgres-storage-adapter';
import { ensureActiveVersion } from '../apps/product-ui/src/lib/project-repair';
import { closePool } from '../src/modules/product/storage/db-config';

async function testRepair() {
    console.log('--- TESTING PROJECT VERSION REPAIR ---');
    const storage = new PostgresStorageAdapter();
    const connected = await storage.healthCheck();
    if (!connected) {
        console.error('FAIL: No connection to PostgreSQL');
        process.exit(1);
    }

    const projId = `test_repair_${Date.now()}`;

    // TEST 1: Proyecto sin versiones
    console.log('\nTEST 1: Proyecto sin versiones...');
    const project1: any = {
        id: projId,
        nombre: 'Test Repair 1',
        cliente: 'QA',
        estado: 'borrador',
        historialVersiones: []
    };
    
    const res1 = ensureActiveVersion(project1);
    console.log('Repaired?', res1.repaired);
    console.log('VersionActual set?', !!res1.project.versionActual);
    console.log('Historial length:', res1.project.historialVersiones.length);
    
    if (res1.repaired && res1.project.historialVersiones.length === 1) {
        console.log('TEST 1: PASSED');
    } else {
        console.error('TEST 1: FAILED');
        process.exit(1);
    }

    // TEST 2: Proyecto con versionActual inexistente
    console.log('\nTEST 2: versionActual inexistente...');
    const project2: any = {
        id: projId + '_2',
        nombre: 'Test Repair 2',
        cliente: 'QA',
        estado: 'borrador',
        versionActual: 'v_missing',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        historialVersiones: [
            { id: 'v_real', fecha: new Date().toISOString(), nota: 'Existing', configuracion: {} }
        ]
    };

    const res2 = ensureActiveVersion(project2);
    console.log('Repaired?', res2.repaired);
    console.log('VersionActual corrected?', res2.project.versionActual === 'v_real');

    if (res2.repaired && res2.project.versionActual === 'v_real') {
        console.log('TEST 2: PASSED');
    } else {
        console.error('TEST 2: FAILED');
        process.exit(1);
    }

    // TEST 3: Integración con Storage
    console.log('\nTEST 3: Integración con Storage...');
    // Guardamos el proyecto roto del test 2 (forzando el estado roto en DB)
    const brokenProject = { ...project2, versionActual: 'v_broken' };
    await storage.saveProject(brokenProject);
    console.log('Broken project saved to DB');

    // Recuperamos vía API simulada (usando el helper que pusimos en los routes)
    const loaded = await storage.getProject(brokenProject.id);
    const res3 = ensureActiveVersion(loaded!);
    if (res3.repaired) {
        await storage.saveProject(res3.project);
        console.log('Project repaired and saved');
    }

    const final = await storage.getProject(brokenProject.id);
    console.log('Final versionActual:', final?.versionActual);
    
    if (final?.versionActual === 'v_real') {
        console.log('TEST 3: PASSED');
    } else {
        console.error('TEST 3: FAILED');
        process.exit(1);
    }

    await closePool();
    console.log('\n--- ALL REPAIR TESTS PASSED ---');
}

testRepair().catch(console.error);
