/**
 * RENDER SCENE CONTRACT
 * Contrato entre el backend y el Viewer 3D.
 */

export interface RenderSceneDTO {
  units: 'meters' | 'mm';
  objects: RenderObjectDTO[];
  layers: RenderLayerDTO[];
  metadata: Record<string, any>;
}

export interface RenderObjectDTO {
  id: string;
  sourceId: string;
  type: string; // "muro", "panel", "montante", "piso", etc.
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  dimensions: { x: number; y: number; z: number };
  material: string;
  layer: string;
  visible: boolean;
  metadata: Record<string, any>;
}

export interface RenderLayerDTO {
  id: string;
  name: string;
  visibleByDefault: boolean;
  description: string;
}

export interface RenderSceneIndustrialDTO {
  escenaBase: RenderSceneDTO;
  modoInicial: string;
  modos: Record<string, any>; // taller, estructural, etc.
}
