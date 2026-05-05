import { Abertura } from '../../core/types';
import { ClasificacionEstructuralAbertura, CategoriaAbertura, EstrategiaDintel } from './types';
import { STRUCTURAL_ASSUMPTIONS } from './structural-assumptions';

/**
 * Clasifica una abertura según su luz y contexto estructural.
 */
export function clasificarAbertura(abertura: Abertura, wallRole: string): ClasificacionEstructuralAbertura {
    const luz = abertura.width;
    const umbrales = STRUCTURAL_ASSUMPTIONS.thresholds.umbralesDinteles;
    
    let categoria: CategoriaAbertura = 'abertura_pequena';
    let estrategiaRecomendada: EstrategiaDintel = 'dintel_simple';
    let razon = 'Luz estándar para dintel simple.';
    let requiereRevisionEstructural = false;

    if (luz <= umbrales.luzMaximaPequena) {
        categoria = 'abertura_pequena';
        estrategiaRecomendada = 'dintel_simple';
    } else if (luz <= umbrales.luzMaximaMedia) {
        categoria = 'abertura_media';
        estrategiaRecomendada = 'dintel_compuesto';
        razon = 'Luz moderada. Se recomienda dintel de perfiles acoplados.';
    } else if (luz <= umbrales.luzMaximaGrande) {
        categoria = 'abertura_grande';
        estrategiaRecomendada = 'dintel_reticulado';
        razon = 'Luz importante. Se recomienda viga reticulada para controlar flechas.';
        requiereRevisionEstructural = true;
    } else if (luz <= umbrales.luzCritica) {
        categoria = 'abertura_critica';
        estrategiaRecomendada = 'dintel_tubular';
        razon = 'Luz crítica. Requiere dintel tubular de alta rigidez o refuerzo pesado.';
        requiereRevisionEstructural = true;
    } else {
        categoria = 'abertura_critica';
        estrategiaRecomendada = 'requiere_viga_estructural_externa';
        razon = 'Luz fuera de los límites estándar del sistema. Requiere viga estructural externa o pórtico.';
        requiereRevisionEstructural = true;
    }

    // El rol del muro puede elevar la categoría
    if (wallRole.includes('loadbearing') && categoria === 'abertura_media' && luz > umbrales.luzMaximaMedia * 0.9) {
        razon += ' Reforzado por rol portante del muro.';
    }

    return {
        aberturaId: (abertura as any).id || 'unknown',
        luz,
        categoria,
        estrategiaRecomendada,
        razon,
        requiereRevisionEstructural
    };
}
