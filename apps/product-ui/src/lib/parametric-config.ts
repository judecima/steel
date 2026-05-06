import { ConfiguracionProyectoDTO } from '../../../../src/modules/product/types';

export const DEFAULT_PARAMETRIC_CONFIG: ConfiguracionProyectoDTO = {
    anchoVivienda: 4.0,
    largoVivienda: 16.0,
    alturaMuro: 2.6,
    pendienteTecho: 10,
    separacionMontantes: 0.4,
    espesorPerfil: 0.9,
    tipoPerfil: 'PGC 100x0.9',
    material: 'acero_galvanizado',
    tipoCubierta: 'one_slope',
    tipoFundacion: 'losa',
    direccionCaida: 'ancho',
    panelMaxLengthM: 4.0,
    panelPreferredLengthM: 3.0,
    aberturas: [],
    murosInternos: []
};

export function normalizarConfiguracionParametrica(input: any): ConfiguracionProyectoDTO {
    return {
        ...DEFAULT_PARAMETRIC_CONFIG,
        ...input,
        // Forzar conversiones numéricas
        anchoVivienda: parseFloat(input?.anchoVivienda) || DEFAULT_PARAMETRIC_CONFIG.anchoVivienda,
        largoVivienda: parseFloat(input?.largoVivienda) || DEFAULT_PARAMETRIC_CONFIG.largoVivienda,
        alturaMuro: parseFloat(input?.alturaMuro) || DEFAULT_PARAMETRIC_CONFIG.alturaMuro,
        pendienteTecho: parseFloat(input?.pendienteTecho) || DEFAULT_PARAMETRIC_CONFIG.pendienteTecho,
        separacionMontantes: parseFloat(input?.separacionMontantes) || DEFAULT_PARAMETRIC_CONFIG.separacionMontantes,
        espesorPerfil: parseFloat(input?.espesorPerfil) || DEFAULT_PARAMETRIC_CONFIG.espesorPerfil,
        panelMaxLengthM: parseFloat(input?.panelMaxLengthM) || DEFAULT_PARAMETRIC_CONFIG.panelMaxLengthM,
        panelPreferredLengthM: parseFloat(input?.panelPreferredLengthM) || DEFAULT_PARAMETRIC_CONFIG.panelPreferredLengthM,
        // Forzar reglas de negocio
        tipoCubierta: input?.tipoCubierta === 'two_slope' ? 'two_slope' : 'one_slope',
        direccionCaida: 'ancho', // Siempre ancho para este MVP
        aberturas: Array.isArray(input?.aberturas) ? input.aberturas : [],
        murosInternos: Array.isArray(input?.murosInternos) ? input.murosInternos : []
    };
}
