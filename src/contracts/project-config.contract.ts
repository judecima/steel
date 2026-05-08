/**
 * PROJECT CONFIG CONTRACT
 * Única fuente de verdad para la configuración paramétrica del usuario.
 * Se utiliza en la UI y se persiste en la tabla 'proyectos'.
 */

export interface ProjectConfigDTO {
  // Dimensiones base
  anchoVivienda: number;  // meters
  largoVivienda: number;  // meters
  alturaMuro: number;     // meters
  
  // Techo
  tipoCubierta: 'one_slope' | 'two_slope';
  pendienteTecho: number; // percentage (0-100) or degrees? Standard is degrees or %
  direccionCaida?: 'north' | 'south' | 'east' | 'west';
  
  // Aberturas (User side)
  aberturas: ProjectOpeningDTO[];
  
  // Muros internos
  murosInternos: ProjectInternalWallDTO[];

  // Reglas estructurales
  separacionMontantes: number; // meters, default 0.4
  tipoPerfil: string;         // e.g. "PGC 100x0.9"
}

export interface ProjectOpeningDTO {
  id: string;
  wallId: string; // "wall_north", etc.
  tipo: 'ventana' | 'puerta';
  ancho: number;
  alto: number;
  posicion: number;   // desde el inicio del muro
  antepecho: number;  // altura desde el suelo (0 para puertas)
}

export interface ProjectInternalWallDTO {
  id: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  altura: number;
  espesor: number;
}

export function validateProjectConfig(config: any): string[] {
  const errors: string[] = [];
  if (!config) return ['Configuración nula'];
  
  if (config.anchoVivienda <= 0) errors.push('Ancho de vivienda debe ser mayor a 0');
  if (config.largoVivienda <= 0) errors.push('Largo de vivienda debe ser mayor a 0');
  if (config.alturaMuro <= 0) errors.push('Altura de muro debe ser mayor a 0');
  
  return errors;
}

export const CONFIG_ERRORS = {
  INVALID_DIMENSIONS: 'DIMENSIONES_INVALIDAS',
  MISSING_WALL_ID: 'WALL_ID_REQUERIDO'
};
