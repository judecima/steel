import { StructuralProfile } from './types';
import { STRUCTURAL_ASSUMPTIONS } from './structural-assumptions';

// Small determinist profile catalog without dummy data
// Real manufacturer data must be provided for true CIRSOC checks
const CATALOG: StructuralProfile[] = [
  {
    id: 'pgc_100x0.9',
    name: 'PGC 100x0.9',
    profileType: 'PGC',
    web: 100,
    flange: 40,
    thickness: 0.9,
    source: 'system_catalog',
    completeness: 'incomplete' // Intentionally incomplete, lacking area, inertia, etc.
  },
  {
    id: 'pgc_100x1.6',
    name: 'PGC 100x1.6',
    profileType: 'PGC',
    web: 100,
    flange: 40,
    thickness: 1.6,
    steelGrade: 'F-24',
    fy: 240,
    area: 3.12, // example complete value for testing
    ix: 45.6,
    iy: 6.7,
    rx: 3.8,
    ry: 1.4,
    weightPerMeter: 2.45,
    source: 'sample_manufacturer',
    completeness: 'complete'
  }
];

export function getProfileById(id: string): StructuralProfile | undefined {
  return CATALOG.find(p => p.id === id);
}

export function findProfilesByType(type: string): StructuralProfile[] {
  return CATALOG.filter(p => p.profileType === type);
}

export function validateProfileCompleteness(profile: StructuralProfile): boolean {
  if (profile.completeness !== 'complete') return false;
  if (!profile.area || !profile.ix || !profile.iy || !profile.rx || !profile.ry || !profile.fy) {
    return false;
  }
  return true;
}
