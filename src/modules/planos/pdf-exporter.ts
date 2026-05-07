import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PlanoSheetDTO, PlanoEntityDTO, PlanosPackageDTO } from './types';
import { PLANO_CONFIG } from './plano-config';
import { validatePdfScene } from './validate-pdf-scene';
import { normalizePanelGeometry } from './pdf-scene-adapter';

export class PdfExporter {
    static async export(pkg: PlanosPackageDTO): Promise<Uint8Array> {
        try {
            validatePdfScene(pkg);
        } catch (error: any) {
            console.error("[PDF_EXPORT] Validation failed:", error.message);
            throw error;
        }

        console.log("[FLOW_PDF] pkg", { 
            id: pkg.proyectoId, 
            hojasCount: pkg.hojas?.length,
            hojasKeys: pkg?.hojas?.map(h => h.id)
        });

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        for (const sheet of pkg.hojas) {
            try {
                const page = pdfDoc.addPage([PLANO_CONFIG.SIZES.A3.width, PLANO_CONFIG.SIZES.A3.height]);
            const { width, height } = page.getSize();

            // Draw Border
            page.drawRectangle({
                x: PLANO_CONFIG.MARGINS.left,
                y: PLANO_CONFIG.MARGINS.bottom,
                width: width - PLANO_CONFIG.MARGINS.left - PLANO_CONFIG.MARGINS.right,
                height: height - PLANO_CONFIG.MARGINS.top - PLANO_CONFIG.MARGINS.bottom,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });

            // Draw Title Block (Simplified for 8A)
            const tbWidth = 250;
            const tbHeight = 120;
            const tbX = width - PLANO_CONFIG.MARGINS.right - tbWidth;
            const tbY = PLANO_CONFIG.MARGINS.bottom;

            page.drawRectangle({
                x: tbX,
                y: tbY,
                width: tbWidth,
                height: tbHeight,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });

            page.drawText(`PROYECTO: ${sheet.titleBlock.proyecto}`, { x: tbX + 10, y: tbY + 100, size: 10, font: fontBold });
            page.drawText(`CLIENTE: ${sheet.titleBlock.cliente}`, { x: tbX + 10, y: tbY + 85, size: 8, font });
            page.drawText(`FECHA: ${sheet.titleBlock.fecha}`, { x: tbX + 10, y: tbY + 70, size: 8, font });
            page.drawText(`HOJA: ${sheet.codigoHoja} / ${sheet.numeroHoja}`, { x: tbX + 10, y: tbY + 55, size: 12, font: fontBold });
            
            // Disclaimer (Multi-line)
            const disclaimerText = sheet.titleBlock.disclaimer;
            const words = disclaimerText.split(' ');
            let line = '';
            let discY = PLANO_CONFIG.MARGINS.bottom + 25;
            for (const word of words) {
                if ((line + word).length > 100) {
                    page.drawText(line, { x: PLANO_CONFIG.MARGINS.left + 10, y: discY, size: 5, font });
                    line = word + ' ';
                    discY -= 6;
                } else {
                    line += word + ' ';
                }
            }
            page.drawText(line, { x: PLANO_CONFIG.MARGINS.left + 10, y: discY, size: 5, font });

            // Draw Empty Sheet Warning if needed
            if (sheet.entities.length === 0 && sheet.tables.length === 0) {
                page.drawText("Hoja generada sin geometría técnica disponible", {
                    x: width / 2 - 150,
                    y: height / 2,
                    size: 14,
                    font: fontBold,
                    color: rgb(1, 0, 0)
                });
            }

            // Draw Entities
            for (const entity of sheet.entities) {
                if (entity.type === 'text' && entity.text) {
                    page.drawText(entity.text, {
                        x: entity.x || 0,
                        y: entity.y || 0,
                        size: entity.fontSize || 10,
                        font
                    });
                }
                if (entity.type === 'line' && entity.points && entity.points.length >= 2) {
                    const geometry = normalizePanelGeometry(entity);
                    if (geometry.start && geometry.end) {
                        console.log("[FLOW_PDF] drawing line", { 
                            start: geometry.start, 
                            end: geometry.end 
                        });
                        page.drawLine({
                            start: { x: 300 + geometry.start.x * 20, y: 300 + geometry.start.y * 20 },
                            end: { x: 300 + geometry.end.x * 20, y: 300 + geometry.end.y * 20 },
                            color: rgb(0, 0, 0),
                            thickness: 1
                        });
                    }
                }
                if (entity.type === 'rect') {
                    page.drawRectangle({
                        x: entity.x || 0,
                        y: entity.y || 0,
                        width: entity.width || 50,
                        height: entity.height || 50,
                        borderColor: rgb(0, 0, 0),
                        borderWidth: 1
                    });
                }
                if (entity.type === 'circle') {
                    page.drawCircle({
                        x: entity.x || 0,
                        y: entity.y || 0,
                        size: entity.radius || 10,
                        borderColor: rgb(0, 0, 0),
                        borderWidth: 1
                    });
                }
            }

            // Draw Dimensions
            for (const dim of sheet.dimensions || []) {
                const geometry = normalizePanelGeometry(dim);
                if (geometry.start && geometry.end) {
                    const x1 = geometry.start.x;
                    const y1 = geometry.start.y;
                    const x2 = geometry.end.x;
                    const y2 = geometry.end.y;

                    if (Number.isNaN(x1) || Number.isNaN(x2)) {
                        console.warn("[PDF_EXPORT] skipping invalid dimension coords");
                        continue;
                    }

                    page.drawLine({
                        start: { x: x1, y: y1 },
                        end: { x: x2, y: y2 },
                        color: rgb(0, 0, 1),
                        thickness: 0.5
                    });
                    page.drawText(dim.value || (dim as any).text || '', {
                        x: (x1 + x2) / 2,
                        y: (y1 + y2) / 2 + 5,
                        size: 8,
                        font
                    });
                }
            }

            // Draw Warnings (Visible in the sheet)
            sheet.warnings.forEach((warn, idx) => {
                page.drawText(`WARN: ${warn}`, {
                    x: PLANO_CONFIG.MARGINS.left + 10,
                    y: PLANO_CONFIG.MARGINS.bottom + 100 - (idx * 12),
                    size: 7,
                    font,
                    color: rgb(0.8, 0.4, 0)
                });
            });
            
            // Draw Tables
            for (const table of (sheet.tables || [])) {
                if (!table?.position) {
                    console.warn("[PDF_EXPORT] skipping table due to missing position");
                    continue;
                }
                let currentY = table.position.y;
                page.drawText(table.title || '', { x: table.position.x, y: currentY + 15, size: 10, font: fontBold });
                
                // Headers
                table.headers.forEach((h, i) => {
                    page.drawText(h, { x: table.position.x + (i * 70), y: currentY, size: 8, font: fontBold });
                });
                currentY -= 15;
                
                // Rows
                table.rows.forEach(row => {
                    row.forEach((cell, i) => {
                        page.drawText(cell || '', { x: table.position.x + (i * 70), y: currentY, size: 7, font });
                    });
                    currentY -= 12;
                });
            }
          } catch (sheetError: any) {
              console.error(`[PDF_EXPORT] Error exporting sheet ${sheet.id}:`, sheetError.message);
              // Fallback: Continue with next sheet instead of breaking everything
          }
        }

        return await pdfDoc.save();
    }
}
