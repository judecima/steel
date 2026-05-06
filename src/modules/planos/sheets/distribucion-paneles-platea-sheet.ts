import { PlanoSheetDTO, PlanoSymbolDTO } from '../types';
import { TitleBlockBuilder } from '../title-block-builder';

export class DistribucionPanelesSheet {
    static generate(projectResult: any, metadata: any): PlanoSheetDTO {
        const symbols: PlanoSymbolDTO[] = [];
        const panels = projectResult?.construction?.panels || [];
        
        panels.forEach((panel: any) => {
            symbols.push({
                type: 'bubble',
                position: { x: panel.offset, y: 0 }, // Simplified for 8A
                label: panel.id.replace('panel_', 'P-')
            });
        });

        return {
            id: 'distribucion-paneles',
            numeroHoja: 3,
            codigoHoja: 'A02',
            titulo: 'DISTRIBUCIÓN DE PANELES',
            subtitulo: 'PLANTA SOBRE PLATEA',
            viewports: [{
                x: 100, y: 100, width: 800, height: 500, scale: 50, viewCenter: { x: 5, y: 5 }
            }],
            entities: [],
            dimensions: [],
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
