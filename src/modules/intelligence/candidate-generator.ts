import { Abertura, Muro, HouseInput } from '../../core/types';
import { CandidateStrategy, PanelizationCandidate } from './types';
import { round } from '../../utils/math';
import { generateId } from '../../utils/ids';
import { getPanelizationRules } from '../rules/panelization';

export function generateCandidates(wallId: string, wallLength: number, aberturas: Abertura[], input?: HouseInput): PanelizationCandidate[] {
  const candidates: PanelizationCandidate[] = [];
  const rules = getPanelizationRules(input);

  // Estrategia 1: Balanceado
  candidates.push(createCandidate(CandidateStrategy.BALANCED, resolveBalancedSplits(wallLength, rules)));

  // Estrategia 2: Codicioso Izquierda
  candidates.push(createCandidate(CandidateStrategy.GREEDY_LEFT, resolveGreedySplits(wallLength, 'left', rules)));

  // Estrategia 3: Codicioso Derecha
  candidates.push(createCandidate(CandidateStrategy.GREEDY_RIGHT, resolveGreedySplits(wallLength, 'right', rules)));

  // Estrategia 4: Mínimos Paneles
  candidates.push(createCandidate(CandidateStrategy.MIN_PANELS, resolveMinPanelsSplits(wallLength, rules)));

  // Estrategia 5: Sensible a Aberturas
  if (aberturas.length > 0) {
      candidates.push(createCandidate(CandidateStrategy.OPENING_AWARE, resolveOpeningAwareSplits(wallLength, aberturas, rules)));
  }

  return candidates;
}

function createCandidate(strategy: CandidateStrategy, splits: number[]): PanelizationCandidate {
  return {
    id: generateId(`cand_${strategy}`),
    strategy,
    splits,
    panelCount: splits.length,
    valid: true, 
    decisionTrace: []
  };
}

function resolveBalancedSplits(wallLength: number, rules: any): number[] {
  const { maxWidth, preferredWidth } = rules;
  console.log("[FLOW_DEBUG] resolveBalancedSplits", { wallLength, preferredWidth, maxWidth });
  
  if (!Number.isFinite(wallLength) || wallLength < 0) {
      console.error("[FLOW_DEBUG] Invalid wallLength", { wallLength });
      return [0];
  }

  if (wallLength <= maxWidth) return [round(wallLength)];

  const count = Math.ceil(wallLength / preferredWidth);
  console.log("[FLOW_DEBUG] count calculated", { count });
  const ideal = round(wallLength / count);
  const finalIdeal = ideal > maxWidth ? maxWidth : ideal;
  
  const splits = new Array(count).fill(finalIdeal);
  const diff = round(wallLength - (finalIdeal * count));
  
  if (diff !== 0) {
      splits[splits.length - 1] = round(splits[splits.length - 1] + diff);
      if (splits[splits.length - 1] > maxWidth) {
          const last = splits.pop()!;
          splits.push(round(last / 2));
          splits.push(round(last / 2));
      }
  }
  return splits;
}

function resolveGreedySplits(wallLength: number, direction: 'left' | 'right', rules: any): number[] {
  const { preferredWidth, minWidth, maxWidth } = rules;
  const splits: number[] = [];
  let remaining = wallLength;
  
  while (remaining > 0) {
    if (remaining <= preferredWidth) {
      splits.push(round(remaining));
      remaining = 0;
    } else {
      splits.push(preferredWidth);
      remaining = round(remaining - preferredWidth);
      if (remaining < minWidth && remaining > 0) {
          const last = splits.pop()!;
          const total = round(last + remaining);
          if (total <= maxWidth) {
              splits.push(total);
          } else {
              splits.push(round(total / 2));
              splits.push(round(total / 2));
          }
          remaining = 0;
      }
    }
  }

  return direction === 'right' ? splits.reverse() : splits;
}

function resolveMinPanelsSplits(wallLength: number, rules: any): number[] {
    const { maxWidth, minWidth } = rules;
    const targetCount = Math.ceil(wallLength / maxWidth);
    
    if (targetCount === 1) return [wallLength];
    
    const splits: number[] = [];
    let remaining = wallLength;
    for (let i = 0; i < targetCount - 1; i++) {
        splits.push(maxWidth);
        remaining = round(remaining - maxWidth);
    }
    
    if (remaining >= minWidth) {
        splits.push(remaining);
    } else {
        const last = splits.pop()!;
        const total = round(last + remaining);
        splits.push(round(total / 2));
        splits.push(round(total / 2));
    }
    
    return splits;
}

function resolveOpeningAwareSplits(wallLength: number, aberturas: Abertura[], rules: any): number[] {
    const { maxWidth, minWidth, openingClearance } = rules;
    
    // 1. Identificar Zonas Prohibidas para Juntas
    const forbiddenZones = aberturas.map(op => ({
        start: op.position - openingClearance,
        end: op.position + op.width + openingClearance
    }));

    // 2. Partir de una estrategia balanceada base
    const baseSplits = resolveBalancedSplits(wallLength, rules);
    const finalSplits: number[] = [];
    let currentOffset = 0;

    for (let i = 0; i < baseSplits.length; i++) {
        let jointPos = currentOffset + baseSplits[i];
        
        // Si no es la última junta, validar/ajustar
        if (i < baseSplits.length - 1) {
            const conflict = forbiddenZones.find(z => jointPos > z.start && jointPos < z.end);
            
            if (conflict) {
                // Intentar mover la junta fuera de la zona prohibida
                // Probar moviendo a la derecha
                let nudgedPos = round(conflict.end + 0.01);
                let newWidth = nudgedPos - currentOffset;

                // Validar si el nuevo ancho es legal
                if (newWidth >= minWidth && newWidth <= maxWidth) {
                    jointPos = nudgedPos;
                } else {
                    // Probar moviendo a la izquierda
                    nudgedPos = round(conflict.start - 0.01);
                    newWidth = nudgedPos - currentOffset;
                    if (newWidth >= minWidth && newWidth <= maxWidth) {
                        jointPos = nudgedPos;
                    }
                }
            }
        } else {
            // Última pieza, debe cerrar en wallLength
            jointPos = wallLength;
        }

        const actualWidth = round(jointPos - currentOffset);
        finalSplits.push(actualWidth);
        currentOffset = jointPos;
    }

    return finalSplits;
}
