/**
 * Modos del visor productivo.
 * - cliente: visual limpio, sin datos técnicos
 * - taller: cortes, IDs de panel, lista de materiales
 * - ingenieria: estructural + inspección
 */
export type ModoVisorProductivo = 'cliente' | 'taller' | 'ingenieria';

export interface ProductViewerState {
    modoActivo: ModoVisorProductivo;
    proyectoId: string | null;
    panelSeleccionado: string | null;
    murosOcultos: string[];
    wireframe: boolean;
    mostrarEjes: boolean;
}

export function estadoInicial(): ProductViewerState {
    return {
        modoActivo: 'cliente',
        proyectoId: null,
        panelSeleccionado: null,
        murosOcultos: [],
        wireframe: false,
        mostrarEjes: false
    };
}

export function modoHaciaDTOMode(modo: ModoVisorProductivo): string {
    switch (modo) {
        case 'cliente':    return 'estandar';
        case 'taller':     return 'taller';
        case 'ingenieria': return 'estructural';
    }
}
