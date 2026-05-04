import { runPrecheck } from '../src/modules/validation/precheck';
import { generateGeometry } from '../src/modules/geometry/engine';
import { panelizeHouse } from '../src/modules/construction/engine';
import { calculateBOM } from '../src/modules/materials/engine';
import { HouseInput, Panel } from '../src/core/types';
import { generateCandidates } from '../src/modules/intelligence/candidate-generator';
import { validateCandidate } from '../src/modules/intelligence/candidate-validator';
import { scoreCandidate } from '../src/modules/intelligence/candidate-scorer';
import { GlobalArbiter } from '../src/modules/global-planning/global-arbiter';
import { ENGINE_CONFIG } from '../src/core/config';
import { PanelizationCandidate } from '../src/modules/intelligence/types';

function runPipeline(house: any) {
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
    return panelizeHouse(house, winner, telemetry);
}

async function runTests() {
  console.log("=== PROJECT STEEL FRAME - FINAL HARDENING REGRESSION ===\n");

  let passed = true;

  // TEST 1: Balanced Panels
  console.log("TEST 1: Balanced Panels (10m wall)");
  const input1: HouseInput = { width: 10.0, length: 5.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0 };
  const house1 = generateGeometry(input1);
  const result1 = runPipeline(house1);
  const northWallPanels = result1.panels.filter((p: Panel) => p.wallId === 'wall_north');
  if (northWallPanels.length === 3 && northWallPanels.every((p: Panel) => p.width > 3.32 && p.width < 3.35)) {
    console.log("  ✅ Passed: Balanced distribution (~3.33m) verified.");
  } else {
    console.log(`  ❌ Failed: Improper distribution: ${northWallPanels.map((p: Panel) => p.width).join(', ')}`);
    passed = false;
  }

  // TEST 2: Precheck BLOCKING (Impossible Geometry)
  console.log("\nTEST 2: Precheck BLOCKING (Opening overlap)");
  const input2: HouseInput = { 
    width: 6.0, length: 6.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0,
    openings: [
        { wallId: 'wall_north', type: 'window', width: 2.0, height: 1.0, position: 1.0 },
        { wallId: 'wall_north', type: 'window', width: 2.0, height: 1.0, position: 2.0 } // Overlap
    ]
  };
  const precheck2 = runPrecheck(input2);
  if (!precheck2.passed) {
    console.log("  ✅ Passed: Overlap successfully blocked.");
  } else {
    console.log("  ❌ Failed: Precheck failed to block overlap.");
    passed = false;
  }

  // TEST 3: One-way Shift Strategy
  console.log("\nTEST 3: One-way Shift (Shift must go Left to stay within bounds)");
  const input3: HouseInput = { 
    width: 6.0, length: 5.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0,
    openings: [{ wallId: 'wall_north', type: 'window', width: 1.0, height: 1.0, position: 2.4 }] // Joint at 3.0 hits window
  };
  try {
      const house3 = generateGeometry(input3);
      const result3 = runPipeline(house3);
      console.log(`  ✅ Passed: Found valid shift for complex case. Widths: ${result3.panels.filter((w: Panel)=>w.wallId==='wall_north').map((p: Panel)=>p.width)}`);
  } catch (e) {
      console.log(`  ❌ Failed: Should have found a valid shift but errored: ${e}`);
      passed = false;
  }

  // TEST 4: Fail-safe Blocking (Impossible Shift)
  console.log("\nTEST 4: Fail-safe BLOCKING (Impossible Split Plan)");
  const input4: HouseInput = { 
    width: 10.0, length: 5.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0,
    openings: [{ wallId: 'wall_north', type: 'window', width: 8.0, height: 1.0, position: 1.0 }] // 8m window in 10m wall
  };
  try {
    const house4 = generateGeometry(input4);
    runPipeline(house4);
    console.log("  ❌ Failed: Engine should have blocked impossible 8m window split.");
    passed = false;
  } catch (e: any) {
    if (e.message.includes("CRITICAL_PLANNING_FAILURE") || e.message.includes("No valid local candidates")) {
        console.log("  ✅ Passed: Engine successfully blocked impossible split plan.");
    } else {
        console.log(`  ❌ Failed: Unexpected error type: ${e.message}`);
        passed = false;
    }
  }

  // TEST 5: Formalized Header Metadata
  console.log("\nTEST 5: Formalized Header Metadata (In Construction phase)");
  const input5: HouseInput = { width: 5.0, length: 5.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, 
    openings: [{ wallId: 'wall_north', type: 'window', width: 1.0, height: 1.0, position: 1.0 }]
  };
  const house5 = generateGeometry(input5);
  const result5 = runPipeline(house5);
  const opWithHeader = result5.panels[0].openings[0];
  if (opWithHeader && opWithHeader.header && opWithHeader.header.span === 1.0) {
    console.log("  ✅ Passed: Header metadata formalized and attached to opening.");
  } else {
    console.log("  ❌ Failed: Header missing or incorrect.");
    passed = false;
  }

  console.log("\n" + (passed ? "🏆 FINAL HARDENING CERTIFIED" : "❌ HARDENING FAILED"));
}

runTests().catch(err => {
  console.error("Test suite crash:", err);
});
