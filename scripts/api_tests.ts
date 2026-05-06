import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function runTests() {
    console.log('--- RUNNING API INTEGRATION TESTS (PHASE 7) ---');
    
    try {
        // TEST 111: Health Check
        const health = await axios.get(`${API_URL}/health`);
        console.log(`TEST 111: ${health.data.status === 'ok' ? 'PASSED' : 'FAILED'} (Health check)`);

        const testId = 'test_api_' + Date.now();
        const testProject = {
            id: testId,
            nombre: 'Proyecto Test API',
            cliente: 'Cliente Test',
            estado: 'borrador',
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            versionActual: 'v1',
            historialVersiones: [
                { id: 'v1', fecha: new Date().toISOString(), configuracion: {}, nota: 'Initial' }
            ]
        };

        // TEST 112: POST /api/proyectos
        const create = await axios.post(`${API_URL}/proyectos`, testProject);
        console.log(`TEST 112: ${create.status === 201 ? 'PASSED' : 'FAILED'} (Crear proyecto)`);

        // TEST 113: GET /api/proyectos
        const list = await axios.get(`${API_URL}/proyectos`);
        const found = list.data.some((p: any) => p.id === testId);
        console.log(`TEST 113: ${found ? 'PASSED' : 'FAILED'} (Listar proyectos)`);

        // TEST 114: GET /api/proyectos/:id
        const detail = await axios.get(`${API_URL}/proyectos/${testId}`);
        console.log(`TEST 114: ${detail.data.nombre === testProject.nombre ? 'PASSED' : 'FAILED'} (Detalle proyecto)`);

        // TEST 115: PUT /api/proyectos/:id
        testProject.nombre = 'Proyecto Editado';
        const update = await axios.put(`${API_URL}/proyectos/${testId}`, testProject);
        console.log(`TEST 115: ${update.data.nombre === 'Proyecto Editado' ? 'PASSED' : 'FAILED'} (Actualizar proyecto)`);

        // TEST 116: POST /api/proyectos/:id/versiones
        const newVersion = { id: 'v2', fecha: new Date().toISOString(), configuracion: {}, nota: 'v2 test' };
        const versionRes = await axios.post(`${API_URL}/proyectos/${testId}/versiones`, newVersion);
        console.log(`TEST 116: ${versionRes.status === 201 ? 'PASSED' : 'FAILED'} (Crear versión)`);

        // Cleanup
        await axios.delete(`${API_URL}/proyectos/${testId}`);
        console.log('--- API TESTS COMPLETE ---');

    } catch (e: any) {
        console.error('--- API TESTS FAILED ---');
        if (e.response) {
            console.error('Response Error:', e.response.status, e.response.data);
        } else {
            console.error('Error:', e.message);
        }
        process.exit(1);
    }
}

runTests();
