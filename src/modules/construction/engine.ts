import { Muro, Panel, HouseModel, PanelRole } from '../../core/types';
import { logger } from '../../utils/logger';
import { applyStudLayout } from './stud-layout';
import { applyOpeningReinforcements } from './openings';
import { applyJunctions } from './junctions';
import { PanelizationCandidate } from '../intelligence/types';
import { GlobalPlanCandidate, PlannerTelemetry } from '../global-planning/types';
import { ENGINE_CONFIG } from '../../core/config';

export type ConstructionResult = {
    panels: Panel[];
    metadata: {
        candidatesEvaluated: Record<string, PanelizationCandidate>;
        globalWinner?: GlobalPlanCandidate;
        telemetry?: PlannerTelemetry;
    }
};

export function panelizeHouse(house: HouseModel, winner: GlobalPlanCandidate, telemetry?: PlannerTelemetry): ConstructionResult {
  logger.log('HOUSE_PANELIZATION_STARTED', 'house', 'Iniciando materialización del ganador global');

  const allPanels: Panel[] = [];

  // 2. Materializar el plan global ganador
  Object.keys(winner.wallSelections).forEach(wallId => {
    const muro = house.muros.find(w => w.id === wallId)!;
    const winningCandidate = winner.wallSelections[wallId];
    
    // Procesar candidato local para materializar y refinar paneles
    const wallPanels: Panel[] = [];
    let currentOffset = 0;
    
    winningCandidate.splits.forEach((width, index) => {
      // Crear objetos Panel reales
      const panel: Panel = {
        id: `panel_${wallId}_${index}`,
        wallId: wallId,
        role: PanelRole.STRUCTURAL,
        width: width,
        height: Math.max(muro.heightStart, muro.heightEnd),
        offset: currentOffset,
        studs: [],
        aberturas: muro.aberturas.filter(op => op.position >= currentOffset - 0.01 && op.position + op.width <= currentOffset + width + 0.01),
        junctions: [],
        previousPanelId: index > 0 ? wallPanels[index - 1].id : undefined
      };

      if (index > 0) wallPanels[index - 1].nextPanelId = panel.id;

      // Aplicar refinamientos
      applyStudLayout(panel, muro.role);
      applyOpeningReinforcements(panel);
      
      const isFirst = index === 0;
      const isLast = index === winningCandidate.splits.length - 1;
      applyJunctions(panel, muro.role, isFirst, isLast);

      wallPanels.push(panel);
      currentOffset += width;
    });

    allPanels.push(...wallPanels);
  });

  logger.log('HOUSE_PANELIZED', 'house', 'Planificación global y materialización completas', { totalPanels: allPanels.length });

  return {
    panels: allPanels,
    metadata: {
      candidatesEvaluated: winner.wallSelections,
      globalWinner: winner,
      telemetry: telemetry
    }
  };
}
