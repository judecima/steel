import { HouseInput, Muro, WallRole, HouseModel } from '../../core/types';
import { generateId } from '../../utils/ids';
import { logger } from '../../utils/logger';
import { resolveRoofMetadata } from '../roof/engine';

export function generateGeometry(input: HouseInput): HouseModel {
  logger.log('HOUSE_GENERATION_STARTED', 'system', 'Generando geometría inicial de la casa');
  
  const roof = resolveRoofMetadata(input);
  logger.log('ROOF_RESOLVED', 'house', 'Geometría de techo resuelta', { 
    type: roof.type, 
    low: roof.lowSideHeight, 
    high: roof.highSideHeight 
  });

  const muros: Muro[] = [];

  // Asumiendo generación en sentido horario: Norte, Este, Sur, Oeste
  // Muro 1: Norte (Ancho)
  muros.push(createWall('wall_north', input.width, roof.lowSideHeight, roof.lowSideHeight, WallRole.EXTERNAL_LOADBEARING, {x: 0, y: 0}, {x: input.width, y: 0}));
  
  // Muro 2: Este (Largo)
  muros.push(createWall('wall_east', input.length, roof.lowSideHeight, roof.highSideHeight, WallRole.EXTERNAL_LOADBEARING, {x: input.width, y: 0}, {x: input.width, y: input.length}));
  
  // Muro 3: Sur (Ancho)
  muros.push(createWall('wall_south', input.width, roof.highSideHeight, roof.highSideHeight, WallRole.EXTERNAL_LOADBEARING, {x: input.width, y: input.length}, {x: 0, y: input.length}));
  
  // Muro 4: Oeste (Largo)
  muros.push(createWall('wall_west', input.length, roof.highSideHeight, roof.lowSideHeight, WallRole.EXTERNAL_LOADBEARING, {x: 0, y: input.length}, {x: 0, y: 0}));

  // Mapear aberturas a los muros
  if (input.openings) {
    input.openings.forEach(op => {
      const muro = muros.find(w => w.id === op.wallId);
      if (muro) {
        muro.aberturas.push({
          id: generateId('abertura'),
          type: op.type,
          width: op.width,
          height: op.height,
          position: op.position,
          sillHeight: op.sillHeight || 0
        });
      }
    });
  }

  logger.log('HOUSE_GENERATED', 'house', 'Geometría de fundación completa', { wallCount: muros.length });

  return {
    muros,
    roof
  };
}

function createWall(id: string, length: number, hStart: number, hEnd: number, role: WallRole, start: {x:number, y:number}, end: {x:number, y:number}): Muro {
  return {
    id,
    role,
    length,
    heightStart: hStart,
    heightEnd: hEnd,
    start,
    end,
    aberturas: []
  };
}
