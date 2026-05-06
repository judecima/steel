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

        return roles[role] || `Perfil ${profile} - ${role}`;
    }
}
