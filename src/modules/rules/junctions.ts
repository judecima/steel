import { ENGINE_CONFIG } from '../../core/config';
import { WallRole } from '../../core/types';

export function getCornerStrategy(wallRole: WallRole) {
  if (wallRole === WallRole.EXTERNAL_LOADBEARING) {
    return ENGINE_CONFIG.rules.junctions.externalCornerStrategy;
  }
  return ENGINE_CONFIG.rules.junctions.internalCornerStrategy;
}
