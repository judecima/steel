import { PlanoSheetDTO, PlanoTableDTO } from '../types';
import { TitleBlockBuilder } from '../title-block-builder';
import { TablesBuilder } from '../tables-builder';

export class PanelSheet {
    static generate(panel: any, projectMeta: any): PlanoSheetDTO {
        const rows = (panel.studs || []).map((s: any) => [
            s.role.toUpperCase(),
            `${(s.height * 1000).toFixed(0)}mm`,
            '1',
            '--',
            panel.id
        ]);

        const table = TablesBuilder.build(
            `LISTADO DE PIEZAS - ${panel.id}`,
            ['PRODUCTO', 'LARGO', 'CANT', 'PESO', 'DESTINO'],
            rows,
            { x: 750, y: 300 },
            350
        );

        const warnings = ['Verificar escuadría del panel antes de fijar.'];
        if (rows.length === 0) {
            warnings.push("Hoja generada sin geometría técnica disponible (Faltan Studs)");
        }

        return {
            id: `sheet-${panel.id}`,
            numeroHoja: 10, // Dynamic later
            codigoHoja: `P-${panel.id.split('_')[1]}`,
            titulo: `FICHA DE PANEL: ${panel.id}`,
            viewports: [{
                x: 50, y: 100, width: 500, height: 600, scale: 25, viewCenter: { x: 1.5, y: 1.3 }
            }],
            entities: [],
            dimensions: [],
            symbols: [],
            tables: [table],
            titleBlock: TitleBlockBuilder.build(
                projectMeta.nombre,
                projectMeta.cliente,
                'v1.0',
                `P-${panel.id.split('_')[1]}`,
                '--'
            ),
            warnings: warnings
        };
    }
}
