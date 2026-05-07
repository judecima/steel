import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';
import { getWallTransform, applyTransform } from './transform-helper';
import { LOCALIZACION_DOMINIO, t } from './localizacion-dominio';
import { crearEtiquetaAbertura, traducirIdMuro, traducirIdPanel } from './etiquetas-visuales';

export function buildOpeningMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const panel of projectResult.construction.panels) {
    const muro = projectResult.house.muros.find(w => w.id === panel.wallId);
    if (!muro) continue;
    const tWall = getWallTransform(muro, projectResult.house);

    for (const abertura of panel.aberturas) {
      const pos = applyTransform(
        panel.offset + abertura.position + (abertura.width / 2),
        (abertura.type === 'puerta') ? abertura.height / 2 : (abertura.sillHeight || 0) + (abertura.height / 2),
        0,
        tWall
      );

      // Volumen del vacío de la abertura
      objects.push({
        id: `render_opening_${abertura.id}`,
        type: (abertura.type === 'puerta') ? 'puerta' : 'abertura',
        sourceId: abertura.id,
        position: pos,
        rotation: { x: 0, y: tWall.rotY, z: 0 },
        dimensions: { x: abertura.width, y: abertura.height, z: RENDER_CONFIG.depth * 1.1 },
        material: RENDER_CONFIG.materials.opening_void.id,
        layer: 'layer_aberturas',
        visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_aberturas')?.visibleByDefault || true,
        metadata: { 
          ['Etiqueta']: crearEtiquetaAbertura(abertura.type, abertura.width, abertura.height),
          ['ID Técnico']: abertura.id,
          [LOCALIZACION_DOMINIO.metadatos.type]: t('aberturas', abertura.type),
          [LOCALIZACION_DOMINIO.metadatos.panelId]: traducirIdPanel(panel.id),
          [LOCALIZACION_DOMINIO.metadatos.wallId]: traducirIdMuro(panel.wallId),
          ['ID interno de panel']: panel.id,
          ['ID interno de muro']: panel.wallId,
          ['role']: 'opening'
        }
      });
    }
  }

  return objects;
}
