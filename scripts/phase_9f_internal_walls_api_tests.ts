import axios from 'axios';

async function testInternalWallsAPI() {
    const projectId = 'test_9e_1778102309619';
    const baseUrl = 'http://localhost:3002/api'; // Based on typical dev port
    console.log(`--- TESTING INTERNAL WALLS API for ${projectId} ---`);

    // 1. Test Valid Creation
    try {
        console.log('1. Creating valid internal wall...');
        const res = await axios.post(`${baseUrl}/proyectos/${projectId}/internal-walls`, {
            startX: 1.0,
            startZ: 1.0,
            endX: 4.0,
            endZ: 1.0,
            height: 2.6,
            thickness: 0.1
        });
        
        if (res.data.ok) {
            console.log('   - OK: Wall created and scene regenerated');
            console.log('   - Wall ID:', res.data.wall.id);
        } else {
            console.error('   - FAIL:', res.data.error || res.data.message);
        }
    } catch (error: any) {
        console.error('   - ERROR:', error.response?.data || error.message);
    }

    // 2. Test Invalid Payload (Short wall)
    try {
        console.log('\n2. Creating invalid (too short) internal wall...');
        const res = await axios.post(`${baseUrl}/proyectos/${projectId}/internal-walls`, {
            startX: 1.0,
            startZ: 1.0,
            endX: 1.1,
            endZ: 1.1,
            height: 2.6,
            thickness: 0.1
        });
        
        if (!res.data.ok) {
            console.log('   - OK: Correctly rejected short wall');
            console.log('   - Message:', res.data.error || res.data.message);
        } else {
            console.error('   - FAIL: Short wall should have been rejected');
        }
    } catch (error: any) {
        // Axios might throw if status is not 2xx
        console.log('   - OK (Exception):', error.response?.data?.error || error.message);
    }

    // 3. Test Invalid Payload (NaN)
    try {
        console.log('\n3. Creating invalid (NaN) internal wall...');
        const res = await axios.post(`${baseUrl}/proyectos/${projectId}/internal-walls`, {
            startX: "invalid",
            startZ: 1.0,
            endX: 4.0,
            endZ: 1.0
        });
        
        if (!res.data.ok) {
            console.log('   - OK: Correctly rejected invalid coordinates');
        } else {
            console.error('   - FAIL: Invalid coordinates should have been rejected');
        }
    } catch (error: any) {
        console.log('   - OK (Exception):', error.response?.data?.error || error.message);
    }

    console.log('\n--- API TESTS COMPLETED ---');
}

testInternalWallsAPI();
