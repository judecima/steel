import { Abertura, Muro } from '../../core/types';
import { CandidateStrategy, PanelizationCandidate } from './types';
import { round } from '../../utils/math';
import { generateId } from '../../utils/ids';
import { getPanelizationRules } from '../rules/panelization';

export function generateCandidates(wallId: string, wallLength: number, aberturas: Abertura[]): PanelizationCandidate[] {
  const candidates: PanelizationCandidate[] = [];

  // Estrategia 1: Balanceado
  candidates.push(createCandidate(CandidateStrategy.BALANCED, resolveBalancedSplits(wallLength)));

  // Estrategia 2: Codicioso Izquierda
  candidates.push(createCandidate(CandidateStrategy.GREEDY_LEFT, resolveGreedySplits(wallLength, 'left')));

  // Estrategia 3: Codicioso Derecha
  candidates.push(createCandidate(CandidateStrategy.GREEDY_RIGHT, resolveGreedySplits(wallLength, 'right')));

  // Estrategia 4: Mínimos Paneles
  candidates.push(createCandidate(CandidateStrategy.MIN_PANELS, resolveMinPanelsSplits(wallLength)));

  // Estrategia 5: Sensible a Aberturas
  if (aberturas.length > 0) {
      candidates.push(createCandidate(CandidateStrategy.OPENING_AWARE, resolveOpeningAwareSplits(wallLength, aberturas)));
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

function resolveBalancedSplits(wallLength: number): number[] {
  const { maxWidth } = getPanelizationRules();
  const count = Math.ceil(wallLength / maxWidth);
  const ideal = round(wallLength / count);
  const splits = new Array(count).fill(ideal);
  const diff = round(wallLength - (ideal * count));
  if (diff !== 0) splits[splits.length - 1] = round(splits[splits.length - 1] + diff);
  return splits;
}

function resolveGreedySplits(wallLength: number, direction: 'left' | 'right'): number[] {
  const { maxWidth, minWidth } = getPanelizationRules();
  const splits: number[] = [];
  let remaining = wallLength;
  
  while (remaining > 0) {
    if (remaining <= maxWidth) {
      splits.push(round(remaining));
      remaining = 0;
    } else {
      splits.push(maxWidth);
      remaining = round(remaining - maxWidth);
      if (remaining < minWidth && remaining > 0) {
          const last = splits.pop()!;
          const total = round(last + remaining);
          splits.push(round(total / 2));
          splits.push(round(total / 2));
          remaining = 0;
      }
    }
  }

  return direction === 'right' ? splits.reverse() : splits;
}

function resolveMinPanelsSplits(wallLength: number): number[] {
    const { maxWidth, minWidth } = getPanelizationRules();
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

function resolveOpeningAwareSplits(wallLength: number, aberturas: Abertura[]): number[] {
    const { maxWidth, minWidth } = getPanelizationRules();
    const firstOp = aberturas[0];
    const center = round(firstOp.position + firstOp.width / 2);
    
    if (center >= minWidth && center <= maxWidth && (wallLength - center) >= minWidth) {
        return [center, ...resolveBalancedSplits(wallLength - center)];
    }
    
    return resolveBalancedSplits(wallLength); 
}
