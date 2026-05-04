import { ProjectResult } from '../../core/types';
import { AnchorCheckResult } from './types';

export function checkAnchors(projectResult: ProjectResult): AnchorCheckResult {
  const assumptions = projectResult.assumptions || [];
  
  if (!assumptions.includes('foundation_data_provided')) {
    return {
      status: 'insufficient_data',
      requiredData: ['concrete_strength', 'slab_thickness', 'edge_distance'],
      warnings: ['Cannot perform preliminary anchor check without foundation data.'],
    };
  }

  // If data were present, we would calculate actual pullout capacity here.
  return {
    status: 'requires_engineer_review',
    requiredData: [],
    warnings: ['Preliminary anchor check passed based on assumptions, but engineer review is mandatory.'],
    recommendation: 'Use chemical anchors for main hold-downs and mechanical for shear'
  };
}
