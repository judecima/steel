import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const API_BASE = 'http://localhost:3002/api';

async function runTests() {
  console.log('--- RUNNING EXPORT DOWNLOAD TESTS ---');

  const projId = 'test_proj_exports_' + Date.now();
  
  try {
    // Asegurar que el proyecto existe
    await axios.post(`${API_BASE}/proyectos`, {
      id: projId,
      nombre: 'Test Exports',
      cliente: 'QA Bot',
      versionActual: 'v1',
      estado: 'borrador',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    });

    // TEST D1: POST planos export devuelve /api/exports/planos-tecnicos.pdf
    console.log('[STEP] Triggering export...');
    const exportRes = await axios.post(`${API_BASE}/proyectos/${projId}/planos/exportar`);
    const pdfUrl = exportRes.data.files?.pdf;
    console.log(`TEST D1: ${pdfUrl === '/api/exports/planos-tecnicos.pdf' ? 'PASSED' : 'FAILED'} (URL de PDF correcta: ${pdfUrl})`);

    // TEST D2: GET /api/exports/planos-tecnicos.pdf devuelve Content-Type application/pdf
    const pdfFetch = await axios.get(`http://localhost:3002${pdfUrl}`, { responseType: 'arraybuffer' });
    const pdfType = pdfFetch.headers['content-type'];
    console.log(`TEST D2: ${pdfType === 'application/pdf' ? 'PASSED' : 'FAILED'} (Content-Type PDF: ${pdfType})`);

    // TEST D3: GET /api/exports/planos-package.json devuelve Content-Type application/json
    const jsonUrl = exportRes.data.files?.json;
    const jsonFetch = await axios.get(`http://localhost:3002${jsonUrl}`);
    const jsonType = jsonFetch.headers['content-type'];
    console.log(`TEST D3: ${jsonType.includes('application/json') ? 'PASSED' : 'FAILED'} (Content-Type JSON: ${jsonType})`);

    // TEST D4: Content-Disposition contiene attachment y filename correcto
    const disposition = pdfFetch.headers['content-disposition'];
    const isAttachment = disposition.includes('attachment') && disposition.includes('planos-tecnicos.pdf');
    console.log(`TEST D4: ${isAttachment ? 'PASSED' : 'FAILED'} (Content-Disposition: ${disposition})`);

    // TEST D5: No se descarga .html
    const isHtml = pdfType.includes('text/html');
    console.log(`TEST D5: ${!isHtml ? 'PASSED' : 'FAILED'} (No es HTML)`);

    // TEST D6: Path traversal bloqueado
    try {
      await axios.get(`http://localhost:3002/api/exports/..%2f..%2fpackage.json`);
      console.log('TEST D6: FAILED (Path traversal no bloqueado)');
    } catch (e: any) {
      const isBlocked = e.response?.status === 400 || e.response?.status === 403 || e.response?.status === 404;
      console.log(`TEST D6: ${isBlocked ? 'PASSED' : 'FAILED'} (Blocked with status ${e.response?.status})`);
    }

  } catch (error: any) {
    console.error('Error en tests de exportación:', error.message);
    if (error.response) console.error('Data:', error.response.data);
  }

  console.log('--- EXPORT DOWNLOAD TESTS COMPLETE ---');
}

runTests();
