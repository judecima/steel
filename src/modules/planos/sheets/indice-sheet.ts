import { PlanoSheetDTO, PlanosPackageDTO } from '../types';
import { TitleBlockBuilder } from '../title-block-builder';
import { TablesBuilder } from '../tables-builder';

export class IndiceSheet {
    static generate(pkg: any, hojasPrevias: {codigo: string, titulo: string}[]): PlanoSheetDTO {
        const rows = hojasPrevias.map(h => [h.codigo, h.titulo]);
        
        const table = TablesBuilder.build(
            'ÍNDICE DE PLANOS',
            ['N° HOJA', 'TÍTULO'],
            rows,
            { x: 100, y: 600 },
            400
        );

        return {
            id: 'indice',
            numeroHoja: 0,
            codigoHoja: '00',
            titulo: 'ÍNDICE DE PLANOS',
            viewports: [],
            entities: [],
            dimensions: [],
            symbols: [],
            tables: [table],
            titleBlock: TitleBlockBuilder.build(
                pkg.nombre,
                pkg.cliente,
                'v1.0',
                '00',
                hojasPrevias.length.toString()
            ),
            warnings: []
        };
    }
}
