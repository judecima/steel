import { Muro, HouseModel } from '../../core/types';

export interface WallTransform {
  baseX: number;
  baseZ: number;
  dirX: number;
  dirZ: number;
  rotY: number;
}

export function getWallTransform(muro: Muro, house: HouseModel): WallTransform {
  if (muro.start && muro.end) {
    const dx = muro.end.x - muro.start.x;
    const dy = muro.end.y - muro.start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 0) {
      return {
        baseX: muro.start.x,
        baseZ: muro.start.y,
        dirX: dx / length,
        dirZ: dy / length,
        rotY: -Math.atan2(dy, dx)
      };
    }
  }

  // Fallback determinístico basado en ID
  let w = 4;
  let l = 4;
  
  if (house && house.muros) {
      let maxX = 0; let maxY = 0;
      for (const m of house.muros) {
          if (m.start && m.start.x > maxX) maxX = m.start.x;
          if (m.start && m.start.y > maxY) maxY = m.start.y;
          if (m.end && m.end.x > maxX) maxX = m.end.x;
          if (m.end && m.end.y > maxY) maxY = m.end.y;
      }
      if (maxX > 0) w = maxX;
      if (maxY > 0) l = maxY;
  }

  if (muro.id.includes('north')) return { baseX: 0, baseZ: 0, dirX: 1, dirZ: 0, rotY: 0 };
  if (muro.id.includes('south')) return { baseX: w, baseZ: l, dirX: -1, dirZ: 0, rotY: Math.PI };
  if (muro.id.includes('east')) return { baseX: w, baseZ: 0, dirX: 0, dirZ: 1, rotY: -Math.PI / 2 };
  if (muro.id.includes('west')) return { baseX: 0, baseZ: l, dirX: 0, dirZ: -1, rotY: Math.PI / 2 };
  
  return { baseX: 0, baseZ: 0, dirX: 1, dirZ: 0, rotY: 0 };
}

export function applyTransform(localX: number, localY: number, localZ: number, t: WallTransform) {
  const perpX = -t.dirZ;
  const perpZ = t.dirX;
  
  return {
    x: t.baseX + localX * t.dirX + localZ * perpX,
    y: localY,
    z: t.baseZ + localX * t.dirZ + localZ * perpZ
  };
}
