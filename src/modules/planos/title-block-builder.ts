import { PlanoTitleBlockDTO } from './types';
import { PLANO_CONFIG } from './plano-config';

export class TitleBlockBuilder {
    static build(
        proyecto: string,
        cliente: string,
        version: string,
        hoja: string,
        totalHojas: string,
        escala: string = 'Indicada'
    ): PlanoTitleBlockDTO {
        return {
            proyecto: proyecto || 'Sin Nombre',
            cliente,
            ubicacion: 'A definir',
            fecha: new Date().toLocaleDateString('es-AR'),
            version,
            escala,
            hoja,
            totalHojas,
            disclaimer: PLANO_CONFIG.DISCLAIMER
        };
    }
}
