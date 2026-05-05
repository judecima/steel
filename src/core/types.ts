import { PanelizationCandidate } from '../modules/intelligence/types';

export type ProjectStatus = 
  | 'draft'
  | 'constructive_precheck_passed'
  | 'precheck_failed'
  | 'requires_structural_validation';

export enum WallRole {
  EXTERNAL_LOADBEARING = 'external_loadbearing',
  INTERNAL_LOADBEARING = 'internal_loadbearing',
  NON_LOADBEARING = 'non_loadbearing'
}

export enum PanelRole {
  STRUCTURAL = 'structural',
  BRACING = 'bracing',
  FILLER = 'filler'
}

export enum StudRole {
  COMMON = 'common',
  MONTANTE_PRINCIPAL = 'montante_principal',
  MONTANTE_APOYO = 'montante_apoyo',
  MONTANTE_CORTO_SUPERIOR = 'montante_corto_superior',
  MONTANTE_CORTO_INFERIOR = 'montante_corto_inferior',
  CORNER = 'corner',
  JUNCTION = 'junction',
  SOLERA_VENTANA = 'solera_ventana',
  // Legacy aliases
  KING = 'montante_principal',
  JACK = 'montante_apoyo',
  CRIPPLE_TOP = 'montante_corto_superior',
  CRIPPLE_BOTTOM = 'montante_corto_inferior',
  SILL = 'solera_ventana'
}

export enum JunctionType {
  CORNER_L = 'corner_L',
  CORNER_CALIFORNIA = 'corner_California',
  T_JUNCTION = 'T_junction',
  PANEL_JOINT = 'panel_joint'
}

export enum HeaderStrategy {
  PROVISIONAL_BOXED = 'provisional_boxed_header',
  PROVISIONAL_DOUBLE_PGC = 'provisional_double_pgc',
  CUSTOM = 'custom'
}

export type HouseInput = {
  width: number;
  length: number;
  minHeight: number;
  roofType: 'one_slope' | 'two_slope';
  roofSlope: number;
  openings?: OpeningInput[];
};

export type AberturaInput = {
  wallId: string;
  type: 'ventana' | 'puerta' | 'window' | 'door'; // Legacy allowed
  width: number;
  height: number;
  position: number; // distance from wall start
  sillHeight?: number; // for windows
};
export type OpeningInput = AberturaInput;

export type Muro = {
  id: string;
  role: WallRole;
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
  heightStart: number;
  heightEnd: number;
  aberturas: Abertura[]; // Renamed from openings
};
export type Wall = Muro;

export type Abertura = {
  id: string;
  type: 'ventana' | 'puerta' | 'window' | 'door';
  width: number;
  height: number;
  position: number;
  sillHeight: number;
  dintel?: Dintel; // Renamed from header
};
export type Opening = Abertura;

export type Dintel = {
  strategy: HeaderStrategy;
  span: number;
  requiresStructuralValidation: boolean;
};
export type Header = Dintel;

export type Panel = {
  id: string;
  wallId: string;
  role: PanelRole;
  width: number;
  height: number;
  offset: number;
  studs: Stud[];
  aberturas: Abertura[]; // Renamed from openings
  junctions: Junction[];
  previousPanelId?: string;
  nextPanelId?: string;
};

export type Stud = {
  id: string;
  role: StudRole;
  position: number; // position within panel
  height: number;
  profileType: string; // e.g., PGC 100x0.9
  yOffset?: number; // vertical offset from bottom track
};

export type Junction = {
  type: JunctionType;
  position: number;
  relatedWallId?: string;
};

export type BOMItem = {
  profileType: string;
  thickness: number;
  length: number;
  quantity: number;
  role: StudRole | string;
};

export type BillOfMaterials = {
  aggregated: {
    profileType: string;
    thickness: number;
    role: string;
    totalLinearMeters: number;
  }[];
  cutList: BOMItem[];
};

export type DebugEvent = {
  timestamp: number;
  event: string;
  entityId: string;
  relatedIds?: string[];
  reason: string;
  values?: Record<string, any>;
};

export type ProjectResult = {
  input: HouseInput;
  house: HouseModel;
  construction: {
    panels: Panel[];
    metadata?: {
      candidatesEvaluated: Record<string, PanelizationCandidate>;
    };
  };
  bom: BillOfMaterials;
  logs: DebugEvent[];
  status: ProjectStatus;
  assumptions: string[];
  warnings: string[];
};

export type HouseModel = {
  muros: Muro[]; // Renamed from walls
  roof: RoofMetadata;
};

export type RoofMetadata = {
  type: 'one_slope' | 'two_slope';
  slope: number;
  highSideHeight: number;
  lowSideHeight: number;
  peakPosition?: number;
};
