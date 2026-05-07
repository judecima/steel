import axios from 'axios';

async function testViewerInteractionFixes() {
    const projectId = 'test_9e_1778102309619';
    const baseUrl = 'http://localhost:3002/api';
    console.log(`--- TESTING VIEWER INTERACTION FIXES for ${projectId} ---`);

    // 1. Test Wall ID Normalization (Simulate Viewer sending "Muro Este")
    try {
        console.log('1. Creating opening with "Muro Este" (should be normalized to wall_east)...');
        const res = await axios.post(`${baseUrl}/proyectos/${projectId}/aberturas`, {
            wallId: 'Muro Este',
            tipo: 'ventana',
            ancho: 1.2,
            alto: 1.0,
            posicion: 2.0,
            antepecho: 0.9
        });
        
        if (res.data.ok) {
            console.log('   - OK: Opening created and normalized');
            console.log('   - Canonical Wall ID in response:', res.data.opening.wallId);
            
            if (res.data.opening.wallId === 'wall_east') {
                console.log('   - VERIFIED: "Muro Este" -> "wall_east"');
            } else {
                console.error('   - FAIL: Normalization failed, got:', res.data.opening.wallId);
            }
        } else {
            console.error('   - FAIL:', res.data.message);
        }
    } catch (error: any) {
        console.error('   - ERROR:', error.response?.data || error.message);
    }

    // 2. Test Invalid Wall ID rejection
    try {
        console.log('\n2. Creating opening with invalid Wall ID...');
        const res = await axios.post(`${baseUrl}/proyectos/${projectId}/aberturas`, {
            wallId: 'Muro Fantasma',
            tipo: 'ventana',
            ancho: 1.2,
            alto: 1.0,
            posicion: 2.0
        });
        
        if (!res.data.ok && res.data.code === 'INVALID_WALL_ID') {
            console.log('   - OK: Correctly rejected invalid Wall ID');
            console.log('   - Message:', res.data.message);
        } else {
            console.error('   - FAIL: Invalid Wall ID should have been rejected with code INVALID_WALL_ID');
        }
    } catch (error: any) {
        console.log('   - OK (Exception):', error.response?.data || error.message);
    }

    // 3. Test Structural Regeneration (Verify that EngineFacade doesn't crash)
    try {
        console.log('\n3. Verifying structural regeneration with canonical wallId...');
        const res = await axios.post(`${baseUrl}/proyectos/${projectId}/aberturas`, {
            wallId: 'wall_north',
            tipo: 'puerta',
            ancho: 0.9,
            alto: 2.0,
            posicion: 1.0
        });
        
        if (res.data.ok && res.data.renderScene) {
            console.log('   - OK: Scene regenerated successfully');
            const metadata = res.data.renderScene.construction?.metadata || {};
            const northOpenings = metadata.openingFrames?.filter((f: any) => f.wallId === 'wall_north' || f.openingId.includes('op'));
            console.log(`   - Total opening frames generated: ${metadata.openingFrames?.length || 0}`);
        } else {
            console.error('   - FAIL:', res.data.error || res.data.message);
        }
    } catch (error: any) {
        console.error('   - ERROR:', error.response?.data || error.message);
    }

    console.log('\n--- INTERACTION TESTS COMPLETED ---');
}

testViewerInteractionFixes();
