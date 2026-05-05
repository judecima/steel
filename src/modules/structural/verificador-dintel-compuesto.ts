import { CandidatoDisenoDintel, StructuralStatus } from './types';
import { STRUCTURAL_ASSUMPTIONS } from './structural-assumptions';
import { getCodeReference } from './code-references';

/**
 * Verifica preliminarmente un dintel compuesto.
 */
export function verificarDintelCompuesto(aberturaId: string, luz: number, perfiles: string[]): CandidatoDisenoDintel {
    // Simulación de cálculo de capacidad para perfiles acoplados
    // En una implementación real, esto buscaría propiedades en el catálogo
    
    const esPortante = true; // Supuesto conservador
    let estado: StructuralStatus = 'preliminary_pass';
    const advertencias: string[] = ['Dimensionamiento preliminar basado en supuestos de carga estándar.'];
    
    // Ratio de utilización simulado basado en luz (simplificación extrema para Fase 3B)
    const ratioUtilizacion = Math.min(0.95, (luz / STRUCTURAL_ASSUMPTIONS.thresholds.umbralesDinteles.luzMaximaMedia) * 0.8);

    if (luz > STRUCTURAL_ASSUMPTIONS.thresholds.umbralesDinteles.luzMaximaMedia) {
        estado = 'requires_engineer_review';
        advertencias.push('La luz excede el límite recomendado para este tipo de dintel.');
    }

    return {
        id: `compuesto_${perfiles.join('_')}_${aberturaId}`,
        aberturaId,
        estrategia: 'dintel_compuesto',
        luz,
        altura: 0.1, // 100mm perfil C estándar
        perfiles,
        ratioUtilizacion,
        estado,
        advertencias,
        referenciasNormativas: [getCodeReference('CIRSOC_303', '6.1')]
    };
}
