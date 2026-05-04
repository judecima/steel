import { LoadCombination } from './types';
import { getCodeReference } from './code-references';

export function getPreliminaryLoadCombinations(): LoadCombination[] {
  return [
    {
      id: 'comb_prelim_gravity',
      name: 'Preliminary Gravity (1.2D + 1.6Lr)',
      factors: { dead: 1.2, roof_live: 1.6 },
      type: 'preliminary', // Explicitly marked
      codeReferences: [getCodeReference('CIRSOC_101', 'Assumption')],
      status: 'preliminary_assumption' // Explicit preliminary assumption status
    },
    {
      id: 'comb_prelim_wind',
      name: 'Preliminary Wind (1.2D + 1.0W + 0.5Lr)',
      factors: { dead: 1.2, wind: 1.0, roof_live: 0.5 },
      type: 'preliminary',
      codeReferences: [
        getCodeReference('CIRSOC_101', 'Assumption'),
        getCodeReference('CIRSOC_102', 'Assumption')
      ],
      status: 'preliminary_assumption'
    }
  ];
}
