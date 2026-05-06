import { ProjectResult } from '../../core/types';
import { IndustrialBOMDTO, IndustrialBOMItem } from './types';
import { round } from '../../utils/math';

export class IndustrialBOMBuilder {
    static build(project: ProjectResult): IndustrialBOMDTO {
        const items: IndustrialBOMItem[] = project.bom.cutList.map(item => {
            const codigo = `${item.profileType}-${Math.round(item.thickness * 100)}`;
            const descripcion = IndustrialBOMBuilder.getDescripcion(item.profileType, item.role);
            
            // Trazabilidad
            const panel = project.construction.panels.find(p => p.id === item.sourceEntityId);
            const muro = panel ? panel.wallId : undefined;

            return {
                ...item,
                codigo,
                descripcion,
                muro,
                panel: item.sourceEntityId
            };
        });

        const resumen: Record<string, number> = {};
        project.bom.aggregated.forEach(agg => {
            resumen[agg.profileType] = (resumen[agg.profileType] || 0) + agg.totalLinearMeters;
        });

        return {
            items,
            resumenPorPerfil: resumen
        };
    }

    private static getDescripcion(profile: string, role: string): string {
        const roles: Record<string, string> = {
            'common': 'Montante Estándar',
            'montante_principal': 'Montante Principal (King)',
            'montante_apoyo': 'Montante de Apoyo (Jack)',
            'montante_corto_superior': 'Montante Corto Superior (Cripple)',
            'montante_corto_inferior': 'Montante Corto Inferior (Cripple)',
            'track': 'Solera',
            'solera_ventana': 'Solera de Ventana',
            'provisional_boxed_header': 'Dintel de Refuerzo (Boxed)',
            'provisional_double_pgc': 'Dintel Doble PGC'
        };

        return roles[role] || `Perfil ${profile} - ${role}`;
    }
}
