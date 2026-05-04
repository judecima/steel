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
  | 'house'
  | 'wall'
  | 'panel'
  | 'stud'
  | 'track'
  | 'opening'
  | 'header'
  | 'roof'
  | 'anchor'
  | 'warning_marker'
  | 'label_anchor';

export type RenderObject = {
  id: string;
  type: RenderObjectType;
  sourceId: string;
  position: Vector3;
  rotation: Vector3;
  dimensions: Vector3; // width(x), height(y), depth(z)
  material: string;
  layer: string;
  visible: boolean;
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
  projectId: string;
  generatedAt: string;
  units: string;
  sourcePhase: string;
  objectCount: number;
  warningCount: number;
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
