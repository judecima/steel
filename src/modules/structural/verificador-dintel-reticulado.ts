import { CandidatoDisenoDintel, ModeloPreliminarDintelReticulado, StructuralStatus } from './types';
import { STRUCTURAL_ASSUMPTIONS } from './structural-assumptions';
import { getCodeReference } from './code-references';

/**
 * Genera un modelo preliminar de dintel reticulado.
 */
export function verificarDintelReticulado(aberturaId: string, luz: number): CandidatoDisenoDintel {
    // Estimación geométrica de la retícula
    const alturaRecomendada = Math.max(0.3, luz / 8); // L/8 como pre-dimensionado
    const cantidadPaneles = Math.ceil(luz / 0.4); // Paneles cada 400mm aprox.
    
    const modelo: ModeloPreliminarDintelReticulado = {
        cordonSuperior: 'PGC 100x0.9',
        cordonInferior: 'PGC 100x0.9',
        alma: 'PGU 100x0.9',
        altura: alturaRecomendada,
        cantidadPaneles,
        patronDiagonales: 'warren',
        preliminar: true
    };

    const advertencias = [
        'Viga reticulada requiere ensamble industrial certificado.',
        'La altura y perfiles son estimaciones para validación de espacio, no para construcción.',
        'Se requiere cálculo de uniones y deformaciones por un profesional.'
    ];

    let estado: StructuralStatus = 'requires_engineer_review'; // Reticulados siempre requieren revisión
    
    return {
        id: `reticulado_${aberturaId}`,
        aberturaId,
        estrategia: 'dintel_reticulado',
        luz,
        altura: alturaRecomendada,
        perfiles: [modelo.cordonSuperior, modelo.cordonInferior, modelo.alma],
        estado,
        advertencias,
        referenciasNormativas: [getCodeReference('CIRSOC_303', '6.3.2')],
        // Adjuntamos el modelo en metadata para el motor de renderizado/reporte
        metadata: { modelo }
    } as CandidatoDisenoDintel;
}
