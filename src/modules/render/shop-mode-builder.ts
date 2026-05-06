import { ProjectResult, Panel } from '../../core/types';
import { ShopPanelView, Vector3 } from './types';
import { t } from './localizacion-dominio';

export function buildShopScene(projectResult: ProjectResult): { paneles: ShopPanelView[] } {
  const panelViews: ShopPanelView[] = [];

  for (const panel of projectResult.construction.panels) {
    // Filtrar la CutList existente para este panel
    const items = projectResult.bom.cutList.filter(item => item.sourceEntityId === panel.id);
    
    // Resumen de BOM por tipo de perfil
    const bomSummary: Record<string, number> = {};
    items.forEach(item => {
        bomSummary[item.profileType] = (bomSummary[item.profileType] || 0) + (item.length * item.quantity);
    });

    // Calcular Bounding Box (simplificado para el DTO)
    const boundingBox = {
        min: { x: 0, y: 0, z: -0.05 },
        max: { x: panel.width, y: panel.height, z: 0.05 }
    };

    panelViews.push({
      panelId: panel.id,
      objects: [], // Se llenará en el scene-builder si es necesario, o se referencia la escenaBase
      labels: [], 
      bomSummary,
      boundingBox
    });
  }

  return { paneles: panelViews };
}
