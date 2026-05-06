import { ProjectResult, BOMItem } from '../../core/types';
import { IndustrialCutListDTO, IndustrialCutListPiece } from './types';

export class CutListBuilder {
    static build(project: ProjectResult): IndustrialCutListDTO {
        const ROLE_MAP: Record<string, string> = {
            'common': 'Montante común',
            'montante_principal': 'Montante rey',
            'montante_apoyo': 'Montante de apoyo',
            'montante_corto_superior': 'Montante corto superior',
            'montante_corto_inferior': 'Montante corto inferior',
            'track': 'Solera',
            'solera_inferior': 'Solera inferior',
            'solera_superior': 'Solera superior',
            'solera_ventana': 'Solera de ventana',
            'corner': 'Montante de esquina',
            'junction': 'Encuentro T',
            'provisional_boxed_header': 'Dintel (Boxed)',
            'provisional_double_pgc': 'Dintel Doble PGC'
        };

        const piezas: IndustrialCutListPiece[] = project.bom.cutList.map((item, index) => {
            const panel = project.construction.panels.find(p => p.id === item.sourceEntityId);
            const muro = panel ? panel.wallId : 'N/A';
            
            // Prioridad derivada del orden de decisión en el planificador
            const prioridadFabricacion = CutListBuilder.getPriority(project, item.sourceEntityId || '');

            return {
                id: `PIEZA-${index.toString().padStart(4, '0')}`,
                perfil: item.profileType,
                longitud: item.length,
                cantidad: item.quantity,
                anguloInicio: 0, // Por defecto 0 en SF estándar
                anguloFin: 0,
                panel: item.sourceEntityId || 'N/A',
                muro: muro,
                piezaTipo: ROLE_MAP[item.role] || item.role,
                prioridadFabricacion
            };
        });

        return { piezas };
    }

    private static getPriority(project: ProjectResult, panelId: string): number {
        // Buscamos el panel en el historial de decisiones (planningTrace)
        // El decisionTrace contiene eventos como 'WALL_DECIDED' o 'CANDIDATE_SELECTED'
        const trace = project.construction.metadata?.candidatesEvaluated || {};
        
        // Si no hay rastro explícito, usamos el índice del panel como prioridad básica
        const panelIndex = project.construction.panels.findIndex(p => p.id === panelId);
        
        // En una implementación avanzada, esto consultaría el orden exacto de montaje
        return panelIndex !== -1 ? panelIndex + 1 : 999;
    }
}
