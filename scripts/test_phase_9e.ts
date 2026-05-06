import { PostgresStorageAdapter } from '../src/modules/product/storage/postgres-storage-adapter';
import { EngineFacade } from '../src/modules/product/engine-facade';
import { closePool } from '../src/modules/product/storage/db-config';

async function runTest9E() {
    console.log('--- TESTING PHASE 9E: PARAMETRIC GENERATION ---');
    const storage = new PostgresStorageAdapter();
    const connected = await storage.healthCheck();
    if (!connected) {
        console.error('FAIL: No connection to PostgreSQL');
        process.exit(1);
    }

    // 1. Crear proyecto mock
    const projId = `test_9e_${Date.now()}`;
    function generarId(prefix: string) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }
    const versionId = generarId('v');

    const initialConfig = {
        anchoVivienda: 4.0,
        largoVivienda: 16.0,
        alturaMuro: 2.6,
        pendienteTecho: 10,
        espesorPerfil: 0.9,
        separacionMontantes: 0.4,
        tipoPerfil: 'PGC 100x0.9',
        material: 'acero_galvanizado',
        tipoCubierta: 'one_slope' as const,
        tipoFundacion: 'losa',
        direccionCaida: 'ancho' as const
    };

    const project = {
        id: projId,
        nombre: 'Test 9E Project',
        cliente: 'QA Team',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estado: 'borrador' as any,
        versionActual: versionId,
        historialVersiones: [
            {
                id: versionId,
                fecha: new Date().toISOString(),
                configuracion: initialConfig,
                nota: 'Initial state'
            }
        ]
    };

    await storage.saveProject(project);
    console.log('STEP 1: Project created in DB');

    // 2. Ejecutar regeneración (Motor)
    console.log('STEP 2: Running EngineFacade...');
    const input = {
        width: initialConfig.anchoVivienda,
        length: initialConfig.largoVivienda,
        minHeight: initialConfig.alturaMuro,
        roofType: initialConfig.tipoCubierta,
        roofSlope: initialConfig.pendienteTecho,
        openings: []
    };

    const result = EngineFacade.generate(input);
    console.log(`Motor result: ${result.house.muros.length} walls, ${result.construction.panels.length} panels`);
    
    const deltaEsperado = Math.round(4.0 * Math.tan(10 * Math.PI / 180) * 1000) / 1000;
    const roof = result.house.roof;
    console.log(`Roof Delta: ${roof.highSideHeight - roof.lowSideHeight} (Expected: ~${deltaEsperado})`);

    const wallNorth = result.house.muros.find(m => m.id === 'wall_north');
    const wallEast = result.house.muros.find(m => m.id === 'wall_east');
    
    const northSlope = Math.abs(wallNorth!.heightEnd - wallNorth!.heightStart);
    const eastSlope = Math.abs(wallEast!.heightEnd - wallEast!.heightStart);

    console.log(`North Wall (Ancho) Slope: ${northSlope}`);
    console.log(`East Wall (Largo) Slope: ${eastSlope}`);

    if (northSlope > 0 && eastSlope === 0) {
        console.log('STEP 2.1: PASSED (Slope correctly oriented across width)');
    } else {
        console.error('STEP 2.1: FAILED (Slope orientation is incorrect)');
        process.exit(1);
    }

    if (result.house.muros.length === 4 && result.construction.panels.length > 0) {
        console.log('STEP 2.2: PASSED (Geometric generation successful)');
        
        // TEST SLOPE-3 & SLOPE-7: Verificar alturas variables en paneles y montantes
        const northPanels = result.construction.panels.filter(p => p.wallId === 'wall_north');
        const firstPanel = northPanels[0];
        const lastPanel = northPanels[northPanels.length - 1];
        
        console.log(`North Wall Panels: ${northPanels.length}`);
        console.log(`First Panel Heights: ${firstPanel.heightStart} -> ${firstPanel.heightEnd}`);
        console.log(`Last Panel Heights: ${lastPanel.heightStart} -> ${lastPanel.heightEnd}`);
        
        const firstStud = firstPanel.studs[0];
        const lastStud = lastPanel.studs[lastPanel.studs.length - 1];
        
        console.log(`First Stud Height: ${firstStud.height}`);
        console.log(`Last Stud Height: ${lastStud.height}`);
        
        if (firstStud.height < lastStud.height && lastStud.height > 2.6) {
            console.log('STEP 2.3: PASSED (Variable stud heights verified)');
        } else {
            console.error('STEP 2.3: FAILED (Stud heights are not variable)');
            process.exit(1);
        }

        // Verificar CutList para solera_superior
        const slopedTracks = result.bom.cutList.filter(item => item.role === 'solera_superior');
        const northSlopedTrack = slopedTracks.find(t => t.sourceEntityId?.includes('wall_north'));
        console.log(`Sloped Track Length: ${northSlopedTrack?.length}`);
        
        if (northSlopedTrack && northSlopedTrack.length > 0.4) { // 0.4 es el ancho de panel típico
             console.log('STEP 2.4: PASSED (Sloped track detected in BOM)');
        } else {
             console.error('STEP 2.4: FAILED (No sloped track in BOM or invalid length)');
             process.exit(1);
        }
    } else {
        console.error('STEP 2.2: FAILED (Unexpected motor output)');
        process.exit(1);
    }

    // 3. Persistir resultado
    (project.historialVersiones[0] as any).resultadoMotor = result;
    project.estado = 'validado' as any;
    await storage.saveProject(project);
    console.log('STEP 3: Result persisted in DB');

    // 4. Verificar carga
    const pool = (storage as any).getPool ? (storage as any).getPool() : require('../src/modules/product/storage/db-config').getPool();
    const direct = await pool.query('SELECT snapshot_json FROM versiones_proyecto WHERE id=$1', [project.historialVersiones[0].id]);
    console.log('DIRECT DB snapshot exists?', !!direct.rows[0]?.snapshot_json);
    if (direct.rows[0]?.snapshot_json) {
        const sj = direct.rows[0].snapshot_json;
        const parsed = typeof sj === 'string' ? JSON.parse(sj) : sj;
        console.log('DIRECT DB has result?', !!parsed.resultadoMotor);
    }

    const loaded = await storage.getProject(projId);
    const v = loaded?.historialVersiones[0];
    console.log('DEBUG: Loaded version resultMotor exists?', !!v?.resultadoMotor);
    if (v?.resultadoMotor) {
        console.log('DEBUG: BOM exists?', !!v.resultadoMotor.bom);
        console.log('DEBUG: BOM aggregated length:', v.resultadoMotor.bom.aggregated.length);
    }

    if (v?.resultadoMotor && v.resultadoMotor.bom.aggregated.length > 0) {
        console.log('STEP 4: PASSED (Persistence verified)');
    } else {
        console.error('STEP 4: FAILED (Result not loaded from DB)');
        process.exit(1);
    }

    await closePool();
    console.log('--- PHASE 9E TEST COMPLETE: SUCCESS ---');
}

runTest9E().catch(console.error);
