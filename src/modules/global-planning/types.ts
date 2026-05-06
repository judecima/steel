import { PanelizationCandidate } from '../intelligence/types';
import { DebugEvent } from '../../core/types';

export type GlobalPlanningConfig = {
  beamWidth: number;
  topKLocalCandidates: number;
  pruningThreshold: number;
  maxExpansionsPerStep: number;
};

export type PartialGlobalScore = {
  total: number;
  components: {
    localQualityAccumulated: number;
    partialContinuity: number;
    partialOpeningSafety: number;
    partialConstructability: number;
  };
  confidence: number;
  penalties: string[];
  bonuses: string[];
};

export type PartialGlobalPlan = {
  id: string;
  decidedWalls: string[];
  wallSelections: Record<string, PanelizationCandidate>;
  valid: boolean;
  partialScore: PartialGlobalScore;
  decisionTrace: DebugEvent[];
  prunedReason?: string;
  telemetry?: any;
};

export type GlobalPlanScore = {
  total: number;
  components: {
    localQuality: number;
    continuity: number;
    jointAlignment: number;
    openingSafetyGlobal: number;
    constructabilityGlobal: number;
    transportSuitability: number;
    repetitionBenefit: number;
  };
  penalties: string[];
  bonuses: string[];
};

export type GlobalPlanCandidate = {
  id: string;
  decidedWalls: string[];
  wallSelections: Record<string, PanelizationCandidate>;
  valid: boolean;
  rejectionReason?: string;
  score: GlobalPlanScore;
  decisionTrace: DebugEvent[];
  telemetry?: PlannerTelemetry;
};

export type GlobalValidationResult = {
  valid: boolean;
  hardVetoReasons: string[];
  softPenaltyReasons: string[];
};

export type PlannerTelemetry = {
  generatedStates: number;
  vetoedStates: number;
  prunedStates: number;
  retainedStates: number;
  dominantPruningReasons: Record<string, number>;
  planningTimeMs: number;
};

export type PartialPlanSignature = {
  decidedWalls: string[];
  familyPatternKey: string;
  junctionCompatibilityKey: string;
  candidateStrategyProfile: string;
};
