import { HouseInput, ProjectResult, ProjectStatus } from './core/types';
import { PROJECT_ASSUMPTIONS } from './core/assumptions';
import { logger } from './utils/logger';
import { runPrecheck } from './modules/validation/precheck';
import { generateGeometry } from './modules/geometry/engine';
import { panelizeHouse } from './modules/construction/engine';
import { calculateBOM } from './modules/materials/engine';
import { generateCandidates } from './modules/intelligence/candidate-generator';
import { validateCandidate } from './modules/intelligence/candidate-validator';
import { scoreCandidate } from './modules/intelligence/candidate-scorer';
import { GlobalArbiter } from './modules/global-planning/global-arbiter';
import { ENGINE_CONFIG } from './core/config';
import { PanelizationCandidate } from './modules/intelligence/types';

async function main() {
  console.log("--- PROJECT STEEL FRAME - PHASE 2 FOUNDATION ---");

  // 1. Define sample input
  const input: HouseInput = {
    width: 8.0,
    length: 12.0,
    minHeight: 2.6,
    roofType: 'two_slope',
    roofSlope: 15,
    openings: [
      { wallId: 'wall_north', type: 'window', width: 1.5, height: 1.2, position: 2.0, sillHeight: 0.9 },
      { wallId: 'wall_east', type: 'door', width: 0.9, height: 2.05, position: 5.0 }
    ]
  };

  // 2. Run Precheck
  const precheck = runPrecheck(input);
  if (!precheck.passed) {
    console.error("Critical Errors found in input:");
    precheck.errors.forEach(e => console.error(`- ${e}`));
    return;
  }

  // 3. Generate Geometry
  const house = generateGeometry(input);

  // 4. Local Intelligence: Generate candidates for each wall
  logger.log('LOCAL_INTELLIGENCE_STARTED', 'house', 'Evaluating local wall candidates');
  const localCandidatesPerWall = new Map<string, PanelizationCandidate[]>();
  
  for (const wall of house.walls) {
      const candidates = generateCandidates(wall.id, wall.length, wall.openings);
      const context = { wallRole: wall.role };
      candidates.forEach(lc => {
         validateCandidate(lc, wall.length, wall.openings);
         if (lc.valid) scoreCandidate(lc, context, wall.openings);
      });
      // Sort and keep valid
      const validCandidates = candidates
        .filter(c => c.valid)
        .sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
        
      localCandidatesPerWall.set(wall.id, validCandidates);
  }

  // 5. Global Planning
  logger.log('GLOBAL_PLANNING_STARTED', 'house', 'Selecting best global combination');
  const { winner: globalPlanWinner, telemetry: plannerTelemetry } = GlobalArbiter.planHouse(house, localCandidatesPerWall, ENGINE_CONFIG.planning);

  // 6. Construction Logic
  const constructionResult = panelizeHouse(house, globalPlanWinner, plannerTelemetry);

  // 7. Materials & BOM
  const bom = calculateBOM(constructionResult.panels);

  // 8. Final Result Assembly
  const result: ProjectResult = {
    input,
    house,
    construction: constructionResult,
    bom,
    logs: logger.getEvents(),
    status: 'requires_structural_validation',
    assumptions: PROJECT_ASSUMPTIONS,
    warnings: precheck.warnings
  };

  // 9. Output Summary
  console.log("\n--- GENERATION SUMMARY ---");
  console.log(`Status: ${result.status}`);
  console.log(`Walls generated: ${result.house.walls.length}`);
  console.log(`Panels generated: ${result.construction.panels.length}`);
  console.log(`Global Winner Score: ${globalPlanWinner.score.total} pts`);
  console.log(`Planning Time: ${plannerTelemetry.planningTimeMs} ms`);
  console.log(`States Generated: ${plannerTelemetry.generatedStates}`);
  console.log(`BOM Profile Types: ${result.bom.aggregated.length}`);
  
  console.log("\n--- AGGREGATED BOM ---");
  result.bom.aggregated.forEach(item => {
    console.log(`- ${item.profileType}: ${item.totalLinearMeters} m`);
  });

  console.log("\n--- VALIDATION ---");
  console.log("Phase 2 complete. Global planning integration is operational.");
}

main().catch(err => {
  console.error(err);
});
