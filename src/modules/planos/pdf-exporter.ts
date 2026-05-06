import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PlanoSheetDTO, PlanoEntityDTO, PlanosPackageDTO } from './types';
import { PLANO_CONFIG } from './plano-config';

export class PdfExporter {
    static async export(pkg: PlanosPackageDTO): Promise<Uint8Array> {
        if (!pkg.hojas || pkg.hojas.length === 0) {
            throw new Error("No hay hojas técnicas para exportar en este proyecto.");
        }
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        for (const sheet of pkg.hojas) {
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
            
            // Disclaimer
            page.drawText(sheet.titleBlock.disclaimer, {
                x: PLANO_CONFIG.MARGINS.left + 10,
                y: PLANO_CONFIG.MARGINS.bottom + 10,
                size: 6,
                font,
                color: rgb(0.5, 0.5, 0.5)
            });

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
                    // Lines in PDF use bottom-left origin
                    // For 8A, we do a simple scale to center for visualization
                    const p1 = entity.points[0];
                    const p2 = entity.points[1];
                    page.drawLine({
                        start: { x: 300 + p1.x * 20, y: 300 + p1.y * 20 },
                        end: { x: 300 + p2.x * 20, y: 300 + p2.y * 20 },
                        color: rgb(1, 0, 0),
                        thickness: 2
                    });
                }
            }
            
            // Draw Tables
            for (const table of sheet.tables) {
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
                        page.drawText(cell, { x: table.position.x + (i * 70), y: currentY, size: 7, font });
                    });
                    currentY -= 12;
                });
            }
        }

        return await pdfDoc.save();
    }
}
