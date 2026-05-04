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
      { wallId: 'wall_north', type: 'window' as const, width: 1.0, height: 1.0, position: 1.0 }
    ] 
  };
  
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

function exportScene() {
  console.log('Generating sample project...');
  const project = buildSampleProject();
  
  console.log('Building RenderSceneDTO...');
  const sceneDTO = SceneBuilder.buildScene(project);
  
  const outputPath = path.join(process.cwd(), 'render-scene.json');
  fs.writeFileSync(outputPath, JSON.stringify(sceneDTO, null, 2), 'utf-8');
  
  console.log(`✅ RenderSceneDTO exported successfully to ${outputPath}`);
  console.log(`Metadata: ${sceneDTO.objects.length} objects, ${sceneDTO.labels.length} labels.`);
}

exportScene();
