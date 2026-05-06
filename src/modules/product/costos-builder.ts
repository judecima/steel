import { CatalogoPrecios } from './types';

/** Catálogo vacío por defecto — sin precios hardcodeados. */
export const CATALOGO_VACIO: Partial<CatalogoPrecios> = {
    perfiles: {},
    accesorios: {},
    manoDeObra: {}
};

/**
 * Devuelve un catálogo con los precios del usuario mezclado con el vacío.
 * Si el usuario pasa un precio parcial, los perfiles no incluidos quedan como null.
 */
export function construirCatalogo(override: Partial<CatalogoPrecios> = {}): Partial<CatalogoPrecios> {
    return {
        perfiles: { ...(override.perfiles ?? {}) },
        accesorios: { ...(override.accesorios ?? {}) },
        manoDeObra: { ...(override.manoDeObra ?? {}) }
    };
}

export function formatearPrecio(valor: number | null, moneda: string = 'ARS'): string {
    if (valor === null) return 'precio pendiente';
    return `${moneda} ${valor.toFixed(2)}`;
}
