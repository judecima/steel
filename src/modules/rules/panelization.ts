import { ENGINE_CONFIG } from '../../core/config';
import { Opening } from '../../core/types';
import { round } from '../../utils/math';
import { logger } from '../../utils/logger';

export function getPanelizationRules() {
  return {
    maxWidth: ENGINE_CONFIG.rules.panelization.maxPanelWidth,
    minWidth: ENGINE_CONFIG.rules.panelization.minPanelWidth,
    openingClearance: ENGINE_CONFIG.rules.panelization.openingEdgeClearance
  };
}

export function isValidPanelWidth(width: number): boolean {
  const { maxWidth, minWidth } = getPanelizationRules();
  return width >= minWidth - 0.001 && width <= maxWidth + 0.001; // Allow small floating point delta
}
