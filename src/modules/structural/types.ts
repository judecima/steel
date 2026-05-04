export type StructuralStatus = 
  | 'not_checked'
  | 'insufficient_data'
  | 'preliminary_pass'
  | 'preliminary_fail'
  | 'requires_engineer_review';

export type StructuralCertificationLevel = 
  | 'constructive_only'
  | 'preliminary_structural_checks'
  | 'engineer_review_required'
  | 'professionally_approved_external';

export type CodeReference = {
  code: string;
  clause: string;
  description: string;
  status: string;
};

export type LoadCase = {
  id: string;
  type: 'dead' | 'live' | 'roof_live' | 'wind' | 'seismic';
  magnitude: number;
  unit: string;
  direction: 'gravity' | 'lateral_x' | 'lateral_y' | 'uplift';
  source: string;
  assumptions: string[];
};

export type LoadCombination = {
  id: string;
  name: string;
  factors: Record<string, number>;
  type: 'service' | 'strength' | 'preliminary';
  codeReferences: CodeReference[];
  status: string;
};

export type StructuralProfile = {
  id: string;
  name: string;
  profileType: string;
  web?: number;
  flange?: number;
  thickness?: number;
  steelGrade?: string;
  fy?: number; // Yield strength
  area?: number;
  ix?: number;
  iy?: number;
  rx?: number;
  ry?: number;
  weightPerMeter?: number;
  source: string;
  completeness: 'complete' | 'sample' | 'incomplete' | 'requires_verification';
};

export type StructuralMember = {
  id: string;
  sourceElementId: string; // Refers to stud ID or header ID
  type: 'stud' | 'header' | 'beam' | 'column';
  profileId: string;
  length: number;
  effectiveLength: number;
  boundaryCondition: string;
  role: string;
  tributaryWidth: number;
  appliedLoads: string[]; // load case IDs
  metadata: Record<string, any>;
};

export type MemberCheckResult = {
  memberId: string;
  status: StructuralStatus;
  utilizationRatio?: number;
  governingCheck?: string;
  demand?: number;
  capacity?: number;
  warnings: string[];
  codeReferences: CodeReference[];
};

export type HeaderCheckResult = {
  openingId: string;
  status: StructuralStatus;
  span: number;
  selectedHeader: string;
  demand?: number;
  capacity?: number;
  utilizationRatio?: number;
  recommendation: string;
  warnings: string[];
  codeReferences: CodeReference[];
};

export type AnchorCheckResult = {
  status: StructuralStatus;
  requiredData: string[];
  warnings: string[];
  recommendation?: string;
};

export type RoofStructuralCheckResult = {
  status: StructuralStatus;
  span: number;
  roofType: string;
  slope: number;
  recommendation?: string;
  warnings: string[];
};

export type StructuralAnalysisResult = {
  status: StructuralStatus;
  certificationLevel: StructuralCertificationLevel;
  memberChecks: MemberCheckResult[];
  headerChecks: HeaderCheckResult[];
  roofCheck: RoofStructuralCheckResult;
  anchorCheck: AnchorCheckResult;
  criticalItems: string[];
  missingData: string[];
  warnings: string[];
  codeReferences: CodeReference[];
  summary: string;
};
