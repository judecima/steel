import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:3002/api';

async function runTests() {
  console.log('--- RUNNING REAL EXPORT TESTS (9D.1) ---');

  const projId = 'test_proj_real_exports_' + Date.now();
  
  try {
    // 1. Crear proyecto de prueba
    console.log('[STEP] Creating test project...');
    const versionId = 'v1_' + Date.now();
    await axios.post(`${API_BASE}/proyectos`, {
      id: projId,
      nombre: 'Test Real Exports',
      cliente: 'QA Bot',
      versionActual: versionId,
      estado: 'borrador',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      historialVersiones: [
        {
          id: versionId,
          numero: 1,
          fecha: new Date().toISOString(),
          resultadoMotor: {
            house: { 
              muros: [
                { id: 'wall_1', start: { x: 0, y: 0 }, end: { x: 4, y: 0 } }
              ] 
            },
            construction: { panels: [
              { id: 'PANEL_1', wallId: 'wall_1', studs: [{ role: 'stud', height: 2.4 }, { role: 'stud', height: 2.4 }] },
              { id: 'PANEL_2', wallId: 'wall_1', studs: [{ role: 'stud', height: 2.4 }, { role: 'stud', height: 2.4 }] },
              { id: 'PANEL_3', wallId: 'wall_1', studs: [{ role: 'stud', height: 2.4 }, { role: 'stud', height: 2.4 }] },
              { id: 'PANEL_4', wallId: 'wall_1', studs: [{ role: 'stud', height: 2.4 }, { role: 'stud', height: 2.4 }] },
              { id: 'PANEL_5', wallId: 'wall_1', studs: [{ role: 'stud', height: 2.4 }, { role: 'stud', height: 2.4 }] }
            ] },
            bom: {
              items: [],
              cutList: [
                { sourceEntityId: 'PANEL_1', profileType: 'PGC100', length: 2.4, quantity: 2, thickness: 0.9, role: 'common' },
                { sourceEntityId: 'PANEL_2', profileType: 'PGC100', length: 2.4, quantity: 2, thickness: 0.9, role: 'common' },
                { sourceEntityId: 'PANEL_3', profileType: 'PGC100', length: 2.4, quantity: 2, thickness: 0.9, role: 'common' },
                { sourceEntityId: 'PANEL_4', profileType: 'PGC100', length: 2.4, quantity: 2, thickness: 0.9, role: 'common' },
                { sourceEntityId: 'PANEL_5', profileType: 'PGC100', length: 2.4, quantity: 2, thickness: 0.9, role: 'common' }
              ],
              aggregated: [
                { profileType: 'PGC100', totalLinearMeters: 24.0, totalCount: 10 }
              ]
            },
            warnings: []
          }
        }
      ]
    });

    // TEST E1: POST /api/proyectos/:id/exportaciones/generar crea archivos
    console.log('[STEP] Generating all exports...');
    const genRes = await axios.post(`${API_BASE}/proyectos/${projId}/exportaciones/generar`);
    console.log('Gen response:', genRes.data);
    console.log(`TEST E1: ${genRes.data.ok ? 'PASSED' : 'FAILED'} (POST generar OK)`);

    // Test E8 helper: ensure PDF size > 5KB
    if (genRes.data.technicalPdfSize < 5120) {
      console.log(`[WARNING] PDF size is small: ${genRes.data.technicalPdfSize} bytes`);
    }

    // TEST E9: GET /api/exports lista estado real
    const listRes = await axios.get(`${API_BASE}/exports`);
    console.log(`TEST E9: ${Array.isArray(listRes.data) && listRes.data.length > 0 ? 'PASSED' : 'FAILED'} (GET /api/exports OK)`);

    const checkFile = (filename: string) => {
      const f = listRes.data.find((x: any) => x.filename === filename);
      return f && f.exists && f.sizeBytes > 0;
    };

    // TEST E2-E6: Existencia de archivos base
    console.log(`TEST E2: ${checkFile('BOM.csv') ? 'PASSED' : 'FAILED'} (BOM.csv existe)`);
    console.log(`TEST E3: ${checkFile('CUTLIST.csv') ? 'PASSED' : 'FAILED'} (CUTLIST.csv existe)`);
    console.log(`TEST E4: ${checkFile('Proyecto.json') ? 'PASSED' : 'FAILED'} (Proyecto.json existe)`);
    console.log(`TEST E5: ${checkFile('Montaje.txt') ? 'PASSED' : 'FAILED'} (Montaje.txt existe)`);
    console.log(`TEST E6: ${checkFile('reporte.tsv') ? 'PASSED' : 'FAILED'} (reporte.tsv existe)`);
    console.log(`TEST E7: ${checkFile('planos-package.json') ? 'PASSED' : 'FAILED'} (planos-package.json existe)`);

    // TEST E10-E11: Tipos MIME
    const bomFetch = await axios.get(`${API_BASE}/exports/BOM.csv`);
    console.log(`TEST E10: ${bomFetch.headers['content-type'].includes('text/csv') ? 'PASSED' : 'FAILED'} (MIME BOM: ${bomFetch.headers['content-type']})`);

    const pdfFetch = await axios.get(`${API_BASE}/exports/planos-tecnicos.pdf`, { responseType: 'arraybuffer' });
    console.log(`TEST E11: ${pdfFetch.headers['content-type'] === 'application/pdf' ? 'PASSED' : 'FAILED'} (MIME PDF: ${pdfFetch.headers['content-type']})`);

    // TEST E8: PDF size > 5KB
    const pdfSize = pdfFetch.data.byteLength;
    console.log(`TEST E8: ${pdfSize > 5120 ? 'PASSED' : 'FAILED'} (PDF size: ${pdfSize} bytes)`);

    // TEST E12: 404 JSON
    try {
      await axios.get(`${API_BASE}/exports/non-existent.file`);
    } catch (e: any) {
      const isJson = e.response?.headers['content-type'].includes('application/json');
      console.log(`TEST E12: ${isJson && e.response?.status === 404 ? 'PASSED' : 'FAILED'} (404 is JSON)`);
    }

  } catch (error: any) {
    console.error('Error en tests reales de exportación:', error.message);
    if (error.response) console.error('Data:', error.response.data);
  }

  console.log('--- REAL EXPORT TESTS COMPLETE ---');
}

runTests();
