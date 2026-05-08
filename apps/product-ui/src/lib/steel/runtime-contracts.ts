export type CanonicalWallId =
  | "wall_north"
  | "wall_south"
  | "wall_east"
  | "wall_west";

export const CANONICAL_WALL_IDS: CanonicalWallId[] = [
  "wall_north",
  "wall_south",
  "wall_east",
  "wall_west",
];

export function isCanonicalWallId(value: unknown): value is CanonicalWallId {
  return typeof value === "string" && CANONICAL_WALL_IDS.includes(value as CanonicalWallId);
}

export function normalizeWallId(value: unknown): CanonicalWallId | null {
  if (typeof value !== "string") return null;

  const raw = value.trim();
  const key = raw.toLowerCase();

  const aliases: Record<string, CanonicalWallId> = {
    wall_north: "wall_north",
    wall_south: "wall_south",
    wall_east: "wall_east",
    wall_west: "wall_west",

    "muro norte": "wall_north",
    norte: "wall_north",
    north: "wall_north",

    "muro sur": "wall_south",
    sur: "wall_south",
    south: "wall_south",

    "muro este": "wall_east",
    este: "wall_east",
    east: "wall_east",

    "muro oeste": "wall_west",
    oeste: "wall_west",
    west: "wall_west",
  };

  return aliases[raw] ?? aliases[key] ?? null;
}

export function assertCanonicalWallId(value: unknown): asserts value is CanonicalWallId {
  if (!isCanonicalWallId(value)) {
    throw new Error(`Invalid canonical wallId: ${String(value)}`);
  }
}

export function toFiniteNumber(value: unknown, fieldName: string): number {
  const n = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number for ${fieldName}: ${String(value)}`);
  }

  return n;
}

export function normalizeCoordToMeters(value: unknown, fieldName: string): number {
  const n = toFiniteNumber(value, fieldName);

  if (Math.abs(n) > 100) {
    return n / 1000;
  }

  return n;
}

export function ensureProjectPersistenceDefaults<T extends Record<string, any>>(project: T): T {
  return {
    ...project,
    estado: project.estado ?? "borrador",
    fechaActualizacion: new Date().toISOString(),
  };
}

export function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function safeErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}
