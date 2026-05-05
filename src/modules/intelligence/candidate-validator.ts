import { PanelizationCandidate } from './types';
import { Abertura } from '../../core/types';
import { getPanelizationRules, isValidPanelWidth } from '../rules/panelization';
import { round } from '../../utils/math';

export function validateCandidate(candidate: PanelizationCandidate, wallLength: number, aberturas: Abertura[]): void {
  const { openingClearance } = getPanelizationRules();
  
  // 1. Validar Anchos
  for (const width of candidate.splits) {
    if (!isValidPanelWidth(width)) {
      candidate.valid = false;
      candidate.rejectionReason = `Ancho de panel ilegal: ${width}m`;
      return;
    }
  }

  // 2. Validar Longitud Total
  const total = round(candidate.splits.reduce((a, b) => a + b, 0));
  if (total !== wallLength) {
    candidate.valid = false;
    candidate.rejectionReason = `Discrepancia de longitud: ${total}m vs ${wallLength}m`;
    return;
  }

  // 3. Validar Conflictos con Aberturas (Veto fuerte)
  let currentOffset = 0;
  for (let i = 0; i < candidate.splits.length - 1; i++) {
    const jointPos = currentOffset + candidate.splits[i];
    
    const conflicto = aberturas.find(op => 
       jointPos > op.position - openingClearance && 
       jointPos < op.position + op.width + openingClearance
    );

    if (conflicto) {
      candidate.valid = false;
      candidate.rejectionReason = `La junta en ${jointPos}m viola la tolerancia de la abertura en ${conflicto.position}m`;
      return;
    }
    
    currentOffset += candidate.splits[i];
  }

  candidate.valid = true;
}
