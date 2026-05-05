import { ProjectResult } from '../../core/types';
import { AnchorCheckResult } from './types';

export function checkAnchors(projectResult: ProjectResult): AnchorCheckResult {
  const assumptions = projectResult.assumptions || [];
  
  if (!assumptions.includes('foundation_data_provided')) {
    return {
      status: 'insufficient_data',
      requiredData: ['resistencia_hormigon', 'espesor_losa', 'distancia_al_borde'],
      warnings: ['No se puede realizar la verificación preliminar de anclajes sin datos de la fundación.'],
    };
  }

  // If data were present, we would calculate actual pullout capacity here.
  return {
    status: 'requires_engineer_review',
    requiredData: [],
    warnings: ['La verificación preliminar de anclajes pasó según supuestos, pero la revisión de ingeniería es obligatoria.'],
    recommendation: 'Usar anclajes químicos para hold-downs principales y mecánicos para corte.'
  };
}
