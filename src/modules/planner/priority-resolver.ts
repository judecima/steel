import { Wall, WallRole } from '../../core/types';

export function resolveWallPriority(walls: Wall[]): string[] {
  // 1. Calculate impact weight for each wall
  const weights = walls.map(wall => {
    let weight = 0;

    // A. External Loadbearing is highest priority
    if (wall.role === WallRole.EXTERNAL_LOADBEARING) weight += 1000;

    // B. High opening density increases risk
    weight += wall.openings.length * 100;

    // C. Long walls have more split complexity (Wait, or short walls are more constrained?)
    // Actually, walls with more adjacent walls/junctions are more constrained globally.
    // For now, let's use openings and role as primary drivers.
    weight += wall.length; 

    return { id: wall.id, weight };
  });

  // 2. Sort descending
  return weights
    .sort((a, b) => b.weight - a.weight)
    .map(w => w.id);
}
