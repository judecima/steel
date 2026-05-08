import { RenderObject } from "./types";

export function buildFloorMesh(input: {
  width: number;
  length: number;
}): RenderObject {
  return {
    id: "floor_interaction_plane",
    sourceId: "house_floor",
    type: "piso",
    layer: "layer_floor_interaction",
    material: "mat_floor_interaction",
    visible: true,
    color: "#94a3b8",
    position: {
      x: input.width / 2,
      y: 0,
      z: input.length / 2,
    },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: {
      x: input.width,
      y: 0.01,
      z: input.length,
    },
    metadata: {
      label: "Plano de piso clickeable",
      purpose: "internal_wall_creation",
    },
  };
}
