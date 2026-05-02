import { StrategicArbiter } from '../src/modules/intelligence/strategic-arbiter';
import { CandidateStrategy, PanelizationCandidate } from '../src/modules/intelligence/types';
import { Opening, WallRole } from '../src/core/types';

async function runIntelligenceTests() {
  console.log("=== PROJECT STEEL FRAME - PHASE 1 POLISH CERTIFICATION ===\n");

  let passed = true;

  // Helper to find candidate by strategy
  const findByStrategy = (all: Record<string, PanelizationCandidate>, strategy: CandidateStrategy) => 
      Object.values(all).find(c => c.strategy === strategy);

  // TEST 1: Operative Penalties
  console.log("TEST 1: Operative Penalties (Score Modifier)");
  const wallWidth1 = 4.1; 
  const res1 = StrategicArbiter.resolveBestPlan('wall_penalty', wallWidth1, [], { wallRole: WallRole.EXTERNAL_LOADBEARING });
  if (res1.winner.score!.penalties.includes('PENALTY_NEAR_MIN_WIDTH')) {
      console.log("  ✅ Passed: Penalty detected and recorded.");
      if (res1.winner.score!.total < 95) { 
          console.log(`  ✅ Passed: Modifier operative. Total score: ${res1.winner.score!.total}`);
      } else {
          console.log(`  ❌ Failed: Score not affected by penalty? Total: ${res1.winner.score!.total}`);
          passed = false;
      }
  } else {
      console.log("  ❌ Failed: Penalty NOT detected for small panels.");
      passed = false;
  }

  // TEST 2: Strategic Context Bias
  console.log("\nTEST 2: Strategic Context Bias (Fewer Panels vs Balanced)");
  // Wall 7.5m.
  console.log("  - Bias: balanced (Expected: Balanced winner)");
  const result2a = StrategicArbiter.resolveBestPlan('wall_bias_norm', 7.5, [], { 
      wallRole: WallRole.EXTERNAL_LOADBEARING,
      preferredBias: 'balanced'
  });
  
  console.log("  - Bias: fewer_panels (Expected: MinPanels winner)");
  const result2b = StrategicArbiter.resolveBestPlan('wall_bias_eff', 7.5, [], { 
      wallRole: WallRole.EXTERNAL_LOADBEARING,
      preferredBias: 'fewer_panels'
  });

  const candBalA = findByStrategy(result2a.allEvaluated, CandidateStrategy.BALANCED);
  const candMinA = findByStrategy(result2a.allEvaluated, CandidateStrategy.MIN_PANELS);
  const candBalB = findByStrategy(result2b.allEvaluated, CandidateStrategy.BALANCED);
  const candMinB = findByStrategy(result2b.allEvaluated, CandidateStrategy.MIN_PANELS);

  if (result2a.winner.strategy === CandidateStrategy.BALANCED && result2b.winner.strategy === CandidateStrategy.MIN_PANELS) {
      console.log("  ✅ Passed: Winner shifted based on strategic context preference.");
  } else {
      console.log(`  ❌ Failed: Bias not effective. A: ${result2a.winner.strategy}, B: ${result2b.winner.strategy}`);
      console.log(`     Scores A: Bal=${candBalA?.score?.total}, MinP=${candMinA?.score?.total}`);
      console.log(`     Scores B: Bal=${candBalB?.score?.total}, MinP=${candMinB?.score?.total}`);
      passed = false;
  }

  // TEST 3: Full Metadata Traceability
  console.log("\nTEST 3: Full Metadata Traceability");
  if (Object.keys(result2a.allEvaluated).length >= 3) {
      console.log(`  ✅ Passed: Metadata contains ${Object.keys(result2a.allEvaluated).length} evaluated candidates.`);
  } else {
      console.log("  ❌ Failed: Metadata is empty or incomplete.");
      passed = false;
  }

  console.log("\n" + (passed ? "🏆 PHASE 1 POLISH CERTIFIED" : "❌ POLISH FAILED"));
}

runIntelligenceTests().catch(err => {
  console.error("Test suite crash:", err);
});
