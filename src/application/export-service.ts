import * as fs from 'fs';
import * as path from 'path';
import { PostgresStorageAdapter } from '../modules/product/storage/postgres-storage-adapter';
import { PackageBuilder } from '../modules/export/package-builder';
import { CSVExporter } from '../modules/export/exporters/export-csv';
import { JSONExporter } from '../modules/export/exporters/export-json';
import { ExcelExporter } from '../modules/export/exporters/export-excel';
import { PDFExporter } from '../modules/export/exporters/export-pdf';
import { PlanoPackageBuilder } from '../modules/planos/plano-package-builder';
import { PdfExporter as TechnicalPdfExporter } from '../modules/planos/pdf-exporter';

export class ExportService {
    private storage = new PostgresStorageAdapter();
    
    // Check 4: Ruta estable dentro del área pública de la web app
    private readonly EXPORT_BASE_DIR = path.join(process.cwd(), 'apps/product-ui/public/qa-viewer/exports');

    async generateIndustrialPackage(projectId: string) {
        const project = await this.storage.getProject(projectId);
        if (!project) throw new Error("Proyecto no encontrado");

        const version = project.historialVersiones?.find(v => v.id === project.versionActual) 
                     || project.historialVersiones?.[0];
        
        const projectResult = version?.resultadoMotor;
        if (!projectResult) throw new Error("El proyecto debe ser generado antes de exportar");

        // Preparar directorio
        const exportDir = path.join(this.EXPORT_BASE_DIR, projectId);
        if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

        try {
            const pkg = PackageBuilder.build(projectResult);

            // 1. Generar Archivos CSV e Industriales
            fs.writeFileSync(path.join(exportDir, 'BOM.csv'), CSVExporter.toCSV(pkg.bom.items, ['codigo', 'descripcion', 'cantidad', 'unidad', 'muro', 'panel']));
            fs.writeFileSync(path.join(exportDir, 'CUTLIST.csv'), CSVExporter.toCSV(pkg.cutList.piezas, ['id', 'perfil', 'longitud', 'cantidad', 'panel', 'muro', 'piezaTipo', 'prioridadFabricacion']));
            fs.writeFileSync(path.join(exportDir, 'Proyecto.json'), JSONExporter.toJSON(pkg));
            
            const excelTsv = ExcelExporter.generateSpreadsheet({ 
                'BOM': pkg.bom.items,
                'Lista de Corte': pkg.cutList.piezas
            });
            fs.writeFileSync(path.join(exportDir, 'reporte.tsv'), excelTsv);
            
            const montageContent = PDFExporter.generateProductionDoc('Resumen de Montaje', pkg.montaje);
            fs.writeFileSync(path.join(exportDir, 'Montaje.txt'), montageContent);

            // 2. Generar Planos Técnicos (PDF)
            const technicalPkg = await PlanoPackageBuilder.build(project);
            const pdfBytes = await TechnicalPdfExporter.export(technicalPkg);
            fs.writeFileSync(path.join(exportDir, 'planos-tecnicos.pdf'), pdfBytes);

            // 3. Registrar éxito en DB (Check 3 saneado)
            await this.storage.logExport(projectId, 'paquete_completo', `/qa-viewer/exports/${projectId}/paquete-completo.zip`, {
                files: ['BOM.csv', 'CUTLIST.csv', 'Proyecto.json', 'Montaje.txt', 'reporte.tsv', 'planos-tecnicos.pdf'],
                pdfSize: pdfBytes.length,
                status: 'disponible'
            });

            return {
                ok: true,
                files: ['BOM.csv', 'CUTLIST.csv', 'Proyecto.json', 'planos-tecnicos.pdf'],
                pdfSize: pdfBytes.length
            };

        } catch (error: any) {
            console.error(`[ExportService] Error en exportación ${projectId}:`, error);
            await this.storage.logExport(projectId, 'error_generacion', 'none', { 
                error: error.message, 
                status: 'error' 
            });
            throw error;
        }
    }

    getExportPath(projectId: string, filename: string): string {
        // Validación básica de seguridad
        if (filename.includes('..') || projectId.includes('..')) {
            throw new Error("Acceso denegado: Intento de Path Traversal");
        }
        return path.join(this.EXPORT_BASE_DIR, projectId, filename);
    }


    async getProjectExports(projectId: string) {
        return await this.storage.getExports(projectId);
    }

    async getProjectExportStatus(projectId: string) {
        const exports = await this.storage.getExports(projectId);
        const lastError = exports.find(e => e.tipo === 'error_generacion' || e.tipo === 'error_planos');

        const files = [
            'BOM.csv',
            'CUTLIST.csv',
            'Proyecto.json',
            'Montaje.txt',
            'reporte.tsv',
            'planos-tecnicos.pdf',
            'planos-package.json'
        ];

        return files.map(filename => {
            const filePath = this.getExportPath(projectId, filename);
            const exists = fs.existsSync(filePath);
            let sizeBytes = 0;
            if (exists) {
                sizeBytes = fs.statSync(filePath).size;
            }

            let status: 'disponible' | 'incompleto' | 'pendiente_de_generar' | 'error' = 'pendiente_de_generar';
            
            if (exists) {
                // Validación mínima para PDFs
                if (sizeBytes >= 5000 || filename !== 'planos-tecnicos.pdf') {
                    status = 'disponible';
                } else {
                    status = 'incompleto';
                }
            } else if (lastError) {
                status = 'error';
            }

            return {
                filename,
                exists,
                sizeBytes,
                status,
                downloadUrl: `/api/exports/${projectId}/${filename}`
            };
        });
    }

    async exportDrawings(projectId: string) {
        const project = await this.storage.getProject(projectId);
        if (!project) throw new Error("Proyecto no encontrado");

        const pkg = await PlanoPackageBuilder.build(project);
        
        const exportDir = path.join(this.EXPORT_BASE_DIR, projectId);
        if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
        
        // Exportar JSON
        fs.writeFileSync(path.join(exportDir, 'planos-package.json'), JSON.stringify(pkg, null, 2));

        // Exportar PDF
        const pdfBytes = await TechnicalPdfExporter.export(pkg);
        fs.writeFileSync(path.join(exportDir, 'planos-tecnicos.pdf'), pdfBytes);

        // Registrar
        await this.storage.logExport(projectId, 'planos_tecnicos_pdf', `/api/exports/${projectId}/planos-tecnicos.pdf`, {
            sheets: pkg.hojas.length,
            version: project.versionActual
        });

        return {
            ok: true,
            pdfUrl: `/api/exports/${projectId}/planos-tecnicos.pdf`,
            jsonUrl: `/api/exports/${projectId}/planos-package.json`
        };
    }

    async getProjectBudget(projectId: string) {


        const project = await this.storage.getProject(projectId);
        if (!project) throw new Error("Proyecto no encontrado");
        
        const version = project.historialVersiones?.find(v => v.id === project.versionActual);
        const bom = version?.resultadoMotor?.bom;
        
        return {
            ok: true,
            bom: bom || { items: [], aggregated: [] },
            config: version?.configuracion
        };
    }
}

export const exportService = new ExportService();
