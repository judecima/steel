import { ProjectResult } from '../../core/types';
import { RenderObject, RenderWarning } from './types';
import { LOCALIZACION_DOMINIO } from './localizacion-dominio';

export function buildAnchorMeshes(projectResult: ProjectResult): { objects: RenderObject[], warnings: RenderWarning[] } {
  const objects: RenderObject[] = [];
  const warnings: RenderWarning[] = [];
  
  // Anchors are out of scope for Phase 4A. Generate a warning marker placeholder.
  warnings.push({
    id: `render_warn_anchors_pending`,
    sourceId: 'house_anchors',
    severity: 'warning',
    message: 'Diseño de anclajes no generado aún — pendiente Fase 4B / datos estructurales de anclajes',
    position: { x: projectResult.input.width / 2, y: 0.1, z: projectResult.input.length / 2 },
    layer: 'layer_anclajes'
  });

  // Also push a physical warning marker object so the layer isn't technically empty
  objects.push({
    id: `render_anchor_placeholder`,
    type: 'advertencia',
    sourceId: 'house_anchors',
    position: { x: projectResult.input.width / 2, y: 0.1, z: projectResult.input.length / 2 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { x: 0.3, y: 0.3, z: 0.3 },
    material: 'mat_warn_rev',
    layer: 'layer_anclajes',
    visible: true,
    metadata: { [LOCALIZACION_DOMINIO.metadatos.note]: 'Marcador de posición para anclajes faltantes' }
  });

  return { objects, warnings };
}
