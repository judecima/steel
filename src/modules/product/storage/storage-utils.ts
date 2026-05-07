import { ProyectoDTO, EstadoProyecto } from '../types';

/**
 * Asegura que el objeto proyecto tenga todos los campos obligatorios para persistencia.
 * Evita errores de restricciones NOT NULL en la base de datos.
 */
export function ensureProjectPersistenceDefaults(project: any): ProyectoDTO {
  return {
    ...project,
    estado: project.estado || project.status || 'borrador',
    fechaActualizacion: new Date().toISOString(),
    versionActual: project.versionActual || 'v1',
    historialVersiones: project.historialVersiones || []
  };
}
