import { Vector2 } from './types';

/**
 * Normaliza la geometría de un panel u objeto para asegurar que tenga start/end válidos.
 * Soporta múltiples formatos de DTO (drift).
 */
export function normalizePanelGeometry(panel: any): { start: Vector2 | null; end: Vector2 | null } {
    if (!panel) return { start: null, end: null };

    const start =
        panel.start ??
        panel.from ??
        panel.origin ??
        (panel.points && panel.points.length > 0 ? panel.points[0] : null) ??
        (panel.p1 ? panel.p1 : null);

    const end =
        panel.end ??
        panel.to ??
        panel.target ??
        (panel.points && panel.points.length > 1 ? panel.points[1] : null) ??
        (panel.p2 ? panel.p2 : null);

    return {
        start: start ? { x: start.x ?? 0, y: start.y ?? 0 } : null,
        end: end ? { x: end.x ?? (start?.x ?? 0), y: end.y ?? (start?.y ?? 0) } : null,
    };
}
