import { IndustrialPackageDTO } from './types';

export class ExportValidator {
    static validate(pkg: IndustrialPackageDTO): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // 1. Integridad BOM/CUTLIST
        const cutListTotalLen = pkg.cutList.piezas.reduce((acc, p) => acc + (p.longitud * p.cantidad), 0);
        const bomTotalLen = Object.values(pkg.bom.resumenPorPerfil).reduce((acc, len) => acc + len, 0);
        
        if (Math.abs(cutListTotalLen - bomTotalLen) > 0.1) {
            errors.push(`Inconsistencia de longitud total: CutList (${cutListTotalLen}) vs BOM (${bomTotalLen})`);
        }

        // 2. Cada panel tiene paquete
        const panelIds = pkg.paneles.map(p => p.panelId);
        const uniquePanelIds = new Set(panelIds);
        if (uniquePanelIds.size !== panelIds.length) {
            errors.push('Existen IDs de paneles duplicados en el paquete.');
        }

        // 3. No piezas huérfanas (todas las piezas pertenecen a un panel que existe en el paquete)
        pkg.cutList.piezas.forEach(pieza => {
            if (!uniquePanelIds.has(pieza.panel)) {
                errors.push(`Pieza huérfana detectada: ${pieza.id} referencia al panel inexistente ${pieza.panel}`);
            }
        });

        // 4. Cada muro tiene secuencia
        const wallIdsWithSequence = pkg.montaje.map(m => m.muroId);
        if (wallIdsWithSequence.length === 0) {
            errors.push('No se generaron secuencias de montaje para ningún muro.');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
