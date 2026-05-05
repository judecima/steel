import { ProjectResult, StudRole } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';
import { getWallTransform, applyTransform } from './transform-helper';
import { LOCALIZACION_DOMINIO, t } from './localizacion-dominio';
import { crearEtiquetaMontante, traducirIdMuro, traducirIdPanel } from './etiquetas-visuales';

export function buildStudMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const panel of projectResult.construction.panels) {
    const muro = projectResult.house.muros.find(w => w.id === panel.wallId);
    if (!muro) continue;
    const tWall = getWallTransform(muro, projectResult.house);

    for (const stud of panel.studs) {
      let materialId = RENDER_CONFIG.materials.stud_common.id;
      if (stud.role === StudRole.MONTANTE_PRINCIPAL) materialId = RENDER_CONFIG.materials.stud_king.id;
      if (stud.role === StudRole.MONTANTE_APOYO) materialId = RENDER_CONFIG.materials.stud_jack.id;
      if (stud.role === StudRole.MONTANTE_CORTO_SUPERIOR || stud.role === StudRole.MONTANTE_CORTO_INFERIOR) materialId = RENDER_CONFIG.materials.stud_cripple.id;
      if (stud.role === StudRole.SOLERA_VENTANA) materialId = RENDER_CONFIG.materials.track.id;

      const yOff = stud.yOffset || 0;

      if (stud.role === StudRole.SOLERA_VENTANA) {
        // Orientación Horizontal
        const pos = applyTransform(panel.offset + stud.position + stud.height / 2, yOff, 0, tWall);
        objects.push({
          id: `render_sill_${stud.id}`,
          type: 'antepecho',
          sourceId: stud.id,
          position: pos,
          rotation: { x: 0, y: tWall.rotY, z: 0 },
          dimensions: { x: stud.height, y: 0.04, z: RENDER_CONFIG.depth },
          material: materialId,
          layer: 'layer_estructura',
          visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_estructura')?.visibleByDefault || true,
          metadata: { 
            ['Etiqueta']: crearEtiquetaMontante(stud.role),
            ['ID Técnico']: stud.id,
            [LOCALIZACION_DOMINIO.metadatos.role]: t('roles', stud.role),
            [LOCALIZACION_DOMINIO.metadatos.panelId]: traducirIdPanel(panel.id),
            [LOCALIZACION_DOMINIO.metadatos.wallId]: traducirIdMuro(panel.wallId),
            ['ID interno de panel']: panel.id,
            ['ID interno de muro']: panel.wallId
          }
        });
      } else {
        // Orientación Vertical
        const pos = applyTransform(panel.offset + stud.position, yOff + stud.height / 2, 0, tWall);
        objects.push({
          id: `render_stud_${stud.id}`,
          type: 'montante',
          sourceId: stud.id,
          position: pos,
          rotation: { x: 0, y: tWall.rotY, z: 0 },
          dimensions: { x: 0.04, y: stud.height, z: RENDER_CONFIG.depth },
          material: materialId,
          layer: 'layer_estructura',
          visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_estructura')?.visibleByDefault || true,
          metadata: { 
            ['Etiqueta']: crearEtiquetaMontante(stud.role),
            ['ID Técnico']: stud.id,
            [LOCALIZACION_DOMINIO.metadatos.role]: t('roles', stud.role),
            [LOCALIZACION_DOMINIO.metadatos.panelId]: traducirIdPanel(panel.id),
            [LOCALIZACION_DOMINIO.metadatos.wallId]: traducirIdMuro(panel.wallId),
            ['ID interno de panel']: panel.id,
            ['ID interno de muro']: panel.wallId
          }
        });
      }
    }

    // Soleras Superior e Inferior
    const trackWidth = panel.width;
    const posBottom = applyTransform(panel.offset + trackWidth / 2, 0.02, 0, tWall);
    
    objects.push({
      id: `render_track_bottom_${panel.id}`,
      type: 'solera',
      sourceId: panel.id,
      position: posBottom,
      rotation: { x: 0, y: tWall.rotY, z: 0 },
      dimensions: { x: trackWidth, y: 0.04, z: RENDER_CONFIG.depth },
      material: RENDER_CONFIG.materials.track.id,
      layer: 'layer_estructura',
      visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_estructura')?.visibleByDefault || true,
      metadata: { 
        ['Etiqueta']: 'Solera Inferior',
        ['ID Técnico']: `track_bottom_${panel.id}`,
        [LOCALIZACION_DOMINIO.metadatos.role]: t('roles', 'solera_inferior'),
        [LOCALIZACION_DOMINIO.metadatos.panelId]: traducirIdPanel(panel.id),
        ['ID interno de panel']: panel.id
      }
    });
    
    const posTop = applyTransform(panel.offset + trackWidth / 2, panel.height - 0.02, 0, tWall);

    objects.push({
      id: `render_track_top_${panel.id}`,
      type: 'solera',
      sourceId: panel.id,
      position: posTop,
      rotation: { x: 0, y: tWall.rotY, z: 0 },
      dimensions: { x: trackWidth, y: 0.04, z: RENDER_CONFIG.depth },
      material: RENDER_CONFIG.materials.track.id,
      layer: 'layer_estructura',
      visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_estructura')?.visibleByDefault || true,
      metadata: { 
        ['Etiqueta']: 'Solera Superior',
        ['ID Técnico']: `track_top_${panel.id}`,
        [LOCALIZACION_DOMINIO.metadatos.role]: t('roles', 'solera_superior'),
        [LOCALIZACION_DOMINIO.metadatos.panelId]: traducirIdPanel(panel.id),
        ['ID interno de panel']: panel.id
      }
    });
  }

  return objects;
}
