import { ProjectResult } from '../../core/types';
import { RoofStructuralCheckResult, StructuralStatus } from './types';
import { STRUCTURAL_ASSUMPTIONS } from './structural-assumptions';

export function checkRoof(projectResult: ProjectResult): RoofStructuralCheckResult {
  const roof = projectResult.house.roof;
  // A naive span calculation: assume span is width for one_slope
  const span = projectResult.input.width;

  let status: StructuralStatus = 'preliminary_pass';
  let recommendation = 'tirante_simple_preliminar';

  if (span > STRUCTURAL_ASSUMPTIONS.thresholds.roof_span_truss_requirement) {
    status = 'requires_engineer_review';
    recommendation = 'requiere_diseno_de_cercha';
  }

  return {
    status,
    span,
    roofType: roof.type,
    slope: roof.slope,
    recommendation,
    warnings: ['El verificador de techo no diseña cerchas. Solo evaluación preliminar de luz.']
  };
}
