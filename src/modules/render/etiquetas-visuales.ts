import { LOCALIZACION_DOMINIO, t, traducirValorMetadata } from './localizacion-dominio';

/**
 * Traduce la orientación o ID de muro a su versión en español.
 */
export function traducirOrientacion(id: string): string {
    const lower = id.toLowerCase();
    if (lower.includes('north') || lower.includes('norte')) return t('orientaciones', 'north');
    if (lower.includes('south') || lower.includes('sur')) return t('orientaciones', 'south');
    if (lower.includes('east') || lower.includes('este')) return t('orientaciones', 'east');
    if (lower.includes('west') || lower.includes('oeste')) return t('orientaciones', 'west');
    return id;
}

/**
 * Crea una etiqueta legible para un panel.
 */
export function crearEtiquetaPanel(panelId: string): string {
    const orientation = traducirOrientacion(panelId);
    const parts = panelId.split('_');
    let index = '1';
    const lastPart = parts[parts.length - 1];
    if (!isNaN(parseInt(lastPart))) {
        index = (parseInt(lastPart) + 1).toString();
    }
    return `Panel ${orientation} ${index}`;
}

/**
 * Crea una etiqueta legible para un muro.
 */
export function crearEtiquetaMuro(wallId: string): string {
    const orientation = traducirOrientacion(wallId);
    return `Muro ${orientation}`;
}

/**
 * Crea una etiqueta para una abertura.
 */
export function crearEtiquetaAbertura(type: string, width: number, height: number): string {
    const translatedType = t('aberturas', type);
    return `${translatedType} ${width.toFixed(2)}x${height.toFixed(2)}`;
}

/**
 * Crea una etiqueta para un montante según su rol.
 */
export function crearEtiquetaMontante(role: string): string {
    return t('roles', role);
}

/**
 * Crea una etiqueta para un dintel.
 */
export function crearEtiquetaDintel(span: number): string {
    return `Dintel (Luz: ${span.toFixed(2)}m)`;
}

/**
 * Traduce un rol técnico a su versión legible.
 */
export function traducirRol(value: string): string {
    return t('roles', value);
}

/**
 * Traduce un tipo de objeto a su versión legible.
 */
export function traducirTipoObjeto(value: string): string {
    return t('tipos', value);
}

/**
 * Traduce un tipo de techo a su versión legible.
 */
export function traducirTipoTecho(value: string): string {
    return t('techos', value);
}

/**
 * Traduce un estado a su versión legible.
 */
export function traducirEstado(value: string): string {
    return t('estados', value);
}

/**
 * Traduce un ID de muro (ej. wall_south) a etiqueta legible (Muro Sur).
 */
export function traducirIdMuro(id: string): string {
    const orientation = traducirOrientacion(id);
    return `Muro ${orientation}`;
}

/**
 * Traduce un ID de panel (ej. panel_wall_south_0) a etiqueta legible (Panel Sur 1).
 */
export function traducirIdPanel(id: string): string {
    const orientation = traducirOrientacion(id);
    const parts = id.split('_');
    let index = '1';
    const lastPart = parts[parts.length - 1];
    if (!isNaN(parseInt(lastPart))) {
        index = (parseInt(lastPart) + 1).toString();
    }
    return `Panel ${orientation} ${index}`;
}

/**
 * Traduce un ID de abertura a etiqueta legible.
 */
export function traducirIdAbertura(id: string): string {
    if (id.includes('ventana')) return 'Ventana';
    if (id.includes('puerta')) return 'Puerta';
    return 'Abertura';
}

/**
 * Traduce un ID de objeto de renderizado a etiqueta legible.
 */
export function traducirIdRender(id: string): string {
    if (id.includes('render_wall_')) return traducirIdMuro(id.replace('render_wall_', ''));
    if (id.includes('render_panel_')) return traducirIdPanel(id.replace('render_panel_', ''));
    if (id.includes('render_stud_')) return 'Montante';
    if (id.includes('render_track_')) return 'Solera';
    if (id.includes('render_opening_')) return 'Vacío de Abertura';
    if (id.includes('render_header_')) return 'Dintel';
    if (id.includes('render_roof_')) return 'Techo';
    if (id.includes('render_foundation')) return 'Fundación';
    if (id.includes('render_anchor')) return 'Anclaje';
    return id;
}

/**
 * Intenta crear una etiqueta legible desde cualquier ID técnico.
 */
export function crearEtiquetaDesdeIdTecnico(id: string): string {
    if (id.startsWith('wall_')) return traducirIdMuro(id);
    if (id.startsWith('panel_')) return traducirIdPanel(id);
    if (id.startsWith('abertura_')) return traducirIdAbertura(id);
    if (id.startsWith('render_')) return traducirIdRender(id);
    return id;
}

/**
 * Traduce una clave de metadato.
 */
export function traducirClaveMetadata(key: string): string {
    return t('metadatos', key);
}
