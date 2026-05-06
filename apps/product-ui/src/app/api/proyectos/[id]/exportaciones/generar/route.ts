import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../../../../src/modules/product/storage/postgres-storage-adapter';
import { PackageBuilder } from '../../../../../../../../../src/modules/export/package-builder';
import { CSVExporter } from '../../../../../../../../../src/modules/export/exporters/export-csv';
import { JSONExporter } from '../../../../../../../../../src/modules/export/exporters/export-json';
import { ExcelExporter } from '../../../../../../../../../src/modules/export/exporters/export-excel';
import { PDFExporter } from '../../../../../../../../../src/modules/export/exporters/export-pdf';
import { PlanoPackageBuilder } from '../../../../../../../../../src/modules/planos/plano-package-builder';
import { PdfExporter as TechnicalPdfExporter } from '../../../../../../../../../src/modules/planos/pdf-exporter';
import { getPool } from '../../../../../../../../../src/modules/product/storage/db-config';
import * as fs from 'fs';
import * as path from 'path';

const storage = new PostgresStorageAdapter();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await storage.getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // 1. Obtener resultado del motor de la versión actual
    const version = project.historialVersiones?.find(v => v.id === project.versionActual) 
                 || project.historialVersiones?.[0];
    
    const projectResult = version?.resultadoMotor;
    console.log(`[GEN] Proj: ${project.id}, vActual: ${project.versionActual}, vFound: ${version?.id}, hasResult: ${!!projectResult}`);
    
    // Preparar directorio de exportación
    const exportDir = path.join(process.cwd(), '../../tools/qa-viewer/exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    // --- GENERACIÓN DE ARCHIVOS INDUSTRIALES ---
    
    if (projectResult) {
      const pkg = PackageBuilder.build(projectResult);
      
      // BOM.csv
      fs.writeFileSync(path.join(exportDir, 'BOM.csv'), CSVExporter.toCSV(pkg.bom.items));
      
      // CUTLIST.csv
      fs.writeFileSync(path.join(exportDir, 'CUTLIST.csv'), CSVExporter.toCSV(pkg.cutList.piezas));
      
      // Proyecto.json
      fs.writeFileSync(path.join(exportDir, 'Proyecto.json'), JSONExporter.toJSON(pkg));
      
      // reporte.tsv (Excel-like)
      const excelTsv = ExcelExporter.generateSpreadsheet({ 
          'BOM': pkg.bom.items,
          'Lista de Corte': pkg.cutList.piezas
      });
      fs.writeFileSync(path.join(exportDir, 'reporte.tsv'), excelTsv);
      
      // Montaje.txt
      // Nota: PDFExporter.generateProductionDoc devuelve un buffer que parece ser tratado como texto en el script original
      const montageContent = PDFExporter.generateProductionDoc('Resumen de Montaje', pkg.montaje);
      fs.writeFileSync(path.join(exportDir, 'Montaje.txt'), montageContent);
    } else {
      // Si no hay datos, crear placeholders con headers para evitar 404
      fs.writeFileSync(path.join(exportDir, 'BOM.csv'), "Código,Descripción,Cantidad,Unidad\n# No hay datos. Regenerar proyecto.");
      fs.writeFileSync(path.join(exportDir, 'CUTLIST.csv'), "Panel,Pieza,Largo,Tipo\n# No hay datos. Regenerar proyecto.");
      fs.writeFileSync(path.join(exportDir, 'Proyecto.json'), JSON.stringify({ error: "No hay datos de motor" }));
      fs.writeFileSync(path.join(exportDir, 'reporte.tsv'), "BOM\nCódigo\tDescripción\n# Sin datos");
      fs.writeFileSync(path.join(exportDir, 'Montaje.txt'), "No hay instrucciones de montaje disponibles. Regenerar proyecto.");
    }

    // --- GENERACIÓN DE PLANOS TÉCNICOS ---
    
    let technicalPdfSize = 0;
    let technicalPkg: any = null;
    try {
      technicalPkg = await PlanoPackageBuilder.build(project);
      
      // planos-package.json
      fs.writeFileSync(path.join(exportDir, 'planos-package.json'), JSON.stringify(technicalPkg, null, 2));

      // planos-tecnicos.pdf
      const pdfBytes = await TechnicalPdfExporter.export(technicalPkg);
      fs.writeFileSync(path.join(exportDir, 'planos-tecnicos.pdf'), pdfBytes);
      technicalPdfSize = pdfBytes.length;
    } catch (e: any) {
      console.error("Error generando planos técnicos:", e.message);
      // No fallar toda la exportación si solo los planos fallan, pero no crear el archivo si no es válido
    }

    // Registrar en historial de exportaciones
    const pool = getPool();
    await pool.query(
      `INSERT INTO exportaciones (proyecto_id, tipo, ruta_archivo, metadata_json, fecha_creacion)
       VALUES ($1, $2, $3, $4, NOW())`,
      [params.id, 'paquete_completo', '/api/exports/paquete-completo.zip', JSON.stringify({ 
        files: ['BOM.csv', 'CUTLIST.csv', 'Proyecto.json', 'Montaje.txt', 'reporte.tsv', 'planos-tecnicos.pdf'],
        pdfSize: technicalPdfSize
      })]
    );

    return NextResponse.json({
      ok: true,
      message: "Paquete de exportación generado correctamente",
      fileCounts: {
        panels: projectResult?.construction?.panels?.length || 0,
        sheets: technicalPkg?.hojas?.length || 0
      },
      technicalPdfSize
    });

  } catch (error: any) {
    console.error("Error en generación de exportaciones:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
