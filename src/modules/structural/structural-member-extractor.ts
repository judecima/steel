import { ProjectResult } from '../../core/types';
import { StructuralMember } from './types';
import { generateId } from '../../utils/ids';

export function extractStructuralMembers(projectResult: ProjectResult): StructuralMember[] {
  const members: StructuralMember[] = [];

  for (const panel of projectResult.construction.panels) {
    // Extract studs as members
    for (const stud of panel.studs) {
      members.push({
        id: generateId(`struct_stud_${stud.id}`),
        sourceElementId: stud.id,
        type: 'stud',
        profileId: stud.profileType === 'PGC 100x0.9' ? 'pgc_100x0.9' : 'pgc_100x1.6', // Naive mapping
        length: stud.height,
        effectiveLength: stud.height,
        boundaryCondition: 'pinned-pinned',
        role: stud.role,
        tributaryWidth: 0.4, // Simplified
        appliedLoads: [],
        metadata: { panelId: panel.id, wallId: panel.wallId }
      });
    }

    // Extract headers as members
    for (const opening of panel.openings) {
      if (opening.header) {
        members.push({
          id: generateId(`struct_header_${opening.id}`),
          sourceElementId: opening.id,
          type: 'header',
          profileId: 'pgc_100x1.6', // Simplified mapping
          length: opening.header.span,
          effectiveLength: opening.header.span,
          boundaryCondition: 'simply-supported',
          role: 'lintel',
          tributaryWidth: opening.header.span / 2, // Simplified tributary area
          appliedLoads: [],
          metadata: { panelId: panel.id, wallId: panel.wallId, strategy: opening.header.strategy }
        });
      }
    }
  }

  return members;
}
