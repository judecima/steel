import { StructuralMember, HeaderCheckResult, StructuralStatus } from './types';
import { STRUCTURAL_ASSUMPTIONS } from './structural-assumptions';
import { getCodeReference } from './code-references';

export function checkHeaders(members: StructuralMember[]): HeaderCheckResult[] {
  const results: HeaderCheckResult[] = [];

  for (const member of members.filter(m => m.type === 'header')) {
    const span = member.length;
    let status: StructuralStatus = 'not_checked';
    let recommendation = '';

    if (span <= STRUCTURAL_ASSUMPTIONS.thresholds.header_span_level_A_max) {
      // Level A
      status = 'preliminary_pass';
      recommendation = 'preliminary_possible';
    } else if (span <= STRUCTURAL_ASSUMPTIONS.thresholds.header_span_level_B_max) {
      // Level B
      status = 'requires_engineer_review';
      recommendation = 'use_boxed_header';
    } else if (span <= STRUCTURAL_ASSUMPTIONS.thresholds.header_span_level_C_max) {
      // Level C
      status = 'requires_engineer_review';
      recommendation = 'use_trussed_header';
    } else {
      // Level D
      status = 'requires_engineer_review';
      recommendation = 'engineer_review_mandatory';
    }

    // A provisional header strategy generated in Phase 1 cannot be silently accepted if span > Level A
    if (member.metadata.strategy && member.metadata.strategy.includes('provisional') && span > STRUCTURAL_ASSUMPTIONS.thresholds.header_span_level_A_max) {
      status = 'requires_engineer_review';
    }

    results.push({
      openingId: member.sourceElementId,
      status,
      span,
      selectedHeader: member.profileId,
      recommendation,
      warnings: ['Provisional header checker only. Engineer must size actual profiles.'],
      codeReferences: [getCodeReference('CIRSOC_303', 'Assumption')]
    });
  }

  return results;
}
