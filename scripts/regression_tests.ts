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
    for (const muro of house.muros) {
        const cands = generateCandidates(muro.id, muro.length, muro.aberturas);
        const context = { wallRole: muro.role };
        cands.forEach(c => {
            validateCandidate(c, muro.length, muro.aberturas);
            if (c.valid) scoreCandidate(c, context, muro.aberturas);
        });
        localMap.set(muro.id, cands.filter(c => c.valid).sort((a, b) => b.score!.total - a.score!.total));
    }
    const { winner, telemetry } = GlobalArbiter.planHouse(house, localMap, ENGINE_CONFIG.planning);
    return panelizeHouse(house, winner, telemetry);
}

async function runTests() {
  console.log("=== PROJECT STEEL FRAME - FINAL HARDENING REGRESSION ===\n");

  let passed = true;

  // TEST 1: Paneles Balanceados
  console.log("TEST 1: Paneles Balanceados (muro de 10m)");
  const input1: HouseInput = { width: 10.0, length: 5.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0 };
  const house1 = generateGeometry(input1);
  const result1 = runPipeline(house1);
  const northWallPanels = result1.panels.filter((p: Panel) => p.wallId === 'wall_north');
  if (northWallPanels.length === 3 && northWallPanels.every((p: Panel) => p.width > 3.32 && p.width < 3.35)) {
    console.log("  ✅ Pasado: Distribución balanceada (~3.33m) verificada.");
  } else {
    console.log(`  ❌ Fallido: Distribución incorrecta: ${northWallPanels.map((p: Panel) => p.width).join(', ')}`);
    passed = false;
  }

  // TEST 2: BLOQUEO de Precheck (Geometría Imposible)
  console.log("\nTEST 2: BLOQUEO de Precheck (Superposición de aberturas)");
  const input2: HouseInput = { 
    width: 6.0, length: 6.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0,
    openings: [
        { wallId: 'wall_north', type: 'ventana', width: 2.0, height: 1.0, position: 1.0 },
        { wallId: 'wall_north', type: 'ventana', width: 2.0, height: 1.0, position: 2.0 } // Superposición
    ]
  };
  const precheck2 = runPrecheck(input2);
  if (!precheck2.passed) {
    console.log("  ✅ Pasado: Superposición bloqueada exitosamente.");
  } else {
    console.log("  ❌ Fallido: El precheck no bloqueó la superposición.");
    passed = false;
  }

  // TEST 3: Estrategia de desplazamiento
  console.log("\nTEST 3: Desplazamiento (Debe ir a la izquierda para mantenerse en límites)");
  const input3: HouseInput = { 
    width: 6.0, length: 5.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0,
    openings: [{ wallId: 'wall_north', type: 'ventana', width: 1.0, height: 1.0, position: 2.4 }]
  };
  try {
      const house3 = generateGeometry(input3);
      const result3 = runPipeline(house3);
      console.log(`  ✅ Pasado: Se encontró un desplazamiento válido. Anchos: ${result3.panels.filter((w: Panel)=>w.wallId==='wall_north').map((p: Panel)=>p.width)}`);
  } catch (e) {
      console.log(`  ❌ Fallido: Debería haber encontrado un desplazamiento válido: ${e}`);
      passed = false;
  }

  // TEST 4: Bloqueo de seguridad (Desplazamiento imposible)
  console.log("\nTEST 4: Bloqueo de SEGURIDAD (Plan de división imposible)");
  const input4: HouseInput = { 
    width: 10.0, length: 5.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0,
    openings: [{ wallId: 'wall_north', type: 'ventana', width: 8.0, height: 1.0, position: 1.0 }] // Ventana de 8m en muro de 10m
  };
  try {
    const house4 = generateGeometry(input4);
    runPipeline(house4);
    console.log("  ❌ Fallido: El motor debería haber bloqueado la división imposible de ventana de 8m.");
    passed = false;
  } catch (e: any) {
    if (e.message.includes("CRITICAL_PLANNING_FAILURE") || e.message.includes("No se proporcionaron candidatos locales válidos")) {
        console.log("  ✅ Pasado: El motor bloqueó exitosamente el plan de división imposible.");
    } else {
        console.log(`  ❌ Fallido: Tipo de error inesperado: ${e.message}`);
        passed = false;
    }
  }

  // TEST 5: Metadatos de Dintel Formalizados
  console.log("\nTEST 5: Metadatos de Dintel Formalizados (En fase de construcción)");
  const input5: HouseInput = { width: 5.0, length: 5.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, 
    openings: [{ wallId: 'wall_north', type: 'ventana', width: 1.0, height: 1.0, position: 1.0 }]
  };
  const house5 = generateGeometry(input5);
  const result5 = runPipeline(house5);
  const opWithHeader = result5.panels[0].aberturas[0];
  if (opWithHeader && opWithHeader.dintel && opWithHeader.dintel.span === 1.0) {
    console.log("  ✅ Pasado: Metadatos de dintel formalizados y adjuntos a la abertura.");
  } else {
    console.log("  ❌ Fallido: Dintel faltante o incorrecto.");
    passed = false;
  }

  console.log("\n" + (passed ? "🏆 HARDENING FINAL CERTIFICADO" : "❌ HARDENING FALLIDO"));
}

runTests().catch(err => {
  console.error("Test suite crash:", err);
});
