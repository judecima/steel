import { Panel, StudRole, Abertura, HeaderStrategy, Stud } from '../../core/types';
import { generateId } from '../../utils/ids';
import { logger } from '../../utils/logger';
import { getDefaultProfile } from '../rules/studs';
import { calculateOpeningFrame, buildOpeningFrameMembers } from '../../lib/engine/structural/openingFrameCalculator';

export function applyOpeningReinforcements(panel: Panel): void {
  const profile = getDefaultProfile();

  panel.aberturas.forEach(op => {
    const relPos = op.position - panel.offset;

    const frameResult = calculateOpeningFrame({
        openingId: op.id,
        type: (op.type === 'ventana' || op.type === 'window') ? 'window' : 'door',
        widthMm: op.width * 1000,
        heightMm: op.height * 1000,
        sillHeightMm: op.sillHeight * 1000,
        wallHeightMm: panel.heightStart * 1000, 
        positionMm: relPos * 1000,
        studSpacingMm: 400
    });

    const members = buildOpeningFrameMembers({
        openingId: op.id,
        type: (op.type === 'ventana' || op.type === 'window') ? 'window' : 'door',
        positionMm: relPos * 1000,
        widthMm: op.width * 1000,
        heightMm: op.height * 1000,
        sillHeightMm: op.sillHeight * 1000,
        wallHeightMm: panel.heightStart * 1000,
        frame: frameResult
    });

    // Mapear miembros industriales a studs del panel
    members.forEach(m => {
        let role = StudRole.COMMON;
        if (m.memberType === 'king') role = StudRole.MONTANTE_PRINCIPAL;
        else if (m.memberType === 'jack') role = StudRole.MONTANTE_APOYO;
        else if (m.memberType === 'header') role = StudRole.DINTEL;
        else if (m.memberType === 'sill') role = StudRole.SOLERA_VENTANA;
        else if (m.memberType === 'cripple') role = StudRole.MONTANTE_CORTO_SUPERIOR;

        const stud: Stud = {
            id: generateId(`ind_${m.memberType}`),
            role: role,
            position: m.xStartMm / 1000,
            height: (m.yEndMm - m.yStartMm) / 1000,
            yOffset: m.yStartMm / 1000,
            profileType: m.profileId,
            metadata: {
                industrialRole: m.memberType,
                openingId: op.id
            }
        };
        panel.studs.push(stud);
    });

    // 6. Limpieza de Montantes Comunes que interfieren con la abertura
    panel.studs = panel.studs.filter(s => {
        if (s.role !== StudRole.COMMON) return true;
        const buffer = 0.01;
        // Si el montante está contenido dentro del vano de la abertura (entre los jacks)
        return s.position < relPos - buffer || s.position > (relPos + op.width) + buffer;
    });
  });
}

function getInterpolatedHeight(panel: Panel, pos: number): number {
  const t = Math.max(0, Math.min(1, pos / panel.width));
  return panel.heightStart + (panel.heightEnd - panel.heightStart) * t;
}
