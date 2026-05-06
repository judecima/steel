import { ConfiguracionProyectoDTO } from './types';

export const CONFIG_DEFAULTS: ConfiguracionProyectoDTO = {
    alturaMuro: 2.6,
    espesorPerfil: 0.9,
    separacionMontantes: 0.4,
    tipoPerfil: 'PGC 100x0.9',
    material: 'acero_galvanizado',
    tipoCubierta: 'one_slope',
    tipoFundacion: 'losa'
};

export function validarConfiguracion(config: ConfiguracionProyectoDTO): string[] {
    const errores: string[] = [];
    if (config.alturaMuro < 2.0 || config.alturaMuro > 6.0) {
        errores.push('La altura de muro debe estar entre 2.0 y 6.0 metros.');
    }
    if (config.separacionMontantes < 0.3 || config.separacionMontantes > 0.6) {
        errores.push('La separación de montantes debe estar entre 300mm y 600mm.');
    }
    if (!config.tipoPerfil || config.tipoPerfil.trim() === '') {
        errores.push('El tipo de perfil no puede estar vacío.');
    }
    return errores;
}

export function configuracionDesdeHouseInput(config: ConfiguracionProyectoDTO) {
    return {
        minHeight: config.alturaMuro,
        roofType: config.tipoCubierta,
        roofSlope: 0
    };
}
