import { HouseInput, ProjectResult } from '../../core/types';
import { PROJECT_ASSUMPTIONS } from '../../core/assumptions';
import { logger } from '../../utils/logger';
import { runPrecheck } from '../validation/precheck';
import { generateGeometry } from '../geometry/engine';
import { panelizeHouse } from '../construction/engine';
import { calculateBOM } from '../materials/engine';
import { generateCandidates } from '../intelligence/candidate-generator';
import { validateCandidate } from '../intelligence/candidate-validator';
import { scoreCandidate } from '../intelligence/candidate-scorer';
import { GlobalArbiter } from '../global-planning/global-arbiter';
import { ENGINE_CONFIG } from '../../core/config';
import { PanelizationCandidate } from '../intelligence/types';
import { panelizeWallIndustrial } from '../../lib/engine/panelization/industrialPanelizer';
import { calculateOpeningFrame } from '../../lib/engine/structural/openingFrameCalculator';
import { optimizeProfileCuts } from '../../lib/engine/cutlist/profileCutOptimizer';

export class EngineFacade {
  static generate(input: HouseInput): ProjectResult {
    // 1. Ejecutar Pre-verificación
    const precheck = runPrecheck(input);
    if (!precheck.passed) {
      throw new Error(`Pre-verificación fallida: ${precheck.errors.join(', ')}`);
    }

    // Limpiar logs para nueva corrida
    logger.clear && logger.clear();

    // 2. Generar Geometría
    const house = generateGeometry(input);
    house.murosInternos = input.internalWalls || [];

    // 3. Inteligencia Local: Generar candidatos para cada muro
    const localCandidatesPerWall = new Map<string, PanelizationCandidate[]>();
    
    for (const muro of house.muros) {
        const candidates = generateCandidates(muro.id, muro.length, muro.aberturas, input);
        const context = { wallRole: muro.role };
        candidates.forEach(lc => {
           validateCandidate(lc, muro.length, muro.aberturas);
           if (lc.valid) scoreCandidate(lc, context, muro.aberturas);
        });
        
        const validCandidates = candidates
          .filter(c => c.valid)
          .sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
          
        localCandidatesPerWall.set(muro.id, validCandidates);
    }

    // 4. Planificación Global
    const { winner: globalPlanWinner, telemetry: plannerTelemetry } = GlobalArbiter.planHouse(house, localCandidatesPerWall, ENGINE_CONFIG.planning);

    // 5. Lógica de Construcción
    const constructionResult = panelizeHouse(house, globalPlanWinner, plannerTelemetry);

    // 5.1 Lógica Industrial (Phase 9F)
    const industrialSegments: any[] = [];
    const panelJoints: any[] = [];
    const openingFrames: any[] = [];

    for (const muro of house.muros) {
        const { panels, joints } = panelizeWallIndustrial({
            wallId: muro.id,
            wallLengthMm: muro.length * 1000,
            preferredPanelMm: input.panelPreferredLength ? input.panelPreferredLength * 1000 : 3000,
            maxPanelMm: input.panelMaxLength ? input.panelMaxLength * 1000 : 4000
        });
        industrialSegments.push(...panels);
        panelJoints.push(...joints);

        for (const op of muro.aberturas) {
            const frame = calculateOpeningFrame({
                openingId: op.id,
                type: op.type === 'ventana' ? 'window' : 'door',
                widthMm: op.width * 1000,
                heightMm: op.height * 1000,
                sillHeightMm: op.sillHeight * 1000,
                wallHeightMm: muro.heightStart * 1000, // Simplificación: usa heightStart
                positionMm: op.position * 1000,
                studSpacingMm: ENGINE_CONFIG.rules.studs.defaultSpacing * 1000
            });
            openingFrames.push(frame);
        }
    }
    
    constructionResult.metadata.industrialSegments = industrialSegments;
    constructionResult.metadata.panelJoints = panelJoints;
    constructionResult.metadata.openingFrames = openingFrames;

    // 6. Materiales & BOM
    const bom = calculateBOM(constructionResult.panels, house.trusses);

    // 7. Ensamblaje del Resultado Final
    return {
      input,
      house,
      construction: constructionResult,
      bom,
      logs: logger.getEvents(),
      status: 'requires_structural_validation',
      assumptions: PROJECT_ASSUMPTIONS,
      warnings: precheck.warnings
    };
  }
}
