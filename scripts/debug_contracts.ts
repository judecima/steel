/**
 * TEST: Phase 9F - Contracts Debug
 * Valida los contratos reales entre Viewer -> API -> Engine -> PDF.
 */

import { normalizeWallId } from '../src/modules/validation/wall-utils';

async function testContracts() {
    console.log('--- AUDITORÍA DE CONTRATOS ---');

    // Contrato 1: wallId
    console.log('\n[CONTRATO_1] wallId Normalization:');
    const inputs = ["Muro Este", "wall_east", "sur", "norte", "Este", "UNKNOWN"];
    inputs.forEach(input => {
        const normalized = normalizeWallId(input);
        console.log(`  "${input}" -> "${normalized}" [${normalized?.startsWith('wall_') ? 'OK' : 'INVALID'}]`);
    });

    // Contrato 2: Unidades y Coordenadas
    console.log('\n[CONTRATO_2] Units & Coordinates (Internal Walls):');
    const samplePayload = {
        startX: 1.5,
        startZ: 2.0,
        endX: 4.5,
        endZ: 2.0
    };
    console.log('  UI Payload (meters):', samplePayload);
    const lengthMm = Math.hypot(samplePayload.endX - samplePayload.startX, samplePayload.endZ - samplePayload.startZ) * 1000;
    console.log('  Engine Input (mm):', lengthMm);

    // Contrato 3: RenderScene Structure
    console.log('\n[CONTRATO_3] RenderScene Structure (Expected vs Real):');
    const mockScene: any = {
        objects: [],
        metadata: { totalWalls: 4 }
    };
    const mockIndustrialScene: any = {
        escenaBase: { objects: [] },
        modoInicial: 'estandar'
    };
    
    console.log('  Legacy Keys:', Object.keys(mockScene));
    console.log('  Industrial Keys:', Object.keys(mockIndustrialScene));

    // Contrato 4: PDF Dimension Entity
    console.log('\n[CONTRATO_4] PDF Dimension Entity (Drift check):');
    const dimLegacy = { value: '3.00', start: { x: 0, y: 0 }, end: { x: 3, y: 0 } };
    const dimDrift = { text: '3.00', points: [{ x: 0, y: 0 }, { x: 3, y: 0 }] };
    
    function checkDim(d: any) {
        const val = d.value ?? d.text ?? 'MISSING';
        const p1 = d.start ?? (d.points?.[0]) ?? 'MISSING';
        return { val, p1 };
    }
    
    console.log('  Legacy Dim:', checkDim(dimLegacy));
    console.log('  Drift Dim:', checkDim(dimDrift));

    console.log('\n--- FIN DE AUDITORÍA DE CONTRATOS ---');
}

testContracts().catch(console.error);
