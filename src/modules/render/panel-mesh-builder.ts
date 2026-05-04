import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';

export function buildPanelMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const panel of projectResult.construction.panels) {
    // In a real system, the panel has its own local coordinate space within the wall.
    // For DTO, we assign relative positioning assuming local origin.
    const w = panel.width;
    const h = panel.height;
    
    objects.push({
      id: `render_panel_${panel.id}`,
      type: 'panel',
      sourceId: panel.id,
      position: { x: panel.offset + w / 2, y: h / 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { x: w, y: h, z: RENDER_CONFIG.depth },
      material: RENDER_CONFIG.materials.panel_volume.id,
      layer: 'layer_panels',
      visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_panels')?.visibleByDefault || false,
      metadata: { wallId: panel.wallId, role: panel.role }
    });
  }

  return objects;
}
