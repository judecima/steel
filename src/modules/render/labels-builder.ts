import { ProjectResult } from '../../core/types';
import { RenderLabel } from './types';
import { RENDER_CONFIG } from './render-config';
import { getWallTransform, applyTransform } from './transform-helper';
import { LOCALIZACION_DOMINIO } from './localizacion-dominio';
import { crearEtiquetaPanel, crearEtiquetaAbertura } from './etiquetas-visuales';

export function buildLabels(projectResult: ProjectResult): RenderLabel[] {
  const labels: RenderLabel[] = [];

  for (const panel of projectResult.construction.panels) {
    const muro = projectResult.house.muros.find(w => w.id === panel.wallId);
    if (!muro) continue;
    const tWall = getWallTransform(muro, projectResult.house);

    // Etiqueta para panel
    const panelLabelPos = applyTransform(panel.offset + panel.width / 2, panel.height + 0.3, 0.15, tWall);

    labels.push({
      id: `label_panel_${panel.id}`,
      sourceId: panel.id,
      text: crearEtiquetaPanel(panel.id),
      position: panelLabelPos,
      layer: 'layer_etiquetas',
      metadata: { 
        [LOCALIZACION_DOMINIO.metadatos.type]: 'ID de Panel',
        'Etiqueta': crearEtiquetaPanel(panel.id),
        'ID Técnico': panel.id
      }
    });

    for (const abertura of panel.aberturas) {
      const openingLabelPos = applyTransform(
        panel.offset + abertura.position + (abertura.width / 2),
        (abertura.type === 'puerta') ? abertura.height / 2 : abertura.height,
        0.3, // offset further outward
        tWall
      );

      labels.push({
        id: `label_opening_${abertura.id}`,
        sourceId: abertura.id,
        text: crearEtiquetaAbertura(abertura.type, abertura.width, abertura.height),
        position: openingLabelPos,
        layer: 'layer_etiquetas',
        metadata: { 
          [LOCALIZACION_DOMINIO.metadatos.type]: 'Desc. Abertura',
          'ID Técnico': abertura.id
        }
      });
    }
  }

  return labels;
}
