import { PlanoSheetDTO, PlanoSymbolDTO, PlanoEntityDTO, PlanoDimensionDTO } from '../types';
import { TitleBlockBuilder } from '../title-block-builder';

export class DistribucionPanelesSheet {
    static generate(projectResult: any, metadata: any): PlanoSheetDTO {
        const entities: PlanoEntityDTO[] = [];
        const symbols: PlanoSymbolDTO[] = [];
        const dimensions: PlanoDimensionDTO[] = [];
        
        const house = projectResult?.house;
        const panels = projectResult?.construction?.panels || [];

        // 1. Dibujar Perímetro de Muros
        if (house?.muros) {
            house.muros.forEach((muro: any) => {
                entities.push({
                    type: 'line',
                    points: [
                        { x: muro.start.x, y: muro.start.y },
                        { x: muro.end.x, y: muro.end.y }
                    ],
                    color: '#000000',
                    strokeWidth: 2
                });
            });
        }

        // 2. Dibujar Juntas de Paneles y Burbujas
        panels.forEach((panel: any) => {
            const muro = house?.muros.find((m: any) => m.id === panel.wallId);
            if (!muro) return;

            // Calcular posición de burbuja (centro del panel)
            const dx = muro.end.x - muro.start.x;
            const dy = muro.end.y - muro.start.y;
            const wallLen = Math.sqrt(dx*dx + dy*dy);
            
            const ux = dx / wallLen;
            const uy = dy / wallLen;
            
            const midPos = panel.offset + panel.width / 2;
            const bubbleX = muro.start.x + ux * midPos;
            const bubbleY = muro.start.y + uy * midPos;

            symbols.push({
                type: 'bubble',
                position: { x: bubbleX, y: bubbleY },
                label: panel.id.replace('panel_', 'P-')
            });

            // Dibujar línea de junta al final del panel (si no es el final del muro)
            if (panel.offset + panel.width < muro.length - 0.05) {
                const jointX = muro.start.x + ux * (panel.offset + panel.width);
                const jointY = muro.start.y + uy * (panel.offset + panel.width);
                
                // Perpendicular para la línea de junta
                const px = -uy * 0.15;
                const py = ux * 0.15;

                entities.push({
                    type: 'line',
                    points: [
                        { x: jointX - px, y: jointY - py },
                        { x: jointX + px, y: jointY + py }
                    ],
                    color: '#FF8C00',
                    strokeWidth: 1
                });
            }
        });

        // 3. Cotas principales
        if (house) {
             dimensions.push({
                 start: { x: 0, y: 0 },
                 end: { x: projectResult.input.width, y: 0 },
                 value: `${projectResult.input.width}m`,
                 offset: -0.5
             });
             dimensions.push({
                start: { x: projectResult.input.width, y: 0 },
                end: { x: projectResult.input.width, y: projectResult.input.length },
                value: `${projectResult.input.length}m`,
                offset: 0.5
            });
        }

        return {
            id: 'distribucion-paneles',
            numeroHoja: 3,
            codigoHoja: 'A02',
            titulo: 'DISTRIBUCIÓN DE PANELES',
            subtitulo: 'PLANTA SOBRE PLATEA',
            viewports: [{
                x: 100, y: 100, width: 800, height: 500, scale: 50, viewCenter: { x: house?.muros[0].end.x / 2 || 2, y: house?.muros[1].end.y / 2 || 8 }
            }],
            entities,
            dimensions,
            symbols,
            tables: [],
            titleBlock: TitleBlockBuilder.build(
                metadata.nombre,
                metadata.cliente,
                'v1.0',
                'A02',
                '--'
            ),
            warnings: []
        };
    }
}
