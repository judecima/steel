import { StrategicArbiter } from '../src/modules/intelligence/strategic-arbiter';
import { CandidateStrategy, PanelizationCandidate } from '../src/modules/intelligence/types';
import { Abertura, WallRole } from '../src/core/types';

async function runIntelligenceTests() {
  console.log("=== PROJECT STEEL FRAME - PHASE 1 POLISH CERTIFICATION ===\n");

  let passed = true;

  // Helper para encontrar candidato por estrategia
  const findByStrategy = (all: Record<string, PanelizationCandidate>, strategy: CandidateStrategy) => 
      Object.values(all).find(c => c.strategy === strategy);

  // TEST 1: Penalizaciones Operativas
  console.log("TEST 1: Penalizaciones Operativas (Modificador de Puntaje)");
  const wallWidth1 = 4.1; 
  const res1 = StrategicArbiter.resolveBestPlan('wall_penalty', wallWidth1, [], { wallRole: WallRole.EXTERNAL_LOADBEARING });
  if (res1.winner.score!.penalties.includes('PENALIZACION_ANCHO_MINIMO')) {
      console.log("  ✅ Pasado: Penalización detectada y registrada.");
      if (res1.winner.score!.total < 95) { 
          console.log(`  ✅ Pasado: Modificador operativo. Puntaje total: ${res1.winner.score!.total}`);
      } else {
          console.log(`  ❌ Fallido: ¿El puntaje no se vio afectado por la penalización? Total: ${res1.winner.score!.total}`);
          passed = false;
      }
  } else {
      console.log("  ❌ Fallido: NO se detectó la penalización para paneles pequeños.");
      passed = false;
  }

  // TEST 2: Sesgo de Contexto Estratégico
  console.log("\nTEST 2: Sesgo de Contexto Estratégico (Menos Paneles vs Balanceado)");
  // Muro 7.5m.
  console.log("  - Sesgo: balanced (Esperado: Ganador Balanceado)");
  const result2a = StrategicArbiter.resolveBestPlan('wall_bias_norm', 7.5, [], { 
      wallRole: WallRole.EXTERNAL_LOADBEARING,
      preferredBias: 'balanced'
  });
  
  console.log("  - Sesgo: fewer_panels (Esperado: Ganador MinPanels)");
  const result2b = StrategicArbiter.resolveBestPlan('wall_bias_eff', 7.5, [], { 
      wallRole: WallRole.EXTERNAL_LOADBEARING,
      preferredBias: 'fewer_panels'
  });

  const candBalA = findByStrategy(result2a.allEvaluated, CandidateStrategy.BALANCED);
  const candMinA = findByStrategy(result2a.allEvaluated, CandidateStrategy.MIN_PANELS);
  const candBalB = findByStrategy(result2b.allEvaluated, CandidateStrategy.BALANCED);
  const candMinB = findByStrategy(result2b.allEvaluated, CandidateStrategy.MIN_PANELS);

  if (result2a.winner.strategy === CandidateStrategy.BALANCED && result2b.winner.strategy === CandidateStrategy.MIN_PANELS) {
      console.log("  ✅ Pasado: El ganador cambió según la preferencia del contexto estratégico.");
  } else {
      console.log(`  ❌ Fallido: El sesgo no fue efectivo. A: ${result2a.winner.strategy}, B: ${result2b.winner.strategy}`);
      console.log(`     Puntajes A: Bal=${candBalA?.score?.total}, MinP=${candMinA?.score?.total}`);
      console.log(`     Puntajes B: Bal=${candBalB?.score?.total}, MinP=${candMinB?.score?.total}`);
      passed = false;
  }

  // TEST 3: Trazabilidad Completa de Metadatos
  console.log("\nTEST 3: Trazabilidad Completa de Metadatos");
  if (Object.keys(result2a.allEvaluated).length >= 3) {
      console.log(`  ✅ Pasado: Los metadatos contienen ${Object.keys(result2a.allEvaluated).length} candidatos evaluados.`);
  } else {
      console.log("  ❌ Fallido: Los metadatos están vacíos o incompletos.");
      passed = false;
  }

  console.log("\n" + (passed ? "🏆 FASE 1 POLISHED CERTIFICADA" : "❌ FALLÓ EL PULIDO"));
}

runIntelligenceTests().catch(err => {
  console.error("Test suite crash:", err);
});
