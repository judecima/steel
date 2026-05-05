import { Muro, WallRole } from '../../core/types';

export function resolveWallPriority(muros: Muro[]): string[] {
  // Ordenar muros de forma determinística
  const sorted = [...muros].sort((a, b) => {
    // 1. Muros de carga externos primero
    if (a.role === WallRole.EXTERNAL_LOADBEARING && b.role !== WallRole.EXTERNAL_LOADBEARING) return -1;
    if (b.role === WallRole.EXTERNAL_LOADBEARING && a.role !== WallRole.EXTERNAL_LOADBEARING) return 1;

    // 2. Mayor densidad de aberturas
    const aDensity = a.aberturas.reduce((sum, o) => sum + o.width, 0) / a.length;
    const bDensity = b.aberturas.reduce((sum, o) => sum + o.width, 0) / b.length;
    if (Math.abs(aDensity - bDensity) > 0.01) {
      return bDensity - aDensity;
    }

    // 3. Fallback al orden léxico del ID para desempates estables
    return a.id.localeCompare(b.id);
  });

  return sorted.map(w => w.id);
}
