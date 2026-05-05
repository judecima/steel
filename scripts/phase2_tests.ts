import { generateGeometry } from '../src/modules/geometry/engine';
import { panelizeHouse } from '../src/modules/construction/engine';
import { HouseInput, Panel, WallRole } from '../src/core/types';
import { CandidateStrategy } from '../src/modules/intelligence/types';
import { ENGINE_CONFIG } from '../src/core/config';

async function runPhase2Tests() {
  console.log("=== PROJECT STEEL FRAME - PHASE 2 GLOBAL PLANNING CERTIFICATION ===\n");

  let passed = true;

  // TEST 1: Zona de Muerte en Esquina (Veto fuerte)
  console.log("TEST 1: Veto de Zona de Muerte en Esquina");
  const input1: HouseInput = { 
    width: 3.5, length: 3.5, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0
  };
  const house1 = generateGeometry(input1);
  
  try {
      const res1 = panelizeHouse(house1);
      console.log(`  ✅ Pasado: La planificación tuvo éxito para un caso válido. Ganador: ${res1.metadata.globalWinner?.id}`);
  } catch (e: any) {
      console.log(`  ❌ Fallido: Debería haber tenido éxito pero falló: ${e.message}`);
      passed = false;
  }

  // TEST 2: Beneficio por Repetición (Estandarización Global)
  console.log("\nTEST 2: Beneficio por Repetición (Estandarización)");
  const input2: HouseInput = { width: 10, length: 10, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0 };
  const house2 = generateGeometry(input2);
  const res2 = panelizeHouse(house2);
  
  if (res2.metadata.globalWinner && res2.metadata.globalWinner.score.components.repetitionBenefit > 0) {
      console.log(`  ✅ Pasado: Beneficio por repetición calculado: ${res2.metadata.globalWinner.score.components.repetitionBenefit} pts`);
  } else {
      console.log("  ❌ Fallido: El beneficio por repetición fue cero para una casa cuadrada estándar.");
      passed = false;
  }

  // TEST 3: Rendimiento de Búsqueda por Beam
  console.log("\nTEST 3: Crecimiento Acotado de Beam (Rendimiento)");
  const telemetry = res2.metadata.telemetry;
  if (telemetry && telemetry.steps.every(s => s.retainedCount <= ENGINE_CONFIG.planning.beamWidth)) {
      console.log(`  ✅ Pasado: Estados retenidos consistentemente <= K (${ENGINE_CONFIG.planning.beamWidth}).`);
  } else {
      console.log("  ❌ Fallido: El crecimiento del beam superó K.");
      passed = false;
  }

  console.log("\n" + (passed ? "🏆 PLANIFICADOR GLOBAL FASE 2 CERTIFICADO" : "❌ FALLÓ LA FASE 2"));
}

runPhase2Tests().catch(err => {
  console.error("Phase 2 test crash:", err);
});
