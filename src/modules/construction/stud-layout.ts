import { Panel, Stud, StudRole, WallRole } from '../../core/types';
import { generateId } from '../../utils/ids';
import { getStudSpacing, getDefaultProfile } from '../rules/studs';

export function applyStudLayout(panel: Panel, wallRole: WallRole): void {
  const spacing = getStudSpacing(wallRole);
  const profile = getDefaultProfile();
  
  // Starting stud at 0
  panel.studs.push(createStud(0, panel.height, profile, StudRole.COMMON));

  let currentPos = spacing;
  while (currentPos < panel.width - 0.05) { // 5cm buffer for end stud
    // Only add stud if it doesn't conflict with an opening (this will be refined in openings.ts)
    panel.studs.push(createStud(currentPos, panel.height, profile, StudRole.COMMON));
    currentPos += spacing;
  }

  // Final stud at the end of panel
  panel.studs.push(createStud(panel.width, panel.height, profile, StudRole.COMMON));
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
