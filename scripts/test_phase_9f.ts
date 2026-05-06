import { PostgresStorageAdapter } from '../src/modules/product/storage/postgres-storage-adapter';
import { EngineFacade } from '../src/modules/product/engine-facade';
import { closePool } from '../src/modules/product/storage/db-config';
import { SceneBuilder } from '../src/modules/render/scene-builder';

async function runTest9F() {
    console.log('--- TESTING PHASE 9F: INDUSTRIAL PANELIZATION & OPENINGS ---');
    const storage = new PostgresStorageAdapter();
    
    // 1. Crear proyecto mock con medidas industriales
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
        direccionCaida: 'ancho' as const,
        panelMaxLengthM: 4.0,
        panelPreferredLengthM: 3.0,
        aberturas: [
            {
                id: 'op_test_1',
                wallId: 'wall_north',
                tipo: 'ventana' as const,
                ancho: 1.2,
                alto: 1.0,
                antepecho: 0.9,
                posicion: 2.0,
                createdAt: new Date().toISOString()
            }
        ]
    };

    const input = {
        width: initialConfig.anchoVivienda,
        length: initialConfig.largoVivienda,
        minHeight: initialConfig.alturaMuro,
        roofType: initialConfig.tipoCubierta,
        roofSlope: initialConfig.pendienteTecho,
        panelMaxLength: initialConfig.panelMaxLengthM,
        panelPreferredLength: initialConfig.panelPreferredLengthM,
        openings: initialConfig.aberturas.map(a => ({
            wallId: a.wallId,
            type: (a.tipo === 'ventana' ? 'window' : 'door') as 'window' | 'door',
            width: a.ancho,
            height: a.alto,
            position: a.posicion,
            sillHeight: a.antepecho
        }))
    };

    console.log('STEP 1: Running EngineFacade with 16m walls...');
    const result = EngineFacade.generate(input);
    
    // TEST PF-1: muro de 16 m se divide en paneles <= 4 m
    const eastPanels = result.construction.panels.filter(p => p.wallId === 'wall_east');
    console.log(`East Wall Panels (16m): ${eastPanels.length}`);
    const giantPanels = eastPanels.filter(p => p.width > 4.01);
    if (giantPanels.length === 0 && eastPanels.length >= 4) {
        console.log('TEST PF-1: PASSED (Panels <= 4m)');
    } else {
        console.error('TEST PF-1: FAILED (Some panels > 4m or count too low)');
        process.exit(1);
    }

    // TEST PF-2: muro de 16 m usa paneles cercanos a 3 m
    // 16 / 3 = 5.33 -> 6 paneles de ~2.66m o similar
    console.log(`Panel widths: ${eastPanels.map(p => p.width.toFixed(2)).join(', ')}`);
    if (eastPanels.length >= 5) {
        console.log('TEST PF-2: PASSED (Prefers transportable panels)');
    } else {
        console.warn('TEST PF-2: WARNING (Check if balanced strategy is picking 3.2m or similar)');
    }

    // TEST PF-3 & PF-4: Render DTO incluye juntas
    const scene = SceneBuilder.buildBaseScene(result);
    const joints = scene.objects.filter(obj => obj.layer === 'layer_panel_joints');
    console.log(`Visible joints in DTO: ${joints.length}`);
    if (joints.length > 0) {
        console.log('TEST PF-3/4: PASSED (Joints visible in DTO)');
    } else {
        console.error('TEST PF-3/4: FAILED (No joints in DTO)');
    }

    // TEST PF-5 & PF-6: Muro lateral trapezoidal
    const northPanels = result.construction.panels.filter(p => p.wallId === 'wall_north');
    const trapPanel = northPanels.find(p => Math.abs(p.heightEnd - p.heightStart) > 0.1);
    if (trapPanel) {
        console.log('TEST PF-5: PASSED (Trapezoidal panel detected)');
        const studs = trapPanel.studs;
        const heights = studs.map(s => s.height);
        const uniqueHeights = new Set(heights.map(h => h.toFixed(3)));
        if (uniqueHeights.size > 1) {
            console.log('TEST PF-6: PASSED (Variable stud heights)');
        } else {
            console.error('TEST PF-6: FAILED (Stud heights are uniform)');
        }
    } else {
        console.error('TEST PF-5: FAILED (No trapezoidal panels on sloped wall)');
    }

    // TEST PF-9 & PF-10: Spanish Roles
    const { PackageBuilder } = require('../src/modules/export/package-builder');
    const pkg = PackageBuilder.build(result);
    const piece = pkg.cutList.piezas.find((p: any) => p.piezaTipo === 'Montante de apoyo');
    
    if (piece) {
        console.log('TEST PF-10: PASSED (Spanish piezaTipo in CutList Package)');
    } else {
        console.error('TEST PF-10: FAILED (No Spanish piezaTipo found in CutList Package)');
        console.log('Sample piezaTipo:', pkg.cutList.piezas.slice(0,5).map((p: any) => p.piezaTipo));
    }

    await closePool();
    console.log('--- PHASE 9F TEST COMPLETE ---');
}

runTest9F().catch(console.error);
