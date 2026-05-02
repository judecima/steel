import { HouseInput, Wall, WallRole, HouseModel } from '../../core/types';
import { generateId } from '../../utils/ids';
import { logger } from '../../utils/logger';
import { resolveRoofMetadata } from '../roof/engine';

export function generateGeometry(input: HouseInput): HouseModel {
  logger.log('HOUSE_GENERATION_STARTED', 'system', 'Generating initial house geometry');
  
  const roof = resolveRoofMetadata(input);
  logger.log('ROOF_RESOLVED', 'house', 'Roof geometry resolved', { 
    type: roof.type, 
    low: roof.lowSideHeight, 
    high: roof.highSideHeight 
  });

  const walls: Wall[] = [];

  // Assuming clockwise generation: North, East, South, West
  // Wall 1: North (Width)
  walls.push(createWall('wall_north', input.width, roof.lowSideHeight, roof.lowSideHeight, WallRole.EXTERNAL_LOADBEARING, {x: 0, y: 0}, {x: input.width, y: 0}));
  
  // Wall 2: East (Length)
  walls.push(createWall('wall_east', input.length, roof.lowSideHeight, roof.highSideHeight, WallRole.EXTERNAL_LOADBEARING, {x: input.width, y: 0}, {x: input.width, y: input.length}));
  
  // Wall 3: South (Width)
  walls.push(createWall('wall_south', input.width, roof.highSideHeight, roof.highSideHeight, WallRole.EXTERNAL_LOADBEARING, {x: input.width, y: input.length}, {x: 0, y: input.length}));
  
  // Wall 4: West (Length)
  walls.push(createWall('wall_west', input.length, roof.highSideHeight, roof.lowSideHeight, WallRole.EXTERNAL_LOADBEARING, {x: 0, y: input.length}, {x: 0, y: 0}));

  // Map openings to walls
  if (input.openings) {
    input.openings.forEach(op => {
      const wall = walls.find(w => w.id === op.wallId);
      if (wall) {
        wall.openings.push({
          id: generateId('op'),
          type: op.type,
          width: op.width,
          height: op.height,
          position: op.position,
          sillHeight: op.sillHeight || 0
        });
      }
    });
  }

  logger.log('HOUSE_GENERATED', 'house', 'Foundation geometry complete', { wallCount: walls.length });

  return {
    walls,
    roof
  };
}

function createWall(id: string, length: number, hStart: number, hEnd: number, role: WallRole, start: {x:number, y:number}, end: {x:number, y:number}): Wall {
  return {
    id,
    role,
    length,
    heightStart: hStart,
    heightEnd: hEnd,
    start,
    end,
    openings: []
  };
}
