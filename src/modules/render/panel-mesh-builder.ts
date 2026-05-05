import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';
import { getWallTransform, applyTransform } from './transform-helper';
import { LOCALIZACION_DOMINIO, t } from './localizacion-dominio';
import { crearEtiquetaPanel, traducirIdMuro, traducirIdPanel } from './etiquetas-visuales';

export function buildPanelMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const panel of projectResult.construction.panels) {
    const muro = projectResult.house.muros.find(w => w.id === panel.wallId);
    if (!muro) continue;

    const tPanel = getWallTransform(muro, projectResult.house);
    
    const w = panel.width;
    const h = panel.height;
    const pos = applyTransform(panel.offset + w / 2, h / 2, 0, tPanel);
    
    objects.push({
      id: `render_panel_${panel.id}`,
      type: 'panel',
      sourceId: panel.id,
      position: pos,
      rotation: { x: 0, y: tPanel.rotY, z: 0 },
      dimensions: { x: w, y: h, z: RENDER_CONFIG.depth },
      material: RENDER_CONFIG.materials.panel_volume.id,
      layer: 'layer_paneles',
      visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_paneles')?.visibleByDefault || false,
      metadata: { 
        ['Etiqueta']: crearEtiquetaPanel(panel.id),
        ['ID Técnico']: panel.id,
        [LOCALIZACION_DOMINIO.metadatos.wallId]: traducirIdMuro(panel.wallId), 
        [LOCALIZACION_DOMINIO.metadatos.panelId]: traducirIdPanel(panel.id),
        [LOCALIZACION_DOMINIO.metadatos.role]: t('varios', panel.role),
        ['ID interno de muro']: panel.wallId,
        ['ID interno de panel']: panel.id
      }
    });
  }

  return objects;
}
