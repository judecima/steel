import { ProjectResult } from '../../core/types';
import { LoadCase } from './types';
import { STRUCTURAL_ASSUMPTIONS } from './structural-assumptions';

export function generatePreliminaryLoadCases(projectResult: ProjectResult): { loads: LoadCase[], missingData: string[] } {
  const loads: LoadCase[] = [];
  const missingData: string[] = [];

  // Dead Load
  loads.push({
    id: 'lc_dead',
    type: 'dead',
    magnitude: STRUCTURAL_ASSUMPTIONS.loads.dead_load_roof_kn_m2,
    unit: 'kN/m2',
    direction: 'gravity',
    source: 'preliminary_assumption',
    assumptions: ['Uniform dead load assumption']
  });

  // Roof Live Load
  loads.push({
    id: 'lc_live_roof',
    type: 'roof_live',
    magnitude: STRUCTURAL_ASSUMPTIONS.loads.live_load_roof_kn_m2,
    unit: 'kN/m2',
    direction: 'gravity',
    source: 'preliminary_assumption',
    assumptions: ['Uniform roof live load assumption']
  });

  // Wind Load
  if (!projectResult.assumptions?.includes('wind_zone_data_provided')) {
    missingData.push('Wind zone data missing. No wind loads generated.');
  } else {
    loads.push({
      id: 'lc_wind',
      type: 'wind',
      magnitude: STRUCTURAL_ASSUMPTIONS.loads.wind_pressure_kn_m2,
      unit: 'kN/m2',
      direction: 'lateral_x',
      source: 'preliminary_assumption',
      assumptions: ['Simplified wind pressure']
    });
  }

  // Seismic Load
  if (!projectResult.assumptions?.includes('seismic_zone_data_provided')) {
    missingData.push('Seismic zone data missing. No seismic loads generated.');
  }

  return { loads, missingData };
}
