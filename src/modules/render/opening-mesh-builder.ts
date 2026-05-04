import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';

export function buildOpeningMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const panel of projectResult.construction.panels) {
    for (const opening of panel.openings) {
      // Opening void volume
      objects.push({
        id: `render_opening_${opening.id}`,
        type: 'opening',
        sourceId: opening.id,
        position: { 
          x: panel.offset + opening.position + (opening.width / 2), 
          y: opening.type === 'door' ? opening.height / 2 : opening.height, 
          z: 0 
        }, // Simplistic positioning for void
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { x: opening.width, y: opening.height, z: RENDER_CONFIG.depth * 1.1 }, // Slightly thicker to stick out of panel
        material: RENDER_CONFIG.materials.opening_void.id,
        layer: 'layer_openings',
        visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_openings')?.visibleByDefault || true,
        metadata: { type: opening.type, panelId: panel.id, wallId: panel.wallId }
      });
    }
  }

  return objects;
}
