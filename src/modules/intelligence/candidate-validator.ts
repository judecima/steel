import { PanelizationCandidate } from './types';
import { Opening } from '../../core/types';
import { getPanelizationRules, isValidPanelWidth } from '../rules/panelization';
import { round } from '../../utils/math';

export function validateCandidate(candidate: PanelizationCandidate, wallLength: number, openings: Opening[]): void {
  const { openingClearance } = getPanelizationRules();
  
  // 1. Validate Widths
  for (const width of candidate.splits) {
    if (!isValidPanelWidth(width)) {
      candidate.valid = false;
      candidate.rejectionReason = `Illegal panel width: ${width}m`;
      return;
    }
  }

  // 2. Validate Total Length
  const total = round(candidate.splits.reduce((a, b) => a + b, 0));
  if (total !== wallLength) {
    candidate.valid = false;
    candidate.rejectionReason = `Length mismatch: ${total}m vs ${wallLength}m`;
    return;
  }

  // 3. Validate Opening Conflicts (Hard Veto)
  let currentOffset = 0;
  for (let i = 0; i < candidate.splits.length - 1; i++) {
    const jointPos = currentOffset + candidate.splits[i];
    
    const conflict = openings.find(op => 
       jointPos > op.position - openingClearance && 
       jointPos < op.position + op.width + openingClearance
    );

    if (conflict) {
      candidate.valid = false;
      candidate.rejectionReason = `Joint at ${jointPos}m violates opening clearance at ${conflict.position}m`;
      return;
    }
    
    currentOffset += candidate.splits[i];
  }

  // If we reached here, the candidate is valid
  candidate.valid = true;
}
