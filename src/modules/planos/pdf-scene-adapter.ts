/**
 * Lee un punto de forma robusta soportando metros (x) y milímetros (xMm).
 */
function readPoint(value: any) {
    if (!value) return null;

    if (Number.isFinite(value.x) && Number.isFinite(value.y)) {
        return { x: value.x, y: value.y };
    }

    if (Number.isFinite(value.xMm) && Number.isFinite(value.yMm)) {
        return { x: value.xMm / 1000, y: value.yMm / 1000 };
    }

    // Fallback si tiene x pero no y, etc.
    return { x: value.x ?? 0, y: value.y ?? 0 };
}

/**
 * Normaliza la geometría de un panel u objeto para asegurar que tenga start/end válidos.
 */
export function normalizePanelGeometry(panel: any): { start: {x:number, y:number} | null; end: {x:number, y:number} | null } {
    if (!panel) return { start: null, end: null };

    const rawStart =
        panel.start ??
        panel.from ??
        panel.origin ??
        (panel.points && panel.points.length > 0 ? panel.points[0] : null) ??
        (panel.p1 ? panel.p1 : null);

    const rawEnd =
        panel.end ??
        panel.to ??
        panel.target ??
        (panel.points && panel.points.length > 1 ? panel.points[1] : null) ??
        (panel.p2 ? panel.p2 : null);

    const start = readPoint(rawStart);
    const end = readPoint(rawEnd);

    return { start, end };
}
