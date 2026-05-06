import { Panel, Stud, StudRole, WallRole } from '../../core/types';
import { generateId } from '../../utils/ids';
import { getStudSpacing, getDefaultProfile } from '../rules/studs';

export function applyStudLayout(panel: Panel, wallRole: WallRole): void {
  const spacing = getStudSpacing(wallRole);
  const profile = getDefaultProfile();
  
  // Starting stud at 0
  panel.studs.push(createStud(0, panel.heightStart, profile, StudRole.COMMON));

  let currentPos = spacing;
  while (currentPos < panel.width - 0.05) { // 5cm buffer for end stud
    const hStud = panel.heightStart + (panel.heightEnd - panel.heightStart) * (currentPos / panel.width);
    panel.studs.push(createStud(currentPos, hStud, profile, StudRole.COMMON));
    currentPos += spacing;
  }

  // Final stud at the end of panel
  panel.studs.push(createStud(panel.width, panel.heightEnd, profile, StudRole.COMMON));
}

function createStud(position: number, height: number, profile: string, role: StudRole): Stud {
  return {
    id: generateId('stud'),
    role,
    position,
    height,
    profileType: profile
  };
}
