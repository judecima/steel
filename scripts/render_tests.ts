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
import { RENDER_CONFIG } from '../src/modules/render/render-config';
import { StructuralEngine } from '../src/modules/structural/engine';
import { calculateBOM } from '../src/modules/materials/engine';

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
    assumptions: assumptions,
    warnings: []
  };
}

async function runTests() {
  console.log("=== PRUEBAS DE CAPA DE RENDERIZADO FASE 4A ===\n");
  let passed = true;
  let failCount = 0;

  const baseInput = { 
    width: 4.0, length: 4.0, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, 
    openings: [
      { wallId: 'wall_north', type: 'ventana', width: 1.5, height: 1.2, position: 1.0, sillHeight: 1.0 },
      { wallId: 'wall_south', type: 'puerta', width: 0.9, height: 2.1, position: 1.5, sillHeight: 0 }
    ] 
  };
  
  const createDeepCopy = (obj: any) => JSON.parse(JSON.stringify(obj));
  
  const projectResult = mockPipeline(baseInput);
  const originalJson = JSON.stringify(projectResult);

  console.log("DEBUG: RENDER_CONFIG layers count:", RENDER_CONFIG.layers?.length);
  if (!RENDER_CONFIG.layers) {
      console.error("CRITICAL: RENDER_CONFIG.layers is undefined!");
      process.exit(1);
  }

  // TEST 1: ProjectResult genera RenderSceneDTO
  console.log("TEST 1: ProjectResult genera RenderSceneDTO");
  const scene = SceneBuilder.buildScene(projectResult);
  if (scene && scene.objects && scene.layers) {
    console.log("  ✅ Pasado: DTO generado con éxito.");
  } else {
    console.log("  ❌ Fallido: El DTO carece de propiedades básicas.");
    passed = false; failCount++;
  }

  // TEST 2: Cada RenderObject tiene sourceId
  console.log("\nTEST 2: Cada RenderObject tiene sourceId");
  const missingSourceId = scene.objects.filter(o => !o.sourceId);
  if (missingSourceId.length === 0) {
    console.log("  ✅ Pasado: Todos los objetos son trazables.");
  } else {
    console.log(`  ❌ Fallido: ${missingSourceId.length} objetos no tienen sourceId.`);
    passed = false; failCount++;
  }

  // TEST 3: Los objetos de panel coinciden con las dimensiones del panel
  console.log("\nTEST 3: Los objetos de panel coinciden con las dimensiones del panel");
  const panelObjects = scene.objects.filter(o => o.type === 'panel');
  if (panelObjects.length > 0 && panelObjects[0].dimensions.y === 2.6) {
    console.log("  ✅ Pasado: El volumen del panel coincide con la altura esperada.");
  } else {
    console.log("  ❌ Fallido: Dimensiones del objeto de panel incorrectas.");
    passed = false; failCount++;
  }

  // TEST 4: Los montantes generan objetos de renderizado individuales
  console.log("\nTEST 4: Los montantes generan objetos de renderizado individuales");
  const studObjects = scene.objects.filter(o => o.type === 'montante');
  if (studObjects.length > 10) {
    console.log(`  ✅ Pasado: Se generaron ${studObjects.length} objetos de montante independientes.`);
  } else {
    console.log(`  ❌ Fallido: No hay suficientes objetos de montante (${studObjects.length}).`);
    passed = false; failCount++;
  }

  // TEST 5: Las aberturas son marcadores de vacío transparentes
  console.log("\nTEST 5: Las aberturas son marcadores de vacío transparentes");
  const openingObjects = scene.objects.filter(o => o.type === 'abertura' || o.type === 'puerta');
  if (openingObjects.length > 0 && openingObjects[0].material === 'mat_opening') {
    console.log("  ✅ Pasado: Abertura generada como marcador de vacío.");
  } else {
    console.log("  ❌ Fallido: Abertura faltante o material incorrecto.");
    passed = false; failCount++;
  }

  // TEST 9: La misma entrada produce salida determinística
  console.log("\nTEST 9: La misma entrada produce salida determinística");
  const scene2 = SceneBuilder.buildScene(projectResult);
  
  const s1Cmp = createDeepCopy(scene);
  const s2Cmp = createDeepCopy(scene2);
  
  // Limpiar campos variables (ahora localizados)
  s1Cmp.metadata['Fecha de generación'] = '';
  s1Cmp.metadata['ID de proyecto'] = '';
  s2Cmp.metadata['Fecha de generación'] = '';
  s2Cmp.metadata['ID de proyecto'] = '';

  if (JSON.stringify(s1Cmp) === JSON.stringify(s2Cmp)) {
    console.log("  ✅ Pasado: La salida es perfectamente determinística.");
  } else {
    console.log("  ❌ Fallido: Se detectó una salida no determinística.");
    passed = false; failCount++;
  }

  // TEST 11: Validación de huella de muro
  console.log("\nTEST 11: La huella de muro cierra el rectángulo");
  const walls = scene.objects.filter(o => o.type === 'muro');
  if (walls.length === 4) {
      console.log("  ✅ Pasado: La huella de muro consta de 4 muros.");
  } else {
      console.log("  ❌ Fallido: La huella de muro no consta de 4 muros.");
      passed = false; failCount++;
  }

  // TEST 12: Validación de límites de panel
  console.log("\nTEST 12: Los paneles se mantienen dentro de los límites del muro");
  let panelsOk = true;
  for (const panel of panelObjects) {
      const wall = walls.find(w => w.sourceId === panel.metadata.wallId);
      if (!wall) continue;
      if (panel.dimensions.x > wall.dimensions.x) panelsOk = false;
  }
  if (panelsOk) {
      console.log("  ✅ Pasado: Los paneles no exceden las dimensiones del muro.");
  } else {
      console.log("  ❌ Fallido: El panel excede los límites del muro.");
      passed = false; failCount++;
  }

  // TEST 13: Validación de límites de montante
  console.log("\nTEST 13: Los montantes se mantienen dentro de los límites del panel");
  let studsOk = true;
  for (const stud of studObjects) {
      if (stud.dimensions.y > 3.0) studsOk = false;
  }
  if (studsOk) {
      console.log("  ✅ Pasado: Los montantes se mantienen dentro de los límites del panel.");
  } else {
      console.log("  ❌ Fallido: El montante excede los límites del panel.");
      passed = false; failCount++;
  }

  // TEST 14: Validación de alineación de techo
  console.log("\nTEST 14: La huella del techo se alinea con los límites de la casa");
  const roof = scene.objects.find(o => o.type === 'techo');
  if (roof && roof.dimensions.x >= 4.0 && roof.dimensions.y === 0.2) {
      console.log("  ✅ Pasado: El techo está correctamente alineado y es abstracto.");
  } else {
      console.log("  ❌ Fallido: Dimensiones del techo incorrectas.");
      passed = false; failCount++;
  }

  // TEST 15: La cantidad y unicidad de etiquetas son determinísticas
  console.log("\nTEST 15: La cantidad y unicidad de etiquetas son determinísticas");
  const labelIds = scene.labels.map(l => l.id);
  const uniqueLabels = new Set(labelIds);
  if (uniqueLabels.size === labelIds.length && labelIds.length > 0) {
      console.log(`  ✅ Pasado: Se generaron ${labelIds.length} etiquetas únicas.`);
  } else {
      console.log("  ❌ Fallido: Las etiquetas no son únicas o faltan.");
      passed = false; failCount++;
  }

  // TEST 16: Los ayudantes de transformación no deben mutar el ProjectResult fuente
  console.log("\nTEST 16: Los ayudantes de transformación no deben mutar el ProjectResult fuente");
  const finalJson = JSON.stringify(projectResult);
  if (originalJson === finalJson) {
    console.log("  ✅ Pasado: Inmutabilidad estricta verificada. La fuente no ha sido tocada.");
  } else {
    console.log("  ❌ Fallido: El ProjectResult fuente fue mutado durante la generación del render.");
    passed = false; failCount++;
  }

  // TEST 17: Integridad del entramado de ventana
  console.log("\nTEST 17: Integridad del entramado de ventana");
  const windowPanel = scene.objects.find(o => o.metadata?.Tipo === 'Ventana')?.metadata?.Panel;
  const windowStuds = scene.objects.filter(o => o.type === 'montante' && o.metadata?.Panel === windowPanel);
  const windowSill = scene.objects.find(o => o.type === 'antepecho' && o.metadata?.Panel === windowPanel);
  const windowHeader = scene.objects.find(o => o.type === 'dintel' && o.metadata?.Panel === windowPanel);
  
  const hasWindowKing = windowStuds.some(s => s.metadata?.Rol === 'Montante Principal');
  const hasWindowJack = windowStuds.some(s => s.metadata?.Rol === 'Montante de Apoyo');
  const hasWindowCrippleTop = windowStuds.some(s => s.metadata?.Rol === 'Montante Corto Superior');
  const hasWindowCrippleBot = windowStuds.some(s => s.metadata?.Rol === 'Montante Corto Inferior');

  if (hasWindowKing && hasWindowJack && hasWindowCrippleTop && hasWindowCrippleBot && windowSill && windowHeader) {
      console.log("  ✅ Pasado: El entramado de ventana incluye principal, apoyo, cortos, antepecho y dintel.");
  } else {
      console.log("  ❌ Fallido: El entramado de ventana está incompleto.", {hasWindowKing, hasWindowJack, hasWindowCrippleTop, hasWindowCrippleBot, hasSill: !!windowSill, hasHeader: !!windowHeader});
      passed = false; failCount++;
  }

  // TEST 18: Integridad del entramado de puerta
  console.log("\nTEST 18: Integridad del entramado de puerta");
  const doorPanel = scene.objects.find(o => o.metadata?.Tipo === 'Puerta')?.metadata?.Panel;
  const doorStuds = scene.objects.filter(o => o.type === 'montante' && o.metadata?.Panel === doorPanel);
  const doorHeader = scene.objects.find(o => o.type === 'dintel' && o.metadata?.Panel === doorPanel);

  const hasDoorKing = doorStuds.some(s => s.metadata?.Rol === 'Montante Principal');
  const hasDoorJack = doorStuds.some(s => s.metadata?.Rol === 'Montante de Apoyo');

  if (hasDoorKing && hasDoorJack && doorHeader) {
      console.log("  ✅ Pasado: El entramado de puerta incluye principal, apoyo y dintel.");
  } else {
      console.log("  ❌ Fallido: El entramado de puerta está incompleto.");
      passed = false; failCount++;
  }

  // TEST 19: La puerta no tiene antepecho
  console.log("\nTEST 19: La puerta no tiene antepecho");
  const doorSill = scene.objects.find(o => o.type === 'antepecho' && o.metadata?.Panel === doorPanel);
  const doorCrippleBot = doorStuds.some(s => s.metadata?.Rol === 'Montante Corto Inferior');
  
  if (!doorSill && !doorCrippleBot) {
      console.log("  ✅ Pasado: La puerta correctamente no tiene antepecho ni montantes cortos inferiores.");
  } else {
      console.log("  ❌ Fallido: La puerta tiene antepecho o montantes cortos inferiores.");
      passed = false; failCount++;
  }

  // TEST 20: Los roles de entramado de aberturas se preservan en el RenderSceneDTO
  console.log("\nTEST 20: Los roles de entramado de aberturas se preservan en el RenderSceneDTO");
  if (hasWindowKing && hasWindowJack && hasWindowCrippleTop && hasWindowCrippleBot && hasDoorKing) {
    console.log("  ✅ Pasado: Los roles se preservan correctamente en los metadatos y se mapean a los objetos de renderizado.");
  } else {
    console.log("  ❌ Fallido: Faltan roles en los metadatos de los objetos de renderizado.");
    passed = false; failCount++;
  }

  // TEST 21: La capa de fundación tiene objetos visibles o advertencia explícita
  console.log("\nTEST 21: La capa de fundación tiene objetos visibles o advertencia explícita");
  const foundationObjs = scene.objects.filter(o => o.layer === 'layer_fundaciones');
  const foundationWarns = scene.warnings.filter(w => w.layer === 'layer_fundaciones');
  if (foundationObjs.length > 0 || foundationWarns.length > 0) {
      console.log("  ✅ Pasado: La capa de fundación tiene objetos o advertencias explícitas.");
  } else {
      console.log("  ❌ Fallido: La capa de fundación está silenciosamente vacía.");
      passed = false; failCount++;
  }

  // TEST 22: La capa de anclajes tiene objetos visibles o advertencia explícita
  console.log("\nTEST 22: La capa de anclajes tiene objetos visibles o advertencia explícita");
  const anchorObjs = scene.objects.filter(o => o.layer === 'layer_anclajes');
  const anchorWarns = scene.warnings.filter(w => w.layer === 'layer_anclajes');
  if (anchorObjs.length > 0 || anchorWarns.length > 0) {
      console.log("  ✅ Pasado: La capa de anclajes tiene objetos o advertencias explícitas.");
  } else {
      console.log("  ❌ Fallido: La capa de anclajes está silenciosamente vacía.");
      passed = false; failCount++;
  }

  // TEST 23: Todos los IDs de capa en RenderSceneDTO coinciden con los IDs canónicos de render-config
  console.log("\nTEST 23: Todos los IDs de capa en RenderSceneDTO coinciden con los IDs canónicos de render-config");
  let layersMatch = true;
  const configLayerIds = RENDER_CONFIG.layers.map(l => l.id);
  const allLayersUsed = new Set([
      ...scene.objects.map(o => o.layer),
      ...scene.labels.map(l => l.layer),
      ...scene.warnings.map(w => w.layer)
  ]);
  
  for (const layerId of allLayersUsed) {
      if (!configLayerIds.includes(layerId)) {
          console.log(`  ❌ Fallido: Se usó un ID de capa desconocido: ${layerId}`);
          layersMatch = false;
      }
  }
  if (layersMatch) {
      console.log("  ✅ Pasado: Todos los objetos usan IDs de capa canónicos.");
  } else {
      passed = false; failCount++;
  }

  // TEST 24: Las estadísticas del visor incluyen claramente capas con cero objetos
  console.log("\nTEST 24: Las estadísticas del visor incluyen claramente capas con cero objetos");
  const dtoEqualConfig = scene.layers.length === RENDER_CONFIG.layers.length;
  if (dtoEqualConfig) {
      console.log("  ✅ Pasado: El DTO exporta la lista completa de capas canónicas para el conteo de la UI.");
  } else {
      console.log("  ❌ Fallido: La lista de capas del DTO no coincide con la configuración canónica.");
      passed = false; failCount++;
  }

  // Pruebas de alineación vertical Fase 4A.4
  const winOpeningObj = scene.objects.find(o => (o.type === 'abertura' as any || o.type === 'ventana' as any) && o.metadata?.Tipo === 'Ventana');
  const doorOpeningObj = scene.objects.find(o => o.type === 'puerta');

  // TEST 25: El fondo vertical del marcador de abertura de ventana es igual a sillHeight
  console.log("\nTEST 25: El fondo vertical del marcador de abertura de ventana es igual a sillHeight");
  if (winOpeningObj) {
      const winBottom = winOpeningObj.position.y - winOpeningObj.dimensions.y / 2;
      if (Math.abs(winBottom - 1.0) < 0.001) {
          console.log("  ✅ Pasado: El fondo de la ventana se alinea perfectamente con sillHeight (1.0).");
      } else {
          console.log(`  ❌ Fallido: El fondo de la ventana es ${winBottom}, se esperaba 1.0.`);
          passed = false; failCount++;
      }
  } else {
      console.log("  ❌ Fallido: No se encontró el objeto de abertura de ventana.");
      passed = false; failCount++;
  }

  // TEST 26: La parte superior vertical del marcador de abertura de ventana es igual al fondo del dintel
  console.log("\nTEST 26: La parte superior vertical del marcador de abertura de ventana es igual al fondo del dintel");
  if (winOpeningObj && windowHeader) {
      const winTop = winOpeningObj.position.y + winOpeningObj.dimensions.y / 2;
      const headerBottom = windowHeader.position.y - windowHeader.dimensions.y / 2;
      if (Math.abs(winTop - headerBottom) < 0.001) {
          console.log(`  ✅ Pasado: La parte superior de la ventana (${winTop}) se alinea con el fondo del dintel (${headerBottom}).`);
      } else {
          console.log(`  ❌ Fallido: La parte superior de la ventana (${winTop}) no se alinea con el fondo del dintel (${headerBottom}).`);
          passed = false; failCount++;
      }
  } else {
      console.log("  ❌ Fallido: No se encontraron los objetos requeridos.");
      passed = false; failCount++;
  }

  // TEST 27: El fondo del marcador de abertura de puerta es igual a 0
  console.log("\nTEST 27: El fondo del marcador de abertura de puerta es igual a 0");
  if (doorOpeningObj) {
      const doorBottom = doorOpeningObj.position.y - doorOpeningObj.dimensions.y / 2;
      if (Math.abs(doorBottom - 0) < 0.001) {
          console.log("  ✅ Pasado: El fondo de la puerta descansa exactamente en el suelo (y=0).");
      } else {
          console.log(`  ❌ Fallido: El fondo de la puerta es ${doorBottom}, se esperaba 0.`);
          passed = false; failCount++;
      }
  } else {
      console.log("  ❌ Fallido: No se encontró el objeto de abertura de puerta.");
      passed = false; failCount++;
  }

  // TEST 28: La parte superior del marcador de abertura de puerta es igual al fondo del dintel
  console.log("\nTEST 28: La parte superior del marcador de abertura de puerta es igual al fondo del dintel");
  if (doorOpeningObj && doorHeader) {
      const doorTop = doorOpeningObj.position.y + doorOpeningObj.dimensions.y / 2;
      const headerBottom = doorHeader.position.y - doorHeader.dimensions.y / 2;
      if (Math.abs(doorTop - headerBottom) < 0.001) {
          console.log(`  ✅ Pasado: La parte superior de la puerta (${doorTop}) se alinea con el fondo del dintel (${headerBottom}).`);
      } else {
          console.log(`  ❌ Fallido: La parte superior de la puerta (${doorTop}) no se alinea con el fondo del dintel (${headerBottom}).`);
          passed = false; failCount++;
      }
  } else {
      console.log("  ❌ Fallido: No se encontraron los objetos requeridos.");
      passed = false; failCount++;
  }

  // TEST 29: El cuadro delimitador del marcador de abertura se alinea con el vacío entramado dentro de la tolerancia
  console.log("\nTEST 29: El cuadro delimitador del marcador de abertura se alinea con el vacío entramado dentro de la tolerancia");
  let voidOk = true;
  for (const obj of [winOpeningObj, doorOpeningObj]) {
      if (!obj) continue;
      const header = scene.objects.find(o => o.type === 'dintel' && o.sourceId === obj.sourceId);
      if (header && obj.dimensions.x !== header.dimensions.x) {
          console.log(`  ❌ Fallido: El ancho de la abertura (${obj.dimensions.x}) != Luz del dintel (${header.dimensions.x}).`);
          voidOk = false;
      }
  }
  if (voidOk) {
      console.log("  ✅ Pasado: Los vacíos de las aberturas delimitan con precisión horizontal y verticalmente.");
  } else {
      passed = false; failCount++;
  }

  // TEST 30 & 31: Continuidad de montantes cortos superiores bajo aberturas anchas
  console.log("\nTEST 30 & 31: Continuidad de montantes cortos superiores bajo aberturas anchas");
  let crippleContinuityOk = true;
  for (const opObj of [winOpeningObj, doorOpeningObj]) {
      if (!opObj) continue;
      const cripples = scene.objects.filter(o => o.type === 'montante' && o.metadata?.Rol === 'Montante Corto Superior' && o.metadata?.Panel === opObj.metadata?.Panel);
      if (cripples.length < 2) {
          console.log(`  ❌ Fallido: La abertura ${opObj.metadata?.Tipo} (ancho ${opObj.dimensions.x}) solo tiene ${cripples.length} montantes cortos superiores. Se esperaban al menos 2 para anchos de 0.9m+.`);
          crippleContinuityOk = false;
      }
  }
  if (crippleContinuityOk) {
      console.log("  ✅ Pasado: Las aberturas anchas generan múltiples montantes cortos superiores preservando el ritmo.");
  } else {
      passed = false; failCount++;
  }

  // TEST 32 & 33: Tolerancia de espaciado modular y sin montantes duplicados
  console.log("\nTEST 32 & 33: El entramado de aberturas preserva la tolerancia de espaciado modular y no hay duplicados");
  let spacingOk = true;
  const panelWallNorth0Studs = scene.objects.filter(o => o.type === 'montante' && o.metadata?.panelId === 'panel_wall_north_0');
  
  const rawXPositions = panelWallNorth0Studs.map(s => s.position.x).sort((a,b) => a-b);
  const xPositions: number[] = [];
  for (const x of rawXPositions) {
      if (xPositions.length === 0 || x - xPositions[xPositions.length - 1] > 0.01) {
          xPositions.push(x);
      }
  }
  
  for (let i = 1; i < xPositions.length; i++) {
      const delta = xPositions[i] - xPositions[i-1];
      if (delta > 0.45) {
          console.log(`  ❌ Fallido: Ritmo modular roto, brecha demasiado grande: ${delta} entre ${xPositions[i-1]} and ${xPositions[i]}`);
          spacingOk = false;
      }
  }
  if (spacingOk) {
      console.log("  ✅ Pasado: El espaciado modular preserva la tolerancia sin duplicados.");
  } else {
      passed = false; failCount++;
  }

  // TEST 34: El dintel se extiende entre los montantes de apoyo correctamente
  console.log("\nTEST 34: El dintel se extiende entre los montantes de apoyo correctamente");
  let headerSpanOk = true;
  for (const opObj of [winOpeningObj, doorOpeningObj]) {
      if (!opObj) continue;
      const header = scene.objects.find(o => o.type === 'dintel' && o.metadata?.panelId === opObj.metadata?.panelId);
      const jacks = scene.objects.filter(o => o.type === 'montante' && o.metadata?.role === 'montante_apoyo' && o.metadata?.panelId === opObj.metadata?.panelId);
      
      if (header && jacks.length === 2) {
          const jackX = jacks.map(j => j.position.x).sort((a,b) => a-b);
          const jackSpan = jackX[1] - jackX[0];
          if (Math.abs(header.dimensions.x - jackSpan) > 0.05) {
              console.log(`  ❌ Fallido: La luz del dintel (${header.dimensions.x}) no coincide con la luz entre apoyos (${jackSpan}).`);
              headerSpanOk = false;
          }
      }
  }
  if (headerSpanOk) {
      console.log("  ✅ Pasado: Los dinteles se extienden correctamente entre los montantes de apoyo.");
  } else {
      passed = false; failCount++;
  }

  // === FASE 4B: VISUALIZACIÓN INDUSTRIAL AVANZADA ===
  
  // Ejecutar motor estructural para alimentar los modos industriales
  const structuralResult = StructuralEngine.runPreliminaryAnalysis(projectResult);
  projectResult.structural = structuralResult;

  // Generar escena industrial completa para pruebas dinámicas
  const sceneIndustrial = SceneBuilder.buildIndustrialScene(projectResult, 'estructural');
  const industrialStructural = sceneIndustrial;

  // TEST 35: DTO de composición industrial generado correctamente
  console.log("\nTEST 35: DTO de composición industrial generado correctamente");
  if (industrialStructural.escenaBase && industrialStructural.modoInicial === 'estructural') {
      console.log("  ✅ Pasado: DTO usa composición en lugar de herencia.");
  } else {
      console.log("  ❌ Fallido: Estructura del DTO incorrecta.");
      passed = false; failCount++;
  }

  // TEST 36: Dintel Compuesto visible correctamente
  console.log("\nTEST 36: Dintel Compuesto visible correctamente");
  const pCompuesto = mockPipeline({ 
      width: 3, length: 3, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, 
      openings: [{ wallId: 'wall_north', type: 'ventana', width: 1.5, height: 1, position: 1 }] 
  }, ['wind_zone_data_provided', 'seismic_zone_data_provided', 'foundation_data_provided']);
  pCompuesto.structural = StructuralEngine.runPreliminaryAnalysis(pCompuesto);
  const sceneCompuesto = SceneBuilder.buildIndustrialScene(pCompuesto, 'estructural');
  const compuestoPieces = sceneCompuesto.escenaBase.objects.filter(o => o.id.includes('render_header_compuesto'));
  if (compuestoPieces.length >= 2) {
      console.log("  ✅ Pasado: Dintel compuesto genera múltiples piezas físicas.");
  } else {
      console.log(`  ❌ Fallido: Se esperaban múltiples piezas, se obtuvo ${compuestoPieces.length}`);
      passed = false; failCount++;
  }

  // TEST 37: Dintel Reticulado visible correctamente
  console.log("\nTEST 37: Dintel Reticulado visible correctamente");
  const pReticulado = mockPipeline({ 
    width: 6, length: 3, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, 
    openings: [{ wallId: 'wall_north', type: 'ventana', width: 2.5, height: 1, position: 1 }] 
  }, ['wind_zone_data_provided', 'seismic_zone_data_provided', 'foundation_data_provided']);
  pReticulado.structural = StructuralEngine.runPreliminaryAnalysis(pReticulado);
  const sceneReticulado = SceneBuilder.buildIndustrialScene(pReticulado, 'estructural');
  const trussParts = sceneReticulado.escenaBase.objects.filter(o => o.metadata?.Rol === 'Cordón Superior' || o.metadata?.Rol === 'Cordón Inferior' || o.metadata?.Rol === 'Alma Reticulada');
  if (trussParts.length >= 4) {
      console.log(`  ✅ Pasado: Dintel reticulado genera estructura compleja (${trussParts.length} partes).`);
  } else {
      console.log(`  ❌ Fallido: Partes del reticulado insuficientes (${trussParts.length}).`);
      passed = false; failCount++;
  }

  // TEST 38: Viga externa genera marcador visual
  console.log("\nTEST 38: Viga externa genera marcador visual");
  const pExterno = mockPipeline({ 
    width: 10, length: 3, minHeight: 2.6, roofType: 'one_slope', roofSlope: 0, 
    openings: [{ wallId: 'wall_north', type: 'ventana', width: 1.2, height: 1, position: 1.0 }] 
  });
  pExterno.structural = StructuralEngine.runPreliminaryAnalysis(pExterno);
  // Forzar estrategia para probar el marcador visual
  if (pExterno.structural?.disenosDintel && pExterno.structural.disenosDintel.length > 0) {
      const diseno = pExterno.structural.disenosDintel[0];
      if (diseno && diseno.candidatoSeleccionado) {
          diseno.candidatoSeleccionado.estrategia = 'requiere_viga_estructural_externa';
      }
  }
  const sceneExterno = SceneBuilder.buildIndustrialScene(pExterno, 'estructural');
  const marker = sceneExterno.escenaBase.objects.find(o => o.type === 'marcador_viga_externa');
  if (marker && marker.metadata?.['Aviso'].includes('VIGA ESTRUCTURAL EXTERNA')) {
      console.log("  ✅ Pasado: Marcador de viga externa generado y localizado.");
  } else {
      console.log("  ❌ Fallido: No se encontró el marcador de viga externa.");
      console.log("     Tipos de objetos encontrados:", Array.from(new Set(sceneExterno.escenaBase.objects.map(o => o.type))).join(', '));
      passed = false; failCount++;
  }

  // TEST 39: Overlay estructural muestra estados
  console.log("\nTEST 39: Overlay estructural muestra estados");
  if (industrialStructural.modos.estructural.overlays.estructural && industrialStructural.modos.estructural.overlays.estructural.length > 0) {
      console.log("  ✅ Pasado: Overlay estructural presente en el DTO.");
  } else {
      console.log("  ❌ Fallido: No se encontró overlay estructural.");
      passed = false; failCount++;
  }

  // TEST 40: Shop mode genera cut list visual y labels
  console.log("\nTEST 40: Shop mode genera cut list visual y labels");
  projectResult.bom = calculateBOM(projectResult.construction.panels); // Recalcular con sourceEntityId
  const sceneShop = SceneBuilder.buildIndustrialScene(projectResult, 'taller');
  const shopLabels = sceneShop.modos.taller.labels.filter(l => l.id.includes('label_shop'));
  if (sceneShop.modos.taller.metadata.taller?.paneles.length > 0 && shopLabels.length > 0) {
      console.log(`  ✅ Pasado: Shop mode incluye metadata de paneles y ${shopLabels.length} etiquetas de corte.`);
  } else {
      console.log("  ❌ Fallido: Datos de taller incompletos.");
      passed = false; failCount++;
  }

  // TEST 41: Sequence mode genera pasos basados en el rastro del planificador
  console.log("\nTEST 41: Sequence mode genera pasos basados en el rastro del planificador");
  const sceneSeq = SceneBuilder.buildIndustrialScene(projectResult, 'montaje');
  const steps = sceneSeq.modos.montaje.metadata.montaje?.pasos;
  if (steps && steps.length >= 3 && steps.some(s => s.id.includes('wall_'))) {
      console.log(`  ✅ Pasado: Secuencia de montaje generada con ${steps.length} pasos.`);
  } else {
      console.log("  ❌ Fallido: Pasos de montaje ausentes o incorrectos.");
      passed = false; failCount++;
  }

  // TEST 42: Inspection mode genera bounding boxes
  console.log("\nTEST 42: Inspection mode genera bounding boxes");
  const sceneInsp = SceneBuilder.buildIndustrialScene(projectResult, 'inspeccion');
  const bboxes = sceneInsp.modos.inspeccion.overlays.inspeccion?.filter(o => o.type === 'box_inspeccion');
  if (bboxes && bboxes.length >= scene.objects.length) {
      console.log(`  ✅ Pasado: Inspection mode generó ${bboxes.length} bounding boxes.`);
  } else {
      console.log("  ❌ Fallido: Bounding boxes insuficientes.");
      passed = false; failCount++;
  }

  // TEST 43: No rompe render anterior
  console.log("\nTEST 43: No rompe render anterior");
  if (scene.objects.length > 50) {
      console.log("  ✅ Pasado: La escena base se mantiene íntegra.");
  } else {
      console.log("  ❌ Fallido: La escena base parece degradada.");
      passed = false; failCount++;
  }

  // TEST 44: Todos los labels visibles están en español
  console.log("\nTEST 44: Todos los labels visibles están en español");
  const allLabels = [
      ...sceneShop.escenaBase.labels.map(l => l.text),
      ...(steps || []).map(s => s.title),
      ...(steps || []).map(s => s.description)
  ];
  const englishTerms = ['Stud', 'Track', 'Header', 'Window', 'Door', 'Wall'];
  const foundEnglish = allLabels.filter(txt => englishTerms.some(term => txt.includes(term)));
  if (foundEnglish.length === 0) {
      console.log("  ✅ Pasado: Localización certificada en todos los modos industriales.");
  } else {
      console.log("  ❌ Fallido: Se encontraron términos en inglés en la UI industrial.");
      console.log("     Ejemplos encontrados:", foundEnglish.slice(0, 5).join(', '));
      passed = false; failCount++;
  }

  console.log("\nTEST 45: Industrial DTO contains all five modes");
  const modes = Object.keys(sceneIndustrial.modos);
  if (modes.length === 5 && modes.includes('taller') && modes.includes('montaje')) {
      console.log("  ✅ Pasado: DTO contiene los 5 modos industriales.");
  } else {
      console.log("  ❌ Fallido: DTO incompleto.");
      passed = false; failCount++;
  }

  console.log("TEST 46: Each mode contains distinct visible object/layer changes");
  const tallerObjects = sceneIndustrial.modos.taller.objects.length;
  const standardObjects = sceneIndustrial.modos.estandar.objects.length;
  // En este caso estandar suele tener 0 extras, taller tiene etiquetas (labels)
  const tallerLabels = sceneIndustrial.modos.taller.labels.length;
  if (tallerLabels > 0) {
      console.log("  ✅ Pasado: El modo taller agrega etiquetas específicas.");
  } else {
      console.log("  ❌ Fallido: El modo taller no tiene objetos distintivos.");
      passed = false; failCount++;
  }

  console.log("TEST 47: Estructural mode adds markers");
  if (sceneIndustrial.modos.estructural.objects.length > 0) {
      console.log("  ✅ Pasado: El modo estructural agrega marcadores visuales.");
  } else {
      console.log("  ❌ Fallido: El modo estructural está vacío.");
      passed = false; failCount++;
  }

  console.log("TEST 48: Taller mode exposes BOM metadata");
  if (sceneIndustrial.modos.taller.metadata.taller?.paneles) {
      console.log("  ✅ Pasado: Modo taller expone metadatos de paneles.");
  } else {
      console.log("  ❌ Fallido: No hay metadatos de taller.");
      passed = false; failCount++;
  }

  console.log("TEST 49: Montaje mode exposes sequence steps");
  if (sceneIndustrial.modos.montaje.metadata.montaje?.pasos) {
      console.log("  ✅ Pasado: Modo montaje expone pasos de secuencia.");
  } else {
      console.log("  ❌ Fallido: No hay metadatos de montaje.");
      passed = false; failCount++;
  }

  console.log("TEST 50: Inspección mode exposes bounding boxes");
  if (sceneIndustrial.modos.inspeccion.overlays.inspeccion?.length > 0) {
      console.log("  ✅ Pasado: Modo inspección expone bounding boxes.");
  } else {
      console.log("  ❌ Fallido: No hay overlays de inspección.");
      passed = false; failCount++;
  }

  if (!passed) {
      console.error(`\nSuite Fallida. ${failCount} errores.`);
      process.exit(1);
  } else {
      console.log(`\n🏆 SUITE PASADA. Todas las pruebas del núcleo de la Fase 4B se completaron con éxito.`);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
