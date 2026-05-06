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
                x: 100,
                y: 200,
                text: 'NOTAS GENERALES:',
                fontSize: 12,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 180,
                text: '- Todas las medidas en milímetros (mm) salvo indicación contraria.',
                fontSize: 8,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 165,
                text: '- Perfilería de acero galvanizado conformada en frío (Steel Frame).',
                fontSize: 8,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 150,
                text: '- Recubrimiento mínimo de galvanizado Z-275.',
                fontSize: 8,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 135,
                text: '- Los anclajes deben verificarse según cálculo estructural específico.',
                fontSize: 8,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 120,
                text: '- Documento para uso exclusivo en taller y montaje de estructura.',
                fontSize: 8,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 105,
                text: 'ESPECIFICACIONES TÉCNICAS ADICIONALES:',
                fontSize: 8,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 95,
                text: '- Acero S250GD + Z275 según norma IRAM-IAS U 500-205.',
                fontSize: 7,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 85,
                text: '- Tornillería autoperforante punta mecha con recubrimiento orgánico.',
                fontSize: 7,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 75,
                text: '- Rigidización mediante cruces de San Andrés o placas de OSB/Fenólico.',
                fontSize: 7,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 65,
                text: '- Sellado de soleras inferiores con banda acústica de polietileno expandido.',
                fontSize: 7,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 55,
                text: '- Montaje según manual de procedimientos de Steel Framing estándar.',
                fontSize: 7,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 45,
                text: '- Este plano no reemplaza al cálculo de ingeniería de detalle definitivo.',
                fontSize: 7,
                align: 'left'
            },
            {
                type: 'text',
                x: 100,
                y: 35,
                text: '- Verificaciones de carga de viento y nieve según zona bioclimática.',
                fontSize: 7,
                align: 'left'
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
