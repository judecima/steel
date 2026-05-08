"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANONICAL_WALL_IDS = void 0;
exports.isCanonicalWallId = isCanonicalWallId;
exports.normalizeWallId = normalizeWallId;
exports.assertCanonicalWallId = assertCanonicalWallId;
exports.toFiniteNumber = toFiniteNumber;
exports.normalizeCoordToMeters = normalizeCoordToMeters;
exports.ensureProjectPersistenceDefaults = ensureProjectPersistenceDefaults;
exports.safeErrorMessage = safeErrorMessage;
exports.safeErrorStack = safeErrorStack;
exports.CANONICAL_WALL_IDS = [
    "wall_north",
    "wall_south",
    "wall_east",
    "wall_west",
];
function isCanonicalWallId(value) {
    return typeof value === "string" && exports.CANONICAL_WALL_IDS.includes(value);
}
function normalizeWallId(value) {
    if (typeof value !== "string")
        return null;
    const raw = value.trim();
    const key = raw.toLowerCase();
    const aliases = {
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
function assertCanonicalWallId(value) {
    if (!isCanonicalWallId(value)) {
        throw new Error(`Invalid canonical wallId: ${String(value)}`);
    }
}
function toFiniteNumber(value, fieldName) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) {
        throw new Error(`Invalid number for ${fieldName}: ${String(value)}`);
    }
    return n;
}
function normalizeCoordToMeters(value, fieldName) {
    const n = toFiniteNumber(value, fieldName);
    if (Math.abs(n) > 100) {
        return n / 1000;
    }
    return n;
}
function ensureProjectPersistenceDefaults(project) {
    return {
        ...project,
        estado: project.estado ?? "borrador",
        fechaActualizacion: new Date().toISOString(),
    };
}
function safeErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function safeErrorStack(error) {
    return error instanceof Error ? error.stack : undefined;
}
