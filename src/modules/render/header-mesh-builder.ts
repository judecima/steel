import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';

export function buildHeaderMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const panel of projectResult.construction.panels) {
    for (const opening of panel.openings) {
      if (opening.header) {
        // Simple top representation
        const yTop = opening.type === 'door' ? opening.height : 2.0; // Assume top of window is at 2.0m for mock purposes
        
        objects.push({
          id: `render_header_${opening.id}`,
          type: 'header',
          sourceId: opening.id,
          position: { 
            x: panel.offset + opening.position + (opening.header.span / 2), 
            y: yTop + 0.1, // 100mm above opening
            z: 0 
          },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { x: opening.header.span, y: 0.2, z: RENDER_CONFIG.depth }, // 200mm high header abstract
          material: RENDER_CONFIG.materials.header.id,
          layer: 'layer_headers',
          visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_headers')?.visibleByDefault || true,
          metadata: { strategy: opening.header.strategy, span: opening.header.span, panelId: panel.id }
        });
      }
    }
  }

  return objects;
}
