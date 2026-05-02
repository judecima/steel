import { PanelizationCandidate, CandidateScore, StrategicContext } from './types';
import { Opening } from '../../core/types';
import { getPanelizationRules } from '../rules/panelization';
import { round } from '../../utils/math';

export function scoreCandidate(candidate: PanelizationCandidate, context: StrategicContext, openings: Opening[]): void {
  const { openingClearance, maxWidth } = getPanelizationRules();
  
  // 1. Dynamic Weights based on Strategic Context
  let weights = {
    panelCount: 0.30,
    widthBalance: 0.25,
    openingSafety: 0.20,
    constructability: 0.15,
    continuity: 0.10
  };

  if (context.preferredBias === 'fewer_panels') {
      weights.panelCount = 0.50;
      weights.widthBalance = 0.10;
      weights.openingSafety = 0.10;
      weights.constructability = 0.20;
      weights.continuity = 0.10;
  }

  // 2. Component Scores
  const components = {
    panelCount: calculatePanelCountScore(candidate),
    widthBalance: calculateBalanceScore(candidate),
    openingSafety: calculateSafetyScore(candidate, openings, openingClearance),
    constructability: calculateComplexityScore(candidate, maxWidth),
    continuity: 50 
  };

  // 3. Operational Penalties/Bonuses
  const penalties: string[] = [];
  const bonuses: string[] = [];
  let modifier = 0;

  if (candidate.splits.some(w => w < 2.2)) {
      penalties.push('PENALTY_NEAR_MIN_WIDTH');
      modifier -= 5;
  }
  if (candidate.panelCount <= 2) {
      bonuses.push('BONUS_SIMPLE_WALL');
      modifier += 5;
  }

  // 4. Total (Weighted Average + Modifiers)
  const total = round(
    (components.panelCount * weights.panelCount) +
    (components.widthBalance * weights.widthBalance) +
    (components.openingSafety * weights.openingSafety) +
    (components.constructability * weights.constructability) +
    (components.continuity * weights.continuity) +
    modifier
  );

  candidate.score = {
    total,
    components,
    penalties,
    bonuses
  };
}

function calculatePanelCountScore(candidate: PanelizationCandidate): number {
  return Math.max(0, 100 - (candidate.panelCount - 1) * 10);
}

function calculateBalanceScore(candidate: PanelizationCandidate): number {
  if (candidate.panelCount <= 1) return 100;
  const avg = candidate.splits.reduce((a, b) => a + b, 0) / candidate.panelCount;
  const variance = candidate.splits.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / candidate.panelCount;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, 100 - round(stdDev * 100));
}

function calculateSafetyScore(candidate: PanelizationCandidate, openings: Opening[], clearance: number): number {
  if (openings.length === 0) return 100;
  let minSafeDistance = Infinity;
  let currentOffset = 0;
  for (let i = 0; i < candidate.splits.length - 1; i++) {
    const jointPos = currentOffset + candidate.splits[i];
    openings.forEach(op => {
      const distStart = Math.min(Math.abs(jointPos - op.position), Math.abs(jointPos - (op.position + op.width)));
      minSafeDistance = Math.min(minSafeDistance, distStart);
    });
    currentOffset += candidate.splits[i];
  }
  const score = round((minSafeDistance / (clearance + 0.5)) * 100);
  return Math.min(100, Math.max(0, score));
}

function calculateComplexityScore(candidate: PanelizationCandidate, maxWidth: number): number {
  const fullPanels = candidate.splits.filter(w => Math.abs(w - maxWidth) < 0.01).length;
  const ratio = fullPanels / candidate.panelCount;
  return round(ratio * 100);
}
