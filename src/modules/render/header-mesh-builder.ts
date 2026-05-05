import { ProjectResult } from '../../core/types';
import { RenderObject } from './types';
import { RENDER_CONFIG } from './render-config';
import { getWallTransform, applyTransform } from './transform-helper';
import { LOCALIZACION_DOMINIO, t } from './localizacion-dominio';
import { crearEtiquetaDintel, traducirIdMuro, traducirIdPanel } from './etiquetas-visuales';

export function buildHeaderMeshes(projectResult: ProjectResult): RenderObject[] {
  const objects: RenderObject[] = [];

  for (const panel of projectResult.construction.panels) {
    const muro = projectResult.house.muros.find(w => w.id === panel.wallId);
    if (!muro) continue;
    const tWall = getWallTransform(muro, projectResult.house);

    for (const abertura of panel.aberturas) {
      if (abertura.dintel) {
        // Representación precisa de la parte superior
        const yTop = (abertura.sillHeight || 0) + abertura.height;
        
        const pos = applyTransform(
          panel.offset + abertura.position + (abertura.dintel.span / 2),
          yTop + 0.1, // El centro está 100mm por encima de la abertura (0.2m de espesor)
          0,
          tWall
        );

        objects.push({
          id: `render_header_${abertura.id}`,
          type: 'dintel',
          sourceId: abertura.id,
          position: pos,
          rotation: { x: 0, y: tWall.rotY, z: 0 },
          dimensions: { x: abertura.dintel.span, y: 0.2, z: RENDER_CONFIG.depth }, // dintel abstracto de 200mm de alto
          material: RENDER_CONFIG.materials.header.id,
          layer: 'layer_dinteles',
          visible: RENDER_CONFIG.layers.find(l => l.id === 'layer_dinteles')?.visibleByDefault || true,
          metadata: { 
            ['Etiqueta']: crearEtiquetaDintel(abertura.dintel.span),
            ['ID Técnico']: `dintel_${abertura.id}`,
            [LOCALIZACION_DOMINIO.metadatos.strategy]: t('estrategias', abertura.dintel.strategy), 
            ['Luz']: abertura.dintel.span, 
            [LOCALIZACION_DOMINIO.metadatos.panelId]: traducirIdPanel(panel.id),
            [LOCALIZACION_DOMINIO.metadatos.wallId]: traducirIdMuro(panel.wallId),
            ['ID interno de panel']: panel.id,
            ['ID interno de muro']: panel.wallId,
            ['ID interno de abertura']: abertura.id
          }
        });
      }
    }
  }

  return objects;
}
