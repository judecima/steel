import { BillOfMaterials } from '../../core/types';
import { CatalogoPrecios, ItemPresupuesto, PresupuestoProyectoDTO } from './types';

export function construirPresupuesto(
    bom: BillOfMaterials,
    catalogo: Partial<CatalogoPrecios>,
    superficieM2: number,
    desperdicioEstimadoPct: number = 10
): PresupuestoProyectoDTO {
    const perfilesPrecios = catalogo.perfiles ?? {};
    const items: ItemPresupuesto[] = [];

    for (const entrada of bom.aggregated) {
        const precio = perfilesPrecios[entrada.profileType] ?? null;
        const cantidad = entrada.totalLinearMeters;
        items.push({
            concepto: entrada.profileType,
            cantidad,
            unidad: 'm lin.',
            precioUnitario: precio,
            subtotal: precio !== null ? Math.round(precio * cantidad * 100) / 100 : null
        });
    }

    const todosConPrecio = items.every(i => i.subtotal !== null);
    const costoTotal = todosConPrecio
        ? items.reduce((acc, i) => acc + (i.subtotal ?? 0), 0)
        : null;
    const costoM2 = costoTotal !== null && superficieM2 > 0
        ? Math.round((costoTotal / superficieM2) * 100) / 100
        : null;

    return {
        items,
        costoTotal,
        costoM2,
        desperdicioEstimado: desperdicioEstimadoPct,
        moneda: 'ARS'
    };
}
