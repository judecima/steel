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
  KING = 'king',
  JACK = 'jack',
  CRIPPLE_TOP = 'cripple_top',
  CRIPPLE_BOTTOM = 'cripple_bottom',
  CORNER = 'corner',
  JUNCTION = 'junction'
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

export type OpeningInput = {
  wallId: string;
  type: 'window' | 'door';
  width: number;
  height: number;
  position: number; // distance from wall start
  sillHeight?: number; // for windows
};

export type Wall = {
  id: string;
  role: WallRole;
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
  heightStart: number;
  heightEnd: number;
  openings: Opening[];
};

export type Opening = {
  id: string;
  type: 'window' | 'door';
  width: number;
  height: number;
  position: number;
  sillHeight: number;
  header?: Header;
};

export type Header = {
  strategy: HeaderStrategy;
  span: number;
  requiresStructuralValidation: boolean;
};

export type Panel = {
  id: string;
  wallId: string;
  role: PanelRole;
  width: number;
  height: number;
  offset: number;
  studs: Stud[];
  openings: Opening[];
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
  walls: Wall[];
  roof: RoofMetadata;
};

export type RoofMetadata = {
  type: 'one_slope' | 'two_slope';
  slope: number;
  highSideHeight: number;
  lowSideHeight: number;
  peakPosition?: number;
};
