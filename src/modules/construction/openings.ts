import { Panel, StudRole, Opening, HeaderStrategy } from '../../core/types';
import { generateId } from '../../utils/ids';
import { logger } from '../../utils/logger';
import { getDefaultProfile } from '../rules/studs';

export function applyOpeningReinforcements(panel: Panel): void {
  const profile = getDefaultProfile();

  panel.openings.forEach(op => {
    const relPos = op.position - panel.offset;

    logger.log('OPENING_REINFORCEMENT_APPLIED', panel.id, `Applying reinforcement for ${op.type}`, { relPos, width: op.width });

    // Formalize Header metadata during reinforcement phase
    op.header = {
        strategy: HeaderStrategy.PROVISIONAL_BOXED,
        span: op.width,
        requiresStructuralValidation: true
    };

    // 1. King Studs
    panel.studs.push({ id: generateId('king'), role: StudRole.KING, position: relPos - 0.05, height: panel.height, profileType: profile });
    panel.studs.push({ id: generateId('king'), role: StudRole.KING, position: relPos + op.width + 0.05, height: panel.height, profileType: profile });

    // 2. Jack Studs
    const headerHeight = op.height + op.sillHeight;
    panel.studs.push({ id: generateId('jack'), role: StudRole.JACK, position: relPos, height: headerHeight, profileType: profile });
    panel.studs.push({ id: generateId('jack'), role: StudRole.JACK, position: relPos + op.width, height: headerHeight, profileType: profile });

    // 3. Cripple Studs (Top)
    const crippleHeight = panel.height - headerHeight;
    if (crippleHeight > 0.1) {
        panel.studs.push({ id: generateId('cripple'), role: StudRole.CRIPPLE_TOP, position: relPos + op.width / 2, height: crippleHeight, profileType: profile });
    }

    // 4. Cleanup
    panel.studs = panel.studs.filter(s => {
        if (s.role !== StudRole.COMMON) return true;
        const buffer = 0.02;
        return s.position < relPos - buffer || s.position > relPos + op.width + buffer;
    });
  });
}
