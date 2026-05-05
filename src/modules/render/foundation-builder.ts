import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';
import { LOCALIZACION_DOMINIO } from './localizacion-dominio';

export function buildFoundationMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];
  
  const w = projectResult.input.width;
  const l = projectResult.input.length;
  const thickness = 0.2; // 200mm slab
  
  objects.push({
    id: `render_foundation_slab`,
    type: 'fundacion',
    sourceId: 'house_foundation',
    position: { x: w / 2, y: -thickness / 2, z: l / 2 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { x: w, y: thickness, z: l },
    material: RENDER_CONFIG.materials.foundation?.id || 'mat_foundation',
    layer: 'layer_fundaciones',
    visible: RENDER_CONFIG.layers.find(ly => ly.id === 'layer_fundaciones')?.visibleByDefault || true,
    metadata: { [LOCALIZACION_DOMINIO.metadatos.note]: 'Losa de referencia visual únicamente' }
  });

  return objects;
}
