import { ClasificacionEstructuralAbertura, EstrategiaDintel } from './types';

/**
 * Selecciona las estrategias de diseño aplicables basándose en la clasificación inicial.
 */
export function seleccionarEstrategiasPosibles(clasificacion: ClasificacionEstructuralAbertura): EstrategiaDintel[] {
    const estrategias: EstrategiaDintel[] = [];

    switch (clasificacion.categoria) {
        case 'abertura_pequena':
            estrategias.push('dintel_simple');
            estrategias.push('dintel_compuesto'); // Siempre es una opción de refuerzo
            break;
        case 'abertura_media':
            estrategias.push('dintel_compuesto');
            estrategias.push('dintel_reticulado');
            break;
        case 'abertura_grande':
            estrategias.push('dintel_reticulado');
            estrategias.push('dintel_tubular');
            break;
        case 'abertura_critica':
            if (clasificacion.estrategiaRecomendada === 'requiere_viga_estructural_externa') {
                estrategias.push('requiere_viga_estructural_externa');
            } else {
                estrategias.push('dintel_tubular');
                estrategias.push('requiere_viga_estructural_externa');
            }
            break;
    }

    return estrategias;
}

/**
 * Obtiene la recomendación de texto legible según la estrategia.
 */
export function obtenerRecomendacionTexto(estrategia: EstrategiaDintel): string {
    switch (estrategia) {
        case 'dintel_simple': return 'Usar dintel de perfil simple (C o U).';
        case 'dintel_compuesto': return 'Usar dintel de perfiles acoplados (Cajón o Espalda con Espalda).';
        case 'dintel_reticulado': return 'Usar viga reticulada integrada al panel.';
        case 'dintel_tubular': return 'Usar dintel de perfil tubular (RHS/SHS).';
        case 'requiere_viga_estructural_externa': return 'Requiere viga estructural externa (Hormigón, Perfil laminado pesado o Pórtico).';
        default: return 'Consultar con ingeniería.';
    }
}
