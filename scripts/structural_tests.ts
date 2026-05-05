import { generateGeometry } from '../src/modules/geometry/engine';
import { runPrecheck } from '../src/modules/validation/precheck';
import { panelizeHouse } from '../src/modules/construction/engine';
import { GlobalArbiter } from '../src/modules/global-planning/global-arbiter';
import { ENGINE_CONFIG } from '../src/core/config';
import { PanelizationCandidate } from '../src/modules/intelligence/types';
import { generateCandidates } from '../src/modules/intelligence/candidate-generator';
import { validateCandidate } from '../src/modules/intelligence/candidate-validator';
import { scoreCandidate } from '../src/modules/intelligence/candidate-scorer';
import { StructuralEngine } from '../src/modules/structural/engine';
import { buildStructuralReport } from '../src/modules/structural/report';
import { ProjectResult } from '../src/core/types';

declare var process: any;

function mockPipeline(input: any, assumptions: string[] = []): ProjectResult {
  const house = generateGeometry(input);
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
  const result = panelizeHouse(house, winner, telemetry);
  
  return {
    input,
    house,
    construction: result,
    bom: { aggregated: [], cutList: [] },
    logs: [],
    status: 'constructive_precheck_passed',
    assumptions,
    warnings: []
  };
}

async function runTests() {
  console.log("=== PRUEBAS DE CAPA ESTRUCTURAL FASE 3 ===\n");
  let passed = true;
  let failCount = 0;

  // TEST 1: Datos faltantes no pasan -> esperado: insufficient_data
  console.log("TEST 1: Datos faltantes no pasan");
  const p1 = mockPipeline({ width: 3.0, length: 3.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0 });
  const res1 = StructuralEngine.runPreliminaryAnalysis(p1);
  if (res1.status === 'insufficient_data') {
    console.log("  ✅ Pasado: Bloqueado por datos faltantes.");
  } else {
    console.log(`  ❌ Fallido: Se esperaba insufficient_data, se obtuvo ${res1.status}`);
    passed = false; failCount++;
  }

  // TEST 2: Abertura sobredimensionada activa revisión -> esperado: requires_engineer_review
  console.log("\nTEST 2: Abertura sobredimensionada activa revisión");
  const p2 = mockPipeline(
    { width: 6.0, length: 5.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, openings: [{ wallId: 'wall_north', type: 'ventana', width: 2.6, height: 1.0, position: 1.0 }] },
    ['wind_zone_data_provided', 'seismic_zone_data_provided', 'foundation_data_provided']
  );
  const res2 = StructuralEngine.runPreliminaryAnalysis(p2);
  const dintelCheck = res2.dintelChecks[0];
  if (dintelCheck && dintelCheck.status === 'requires_engineer_review' && dintelCheck.recommendation.includes('viga reticulada')) {
    console.log("  ✅ Pasado: Abertura sobredimensionada marcada para dintel reticulado.");
  } else {
    console.log(`  ❌ Fallido: No se marcó correctamente. Estado: ${dintelCheck?.status}, Rec: ${dintelCheck?.recommendation}`);
    passed = false; failCount++;
  }

  // TEST 3: El dintel provisional no puede aceptarse silenciosamente -> esperado: requires_engineer_review
  console.log("\nTEST 3: El dintel provisional no puede aceptarse silenciosamente");
  const p3 = mockPipeline(
    { width: 6.0, length: 5.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, openings: [{ wallId: 'wall_north', type: 'ventana', width: 2.0, height: 1.0, position: 1.0 }] }
  );
  const res3 = StructuralEngine.runPreliminaryAnalysis(p3);
  const dintelCheck3 = res3.dintelChecks[0];
  if (dintelCheck3 && dintelCheck3.status === 'requires_engineer_review') {
    console.log("  ✅ Pasado: Dintel provisional marcado explícitamente para revisión.");
  } else {
    console.log(`  ❌ Fallido: Dintel provisional no marcado. Estado: ${dintelCheck3?.status}`);
    passed = false; failCount++;
  }

  // TEST 4: El ratio de utilización del miembro se calcula cuando existen datos de perfil/carga
  console.log("\nTEST 4: El ratio de utilización del miembro se calcula");
  const p4 = mockPipeline(
    { width: 3.0, length: 3.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0 },
    ['wind_zone_data_provided', 'seismic_zone_data_provided', 'foundation_data_provided']
  );
  p4.construction.panels[0].studs[0].profileType = 'PGC 100x1.6'; 
  const res4 = StructuralEngine.runPreliminaryAnalysis(p4);
  const studCheck = res4.memberChecks.find(m => m.utilizationRatio !== undefined);
  if (studCheck && typeof studCheck.utilizationRatio === 'number') {
    console.log(`  ✅ Pasado: UR calculado (${studCheck.utilizationRatio.toFixed(2)})`);
  } else {
    console.log(`  ❌ Fallido: No se calculó el UR.`);
    passed = false; failCount++;
  }

  // TEST 5: El fallo de un miembro bloquea el pase preliminar -> esperado: preliminary_fail
  console.log("\nTEST 5: El fallo de un miembro bloquea el pase preliminar");
  const fakeFail = buildStructuralReport(
    [{ memberId: 'x', status: 'preliminary_fail', warnings: [], codeReferences: [] }], 
    [], 
    [], // disenosDintel
    { status: 'preliminary_pass', span: 1, roofType: 'x', slope: 0, warnings: [] }, 
    { status: 'preliminary_pass', requiredData: [], warnings: [] }, 
    []
  );
  if (fakeFail.status === 'preliminary_fail') {
    console.log("  ✅ Pasado: El fallo del miembro escala a preliminary_fail general.");
  } else {
    console.log("  ❌ Fallido: El estado no escaló.");
    passed = false; failCount++;
  }

  // TEST 6: Sin reclamo de cumplimiento final CIRSOC
  console.log("\nTEST 6: Sin reclamo de cumplimiento final CIRSOC");
  const hasClaim = res1.warnings.some(w => w.includes('final CIRSOC approved'));
  if (!hasClaim) {
    console.log("  ✅ Pasado: El reporte impone límites preliminares.");
  } else {
    console.log("  ❌ Fallido: Se encontró lenguaje prohibido.");
    passed = false; failCount++;
  }

  // TEST 7: El verificador de anclaje requiere datos de fundación
  console.log("\nTEST 7: El verificador de anclaje requiere datos de fundación");
  if (res1.anchorCheck.status === 'insufficient_data') {
    console.log("  ✅ Pasado: Verificación de anclaje bloqueada de forma segura.");
  } else {
    console.log("  ❌ Fallido: La verificación de anclaje ignoró los datos faltantes.");
    passed = false; failCount++;
  }

  // TEST 8: La gran luz del techo activa el requisito de cercha
  console.log("\nTEST 8: La gran luz del techo activa el requisito de cercha");
  const p8 = mockPipeline({ width: 5.0, length: 3.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0 }); 
  const res8 = StructuralEngine.runPreliminaryAnalysis(p8);
  if (res8.roofCheck.status === 'requires_engineer_review' && res8.roofCheck.recommendation === 'requiere_diseno_de_cercha') {
    console.log("  ✅ Pasado: La gran luz activó la revisión de diseño de cercha.");
  } else {
    console.log(`  ❌ Fallido: La verificación del techo no marcó la gran luz. Rec: ${res8.roofCheck.recommendation}`);
    passed = false; failCount++;
  }

  // TEST 9: Completitud de datos mixta
  console.log("\nTEST 9: Completitud de datos mixta");
  const res9 = StructuralEngine.runPreliminaryAnalysis(p4);
  if (res9.status === 'requires_engineer_review' || res9.status === 'insufficient_data') {
    console.log("  ✅ Pasado: Completitud mixta marcada para revisión.");
  } else {
    console.log(`  ❌ Fallido: Se esperaba requiere_revision_ingenieria o datos_insuficientes, se obtuvo ${res9.status}`);
    passed = false; failCount++;
  }

  // TEST 10: Abertura pequeña usa dintel simple
  console.log("\nTEST 10: Abertura pequeña usa dintel simple");
  const p10 = mockPipeline({ width: 3, length: 3, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, openings: [{ wallId: 'wall_north', type: 'ventana', width: 0.8, height: 1, position: 1 }] });
  const res10 = StructuralEngine.runPreliminaryAnalysis(p10);
  const diseno10 = res10.disenosDintel[0];
  if (diseno10 && diseno10.clasificacion.categoria === 'abertura_pequena' && diseno10.candidatoSeleccionado?.estrategia === 'dintel_simple') {
    console.log("  ✅ Pasado: Clasificación correcta para abertura pequeña.");
  } else {
    console.log(`  ❌ Fallido: Clasificación incorrecta. Categoria: ${diseno10?.clasificacion.categoria}`);
    passed = false; failCount++;
  }

  // TEST 11: Abertura media recomienda dintel compuesto
  console.log("\nTEST 11: Abertura media recomienda dintel compuesto");
  const p11 = mockPipeline({ width: 3, length: 3, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, openings: [{ wallId: 'wall_north', type: 'ventana', width: 1.5, height: 1, position: 1 }] });
  const res11 = StructuralEngine.runPreliminaryAnalysis(p11);
  const diseno11 = res11.disenosDintel[0];
  if (diseno11 && diseno11.clasificacion.categoria === 'abertura_media' && diseno11.candidatos.some(c => c.estrategia === 'dintel_compuesto')) {
    console.log("  ✅ Pasado: Clasificación correcta para abertura media.");
  } else {
    console.log(`  ❌ Fallido: Clasificación incorrecta. Categoria: ${diseno11?.clasificacion.categoria}`);
    passed = false; failCount++;
  }

  // TEST 12: Abertura grande recomienda dintel reticulado
  console.log("\nTEST 12: Abertura grande recomienda dintel reticulado");
  const p12 = mockPipeline(
    { width: 6, length: 3, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, openings: [{ wallId: 'wall_north', type: 'ventana', width: 2.5, height: 1, position: 1 }] },
    ['wind_zone_data_provided', 'seismic_zone_data_provided', 'foundation_data_provided']
  );
  const res12 = StructuralEngine.runPreliminaryAnalysis(p12);
  const diseno12 = res12.disenosDintel[0];
  if (diseno12 && diseno12.clasificacion.categoria === 'abertura_grande' && diseno12.candidatos.some(c => c.estrategia === 'dintel_reticulado')) {
    console.log("  ✅ Pasado: Clasificación correcta para abertura grande.");
  } else {
    console.log(`  ❌ Fallido: Clasificación incorrecta. Categoria: ${diseno12?.clasificacion.categoria}`);
    passed = false; failCount++;
  }

  // TEST 13: Abertura crítica recomienda tubular o viga externa
  console.log("\nTEST 13: Abertura crítica recomienda tubular o viga externa");
  const p13 = mockPipeline({ width: 4.0, length: 3, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, openings: [{ wallId: 'wall_north', type: 'ventana', width: 3.1, height: 1, position: 0.45 }] });
  const res13 = StructuralEngine.runPreliminaryAnalysis(p13);
  const diseno13 = res13.disenosDintel[0];
  if (diseno13 && diseno13.clasificacion.categoria === 'abertura_critica' && diseno13.candidatos.some(c => c.estrategia === 'dintel_tubular')) {
    console.log("  ✅ Pasado: Clasificación correcta para abertura crítica.");
  } else {
    console.log(`  ❌ Fallido: Clasificación incorrecta. Categoria: ${diseno13?.clasificacion.categoria}`);
    passed = false; failCount++;
  }

  // TEST 14: Tubular falla sin catálogo
  console.log("\nTEST 14: Tubular falla sin catálogo");
  const dTubular = diseno13.candidatos.find(c => c.estrategia === 'dintel_tubular');
  if (dTubular && dTubular.estado === 'insufficient_data') {
    console.log("  ✅ Pasado: Tubular detecta falta de catálogo.");
  } else {
    console.log(`  ❌ Fallido: Tubular no detectó falta de catálogo. Estado: ${dTubular?.estado}`);
    passed = false; failCount++;
  }

  // TEST 15: Reticulado genera altura y paneles
  console.log("\nTEST 15: Reticulado genera altura y paneles");
  const dReticulado = diseno12.candidatos.find(c => c.estrategia === 'dintel_reticulado');
  if (dReticulado && dReticulado.metadata && dReticulado.metadata.modelo && dReticulado.metadata.modelo.altura > 0 && dReticulado.metadata.modelo.cantidadPaneles > 0) {
    console.log(`  ✅ Pasado: Reticulado estimado (h=${dReticulado.metadata.modelo.altura.toFixed(2)}m, paneles=${dReticulado.metadata.modelo.cantidadPaneles})`);
  } else {
    console.log("  ❌ Fallido: Reticulado no generó datos geométricos.");
    passed = false; failCount++;
  }

  // TEST 16: Abertura grande nunca devuelve aprobación final
  console.log("\nTEST 16: Abertura grande nunca devuelve aprobación final");
  if (res12.status === 'requires_engineer_review' || res12.status === 'preliminary_fail' || res12.status === 'insufficient_data') {
    console.log(`  ✅ Pasado: Abertura grande bloqueada de forma segura (Estado: ${res12.status}).`);
  } else {
    console.log(`  ❌ Fallido: Se obtuvo aprobación preliminar para una abertura grande (${res12.status})`);
    passed = false; failCount++;
  }

  // TEST 17: Integración en resultado estructural
  console.log("\nTEST 17: Integración en resultado estructural");
  if (res12.disenosDintel && res12.disenosDintel.length > 0) {
    console.log("  ✅ Pasado: Diseños detallados integrados en el resultado.");
  } else {
    console.log("  ❌ Fallido: No se encontraron diseños detallados.");
    passed = false; failCount++;
  }

  // TEST 18: Reporte incluye disclaimer estructural
  console.log("\nTEST 18: Reporte incluye disclaimer estructural");
  if (res12.summary.includes('REQUIERE revisión profesional') && res12.summary.includes('NO constituye una aprobación final')) {
    console.log("  ✅ Pasado: Disclaimers de seguridad presentes en el reporte.");
  } else {
    console.log("  ❌ Fallido: Disclaimers ausentes.");
    passed = false; failCount++;
  }

  // TEST 19: Sin cargas suficientes -> datos insuficientes
  console.log("\nTEST 19: Sin cargas suficientes -> datos insuficientes");
  const p19 = mockPipeline({ width: 3, length: 3, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0 });
  const res19 = StructuralEngine.runPreliminaryAnalysis(p19);
  if (res19.status === 'insufficient_data') {
    console.log("  ✅ Pasado: Bloqueado correctamente por falta de cargas.");
  } else {
    console.log(`  ❌ Fallido: Estado obtenido: ${res19.status}`);
    passed = false; failCount++;
  }

  // TEST 20: No romper tests existentes (Re-validar Test 2 con nuevo flujo)
  console.log("\nTEST 20: No romper tests existentes (Abertura sobredimensionada)");
  const res20 = StructuralEngine.runPreliminaryAnalysis(p2);
  const dintelCheck20 = res20.dintelChecks[0];
  if (dintelCheck20 && dintelCheck20.status === 'requires_engineer_review' && res20.disenosDintel[0].clasificacion.categoria === 'abertura_grande') {
    console.log("  ✅ Pasado: Flujo anterior compatible con nueva clasificación.");
  } else {
    console.log(`  ❌ Fallido: Comportamiento alterado. Categoria: ${res20.disenosDintel[0]?.clasificacion.categoria}`);
    passed = false; failCount++;
  }

  if (!passed) {
      console.error(`\nSuite Fallida. ${failCount} errores.`);
      process.exit(1);
  } else {
      console.log(`\n🏆 SUITE PASADA. Las 20 pruebas se completaron exitosamente.`);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
