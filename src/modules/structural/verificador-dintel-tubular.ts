import { CandidatoDisenoDintel, StructuralStatus } from './types';
import { findProfilesByType } from './profile-catalog';
import { getCodeReference } from './code-references';

/**
 * Verifica preliminarmente un dintel tubular.
 */
export function verificarDintelTubular(aberturaId: string, luz: number): CandidatoDisenoDintel {
    const perfilesTubulares = findProfilesByType('TUBULAR'); // No existen en el catálogo actual
    
    let estado: StructuralStatus = 'requires_engineer_review';
    let advertencias: string[] = [
        'Dintel tubular requiere verificación de uniones soldadas y protección anticorrosiva especial.',
        'Se requiere revisión estructural profesional obligatoria.'
    ];

    if (perfilesTubulares.length === 0) {
        estado = 'insufficient_data';
        advertencias.push('No se encontraron perfiles tubulares en el catálogo certificado para realizar la verificación preliminar.');
    }

    return {
        id: `tubular_${aberturaId}`,
        aberturaId,
        estrategia: 'dintel_tubular',
        luz,
        altura: 0.1, // Placeholder
        perfiles: [],
        estado,
        advertencias,
        referenciasNormativas: [getCodeReference('CIRSOC_303', '6.1')]
    };
}
