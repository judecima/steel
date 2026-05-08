import { ProjectResult } from '../../core/types';
import { RenderObject, RenderWarning } from './types';
import { RENDER_CONFIG } from './render-config';
import { LOCALIZACION_DOMINIO, t } from './localizacion-dominio';

export function buildRoofMeshes(projectResult: ProjectResult): { objects: RenderObject[], warnings: RenderWarning[] } {
  const objects: RenderObject[] = [];
  const warnings: RenderWarning[] = [];

  const roof = projectResult.house.roof;
  if (!roof || !roof.type) {
    warnings.push({
      id: `render_warn_roof_missing`,
      sourceId: 'house',
      severity: 'warning',
      message: 'Geometría del techo faltante o incompleta',
      position: { x: projectResult.input.width / 2, y: 3.0, z: projectResult.input.length / 2 },
      layer: 'layer_advertencias'
    });
    return { objects, warnings };
  }

  const angleRad = (roof.slope * Math.PI) / 180;
  const deltaHeight = projectResult.input.width * Math.tan(angleRad);

  // Representación simplificada del volumen del techo
  let maxX = projectResult.input.width;
  let maxZ = projectResult.input.length;
  
  if (projectResult.house.muros.length > 0) {
      let calcMaxX = 0; let calcMaxZ = 0;
      for (const w of projectResult.house.muros) {
          if (w.start && w.start.x > calcMaxX) calcMaxX = w.start.x;
          if (w.start && w.start.y > calcMaxZ) calcMaxZ = w.start.y;
          if (w.end && w.end.x > calcMaxX) calcMaxX = w.end.x;
          if (w.end && w.end.y > calcMaxZ) calcMaxZ = w.end.y;
      }
      if (calcMaxX > 0) maxX = calcMaxX;
      if (calcMaxZ > 0) maxZ = calcMaxZ;
  }

  const thickness = 0.05; // Thinner slab
  const overhang = 0.6; // 0.3m each side

  objects.push({
    id: `render_roof_volume`,
    type: 'techo',
    sourceId: 'house',
    position: { x: maxX / 2, y: projectResult.input.minHeight + thickness / 2 + deltaHeight / 2, z: maxZ / 2 },
    rotation: { x: 0, y: 0, z: angleRad },
    dimensions: { x: (maxX + overhang) / Math.cos(angleRad), y: thickness, z: maxZ + overhang },
    material: RENDER_CONFIG.materials.roof.id,
    layer: 'layer_techo',
    visible: true,
    metadata: { 
      [LOCALIZACION_DOMINIO.metadatos.type]: t('techos', roof.type), 
      'Pendiente': roof.slope 
    }
  });

  return { objects, warnings };
}
