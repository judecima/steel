import { ProyectoDTO, VersionProyectoDTO } from '../../../../src/modules/product/types';
import { normalizarConfiguracionParametrica } from './parametric-config';

export interface RepairResult {
    project: ProyectoDTO;
    repaired: boolean;
    warning?: string;
}

export function ensureActiveVersion(project: ProyectoDTO): RepairResult {
    let repaired = false;
    let warning = '';

    const historial = project.historialVersiones || [];

    // CASO 1: Historial vacío
    if (historial.length === 0) {
        const newVersionId = `v_init_${Date.now()}`;
        const newVersion: VersionProyectoDTO = {
            id: newVersionId,
            fecha: new Date().toISOString(),
            nota: 'Versión inicial (Auto-reparada)',
            configuracion: normalizarConfiguracionParametrica({}) // Usa defaults
        };
        project.historialVersiones = [newVersion];
        project.versionActual = newVersionId;
        repaired = true;
        warning = 'El proyecto no tenía versiones. Se creó una versión inicial automáticamente.';
        return { project, repaired, warning };
    }

    // CASO 2: versionActual es null o vacío
    if (!project.versionActual) {
        project.versionActual = historial[historial.length - 1].id;
        repaired = true;
        warning = 'El proyecto no tenía una versión activa definida. Se activó la última versión disponible.';
    }

    // CASO 3: versionActual apunta a algo que no está en el historial
    const vActual = historial.find(v => v.id === project.versionActual);
    if (!vActual) {
        project.versionActual = historial[historial.length - 1].id;
        repaired = true;
        warning = `La versión activa '${project.versionActual}' no existía. Se activó la última versión disponible.`;
    }

    return { project, repaired, warning };
}
