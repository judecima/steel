import { ProjectResult, Panel } from '../../core/types';
import { RenderLabel } from './types';
import { getWallTransform, applyTransform } from './transform-helper';
import { traducirRol } from './etiquetas-visuales';

export function buildPanelCutLabels(projectResult: ProjectResult): RenderLabel[] {
  const labels: RenderLabel[] = [];

  for (const panel of projectResult.construction.panels) {
    const muro = projectResult.house.muros.find(w => w.id === panel.wallId);
    if (!muro) continue;
    const tWall = getWallTransform(muro, projectResult.house);

    for (const stud of panel.studs) {
      const pos = applyTransform(
        panel.offset + stud.position,
        (stud.yOffset || 0) + (stud.height / 2),
        0.1, // Al frente
        tWall
      );

      labels.push({
        id: `label_shop_${stud.id}`,
        sourceId: stud.id,
        text: `${traducirRol(stud.role)} - L=${stud.height.toFixed(3)}`,
        position: pos,
        layer: 'layer_shop_labels',
        metadata: {
            ['Longitud']: stud.height,
            ['ID Pieza']: stud.id,
            ['Rol']: traducirRol(stud.role)
        }
      });
    }
  }

  return labels;
}
