import { ENGINE_CONFIG } from '../../core/config';
import { WallRole } from '../../core/types';

export function getStudSpacing(wallRole: WallRole): number {
  if (wallRole === WallRole.INTERNAL_LOADBEARING || wallRole === WallRole.NON_LOADBEARING) {
    return ENGINE_CONFIG.rules.studs.internalWallSpacing;
  }
  return ENGINE_CONFIG.rules.studs.defaultSpacing;
}

export function getDefaultProfile() {
  return ENGINE_CONFIG.rules.studs.profileDefault;
}

export function getDefaultTrack() {
  return ENGINE_CONFIG.rules.studs.trackDefault;
}
