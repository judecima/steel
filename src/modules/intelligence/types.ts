import { DebugEvent, WallRole } from '../../core/types';

export enum CandidateStrategy {
  BALANCED = 'balanced',
  GREEDY_LEFT = 'greedy_left',
  GREEDY_RIGHT = 'greedy_right',
  OPENING_AWARE = 'opening_aware',
  MIN_PANELS = 'min_panels'
}

export type STRATEGIC_BIAS = 'balanced' | 'fewer_panels' | 'opening_safe';

export type StrategicContext = {
  wallRole: WallRole;
  housePriority?: 'normal' | 'high_opening_density' | 'transport_sensitive';
  adjacentWalls?: string[];
  preferredBias?: STRATEGIC_BIAS;
};

export type CandidateScore = {
  total: number;
  components: {
    panelCount: number;
    widthBalance: number;
    openingSafety: number;
    constructability: number;
    continuity: number;
  };
  penalties: string[];
  bonuses: string[];
};

export type PanelizationCandidate = {
  id: string;
  strategy: CandidateStrategy;
  splits: number[];
  panelCount: number;
  valid: boolean;
  rejectionReason?: string;
  score?: CandidateScore;
  decisionTrace: DebugEvent[];
};
