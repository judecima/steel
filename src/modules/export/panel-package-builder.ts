import { ProjectResult, Panel } from '../../core/types';
import { PanelPackageDTO, IndustrialCutListPiece } from './types';
import { calculateBOM } from '../materials/engine';

export class PanelPackageBuilder {
    static buildAll(project: ProjectResult, allPieces: IndustrialCutListPiece[]): PanelPackageDTO[] {
        return project.construction.panels.map(panel => {
            const piezasPanel = allPieces.filter(p => p.panel === panel.id);
            const bomLocal = calculateBOM([panel]);

            return {
                panelId: panel.id,
                geometria: panel, // Simplificado: el DTO industrial consume el objeto panel directamente
                piezas: piezasPanel,
                bomLocal: bomLocal,
                metadata: {
                    muro: panel.wallId,
                    ancho: panel.width,
                    alto: panel.height,
                    rol: panel.role
                }
            };
        });
    }
}
