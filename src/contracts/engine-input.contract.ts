/**
 * ENGINE INPUT CONTRACT
 * Contrato estricto para el EngineFacade. 
 * Cualquier input de UI debe pasar por un Mapper antes de llegar aquí.
 */

export interface EngineInputDTO {
  width: number;       // meters
  length: number;      // meters
  minHeight: number;   // meters
  
  roof: {
    type: 'one_slope' | 'two_slope';
    slope: number;
  };
  
  openings: EngineOpeningDTO[];
  
  internalWalls?: EngineInternalWallDTO[];
  
  // Opciones de ingeniería
  engineering?: {
    studSpacing: number; // meters
    preferredProfile: string;
  };
}

export interface EngineOpeningDTO {
  wallId: string; // wall_north, wall_south, wall_east, wall_west
  type: 'window' | 'door';
  width: number;
  height: number;
  position: number;
  sillHeight: number;
}

export interface EngineInternalWallDTO {
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  height: number;
  thickness: number;
}

export function validateEngineInput(input: any): boolean {
  // Los validadores del motor deben ser exhaustivos
  return (
    typeof input.width === 'number' &&
    typeof input.length === 'number' &&
    Array.isArray(input.openings)
  );
}
