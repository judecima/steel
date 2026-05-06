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
import { withTimeout } from '@/lib/server/withTimeout';
import * as fs from 'fs';
import * as path from 'path';

const storage = new PostgresStorageAdapter();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pool = getPool();
  try {
    return await withTimeout(
      (async () => {
        const project = await storage.getProject(params.id);
        if (!project) {
          return NextResponse.json({ 
            ok: false, 
            code: 'PROJECT_NOT_FOUND', 
            message: 'Proyecto no encontrado' 
          }, { status: 404 });
        }

        // 1. Obtener resultado del motor de la versión actual
        const version = project.historialVersiones?.find(v => v.id === project.versionActual) 
                     || project.historialVersiones?.[0];
        
        const projectResult = version?.resultadoMotor;
        
        if (!projectResult) {
          return NextResponse.json({
            ok: false,
            code: 'PROJECT_NOT_GENERATED',
            message: 'Debe generar el proyecto antes de exportar.'
          });
        }

        // Preparar directorio de exportación por proyecto
        const exportBaseDir = path.join(process.cwd(), '../../tools/qa-viewer/exports');
        const exportDir = path.join(exportBaseDir, params.id);
        if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

        // --- GENERACIÓN DE ARCHIVOS INDUSTRIALES ---
        const pkg = PackageBuilder.build(projectResult);
        
        // BOM.csv
        fs.writeFileSync(path.join(exportDir, 'BOM.csv'), CSVExporter.toCSV(pkg.bom.items, ['codigo', 'descripcion', 'cantidad', 'unidad', 'muro', 'panel']));
        
        // CUTLIST.csv
        fs.writeFileSync(path.join(exportDir, 'CUTLIST.csv'), CSVExporter.toCSV(pkg.cutList.piezas, ['id', 'perfil', 'longitud', 'cantidad', 'panel', 'muro', 'piezaTipo', 'prioridadFabricacion']));
        
        // Proyecto.json
        fs.writeFileSync(path.join(exportDir, 'Proyecto.json'), JSONExporter.toJSON(pkg));
        
        // reporte.tsv (Excel-like)
        const excelTsv = ExcelExporter.generateSpreadsheet({ 
            'BOM': pkg.bom.items,
            'Lista de Corte': pkg.cutList.piezas
        });
        fs.writeFileSync(path.join(exportDir, 'reporte.tsv'), excelTsv);
        
        // Montaje.txt
        const montageContent = PDFExporter.generateProductionDoc('Resumen de Montaje', pkg.montaje);
        fs.writeFileSync(path.join(exportDir, 'Montaje.txt'), montageContent);

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
          // Registrar error en DB para que la auditoría lo sepa
          await pool.query(
            `INSERT INTO exportaciones (proyecto_id, tipo, ruta_archivo, metadata_json, fecha_creacion)
             VALUES ($1, $2, $3, $4, NOW())`,
            [params.id, 'error_planos', 'none', JSON.stringify({ error: e.message, code: 'PDF_EXPORT_FAILED' })]
          );
          throw e; // Relanzar para manejar en el catch exterior
        }

        // Registrar Éxito
        await pool.query(
          `INSERT INTO exportaciones (proyecto_id, tipo, ruta_archivo, metadata_json, fecha_creacion)
           VALUES ($1, $2, $3, $4, NOW())`,
          [params.id, 'paquete_completo', `/api/exports/${params.id}/paquete-completo.zip`, JSON.stringify({ 
            files: ['BOM.csv', 'CUTLIST.csv', 'Proyecto.json', 'Montaje.txt', 'reporte.tsv', 'planos-tecnicos.pdf'],
            pdfSize: technicalPdfSize,
            status: 'disponible'
          })]
        );

        return NextResponse.json({
          ok: true,
          message: "Paquete de exportación generado correctamente",
          technicalPdfSize
        });
      })(),
      20000,
      'Tiempo agotado generando exportaciones'
    );
  } catch (error: any) {
    console.error("Error en generación de exportaciones:", error);
    
    // Marcar como error en DB para evitar pending infinito
    await pool.query(
        `INSERT INTO exportaciones (proyecto_id, tipo, ruta_archivo, metadata_json, fecha_creacion)
         VALUES ($1, $2, $3, $4, NOW())`,
        [params.id, 'error_generacion', 'none', JSON.stringify({ error: error.message, status: 'error' })]
    );

    return NextResponse.json({ 
        ok: false, 
        code: error.message === 'Tiempo agotado generando exportaciones' ? 'EXPORT_TIMEOUT' : 'EXPORT_FAILED',
        message: error.message,
        status: 'error'
    }, { status: 500 });
  }
}
