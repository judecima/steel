import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';

export function buildTrussMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];
  const trusses = projectResult.house.trusses || [];
  const wallHeight = projectResult.input.minHeight;

  for (const truss of trusses) {
    for (const profile of truss.profiles) {
      let materialId = RENDER_CONFIG.materials.track.id;
      
      // Calculate center point in 2D truss plane
      const midX = (profile.start.x + profile.end.x) / 2;
      const midY = (profile.start.y + profile.end.y) / 2;
      
      // Calculate rotation in truss plane
      const dx = profile.end.x - profile.start.x;
      const dy = profile.end.y - profile.start.y;
      const rotationZ = Math.atan2(dy, dx);
      
      // Map to 3D world coordinates
      // X maps to World X
      // Y maps to World Y (starting from wallHeight)
      // Truss positionZ maps to World Z
      
      const position = {
          x: midX,
          y: wallHeight + midY,
          z: truss.positionZ
      };

      objects.push({
        id: `render_truss_profile_${profile.id}`,
        type: 'cercha',
        sourceId: profile.id,
        position,
        rotation: { x: 0, y: 0, z: rotationZ },
        dimensions: { x: profile.length, y: 0.04, z: RENDER_CONFIG.depth },
        material: materialId,
        layer: 'layer_cerchas',
        visible: true,
        metadata: {
          'Tipo': profile.type,
          'Largo': profile.length,
          'Perfil': profile.profileType,
          'Posición Z': truss.positionZ
        }
      });
    }
  }

  return objects;
}
