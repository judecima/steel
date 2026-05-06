import { ProyectoDTO, VersionProyectoDTO, ConfiguracionProyectoDTO } from './types';

export function crearNuevaVersion(
    proyecto: ProyectoDTO,
    configuracion: ConfiguracionProyectoDTO,
    nota?: string
): VersionProyectoDTO {
    return {
        id: `v_${Date.now()}`,
        fecha: new Date().toISOString(),
        configuracion,
        nota: nota ?? 'Regeneración manual'
    };
}

export function agregarVersion(proyecto: ProyectoDTO, version: VersionProyectoDTO): ProyectoDTO {
    return {
        ...proyecto,
        versionActual: version.id,
        historialVersiones: [...proyecto.historialVersiones, version],
        fechaActualizacion: new Date().toISOString()
    };
}

export function obtenerVersionActual(proyecto: ProyectoDTO): VersionProyectoDTO | undefined {
    return proyecto.historialVersiones.find(v => v.id === proyecto.versionActual);
}

export function obtenerVersionAnterior(proyecto: ProyectoDTO): VersionProyectoDTO | undefined {
    const idx = proyecto.historialVersiones.findIndex(v => v.id === proyecto.versionActual);
    return idx > 0 ? proyecto.historialVersiones[idx - 1] : undefined;
}
