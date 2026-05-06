import { ProjectResult } from '../../core/types';
import { AssemblyStep } from './types';
import { t } from './localizacion-dominio';

export function buildSequenceScene(projectResult: ProjectResult): { pasos: AssemblyStep[] } {
  const steps: AssemblyStep[] = [];
  const winner = projectResult.construction.metadata?.globalWinner;

  if (!winner || !winner.decidedWalls) {
    return { pasos: [] };
  }

  // Paso 1: Fundación (implícito)
  steps.push({
    id: 'step_foundation',
    order: 1,
    title: 'Fundación y Platea',
    description: 'Preparación de la base nivelada y anclajes químicos.',
    visibleLayers: ['layer_fundacion'],
    highlightedObjectIds: []
  });

  // Pasos de Muros (siguiendo el rastro del planificador)
  winner.decidedWalls.forEach((wallId: string, index: number) => {
    const muro = projectResult.house.muros.find(w => w.id === wallId);
    const wallName = muro ? muro.id : wallId;
    
    steps.push({
      id: `step_wall_${wallId}`,
      order: index + 2,
      title: `Montaje de Muro ${wallId.includes('north') ? 'Norte' : wallId.includes('south') ? 'Sur' : wallId.includes('east') ? 'Este' : 'Oeste'}`,
      description: `Instalación de paneles y alineación de ${wallName}.`,
      visibleLayers: ['layer_fundacion', 'layer_muros', 'layer_paneles', 'layer_montantes', 'layer_soleras', 'layer_dinteles'],
      highlightedObjectIds: projectResult.construction.panels
        .filter(p => p.wallId === wallId)
        .map(p => `render_panel_${p.id}`)
    });
  });

  // Paso Final: Techo
  steps.push({
    id: 'step_roof',
    order: winner.decidedWalls.length + 2,
    title: 'Estructura de Techo',
    description: 'Instalación de correas y cabios superiores.',
    visibleLayers: ['layer_fundacion', 'layer_muros', 'layer_paneles', 'layer_montantes', 'layer_soleras', 'layer_dinteles', 'layer_techo'],
    highlightedObjectIds: []
  });

  return { pasos: steps };
}
