import { ProjectResult } from '../../core/types';
import { RenderObject, RenderWarning } from './types';
import { RENDER_CONFIG } from './render-config';
import { LOCALIZACION_DOMINIO } from './localizacion-dominio';

export function buildFoundationMeshes(projectResult: ProjectResult): { objects: RenderObject[], warnings: RenderWarning[] } {
  const objects: RenderObject[] = [];
  const warnings: RenderWarning[] = [];
  
  const w = projectResult.input.width;
  const l = projectResult.input.length;
  const thickness = 0.2; // 200mm slab

  if (!w || !l || w <= 0 || l <= 0) {
    warnings.push({
      id: 'warn_foundation_missing_data',
      sourceId: 'project_input',
      severity: 'warning',
      message: 'Fundación no generada — faltan datos de base (dimensiones del proyecto inválidas)',
      position: { x: 0, y: 0.1, z: 0 },
      layer: 'layer_fundaciones'
    });
    return { objects, warnings };
  }
  
  objects.push({
    id: `render_foundation_slab`,
    type: 'fundacion',
    sourceId: 'house_foundation',
    position: { x: w / 2, y: -thickness / 2, z: l / 2 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { x: w, y: thickness, z: l },
    material: RENDER_CONFIG.materials.foundation?.id || 'mat_foundation',
    layer: 'layer_fundaciones',
    visible: true, // Visible by default for QA
    metadata: { 
      [LOCALIZACION_DOMINIO.metadatos.type]: 'Fundación',
      [LOCALIZACION_DOMINIO.metadatos.note]: 'Referencia visual',
      'Estado': 'Referencia visual'
    }
  });

  return { objects, warnings };
}
