import { Wall, Panel, PanelRole, WallRole } from '../../core/types';
import { generateId } from '../../utils/ids';
import { logger } from '../../utils/logger';
import { StrategicArbiter } from '../intelligence/strategic-arbiter';
import { PanelizationCandidate } from '../intelligence/types';

export function splitWallIntoPanels(wall: Wall): { panels: Panel[]; metadata: Record<string, PanelizationCandidate> } {
  const panels: Panel[] = [];
  
  logger.log('WALL_PANELIZATION_STARTED', wall.id, `Splitting wall of length ${wall.length}`);

  // Phase 1 Intelligence: Delegate decision to the Arbiter with Strategic Context
  const context = { wallRole: wall.role || WallRole.EXTERNAL_LOADBEARING };
  const arbResult = StrategicArbiter.resolveBestPlan(wall.id, wall.length, wall.openings, context);
  const splits = arbResult.winner.splits;

  let currentOffset = 0;
  splits.forEach((width, index) => {
    const panelId = generateId(`panel_${wall.id}`);
    
    const panel: Panel = {
      id: panelId,
      wallId: wall.id,
      role: PanelRole.STRUCTURAL,
      width: width,
      height: Math.max(wall.heightStart, wall.heightEnd),
      offset: currentOffset,
      studs: [],
      openings: wall.openings
        .filter(op => op.position >= currentOffset - 0.01 && op.position + op.width <= currentOffset + width + 0.01),
      junctions: [],
      previousPanelId: index > 0 ? panels[index - 1].id : undefined
    };

    if (index > 0) {
      panels[index - 1].nextPanelId = panelId;
    }

    panels.push(panel);
    currentOffset += width;
  });

  logger.log('WALL_PANELIZED', wall.id, `Generated ${panels.length} panels`, { widths: splits, winner: arbResult.winner.strategy });
  
  return { 
      panels, 
      metadata: arbResult.allEvaluated 
  };
}
