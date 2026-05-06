import { PlanoSheetDTO, PlanoEntityDTO } from '../types';
import { TitleBlockBuilder } from '../title-block-builder';
import { PLANO_CONFIG } from '../plano-config';

export class PortadaSheet {
    static generate(pkg: any): PlanoSheetDTO {
        const entities: PlanoEntityDTO[] = [
            {
                type: 'text',
                x: 400,
                y: 500,
                text: (pkg.nombre || 'PROYECTO').toUpperCase(),
                fontSize: 36,
                align: 'center'
            },
            {
                type: 'text',
                x: 400,
                y: 450,
                text: 'DOCUMENTACIÓN TÉCNICA DE ESTRUCTURA',
                fontSize: 18,
                align: 'center'
            },
            {
                type: 'text',
                x: 400,
                y: 300,
                text: 'VISTA 3D DISPONIBLE EN VISOR DEL PROYECTO',
                fontSize: 12,
                color: PLANO_CONFIG.COLORS.muted,
                align: 'center'
            }
        ];

        return {
            id: 'portada',
            numeroHoja: 1,
            codigoHoja: 'PORTADA',
            titulo: 'PORTADA',
            viewports: [],
            entities,
            dimensions: [],
            symbols: [],
            tables: [],
            titleBlock: TitleBlockBuilder.build(
                pkg.nombre,
                pkg.cliente,
                'v1.0',
                '01',
                '--'
            ),
            warnings: []
        };
    }
}
