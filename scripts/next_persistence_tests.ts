import axios from 'axios';

const API_BASE = 'http://localhost:3002/api';

async function runTests() {
  console.log('--- RUNNING PHASE 9D PERSISTENCE TESTS ---');

  const projId = 'test_proj_persistence_' + Date.now();
  
  try {
    // Asegurar salud inicial (trigger migrations)
    await axios.get(`${API_BASE}/health`);

    // Asegurar que el proyecto existe
    await axios.post(`${API_BASE}/proyectos`, {
      id: projId,
      nombre: 'Test Persistence',
      cliente: 'QA Bot',
      versionActual: 'v1',
      estado: 'borrador',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    }).catch(e => {}); 

    // TEST 178: GET producción devuelve estructura inicial
    console.log('[STEP] Checking production...');
    const prodRes = await axios.get(`${API_BASE}/proyectos/${projId}/produccion`);
    console.log(`TEST 178: ${prodRes.data.estado_global === 'pendiente' ? 'PASSED' : 'FAILED'} (Estructura inicial OK)`);

    // TEST 179: PUT producción persiste estados por panel
    console.log('[STEP] Saving production state...');
    const testPanels = [
      { panel_id: 'P01', estado: 'fabricado' },
      { panel_id: 'P02', estado: 'fabricacion' }
    ];
    await axios.put(`${API_BASE}/proyectos/${projId}/produccion`, {
      estado_global: 'en_progreso',
      avance_porcentaje: 40,
      paneles: testPanels
    });
    console.log('TEST 179: PASSED (PUT producción OK)');

    // TEST 180: Recargar producción mantiene cambios
    const prodRes2 = await axios.get(`${API_BASE}/proyectos/${projId}/produccion`);
    const isSaved = prodRes2.data.avance_porcentaje == 40 && prodRes2.data.paneles.length >= 2;
    console.log(`TEST 180: ${isSaved ? 'PASSED' : 'FAILED'} (Persistencia de producción OK)`);

    // TEST 181: GET catálogo costos devuelve lista
    console.log('[STEP] Checking catalog...');
    const catRes = await axios.get(`${API_BASE}/costos/catalogo`);
    console.log(`TEST 181: ${Array.isArray(catRes.data) ? 'PASSED' : 'FAILED'} (Catálogo devuelto)`);

    // TEST 182: PUT catálogo costos persiste precios
    console.log('[STEP] Updating catalog...');
    const testCatalog = [
      { codigo: 'perf_test', descripcion: 'Test PGC', unidad: 'ml', precio_unitario: 99.9, moneda: 'USD' }
    ];
    await axios.put(`${API_BASE}/costos/catalogo`, testCatalog);
    const catRes2 = await axios.get(`${API_BASE}/costos/catalogo`);
    const itemSaved = catRes2.data.find((i: any) => i.codigo === 'perf_test');
    console.log(`TEST 182: ${itemSaved && itemSaved.precio_unitario == 99.9 ? 'PASSED' : 'FAILED'} (Persistencia de catálogo OK)`);

    // TEST 184: POST presupuesto guarda snapshot
    console.log('[STEP] Saving budget snapshot...');
    const budgetPayload = {
      items_json: [{ id: 'perf_test', quantity: 10, subtotal: 999 }],
      total: 999,
      moneda: 'USD',
      estado: 'confirmado'
    };
    const budgetRes = await axios.post(`${API_BASE}/proyectos/${projId}/presupuesto`, budgetPayload);
    console.log(`TEST 184: ${budgetRes.data.total == 999 ? 'PASSED' : 'FAILED'} (Snaphost de presupuesto OK)`);

    // TEST 185: GET presupuesto devuelve último snapshot
    const budgetRes2 = await axios.get(`${API_BASE}/proyectos/${projId}/presupuesto`);
    console.log(`TEST 185: ${budgetRes2.data && budgetRes2.data.total == 999 ? 'PASSED' : 'FAILED'} (Lectura de snapshot OK)`);

    // TEST 186: POST planos registra exportación
    console.log('[STEP] Triggering export with history...');
    await axios.post(`${API_BASE}/proyectos/${projId}/planos/exportar`);
    console.log('TEST 186: PASSED (Export registrado)');

    // TEST 187: GET exportaciones devuelve historial
    const historyRes = await axios.get(`${API_BASE}/proyectos/${projId}/exportaciones`);
    const hasHistory = historyRes.data.some((h: any) => h.tipo === 'planos_tecnicos_pdf');
    console.log(`TEST 187: ${hasHistory ? 'PASSED' : 'FAILED'} (Historial de exportaciones OK)`);

  } catch (error: any) {
    console.error('Error en tests de persistencia:', error.message);
    if (error.response) console.error('Data:', error.response.data);
  }

  console.log('--- PHASE 9D PERSISTENCE TESTS COMPLETE ---');
}

runTests();
