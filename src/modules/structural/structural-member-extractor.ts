import { ProjectResult } from '../../core/types';
import { StructuralMember } from './types';
import { generateId } from '../../utils/ids';

export function extractStructuralMembers(projectResult: ProjectResult): StructuralMember[] {
  const members: StructuralMember[] = [];

  for (const panel of projectResult.construction.panels) {
    // Extraer montantes como miembros
    for (const stud of panel.studs) {
      members.push({
        id: generateId(`struct_stud_${stud.id}`),
        sourceElementId: stud.id,
        type: 'montante',
        profileId: stud.profileType === 'PGC 100x0.9' ? 'pgc_100x0.9' : 'pgc_100x1.6', // Mapeo ingenuo
        length: stud.height,
        effectiveLength: stud.height,
        boundaryCondition: 'pinned-pinned',
        role: stud.role,
        tributaryWidth: 0.4, // Simplificado
        appliedLoads: [],
        metadata: { panelId: panel.id, wallId: panel.wallId }
      });
    }

    // Extraer dinteles como miembros
    for (const abertura of panel.aberturas) {
      if (abertura.dintel) {
        members.push({
          id: generateId(`struct_header_${abertura.id}`),
          sourceElementId: abertura.id,
          type: 'dintel',
          profileId: 'pgc_100x1.6', // Mapeo simplificado
          length: abertura.dintel.span,
          effectiveLength: abertura.dintel.span,
          boundaryCondition: 'simply-supported',
          role: 'lintel',
          tributaryWidth: abertura.dintel.span / 2, // Área tributaria simplificada
          appliedLoads: [],
          metadata: { panelId: panel.id, wallId: panel.wallId, strategy: abertura.dintel.strategy }
        });
      }
    }
  }

  return members;
}
