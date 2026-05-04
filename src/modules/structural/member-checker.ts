import { StructuralMember, MemberCheckResult, LoadCase, LoadCombination } from './types';
import { getProfileById, validateProfileCompleteness } from './profile-catalog';
import { getCodeReference } from './code-references';

export function checkMembers(members: StructuralMember[], loadCases: LoadCase[], loadCombos: LoadCombination[]): MemberCheckResult[] {
  const results: MemberCheckResult[] = [];

  for (const member of members.filter(m => m.type === 'stud')) {
    const profile = getProfileById(member.profileId);
    
    if (!profile || !validateProfileCompleteness(profile)) {
      results.push({
        memberId: member.id,
        status: 'insufficient_data',
        warnings: ['Profile data is incomplete or missing. Area, inertia, fy are required.'],
        codeReferences: []
      });
      continue;
    }

    if (loadCases.length === 0) {
      results.push({
        memberId: member.id,
        status: 'insufficient_data',
        warnings: ['Load data missing.'],
        codeReferences: []
      });
      continue;
    }

    // Preliminary checks: VERY simplified axial check
    // Real capacity would use CIRSOC 303 formulas for local/distortional/global buckling
    const capacityKn = (profile.area! * 100 * profile.fy!) / 1000; // area cm2 * 100 mm2/cm2 * N/mm2 = N / 1000 = kN
    const demandKn = calculateMaxDemand(member, loadCases, loadCombos); 
    const utilization = demandKn / (capacityKn * 0.5); // 0.5 arbitrary preliminary buckling reduction factor

    let status: 'preliminary_pass' | 'preliminary_fail' = 'preliminary_pass';
    if (utilization > 1.0) {
      status = 'preliminary_fail';
    }

    results.push({
      memberId: member.id,
      status,
      utilizationRatio: utilization,
      governingCheck: 'preliminary_axial_compression',
      demand: demandKn,
      capacity: capacityKn * 0.5,
      warnings: ['Preliminary method used', 'Engineer review required for final design'],
      codeReferences: [getCodeReference('CIRSOC_303', 'Assumption')]
    });
  }

  return results;
}

function calculateMaxDemand(member: StructuralMember, loads: LoadCase[], combos: LoadCombination[]): number {
  // Simplified tributary area load mapping
  // area = trib_width * (assumed roof span / 2) -> Let's assume a generic roof influence of 2m for the stud
  const influenceArea = member.tributaryWidth * 2.0; 
  let maxDemand = 0;

  for (const combo of combos) {
    let currentDemand = 0;
    for (const load of loads) {
      if (combo.factors[load.type]) {
        currentDemand += load.magnitude * influenceArea * combo.factors[load.type];
      }
    }
    if (currentDemand > maxDemand) {
      maxDemand = currentDemand;
    }
  }

  return maxDemand || 1.0; // fallback to 1kN minimum if no combos match
}
