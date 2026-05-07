/**
 * Normalizador obligatorio de WallId para el motor Steel.
 * Asegura que las etiquetas visuales se conviertan en IDs técnicos canónicos.
 */
export function normalizeWallId(value: unknown): string | null {
    if (typeof value !== "string") return null;
  
    const raw = value.trim();
    const key = raw.toLowerCase();
  
    const aliases: Record<string, string> = {
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

/**
 * Valida si un ID es canónico.
 */
export function isCanonicalWallId(wallId: string): boolean {
    return ["wall_north", "wall_south", "wall_east", "wall_west"].includes(wallId);
}
