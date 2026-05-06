import { generateGeometry } from '../src/modules/geometry/engine';
import { panelizeHouse } from '../src/modules/construction/engine';
import { GlobalArbiter } from '../src/modules/global-planning/global-arbiter';
import { ENGINE_CONFIG } from '../src/core/config';
import { calculateBOM } from '../src/modules/materials/engine';
import { ProjectResult } from '../src/core/types';
import { PackageBuilder } from '../src/modules/export/package-builder';
import { CSVExporter } from '../src/modules/export/exporters/export-csv';
import { JSONExporter } from '../src/modules/export/exporters/export-json';
import { ExcelExporter } from '../src/modules/export/exporters/export-excel';
import { PDFExporter } from '../src/modules/export/exporters/export-pdf';
import { generateCandidates } from '../src/modules/intelligence/candidate-generator';
import { validateCandidate } from '../src/modules/intelligence/candidate-validator';

declare var require: any;
const fs = require('fs');
const path = require('path');

function getProject(): ProjectResult {
    const input = { 
        width: 4.0, length: 4.0, minHeight: 2.6, 
        roofType: 'one_slope' as const, roofSlope: 0,
        openings: [
            { wallId: 'wall_north', type: 'ventana' as const, width: 1.2, height: 1.0, position: 1.0, sillHeight: 1.0 },
            { wallId: 'wall_south', type: 'puerta' as const, width: 0.9, height: 2.1, position: 1.5, sillHeight: 0 }
        ]
    };
    const house = generateGeometry(input);
    const localMap = new Map();
    
    house.muros.forEach(m => {
        const cands = generateCandidates(m.id, m.length, m.aberturas);
        cands.forEach(c => validateCandidate(c, m.length, m.aberturas));
        localMap.set(m.id, cands.filter(c => c.valid));
    });

    const { winner, telemetry } = GlobalArbiter.planHouse(house, localMap, ENGINE_CONFIG.planning);
    const result = panelizeHouse(house, winner, telemetry);
    
    return {
        input, house, construction: result,
        bom: calculateBOM(result.panels),
        logs: [], status: 'constructive_precheck_passed', assumptions: [], warnings: []
    };
}

function runIndustrialExport() {
    console.log("=== GENERANDO EXPORTACIONES INDUSTRIALES PARA EL VISOR ===");
    const project = getProject();
    const pkg = PackageBuilder.build(project);
    
    const exportDir = path.join(process.cwd(), 'tools', 'qa-viewer', 'exports');
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    fs.writeFileSync(path.join(exportDir, 'bom.csv'), CSVExporter.toCSV(pkg.bom.items));
    fs.writeFileSync(path.join(exportDir, 'cutlist.csv'), CSVExporter.toCSV(pkg.cutList.piezas));
    fs.writeFileSync(path.join(exportDir, 'proyecto_industrial.json'), JSONExporter.toJSON(pkg));
    
    const excelTsv = ExcelExporter.generateSpreadsheet({ 
        'BOM': pkg.bom.items,
        'Lista de Corte': pkg.cutList.piezas
    });
    fs.writeFileSync(path.join(exportDir, 'reporte.tsv'), excelTsv);
    
    const pdfDoc = PDFExporter.generateProductionDoc('Resumen de Montaje', pkg.montaje);
    fs.writeFileSync(path.join(exportDir, 'montaje.txt'), pdfDoc);

    console.log(`✅ Archivos exportados a: ${exportDir}`);
}

runIndustrialExport();
