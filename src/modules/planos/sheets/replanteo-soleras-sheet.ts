import { PlanoSheetDTO, PlanoEntityDTO, Vector2 } from '../types';
import { TitleBlockBuilder } from '../title-block-builder';
import { PLANO_CONFIG } from '../plano-config';

export class ReplanteoSolerasSheet {
    static generate(projectResult: any, metadata: any): PlanoSheetDTO {
        const entities: PlanoEntityDTO[] = [];
        const panels = projectResult?.construction?.panels || [];
        
        // Simplified representation of bottom tracks
        panels.forEach((panel: any) => {
            // Find related wall to get real coordinates
            const wall = projectResult?.house?.muros?.find((m: any) => m.id === panel.wallId);
            if (!wall) return;

            const p1 = wall.start;
            const p2 = wall.end;

            entities.push({
                type: 'line',
                points: [p1, p2],
                color: PLANO_CONFIG.COLORS.solera,
                strokeWidth: 2
            });
        });

        return {
            id: 'replanteo-soleras',
            numeroHoja: 2,
            codigoHoja: 'A01',
            titulo: 'REPLANTEO DE SOLERAS',
            subtitulo: 'NIVEL DE FUNDACIÓN',
            viewports: [{
                x: 100, y: 100, width: 800, height: 500, scale: 50, viewCenter: { x: 5, y: 5 }
            }],
            entities,
            dimensions: [],
            symbols: [],
            tables: [],
            titleBlock: TitleBlockBuilder.build(
                metadata.nombre,
                metadata.cliente,
                'v1.0',
                'A01',
                '--'
            ),
            warnings: ['Medidas sujetas a verificación en obra.']
        };
    }
}
