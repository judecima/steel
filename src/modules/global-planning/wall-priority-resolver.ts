import { Wall, WallRole } from '../../core/types';

export function resolveWallPriority(walls: Wall[]): string[] {
  // Sort walls deterministically
  const sorted = [...walls].sort((a, b) => {
    // 1. External load-bearing walls first
    if (a.role === WallRole.EXTERNAL_LOADBEARING && b.role !== WallRole.EXTERNAL_LOADBEARING) return -1;
    if (b.role === WallRole.EXTERNAL_LOADBEARING && a.role !== WallRole.EXTERNAL_LOADBEARING) return 1;

    // 2. Higher opening density
    const aDensity = a.openings.reduce((sum, o) => sum + o.width, 0) / a.length;
    const bDensity = b.openings.reduce((sum, o) => sum + o.width, 0) / b.length;
    if (Math.abs(aDensity - bDensity) > 0.01) {
      return bDensity - aDensity;
    }

    // 3. More critical junctions (Not fully modeled in Wall type right now, fallback)
    
    // 4. Fallback to ID lexical sort to maintain stable tie-breaks
    return a.id.localeCompare(b.id);
  });

  return sorted.map(w => w.id);
}
