import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';

export function buildStudMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const panel of projectResult.construction.panels) {
    for (const stud of panel.studs) {
      let materialId = RENDER_CONFIG.materials.stud_common.id;
      if (stud.role === 'king') materialId = RENDER_CONFIG.materials.stud_king.id;
      if (stud.role === 'jack') materialId = RENDER_CONFIG.materials.stud_jack.id;

      objects.push({
        id: `render_stud_${stud.id}`,
        type: 'stud',
        sourceId: stud.id,
        position: { x: panel.offset + stud.position, y: stud.height / 2, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { x: 0.04, y: stud.height, z: RENDER_CONFIG.depth }, // 40mm flange
        material: materialId,
        layer: 'layer_framing',
        visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_framing')?.visibleByDefault || true,
        metadata: { role: stud.role, panelId: panel.id, wallId: panel.wallId }
      });
    }

    // Tracks
    const trackWidth = panel.width;
    objects.push({
      id: `render_track_bottom_${panel.id}`,
      type: 'track',
      sourceId: panel.id,
      position: { x: panel.offset + trackWidth / 2, y: 0.02, z: 0 }, // 20mm height approx
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { x: trackWidth, y: 0.04, z: RENDER_CONFIG.depth },
      material: RENDER_CONFIG.materials.track.id,
      layer: 'layer_framing',
      visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_framing')?.visibleByDefault || true,
      metadata: { role: 'bottom_track', panelId: panel.id }
    });
    
    objects.push({
      id: `render_track_top_${panel.id}`,
      type: 'track',
      sourceId: panel.id,
      position: { x: panel.offset + trackWidth / 2, y: panel.height - 0.02, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { x: trackWidth, y: 0.04, z: RENDER_CONFIG.depth },
      material: RENDER_CONFIG.materials.track.id,
      layer: 'layer_framing',
      visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_framing')?.visibleByDefault || true,
      metadata: { role: 'top_track', panelId: panel.id }
    });
  }

  return objects;
}
