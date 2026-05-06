import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../../../../src/modules/product/storage/postgres-storage-adapter';
import { getPool } from '../../../../../../../../../src/modules/product/storage/db-config';
import { PlanoPackageBuilder } from '../../../../../../../../../src/modules/planos/plano-package-builder';
import { PdfExporter } from '../../../../../../../../../src/modules/planos/pdf-exporter';
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

    // Generar paquete
    const pkg = await PlanoPackageBuilder.build(project);
    
    // Exportar JSON
    const exportDir = path.join(process.cwd(), '../../tools/qa-viewer/exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
    
    const jsonPath = path.join(exportDir, 'planos-package.json');
    fs.writeFileSync(jsonPath, JSON.stringify(pkg, null, 2));

    // Exportar PDF
    const pdfBytes = await PdfExporter.export(pkg);
    const pdfPath = path.join(exportDir, 'planos-tecnicos.pdf');
    fs.writeFileSync(pdfPath, pdfBytes);

    // Registrar en historial
    const pool = getPool();
    await pool.query(
      `INSERT INTO exportaciones (proyecto_id, tipo, ruta_archivo, metadata_json, fecha_creacion)
       VALUES ($1, $2, $3, $4, NOW())`,
      [params.id, 'planos_tecnicos_pdf', '/api/exports/planos-tecnicos.pdf', JSON.stringify({ 
        sheets: pkg.hojas.length,
        version: project.versionActual,
        jsonPath: '/api/exports/planos-package.json'
      })]
    );

    return NextResponse.json({
      ok: true,
      files: {
        pdf: '/api/exports/planos-tecnicos.pdf',
        json: '/api/exports/planos-package.json'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
