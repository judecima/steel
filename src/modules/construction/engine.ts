import { Wall, Panel, HouseModel, PanelRole } from '../../core/types';
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
  logger.log('HOUSE_PANELIZATION_STARTED', 'house', 'Starting materialization of global winner');

  const allPanels: Panel[] = [];

  // 2. Materialize the winning global plan
  Object.keys(winner.wallSelections).forEach(wallId => {
    const wall = house.walls.find(w => w.id === wallId)!;
    const winningCandidate = winner.wallSelections[wallId];
    
    // Process local candidate to materialize and refine panels
    const wallPanels: Panel[] = [];
    let currentOffset = 0;
    
    winningCandidate.splits.forEach((width, index) => {
      // Create actual Panel objects
      const panel: Panel = {
        id: `panel_${wallId}_${index}`,
        wallId: wallId,
        role: PanelRole.STRUCTURAL, // Default to structural for now
        width: width,
        height: Math.max(wall.heightStart, wall.heightEnd),
        offset: currentOffset,
        studs: [],
        openings: wall.openings.filter(op => op.position >= currentOffset - 0.01 && op.position + op.width <= currentOffset + width + 0.01),
        junctions: [],
        previousPanelId: index > 0 ? wallPanels[index - 1].id : undefined
      };

      if (index > 0) wallPanels[index - 1].nextPanelId = panel.id;

      // Apply refinements
      applyStudLayout(panel, wall.role);
      applyOpeningReinforcements(panel);
      
      const isFirst = index === 0;
      const isLast = index === winningCandidate.splits.length - 1;
      applyJunctions(panel, wall.role, isFirst, isLast);

      wallPanels.push(panel);
      currentOffset += width;
    });

    allPanels.push(...wallPanels);
  });

  logger.log('HOUSE_PANELIZED', 'house', 'Global planning and materialization complete', { totalPanels: allPanels.length });

  return {
    panels: allPanels,
    metadata: {
      candidatesEvaluated: winner.wallSelections,
      globalWinner: winner,
      telemetry: telemetry
    }
  };
}
