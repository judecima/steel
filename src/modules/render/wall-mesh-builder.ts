import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';

export function buildWallMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const wall of projectResult.house.walls) {
    // Basic translation: x, z depends on orientation. 
    // This is a naive positioning assuming walls start at (0,0) and go along axis.
    // In a real 3D system, wall line vectors determine this.
    // For DTO, we define position as center of wall bottom.
    
    // We infer basic orientation from wall ID in our parametric house:
    // north: x = width/2, z = 0
    // east: x = width, z = length/2
    // south: x = width/2, z = length
    // west: x = 0, z = length/2
    
    let x = 0;
    let z = 0;
    let dimX = RENDER_CONFIG.depth;
    let dimZ = wall.length;
    let rotY = 0;

    const w = projectResult.input.width;
    const l = projectResult.input.length;

    if (wall.id.includes('north')) {
      x = w / 2; z = 0; dimX = wall.length; dimZ = RENDER_CONFIG.depth;
    } else if (wall.id.includes('south')) {
      x = w / 2; z = l; dimX = wall.length; dimZ = RENDER_CONFIG.depth;
    } else if (wall.id.includes('east')) {
      x = w; z = l / 2; dimX = RENDER_CONFIG.depth; dimZ = wall.length;
    } else if (wall.id.includes('west')) {
      x = 0; z = l / 2; dimX = RENDER_CONFIG.depth; dimZ = wall.length;
    }

    objects.push({
      id: `render_wall_${wall.id}`,
      type: 'wall',
      sourceId: wall.id,
      position: { x, y: wall.heightStart / 2, z },
      rotation: { x: 0, y: rotY, z: 0 },
      dimensions: { x: dimX, y: wall.heightStart, z: dimZ },
      material: RENDER_CONFIG.materials.wall_volume.id,
      layer: 'layer_walls',
      visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_walls')?.visibleByDefault || false,
      metadata: { role: wall.role }
    });
  }

  return objects;
}
