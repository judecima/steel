export function assertCanonicalWallId(wallId: unknown): asserts wallId is string {
  const valid = ["wall_north", "wall_south", "wall_east", "wall_west"];

  if (typeof wallId !== "string" || !valid.includes(wallId)) {
    throw new Error(`Invalid canonical wallId: ${String(wallId)}`);
  }
}

export function assertFiniteNumber(name: string, value: unknown): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid number ${name}: ${String(value)}`);
  }
}

export function assertRenderSceneUsable(scene: any): void {
  if (!scene) {
    throw new Error("renderScene missing");
  }

  // Comprobar si tiene objetos dibujables en alguna de sus estructuras (Industrial o Legacy)
  const hasObjects =
    Array.isArray(scene.objects) ||
    (scene.escenaBase && Array.isArray(scene.escenaBase.objects));

  if (!hasObjects) {
    throw new Error(`renderScene has no drawable objects. Keys: ${Object.keys(scene).join(", ")}`);
  }
}
