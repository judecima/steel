import { PlanosPackageDTO } from './types';

/**
 * Valida que el paquete de planos sea apto para exportar a PDF.
 * Evita fallos críticos en el loop de exportación.
 */
export function validatePdfScene(pkg: PlanosPackageDTO): boolean {
    if (!pkg) {
        throw new Error("Paquete de planos (PlanosPackageDTO) es nulo o indefinido.");
    }

    if (!pkg.hojas || pkg.hojas.length === 0) {
        throw new Error("El paquete no contiene hojas técnicas para exportar.");
    }

    // Validación básica de integridad
    const invalidHojas = pkg.hojas.filter(h => !h.id || !h.titleBlock);
    if (invalidHojas.length > 0) {
        console.warn(`[PDF_VALIDATE] Se detectaron ${invalidHojas.length} hojas con integridad dañada.`);
    }

    return true;
}
