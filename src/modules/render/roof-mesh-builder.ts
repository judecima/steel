import { ProjectResult } from '../../core/types';
import { RenderObject, RenderWarning } from './types';
import { RENDER_CONFIG } from './render-config';

export function buildRoofMeshes(projectResult: ProjectResult): { objects: RenderObject[], warnings: RenderWarning[] } {
  const objects: RenderObject[] = [];
  const warnings: RenderWarning[] = [];

  const roof = projectResult.house.roof;
  if (!roof || !roof.type) {
    warnings.push({
      id: `render_warn_roof_missing`,
      sourceId: 'house',
      severity: 'warning',
      message: 'Roof geometry missing or incomplete',
      position: { x: projectResult.input.width / 2, y: 3.0, z: projectResult.input.length / 2 },
      layer: 'layer_warnings'
    });
    return { objects, warnings };
  }

  // Simplified DTO representation of a roof volume spanning the house
  const w = projectResult.input.width;
  const l = projectResult.input.length;

  objects.push({
    id: `render_roof_volume`,
    type: 'roof',
    sourceId: 'house',
    position: { x: w / 2, y: projectResult.input.minHeight + 0.5, z: l / 2 },
    rotation: { x: 0, y: 0, z: roof.slope > 0 ? 0.1 : 0 }, // Fake slope rotation
    dimensions: { x: w + 0.5, y: 1.0, z: l + 0.5 }, // Fake overhang
    material: RENDER_CONFIG.materials.roof.id,
    layer: 'layer_roof',
    visible: RENDER_CONFIG.layers.find(ly => ly.id === 'layer_roof')?.visibleByDefault || true,
    metadata: { type: roof.type, slope: roof.slope }
  });

  return { objects, warnings };
}
