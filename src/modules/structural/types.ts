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
  sourceElementId: string; // Refiere al ID del montante o del dintel
  type: 'montante' | 'dintel' | 'viga' | 'columna';
  profileId: string;
  length: number;
  effectiveLength: number;
  boundaryCondition: string;
  role: string;
  tributaryWidth: number;
  appliedLoads: string[]; // IDs de casos de carga
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
  aberturaId: string;
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

export type EstrategiaDintel = 
  | 'dintel_simple'
  | 'dintel_compuesto'
  | 'dintel_reticulado'
  | 'dintel_tubular'
  | 'requiere_viga_estructural_externa';

export type CategoriaAbertura = 
  | 'abertura_pequena'
  | 'abertura_media'
  | 'abertura_grande'
  | 'abertura_critica';

export type ClasificacionEstructuralAbertura = {
  aberturaId: string;
  luz: number;
  categoria: CategoriaAbertura;
  estrategiaRecomendada: EstrategiaDintel;
  razon: string;
  requiereRevisionEstructural: boolean;
};

export type CandidatoDisenoDintel = {
  id: string;
  aberturaId: string;
  estrategia: EstrategiaDintel;
  luz: number;
  altura: number;
  perfiles: string[];
  demandaEstimada?: number;
  capacidadEstimada?: number;
  ratioUtilizacion?: number;
  estado: StructuralStatus;
  advertencias: string[];
  referenciasNormativas: CodeReference[];
  metadata?: Record<string, any>;
};

export type ModeloPreliminarDintelReticulado = {
  cordonSuperior: string;
  cordonInferior: string;
  alma: string;
  altura: number;
  cantidadPaneles: number;
  patronDiagonales: 'warren' | 'pratt' | 'n';
  preliminar: boolean;
};

export type ModeloPreliminarDintelTubular = {
  perfilTubular: string;
  luz: number;
  demanda?: number;
  capacidad?: number;
  ratioUtilizacion?: number;
  preliminar: boolean;
};

export type ResultadoDisenoDintelAbertura = {
  aberturaId: string;
  clasificacion: ClasificacionEstructuralAbertura;
  candidatos: CandidatoDisenoDintel[];
  candidatoSeleccionado?: CandidatoDisenoDintel;
  estado: StructuralStatus;
  recomendacion: string;
  advertencias: string[];
  datosFaltantes: string[];
  referenciasNormativas: CodeReference[];
};

export type StructuralAnalysisResult = {
  status: StructuralStatus;
  certificationLevel: StructuralCertificationLevel;
  memberChecks: MemberCheckResult[];
  dintelChecks: HeaderCheckResult[]; 
  disenosDintel: ResultadoDisenoDintelAbertura[]; // Nueva sección detallada
  roofCheck: RoofStructuralCheckResult;
  anchorCheck: AnchorCheckResult;
  criticalItems: string[];
  missingData: string[];
  warnings: string[];
  codeReferences: CodeReference[];
  summary: string;
};
