import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';
import { getWallTransform, applyTransform } from './transform-helper';
import { LOCALIZACION_DOMINIO, t } from './localizacion-dominio';
import { crearEtiquetaMuro, traducirIdMuro } from './etiquetas-visuales';

export function buildWallMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const muro of projectResult.house.muros) {
    const tWall = getWallTransform(muro, projectResult.house);
    
    // The wall center in its local coordinate space:
    const pos = applyTransform(muro.length / 2, muro.heightStart / 2, 0, tWall);

    objects.push({
      id: `render_wall_${muro.id}`,
      type: 'muro',
      sourceId: muro.id,
      position: pos,
      rotation: { x: 0, y: tWall.rotY, z: 0 },
      dimensions: { x: muro.length, y: muro.heightStart, z: RENDER_CONFIG.depth },
      material: RENDER_CONFIG.materials.wall_volume.id,
      layer: 'layer_muros',
      visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_muros')?.visibleByDefault || false,
      metadata: { 
        ['Etiqueta']: crearEtiquetaMuro(muro.id),
        ['ID Técnico']: muro.id,
        [LOCALIZACION_DOMINIO.metadatos.role]: t('varios', muro.role),
        ['Muro']: traducirIdMuro(muro.id)
      }
    });
  }

  return objects;
}
