import { 
  StructuralAnalysisResult, MemberCheckResult, HeaderCheckResult, 
  RoofStructuralCheckResult, AnchorCheckResult, StructuralStatus, 
  StructuralCertificationLevel, CodeReference 
} from './types';

export function buildStructuralReport(
  memberChecks: MemberCheckResult[],
  headerChecks: HeaderCheckResult[],
  roofCheck: RoofStructuralCheckResult,
  anchorCheck: AnchorCheckResult,
  missingDataFromEngine: string[]
): StructuralAnalysisResult {
  
  const allMissingData = [...missingDataFromEngine];
  const allWarnings = [
    'SAFETY BOUNDARY: This is a PRELIMINARY structural check only.',
    'DO NOT use this report for construction. Professional engineer approval is mandatory.'
  ];
  const criticalItems: string[] = [];
  const codeRefsMap = new Map<string, CodeReference>();

  let overallStatus: StructuralStatus = 'preliminary_pass';

  // Aggregate Anchor Check
  if (anchorCheck.status === 'insufficient_data') {
    allMissingData.push(...anchorCheck.requiredData.map(d => `Anchor data: ${d}`));
    overallStatus = downgradeStatus(overallStatus, 'insufficient_data');
  } else if (anchorCheck.status === 'requires_engineer_review') {
    criticalItems.push('Anchors require engineer review.');
    overallStatus = downgradeStatus(overallStatus, 'requires_engineer_review');
  }
  allWarnings.push(...anchorCheck.warnings);

  // Aggregate Roof Check
  if (roofCheck.status === 'requires_engineer_review') {
    criticalItems.push(`Roof span (${roofCheck.span}m) requires truss design.`);
    overallStatus = downgradeStatus(overallStatus, 'requires_engineer_review');
  } else if (roofCheck.status === 'insufficient_data') {
    overallStatus = downgradeStatus(overallStatus, 'insufficient_data');
  }
  allWarnings.push(...roofCheck.warnings);

  // Aggregate Headers
  for (const hc of headerChecks) {
    if (hc.status === 'insufficient_data') {
      overallStatus = downgradeStatus(overallStatus, 'insufficient_data');
    } else if (hc.status === 'requires_engineer_review') {
      criticalItems.push(`Header at ${hc.openingId} span ${hc.span}m requires review (${hc.recommendation})`);
      overallStatus = downgradeStatus(overallStatus, 'requires_engineer_review');
    } else if (hc.status === 'preliminary_fail') {
      overallStatus = downgradeStatus(overallStatus, 'preliminary_fail');
    }
    allWarnings.push(...hc.warnings);
    hc.codeReferences.forEach(ref => codeRefsMap.set(ref.code, ref));
  }

  // Aggregate Members
  let hasIncompleteMemberData = false;
  let hasCompleteMemberData = false;

  for (const mc of memberChecks) {
    if (mc.status === 'insufficient_data') {
      hasIncompleteMemberData = true;
      overallStatus = downgradeStatus(overallStatus, 'insufficient_data');
    } else {
      hasCompleteMemberData = true;
    }
    
    if (mc.status === 'requires_engineer_review') {
      overallStatus = downgradeStatus(overallStatus, 'requires_engineer_review');
    } else if (mc.status === 'preliminary_fail') {
      criticalItems.push(`Member ${mc.memberId} failed preliminary check (UR: ${mc.utilizationRatio?.toFixed(2)})`);
      overallStatus = downgradeStatus(overallStatus, 'preliminary_fail');
    }
    allWarnings.push(...mc.warnings);
    mc.codeReferences.forEach(ref => codeRefsMap.set(ref.code, ref));
  }

  // Mixed Data Completeness Rule (Test 9)
  if (hasCompleteMemberData && hasIncompleteMemberData) {
    overallStatus = downgradeStatus(overallStatus, 'requires_engineer_review');
    criticalItems.push('Mixed data completeness: Some members lacked data while others were checked. Full verification required.');
  }

  // Determine Certification Level
  let certificationLevel: StructuralCertificationLevel = 'preliminary_structural_checks';
  if (overallStatus === 'insufficient_data' || overallStatus === 'requires_engineer_review') {
    certificationLevel = 'engineer_review_required';
  } else if (overallStatus === 'preliminary_fail') {
    certificationLevel = 'engineer_review_required'; // Failures mean it must be engineered
  }

  return {
    status: overallStatus,
    certificationLevel,
    memberChecks,
    headerChecks,
    roofCheck,
    anchorCheck,
    criticalItems: Array.from(new Set(criticalItems)),
    missingData: Array.from(new Set(allMissingData)),
    warnings: Array.from(new Set(allWarnings)),
    codeReferences: Array.from(codeRefsMap.values()),
    summary: `Preliminary status: ${overallStatus}. ${criticalItems.length} critical items.`
  };
}

function downgradeStatus(current: StructuralStatus, next: StructuralStatus): StructuralStatus {
  const ranks: Record<StructuralStatus, number> = {
    'preliminary_pass': 0,
    'requires_engineer_review': 1,
    'insufficient_data': 2,
    'preliminary_fail': 3,
    'not_checked': -1
  };
  return ranks[next] > ranks[current] ? next : current;
}
