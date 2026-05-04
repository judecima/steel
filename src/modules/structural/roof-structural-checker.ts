import { ProjectResult } from '../../core/types';
import { RoofStructuralCheckResult, StructuralStatus } from './types';
import { STRUCTURAL_ASSUMPTIONS } from './structural-assumptions';

export function checkRoof(projectResult: ProjectResult): RoofStructuralCheckResult {
  const roof = projectResult.house.roof;
  // A naive span calculation: assume span is width for one_slope
  const span = projectResult.input.width;

  let status: StructuralStatus = 'preliminary_pass';
  let recommendation = 'preliminary_simple_rafter';

  if (span > STRUCTURAL_ASSUMPTIONS.thresholds.roof_span_truss_requirement) {
    status = 'requires_engineer_review';
    recommendation = 'requires_truss_design';
  }

  return {
    status,
    span,
    roofType: roof.type,
    slope: roof.slope,
    recommendation,
    warnings: ['Roof checker does not design trusses. Only preliminary span evaluation.']
  };
}
