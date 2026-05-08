export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type RenderMaterial = {
  id: string;
  name: string;
  color: string;
  opacity: number;
  metalness: number;
  roughness: number;
};

export type RenderObjectType = 
  | 'casa' | 'house'
  | 'muro' | 'wall'
  | 'piso'
  | 'cercha'


  | 'panel'
  | 'montante' | 'stud'
  | 'solera' | 'track'
  | 'solera_ventana' | 'antepecho' | 'sill'
  | 'abertura' | 'puerta' | 'opening'
  | 'dintel' | 'header'
  | 'techo' | 'roof'
  | 'anclaje' | 'anchor'
  | 'fundacion' | 'foundation'
  | 'advertencia' | 'warning_marker'
  | 'label_anchor'
  | 'marcador_viga_externa'
  | 'box_inspeccion'
  | 'indicador_estructural';

export type ModoVisualizacion = 
  | 'estandar'
  | 'estructural'
  | 'taller'
  | 'montaje'
  | 'inspeccion';

export type RenderObject = {
  id: string;
  type: RenderObjectType;
  sourceId: string;
  position: Vector3;
  rotation: Vector3;
  dimensions: Vector3; // width(x), height(y), depth(z)
  heightStart?: number; // For trapezoidal objects (like slanted walls/panels)
  heightEnd?: number;   // For trapezoidal objects
  material: string;
  layer: string;
  visible: boolean;
  color?: string; // Hex color code (e.g. "#FF0000") for visual distinction
  metadata: Record<string, any>;
};

export type RenderLabel = {
  id: string;
  sourceId: string;
  text: string;
  position: Vector3;
  layer: string;
  metadata: Record<string, any>;
};

export type RenderLayer = {
  id: string;
  name: string;
  visibleByDefault: boolean;
  description: string;
};

export type RenderWarning = {
  id: string;
  sourceId: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  position: Vector3;
  layer: string;
};

export type CameraPreset = {
  id: string;
  name: string;
  position: Vector3;
  target: Vector3;
};

export type RenderSceneMetadata = {
  [key: string]: any;
};

export type RenderSceneDTO = {
  units: string;
  objects: RenderObject[];
  labels: RenderLabel[];
  layers: RenderLayer[];
  warnings: RenderWarning[];
  cameraPresets: CameraPreset[];
  metadata: RenderSceneMetadata;
};

export type AssemblyStep = {
  id: string;
  order: number;
  title: string;
  description: string;
  visibleLayers: string[];
  highlightedObjectIds: string[];
};

export type ShopPanelView = {
  panelId: string;
  objects: RenderObject[];
  labels: RenderLabel[];
  bomSummary: Record<string, number>;
  boundingBox: { min: Vector3; max: Vector3 };
};

export type OverlayEstructuralDTO = {
  aberturaId: string;
  estado: string;
  color: string;
  advertencias: string[];
  requiereRevision: boolean;
};

export type ModeData = {
  objects: RenderObject[];
  labels: RenderLabel[];
  overlays: {
    estructural?: OverlayEstructuralDTO[];
    inspeccion?: RenderObject[];
  };
  metadata: any;
};

export type RenderSceneIndustrialDTO = {
  escenaBase: RenderSceneDTO;
  modoInicial: ModoVisualizacion;
  modos: {
    estandar: ModeData;
    estructural: ModeData;
    taller: ModeData;
    montaje: ModeData;
    inspeccion: ModeData;
  };
};
