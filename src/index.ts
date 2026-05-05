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

  // 1. Definir entrada de muestra
  const input: HouseInput = {
    width: 8.0,
    length: 12.0,
    minHeight: 2.6,
    roofType: 'two_slope',
    roofSlope: 15,
    openings: [
      { wallId: 'wall_north', type: 'ventana', width: 1.5, height: 1.2, position: 2.0, sillHeight: 0.9 },
      { wallId: 'wall_east', type: 'puerta', width: 0.9, height: 2.05, position: 5.0 }
    ]
  };

  // 2. Ejecutar Pre-verificación
  const precheck = runPrecheck(input);
  if (!precheck.passed) {
    console.error("Errores críticos encontrados en la entrada:");
    precheck.errors.forEach(e => console.error(`- ${e}`));
    return;
  }

  // 3. Generar Geometría
  const house = generateGeometry(input);

  // 4. Inteligencia Local: Generar candidatos para cada muro
  logger.log('LOCAL_INTELLIGENCE_STARTED', 'house', 'Evaluando candidatos locales de muro');
  const localCandidatesPerWall = new Map<string, PanelizationCandidate[]>();
  
  for (const muro of house.muros) {
      const candidates = generateCandidates(muro.id, muro.length, muro.aberturas);
      const context = { wallRole: muro.role };
      candidates.forEach(lc => {
         validateCandidate(lc, muro.length, muro.aberturas);
         if (lc.valid) scoreCandidate(lc, context, muro.aberturas);
      });
      // Ordenar y mantener válidos
      const validCandidates = candidates
        .filter(c => c.valid)
        .sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
        
      localCandidatesPerWall.set(muro.id, validCandidates);
  }

  // 5. Planificación Global
  logger.log('GLOBAL_PLANNING_STARTED', 'house', 'Seleccionando la mejor combinación global');
  const { winner: globalPlanWinner, telemetry: plannerTelemetry } = GlobalArbiter.planHouse(house, localCandidatesPerWall, ENGINE_CONFIG.planning);

  // 6. Lógica de Construcción
  const constructionResult = panelizeHouse(house, globalPlanWinner, plannerTelemetry);

  // 7. Materiales & BOM
  const bom = calculateBOM(constructionResult.panels);

  // 8. Ensamblaje del Resultado Final
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

  // 9. Resumen de Salida
  console.log("\n--- RESUMEN DE GENERACIÓN ---");
  console.log(`Estado: ${result.status}`);
  console.log(`Muros generados: ${result.house.muros.length}`);
  console.log(`Paneles generados: ${result.construction.panels.length}`);
  console.log(`Puntuación del Ganador Global: ${globalPlanWinner.score.total} pts`);
  console.log(`Tiempo de Planificación: ${plannerTelemetry.planningTimeMs} ms`);
  console.log(`Estados Generados: ${plannerTelemetry.generatedStates}`);
  console.log(`Tipos de Perfiles BOM: ${result.bom.aggregated.length}`);
  
  console.log("\n--- LISTADO DE MATERIALES (BOM) ---");
  result.bom.aggregated.forEach(item => {
    console.log(`- ${item.profileType}: ${item.totalLinearMeters} m`);
  });

  console.log("\n--- VALIDACIÓN ---");
  console.log("Fase 2 completa. La integración de planificación global es operativa.");
}

main().catch(err => {
  console.error(err);
});
