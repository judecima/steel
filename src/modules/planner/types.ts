import { PanelizationCandidate } from '../intelligence/types';
import { DebugEvent } from '../../core/types';

export type GlobalPlanningConfig = {
  beamWidth: number;
  topKLocalCandidates: number;
  pruningThreshold: number; // e.g. 0.8 means 20% below best score
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

export type PartialGlobalPlan = {
  id: string;
  decidedWalls: string[];
  wallSelections: Record<string, PanelizationCandidate>;
  valid: boolean;
  partialScore: PartialGlobalScore;
  decisionTrace: DebugEvent[];
  prunedReason?: string;
};

export type GlobalPlanCandidate = {
  id: string;
  wallSelections: Record<string, PanelizationCandidate>;
  valid: boolean;
  rejectionReason?: string;
  score: GlobalPlanScore;
  decisionTrace: DebugEvent[];
};

export type PlannerTelemetry = {
  steps: {
    wallId: string;
    generatedCount: number;
    vetoedCount: number;
    prunedCount: number;
    retainedCount: number;
    stepTimeMs: number;
    dominantPruningReason?: string;
  }[];
  totalPlanningTimeMs: number;
};

export type PartialPlanSignature = {
    decidedWalls: string[];
    familyPatternKey: string;
    junctionCompatibilityKey: string;
    strategyProfile: string;
};
