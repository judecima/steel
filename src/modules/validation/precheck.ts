import { HouseInput, OpeningInput } from '../../core/types';
import { logger } from '../../utils/logger';
import { getPanelizationRules } from '../rules/panelization';

export type PrecheckResult = {
  passed: boolean;
  warnings: string[];
  errors: string[];
};

export function runPrecheck(input: HouseInput): PrecheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { openingClearance, minWidth } = getPanelizationRules();

  if (input.width <= 0 || input.length <= 0) {
    errors.push("Invalid dimensions: width and length must be positive.");
  }

  if (input.minHeight < 2.0) { // Hardened from 1.0 to 2.0 for industrial realism
    errors.push("Insufficient height: minimum height must be at least 2.0m for code compliance.");
  }

  // Pre-calculate wall lengths for reference
  const wallLengths: Record<string, number> = {
    'wall_north': input.width,
    'wall_south': input.width,
    'wall_east': input.length,
    'wall_west': input.length
  };

  // Check openings
  if (input.openings) {
    // Group openings by wall
    const wallMap = new Map<string, OpeningInput[]>();
    input.openings.forEach(op => {
        const list = wallMap.get(op.wallId) || [];
        list.push(op);
        wallMap.set(op.wallId, list);
    });

    wallMap.forEach((ops, wallId) => {
      const wallLen = wallLengths[wallId];
      if (wallLen === undefined) {
          errors.push(`Unknown wall ID: ${wallId}`);
          return;
      }

      // Sort by position
      ops.sort((a, b) => a.position - b.position);

      ops.forEach((op, index) => {
        // 1. Basic size
        if (op.width <= 0 || op.height <= 0) {
          errors.push(`Invalid opening size: ${wallId} has opening with non-positive dimensions.`);
        }

        // 2. Proximity to wall edges
        if (op.position < openingClearance) {
          errors.push(`Opening too close to corner: ${wallId} opening at ${op.position}m (Min: ${openingClearance}m).`);
        }
        if (op.position + op.width > wallLen - openingClearance) {
          errors.push(`Opening too close to corner: ${wallId} opening at end exceeds safe boundary.`);
        }

        // 3. Proximity to next opening (Overlap or clearance)
        const nextOp = ops[index + 1];
        if (nextOp) {
           const gap = nextOp.position - (op.position + op.width);
           if (gap < 0) {
             errors.push(`Overlapping openings: ${wallId} has overlapping openings around ${op.position}m.`);
           } else if (gap < openingClearance / 2) { // Allow smaller gap between openings than from corners, but still gated
             errors.push(`Insufficient separation: openings on ${wallId} are too close (${gap}m).`);
           }
        }
      });
      
      // 4. Panelization possibility check
      // If a wall is very short but has a large opening, it might be impossible to panelize
      if (wallLen < minWidth && ops.length > 0) {
          warnings.push(`Wall ${wallId} is shorter than minimum panel width (${minWidth}m) but contains openings. Structural integrity risk.`);
      }
    });
  }

  const passed = errors.length === 0;

  if (!passed) {
    logger.log('PRECHECK_FAILED', 'system', 'Input validation failed BLOCKING execution', { errors });
  } else {
    logger.log('PRECHECK_PASSED', 'system', 'Input validation successful');
  }

  return { passed, warnings, errors };
}
