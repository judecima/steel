import { ProjectResult } from '../../core/types';
import { AssemblySheetDTO, AssemblyStepDTO } from './types';

export class AssemblySheetBuilder {
    static build(project: ProjectResult): AssemblySheetDTO[] {
        return project.house.muros.map(muro => {
            const panelesMuro = project.construction.panels
                .filter(p => p.wallId === muro.id)
                .map(p => p.id);

            const pasos: AssemblyStepDTO[] = [
                {
                    orden: 1,
                    titulo: `Preparación de Muro: ${muro.id}`,
                    descripcion: `Identificar y posicionar los paneles ${panelesMuro.join(', ')}.`,
                    panelesInvolucrados: panelesMuro,
                    advertencias: project.warnings.filter(w => w.includes(muro.id))
                },
                {
                    orden: 2,
                    titulo: `Montaje de Paneles`,
                    descripcion: `Fijar paneles a fundación según plano de anclajes.`,
                    panelesInvolucrados: panelesMuro,
                    advertencias: []
                }
            ];

            return {
                muroId: muro.id,
                pasos
            };
        });
    }
}
