import { generateGeometry } from '../src/modules/geometry/engine';
import { panelizeHouse } from '../src/modules/construction/engine';
import { GlobalArbiter } from '../src/modules/global-planning/global-arbiter';
import { ENGINE_CONFIG } from '../src/core/config';
import { PanelizationCandidate } from '../src/modules/intelligence/types';
import { generateCandidates } from '../src/modules/intelligence/candidate-generator';
import { validateCandidate } from '../src/modules/intelligence/candidate-validator';
import { scoreCandidate } from '../src/modules/intelligence/candidate-scorer';
import { SceneBuilder } from '../src/modules/render/scene-builder';
import { ProjectResult } from '../src/core/types';

declare var process: any;

function mockPipeline(input: any): ProjectResult {
  const house = generateGeometry(input);
  const localMap = new Map<string, PanelizationCandidate[]>();
  for (const wall of house.walls) {
      const cands = generateCandidates(wall.id, wall.length, wall.openings);
      const context = { wallRole: wall.role };
      cands.forEach(c => {
          validateCandidate(c, wall.length, wall.openings);
          if (c.valid) scoreCandidate(c, context, wall.openings);
      });
      localMap.set(wall.id, cands.filter(c => c.valid).sort((a, b) => b.score!.total - a.score!.total));
  }
  const { winner, telemetry } = GlobalArbiter.planHouse(house, localMap, ENGINE_CONFIG.planning);
  const result = panelizeHouse(house, winner, telemetry);
  
  return {
    input,
    house,
    construction: result,
    bom: { aggregated: [], cutList: [] },
    logs: [],
    status: 'constructive_precheck_passed',
    assumptions: [],
    warnings: []
  };
}

async function runTests() {
  console.log("=== PHASE 4A RENDER LAYER TESTS ===\n");
  let passed = true;
  let failCount = 0;

  const baseInput = { width: 4.0, length: 4.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, openings: [{ wallId: 'wall_north', type: 'window', width: 1.0, height: 1.0, position: 1.0 }] };
  
  // Create a deep copy helper to test immutability
  const createDeepCopy = (obj: any) => JSON.parse(JSON.stringify(obj));
  
  const projectResult = mockPipeline(baseInput);
  const originalJson = JSON.stringify(projectResult);

  // TEST 1: ProjectResult generates RenderSceneDTO
  console.log("TEST 1: ProjectResult generates RenderSceneDTO");
  const scene = SceneBuilder.buildScene(projectResult);
  if (scene && scene.objects && scene.layers) {
    console.log("  ✅ Passed: DTO Generated successfully.");
  } else {
    console.log("  ❌ Failed: DTO missing basic properties.");
    passed = false; failCount++;
  }

  // TEST 2: Every RenderObject has sourceId
  console.log("\nTEST 2: Every RenderObject has sourceId");
  const missingSourceId = scene.objects.filter(o => !o.sourceId);
  if (missingSourceId.length === 0) {
    console.log("  ✅ Passed: All objects traceable.");
  } else {
    console.log(`  ❌ Failed: ${missingSourceId.length} objects missing sourceId.`);
    passed = false; failCount++;
  }

  // TEST 3: Panel objects match panel dimensions
  console.log("\nTEST 3: Panel objects match panel dimensions");
  const panelObjects = scene.objects.filter(o => o.type === 'panel');
  if (panelObjects.length > 0 && panelObjects[0].dimensions.y === 2.6) {
    console.log("  ✅ Passed: Panel volume matches expected height.");
  } else {
    console.log("  ❌ Failed: Panel object dimensions incorrect.");
    passed = false; failCount++;
  }

  // TEST 4: Studs generate individual render objects
  console.log("\nTEST 4: Studs generate individual render objects");
  const studObjects = scene.objects.filter(o => o.type === 'stud');
  if (studObjects.length > 10) { // Should be a good number of studs in a 4x4 house
    console.log(`  ✅ Passed: Generated ${studObjects.length} independent stud objects.`);
  } else {
    console.log(`  ❌ Failed: Not enough stud objects (${studObjects.length}).`);
    passed = false; failCount++;
  }

  // TEST 5: Openings are transparent void markers
  console.log("\nTEST 5: Openings are transparent void markers");
  const openingObjects = scene.objects.filter(o => o.type === 'opening');
  if (openingObjects.length > 0 && openingObjects[0].material === 'mat_opening') {
    console.log("  ✅ Passed: Opening generated as void marker.");
  } else {
    console.log("  ❌ Failed: Opening missing or incorrect material.");
    passed = false; failCount++;
  }

  // TEST 9: Same input produces deterministic output
  console.log("\nTEST 9: Same input produces deterministic output");
  const scene2 = SceneBuilder.buildScene(projectResult);
  
  // We can't easily stringify metadata.generatedAt, so we strip it before comparison
  const s1Cmp = createDeepCopy(scene);
  const s2Cmp = createDeepCopy(scene2);
  s1Cmp.metadata.generatedAt = '';
  s1Cmp.metadata.projectId = '';
  s2Cmp.metadata.generatedAt = '';
  s2Cmp.metadata.projectId = '';

  if (JSON.stringify(s1Cmp) === JSON.stringify(s2Cmp)) {
    console.log("  ✅ Passed: Output is perfectly deterministic.");
  } else {
    console.log("  ❌ Failed: Non-deterministic output detected.");
    passed = false; failCount++;
  }

  // TEST 10: Render layer does not mutate ProjectResult
  console.log("\nTEST 10: Render layer does not mutate ProjectResult");
  const finalJson = JSON.stringify(projectResult);
  if (originalJson === finalJson) {
    console.log("  ✅ Passed: Strict Immutability verified. Source is untouched.");
  } else {
    console.log("  ❌ Failed: The source ProjectResult was mutated during render generation.");
    passed = false; failCount++;
  }

  if (!passed) {
      console.error(`\nSuite Failed. ${failCount} errors.`);
      process.exit(1);
  } else {
      console.log(`\n🏆 SUITE PASSED. All Phase 4A Core tests completed successfully.`);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
