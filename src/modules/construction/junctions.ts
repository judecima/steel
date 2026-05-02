import { Panel, StudRole, WallRole, JunctionType } from '../../core/types';
import { generateId } from '../../utils/ids';
import { logger } from '../../utils/logger';
import { getDefaultProfile } from '../rules/studs';
import { getCornerStrategy } from '../rules/junctions';

export function applyJunctions(panel: Panel, wallRole: WallRole, isStart: boolean, isEnd: boolean): void {
  const profile = getDefaultProfile();
  const strategy = getCornerStrategy(wallRole);

  if (isStart && strategy === JunctionType.CORNER_CALIFORNIA) {
    logger.log('CORNER_STRATEGY_APPLIED', panel.id, 'Applying California Corner at start', { wallRole });
    // Add two extra studs at the start to form the 3-stud corner
    panel.studs.push({ id: generateId('corner'), role: StudRole.CORNER, position: 0.05, height: panel.height, profileType: profile });
    panel.studs.push({ id: generateId('corner'), role: StudRole.CORNER, position: 0.10, height: panel.height, profileType: profile });
  }

  if (isEnd && strategy === JunctionType.CORNER_CALIFORNIA) {
    logger.log('CORNER_STRATEGY_APPLIED', panel.id, 'Applying California Corner at end', { wallRole });
    // Add two extra studs at the end
    panel.studs.push({ id: generateId('corner'), role: StudRole.CORNER, position: panel.width - 0.05, height: panel.height, profileType: profile });
    panel.studs.push({ id: generateId('corner'), role: StudRole.CORNER, position: panel.width - 0.10, height: panel.height, profileType: profile });
  }
}
