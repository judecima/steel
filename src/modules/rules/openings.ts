import { ENGINE_CONFIG } from '../../core/config';

export function getOpeningRules() {
  return {
    headerStrategy: ENGINE_CONFIG.rules.openings.headerStrategy,
    minSillHeight: ENGINE_CONFIG.rules.openings.minSillHeight,
    defaultDoorHeight: ENGINE_CONFIG.rules.openings.defaultDoorHeight
  };
}
