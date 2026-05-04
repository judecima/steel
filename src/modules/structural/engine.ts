import { ProjectResult } from '../../core/types';
import { StructuralAnalysisResult } from './types';
import { extractStructuralMembers } from './structural-member-extractor';
import { generatePreliminaryLoadCases } from './load-engine';
import { getPreliminaryLoadCombinations } from './load-combinations';
import { checkMembers } from './member-checker';
import { checkHeaders } from './header-checker';
import { checkRoof } from './roof-structural-checker';
import { checkAnchors } from './anchor-checker';
import { buildStructuralReport } from './report';

export class StructuralEngine {
  static runPreliminaryAnalysis(projectResult: ProjectResult): StructuralAnalysisResult {
    // 1. Extract abstract structural members
    const members = extractStructuralMembers(projectResult);

    // 2. Generate Loads & Combos
    const { loads, missingData } = generatePreliminaryLoadCases(projectResult);
    const combos = getPreliminaryLoadCombinations();

    // 3. Run Checkers
    const memberChecks = checkMembers(members, loads, combos);
    const headerChecks = checkHeaders(members);
    const roofCheck = checkRoof(projectResult);
    const anchorCheck = checkAnchors(projectResult);

    // 4. Build Report
    return buildStructuralReport(memberChecks, headerChecks, roofCheck, anchorCheck, missingData);
  }
}
