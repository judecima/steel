import { ProjectResult } from '../../core/types';
import { RenderLabel } from './types';
import { RENDER_CONFIG } from './render-config';

export function buildLabels(projectResult: ProjectResult): RenderLabel[] {
  const labels: RenderLabel[] = [];

  for (const panel of projectResult.construction.panels) {
    // Label for panel
    labels.push({
      id: `label_panel_${panel.id}`,
      sourceId: panel.id,
      text: `${panel.id} (${panel.role})`,
      position: { x: panel.offset + panel.width / 2, y: panel.height + 0.3, z: 0 },
      layer: 'layer_labels',
      metadata: { type: 'panel_id' }
    });

    for (const opening of panel.openings) {
      labels.push({
        id: `label_opening_${opening.id}`,
        sourceId: opening.id,
        text: `${opening.type.toUpperCase()} ${opening.width}x${opening.height}`,
        position: { x: panel.offset + opening.position + (opening.width / 2), y: opening.type === 'door' ? opening.height / 2 : opening.height, z: RENDER_CONFIG.depth / 2 + 0.1 },
        layer: 'layer_labels',
        metadata: { type: 'opening_desc' }
      });
    }
  }

  return labels;
}
