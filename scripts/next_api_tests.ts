import axios from 'axios';

const NEXT_API_BASE = 'http://localhost:3002/api';

console.log('--- RUNNING FASE 9C NEXT.JS API UNIFICATION TESTS ---');

async function runTests() {
  const results = {
    158: false, 159: false, 160: false, 161: false, 162: false,
    163: false, 164: false, 165: false, 166: false, 167: false
  };

  try {
    // TEST 158: Next API health
    const health = await axios.get(`${NEXT_API_BASE}/health`);
    results[158] = health.data.status === 'ok';
    console.log(`TEST 158: ${results[158] ? 'PASSED' : 'FAILED'} (Next API health)`);

    // TEST 159: Next API lista proyectos
    const list = await axios.get(`${NEXT_API_BASE}/proyectos`);
    results[159] = Array.isArray(list.data);
    console.log(`TEST 159: ${results[159] ? 'PASSED' : 'FAILED'} (Next API lista proyectos)`);

    // TEST 160: Next API crea proyecto
    const testId = `test_next_api_${Date.now()}`;
    const newProj = await axios.post(`${NEXT_API_BASE}/proyectos`, {
      id: testId,
      nombre: 'Proyecto Test Next API',
      cliente: 'Cliente Test',
      estado: 'borrador',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      versionActual: 'v1',
      historialVersiones: []
    });
    results[160] = newProj.status === 201 && newProj.data.id === testId;
    console.log(`TEST 160: ${results[160] ? 'PASSED' : 'FAILED'} (Next API crea proyecto)`);

    // TEST 161: Next API obtiene detalle
    const detail = await axios.get(`${NEXT_API_BASE}/proyectos/${testId}`);
    results[161] = detail.data.id === testId;
    console.log(`TEST 161: ${results[161] ? 'PASSED' : 'FAILED'} (Next API obtiene detalle)`);

    // TEST 162: Next API actualiza proyecto
    const update = await axios.put(`${NEXT_API_BASE}/proyectos/${testId}`, {
      ...detail.data,
      nombre: 'Nombre Actualizado'
    });
    results[162] = update.data.nombre === 'Nombre Actualizado';
    console.log(`TEST 162: ${results[162] ? 'PASSED' : 'FAILED'} (Next API actualiza proyecto)`);

    // TEST 164: Next API crea versión
    const version = await axios.post(`${NEXT_API_BASE}/proyectos/${testId}/versiones`, {
      id: 'v2',
      fecha: new Date().toISOString(),
      nota: 'Versión test',
      configuracion: {}
    });
    results[164] = version.status === 201 && version.data.id === 'v2';
    console.log(`TEST 164: ${results[164] ? 'PASSED' : 'FAILED'} (Next API crea versión)`);

    // TEST 165: Next API regenerar devuelve placeholder
    const regen = await axios.post(`${NEXT_API_BASE}/proyectos/${testId}/regenerar`);
    results[165] = regen.data.status === 'pendiente';
    console.log(`TEST 165: ${results[165] ? 'PASSED' : 'FAILED'} (Next API regenerar devuelve placeholder)`);

    // TEST 166: Next API exporta planos
    const exportRes = await axios.post(`${NEXT_API_BASE}/proyectos/${testId}/planos/exportar`);
    results[166] = exportRes.data.ok === true && !!exportRes.data.pdf;
    console.log(`TEST 166: ${results[166] ? 'PASSED' : 'FAILED'} (Next API exporta planos)`);

    // TEST 163: Next API elimina proyecto
    const del = await axios.delete(`${NEXT_API_BASE}/proyectos/${testId}`);
    results[163] = del.status === 204;
    console.log(`TEST 163: ${results[163] ? 'PASSED' : 'FAILED'} (Next API elimina proyecto)`);

    // TEST 167: api.ts no contiene localhost:3001
    const fs = require('fs');
    const path = require('path');
    const apiClient = fs.readFileSync(path.join(process.cwd(), 'apps/product-ui/src/lib/api.ts'), 'utf-8');
    results[167] = !apiClient.includes('localhost:3001');
    console.log(`TEST 167: ${results[167] ? 'PASSED' : 'FAILED'} (api.ts no apunta a localhost:3001)`);

  } catch (error: any) {
    console.error('ERROR EN TESTS:', error.message);
    if (error.response) console.error('Response:', error.response.status, error.response.data);
  }

  const allPassed = Object.values(results).every(v => v);
  console.log(`--- NEXT API TESTS ${allPassed ? 'PASSED' : 'FAILED'} ---`);
}

runTests();
