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

declare var require: any;
declare var process: any;

const fs = require('fs');
const path = require('path');

function buildSampleProject(): ProjectResult {
  const input = { 
    width: 4.0, 
    length: 4.0, 
    minHeight: 2.6, 
    roofType: 'one_slope' as const, 
    roofSlope: 0, 
    openings: [
      { wallId: 'wall_north', type: 'ventana' as const, width: 1.0, height: 1.0, position: 1.0, sillHeight: 1.0 },
      { wallId: 'wall_south', type: 'puerta' as const, width: 0.9, height: 2.1, position: 1.5, sillHeight: 0 }
    ] 
  };
  
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
    assumptions: [],
    warnings: []
  };
}

function exportScene() {
  console.log('Generating sample project...');
  const project = buildSampleProject();
  
  console.log('Building RenderSceneIndustrialDTO...');
  const sceneDTO = SceneBuilder.buildIndustrialScene(project);
  
  const outputPath = path.join(process.cwd(), 'render-scene.json');
  fs.writeFileSync(outputPath, JSON.stringify(sceneDTO, null, 2), 'utf-8');
  
  console.log(`✅ RenderSceneIndustrialDTO exported successfully to ${outputPath}`);
  console.log(`Metadata: ${sceneDTO.escenaBase.objects.length} base objects, 5 visualization modes populated.`);
}

exportScene();
