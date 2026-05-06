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
  
  if (wallLength <= maxWidth) return [round(wallLength)];

  const count = Math.ceil(wallLength / preferredWidth);
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
    const { maxWidth, minWidth } = rules;
    const firstOp = aberturas[0];
    const center = round(firstOp.position + firstOp.width / 2);
    
    if (center >= minWidth && center <= maxWidth && (wallLength - center) >= minWidth) {
        return [center, ...resolveBalancedSplits(wallLength - center, rules)];
    }
    
    return resolveBalancedSplits(wallLength, rules); 
}
