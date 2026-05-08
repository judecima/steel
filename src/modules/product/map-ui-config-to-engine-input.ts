import { normalizeWallId } from "../../../apps/product-ui/src/lib/steel/runtime-contracts";

type AnyConfig = Record<string, any>;

function firstFinite(...values: unknown[]): number | undefined {
  for (const value of values) {
    const n = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(n)) return n;
  }

  return undefined;
}

function requiredNumber(name: string, ...values: unknown[]): number {
  const value = firstFinite(...values);

  if (!Number.isFinite(value)) {
    throw new Error(`Missing required numeric config field: ${name}`);
  }

  return value as number;
}

function normalizeOpening(raw: any) {
  const wallId = normalizeWallId(raw.wallId ?? raw.muro ?? raw.wall);

  if (!wallId) {
    throw new Error(`Invalid opening wallId: ${String(raw.wallId ?? raw.muro ?? raw.wall)}`);
  }

  const type =
    raw.type === "door" || raw.tipo === "puerta"
      ? "door"
      : raw.type === "window" || raw.tipo === "ventana"
        ? "window"
        : null;

  if (!type) {
    throw new Error(`Invalid opening type: ${String(raw.type ?? raw.tipo)}`);
  }

  return {
    id: raw.id,
    wallId,
    type,
    width: requiredNumber("opening.width", raw.width, raw.ancho),
    height: requiredNumber("opening.height", raw.height, raw.alto),
    position: requiredNumber("opening.position", raw.position, raw.posicion),
    sillHeight: firstFinite(raw.sillHeight, raw.antepecho) ?? 0,
  };
}

function normalizeInternalWall(raw: any) {
  const startX = firstFinite(raw.startX, raw.startXmm !== undefined ? raw.startXmm / 1000 : undefined);
  const startZ = firstFinite(raw.startZ, raw.startZmm !== undefined ? raw.startZmm / 1000 : undefined);
  const endX = firstFinite(raw.endX, raw.endXmm !== undefined ? raw.endXmm / 1000 : undefined);
  const endZ = firstFinite(raw.endZ, raw.endZmm !== undefined ? raw.endZmm / 1000 : undefined);

  if (
    !Number.isFinite(startX) ||
    !Number.isFinite(startZ) ||
    !Number.isFinite(endX) ||
    !Number.isFinite(endZ)
  ) {
    throw new Error(`Invalid internal wall coordinates: ${JSON.stringify(raw)}`);
  }

  const height = firstFinite(raw.height, raw.heightMm !== undefined ? raw.heightMm / 1000 : undefined) ?? 2.6;
  const thickness =
    firstFinite(raw.thickness, raw.thicknessMm !== undefined ? raw.thicknessMm / 1000 : undefined) ?? 0.1;

  return {
    id: raw.id,
    startXmm: Math.round((startX as number) * 1000),
    startZmm: Math.round((startZ as number) * 1000),
    endXmm: Math.round((endX as number) * 1000),
    endZmm: Math.round((endZ as number) * 1000),
    heightMm: Math.round(height * 1000),
    thicknessMm: Math.round(thickness * 1000),
    openings: Array.isArray(raw.openings) ? raw.openings : [],
  };
}

export function mapUIConfigToEngineInput(config: AnyConfig): Record<string, any> {
  const width = requiredNumber("width/anchoVivienda/ancho", config.width, config.anchoVivienda, config.ancho);
  const length = requiredNumber("length/largoVivienda/largo", config.length, config.largoVivienda, config.largo);
  const minHeight = requiredNumber(
    "minHeight/alturaMuro/altoMuros",
    config.minHeight,
    config.alturaMuro,
    config.altoMuros
  );

  const roofSlope = firstFinite(config.roofSlope, config.pendienteTecho, config.anguloTechoGrados) ?? 10;
  const roofType = config.roofType ?? config.tipoCubierta ?? "shed";

  const openings = Array.isArray(config.openings)
    ? config.openings.map(normalizeOpening)
    : Array.isArray(config.aberturas)
      ? config.aberturas.map(normalizeOpening)
      : [];

  const internalWalls = Array.isArray(config.internalWalls)
    ? config.internalWalls.map(normalizeInternalWall)
    : Array.isArray(config.murosInternos)
      ? config.murosInternos.map(normalizeInternalWall)
      : [];

  return {
    width,
    length,
    minHeight,
    roofType,
    roofSlope,
    openings,
    internalWalls,
    studSpacing: firstFinite(config.studSpacing, config.separacionMontantes) ?? 0.4,
    profileThickness: firstFinite(config.profileThickness, config.espesorPerfil) ?? 0.9,
    roofDirection: config.roofDirection ?? config.direccionCaida ?? "ancho",
  };
}
