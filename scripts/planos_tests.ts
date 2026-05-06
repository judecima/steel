import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

console.log('--- RUNNING FASE 8A PLANOS TÉCNICOS TESTS ---');

const EXPORTS_DIR = path.join(process.cwd(), 'tools/qa-viewer/exports');
const PDF_PATH = path.join(EXPORTS_DIR, 'planos-tecnicos.pdf');
const JSON_PATH = path.join(EXPORTS_DIR, 'planos-package.json');

async function runTests() {
    // TRIGGER EXPORT VIA API FIRST
    try {
        const res = await axios.get('http://localhost:3002/api/proyectos');
        const firstProj = res.data[0];
        if (firstProj) {
            console.log(`[INIT] Disparando exportación para proyecto: ${firstProj.id}`);
            const postRes = await axios.post(`http://localhost:3002/api/proyectos/${firstProj.id}/planos/exportar`);
            console.log(`TEST 140: ${postRes.data.ok ? 'PASSED' : 'FAILED'} (API endpoint exporta planos)`);
        } else {
            console.log('TEST 140: SKIPPED (No hay proyectos para probar API)');
        }
    } catch (e: any) {
        console.log('TEST 140: FAILED (Error conectando a la API)');
        if (e.response) {
            console.log('Response Error:', e.response.status, e.response.data);
        } else {
            console.log('Error Message:', e.message);
        }
    }

    // NOW CHECK FILES
    const hasJson = fs.existsSync(JSON_PATH);
    let pkg: any = null;
    if (hasJson) {
        pkg = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
    }
    console.log(`TEST 129: ${pkg && pkg.hojas ? 'PASSED' : 'FAILED'} (PlanosPackageDTO se genera)`);

    const firstSheet = pkg?.hojas[0];
    const tb = firstSheet?.titleBlock;
    const tbValid = tb && tb.proyecto && tb.fecha && tb.disclaimer && tb.disclaimer.includes('Documento preliminar');
    console.log(`TEST 130: ${tbValid ? 'PASSED' : 'FAILED'} (Title block completo con disclaimer)`);

    const hasIndice = pkg?.hojas.some((h: any) => h.id === 'indice');
    console.log(`TEST 131: ${hasIndice ? 'PASSED' : 'FAILED'} (Índice de planos existe)`);

    const hasPortada = pkg?.hojas.some((h: any) => h.id === 'portada');
    console.log(`TEST 132: ${hasPortada ? 'PASSED' : 'FAILED'} (Portada existe)`);

    const hasReplanteo = pkg?.hojas.some((h: any) => h.id === 'replanteo-soleras');
    console.log(`TEST 133: ${hasReplanteo ? 'PASSED' : 'FAILED'} (Replanteo de soleras existe)`);

    const hasDistribucion = pkg?.hojas.some((h: any) => h.id === 'distribucion-paneles');
    console.log(`TEST 134: ${hasDistribucion ? 'PASSED' : 'FAILED'} (Distribución de paneles existe)`);

    const hasPanelSheets = pkg?.hojas.some((h: any) => h.id.startsWith('sheet-panel'));
    console.log(`TEST 135: ${hasPanelSheets ? 'PASSED' : 'FAILED'} (Fichas de panel existen)`);

    const allHaveDisclaimer = pkg?.hojas.every((h: any) => h.titleBlock.disclaimer.includes('preliminar'));
    console.log(`TEST 136: ${allHaveDisclaimer ? 'PASSED' : 'FAILED'} (Todas las hojas tienen disclaimer)`);

    const forbidden = ['STUD', 'TRACK', 'HEADER', 'KING', 'JACK', 'CRIPPLE'];
    const jsonStr = JSON.stringify(pkg).toUpperCase();
    const hasEnglish = forbidden.some(term => {
        return jsonStr.includes(`"${term}"`) || jsonStr.includes(` ${term} `);
    });
    console.log(`TEST 137: ${!hasEnglish ? 'PASSED' : 'FAILED'} (No hay términos en inglés prohibidos)`);

    const hasPdf = fs.existsSync(PDF_PATH);
    console.log(`TEST 138: ${hasPdf ? 'PASSED' : 'FAILED'} (PDF se exporta)`);

    console.log(`TEST 139: ${hasJson ? 'PASSED' : 'FAILED'} (JSON se exporta)`);

    const uiContent = fs.readFileSync(path.join(process.cwd(), 'ui/product/exportaciones.html'), 'utf-8');
    const hasUiButton = uiContent.includes('id="btn-generar-planos"') && uiContent.includes('generarPlanos()');
    console.log(`TEST 141: ${hasUiButton ? 'PASSED' : 'FAILED'} (UI expone botón de generación)`);

    console.log('--- PLANOS TÉCNICOS TESTS COMPLETE ---');
}

runTests();
