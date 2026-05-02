import { HouseInput, ProjectResult, ProjectStatus } from './core/types';
import { PROJECT_ASSUMPTIONS } from './core/assumptions';
import { logger } from './utils/logger';
import { runPrecheck } from './modules/validation/precheck';
import { generateGeometry } from './modules/geometry/engine';
import { panelizeHouse } from './modules/construction/engine';
import { calculateBOM } from './modules/materials/engine';

async function main() {
  console.log("--- PROJECT STEEL FRAME - PHASE 0 FOUNDATION ---");

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

  // 4. Construction Logic
  const constructionResult = panelizeHouse(house);

  // 5. Materials & BOM
  const bom = calculateBOM(constructionResult.panels);

  // 6. Final Result Assembly
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

  // 7. Output Summary
  console.log("\n--- GENERATION SUMMARY ---");
  console.log(`Status: ${result.status}`);
  console.log(`Walls generated: ${result.house.walls.length}`);
  console.log(`Panels generated: ${result.construction.panels.length}`);
  console.log(`Global Winner Strategy: ${result.construction.metadata?.globalWinner?.score.total} pts (${result.construction.metadata?.globalWinner?.id})`);
  console.log(`Planning Time: ${result.construction.metadata?.telemetry?.totalPlanningTimeMs} ms`);
  console.log(`BOM Profile Types: ${result.bom.aggregated.length}`);
  
  console.log("\n--- AGGREGATED BOM ---");
  result.bom.aggregated.forEach(item => {
    console.log(`- ${item.profileType}: ${item.totalLinearMeters} m`);
  });

  console.log("\n--- WARNINGS ---");
  if (result.warnings.length > 0) {
    result.warnings.forEach(w => console.warn(`[!] ${w}`));
  } else {
    console.log("No warnings.");
  }

  console.log("\n--- SAMPLE DECISION LOGS ---");
  result.logs.slice(0, 5).forEach(log => {
    console.log(`[${log.event}] ${log.entityId}: ${log.reason}`);
  });

  console.log("\n--- VALIDATION ---");
  console.log("Phase 0 complete. Foundational architecture is ready for Phase 1 (Structural Engineering).");
}

main().catch(err => {
  console.error(err);
});
