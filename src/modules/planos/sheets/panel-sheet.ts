import { PlanoSheetDTO, PlanoTableDTO, PlanoEntityDTO } from '../types';
import { TitleBlockBuilder } from '../title-block-builder';
import { TablesBuilder } from '../tables-builder';

export class PanelSheet {
    static generate(panel: any, projectMeta: any): PlanoSheetDTO {
        const ROLE_MAP: Record<string, string> = {
            'common': 'Montante común',
            'montante_principal': 'Montante rey',
            'montante_apoyo': 'Montante de apoyo',
            'montante_corto_superior': 'Montante corto superior',
            'montante_corto_inferior': 'Montante corto inferior',
            'corner': 'Montante de esquina',
            'junction': 'Encuentro T',
            'solera_ventana': 'Solera de ventana',
            'solera_inferior': 'Solera inferior',
            'solera_superior': 'Solera superior',
            'track': 'Solera'
        };

        const rows = (panel.studs || []).map((s: any) => [
            ROLE_MAP[s.role] || s.role.toUpperCase(),
            `${(s.height * 1000).toFixed(0)}mm`,
            '1',
            '--',
            panel.id
        ]);

        const entities: PlanoEntityDTO[] = [];
        
        // 1. Dibujar Perímetro del Panel (Trapezoidal si corresponde)
        const points = [
            { x: 0, y: 0 },
            { x: panel.width, y: 0 },
            { x: panel.width, y: panel.heightEnd },
            { x: 0, y: panel.heightStart },
            { x: 0, y: 0 }
        ];

        entities.push({
            type: 'path',
            points,
            color: '#000000',
            strokeWidth: 2
        });

        // 2. Dibujar Montantes
        (panel.studs || []).forEach((stud: any) => {
            entities.push({
                type: 'line',
                points: [
                    { x: stud.position, y: stud.yOffset || 0 },
                    { x: stud.position, y: (stud.yOffset || 0) + stud.height }
                ],
                color: '#808080',
                strokeWidth: 1
            });
        });

        // 3. Dibujar Aberturas
        (panel.aberturas || []).forEach((op: any) => {
            entities.push({
                type: 'rect',
                x: op.position - panel.offset,
                y: op.sillHeight,
                width: op.width,
                height: op.height,
                color: '#FF6347',
                strokeWidth: 1.5,
                fill: false
            });
        });

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
                x: 50, y: 100, width: 500, height: 600, scale: 25, viewCenter: { x: panel.width / 2, y: Math.max(panel.heightStart, panel.heightEnd) / 2 }
            }],
            entities,
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
