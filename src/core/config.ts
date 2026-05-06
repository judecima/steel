import { HeaderStrategy, JunctionType } from './types';

export const ENGINE_CONFIG = {
  rules: {
    panelization: {
      maxPanelWidth: 4.0,
      preferredPanelWidth: 3.0,
      minPanelWidth: 1.0, // Reducido para mayor flexibilidad en remates
      openingEdgeClearance: 0.2, // Distancia mínima entre abertura y junta
    },
    studs: {
      defaultSpacing: 0.4, // 400mm O.C.
      internalWallSpacing: 0.6, // 600mm O.C.
      profileDefault: 'PGC 100x0.9',
      trackDefault: 'PGU 100x0.9',
    },
    junctions: {
      externalCornerStrategy: JunctionType.CORNER_CALIFORNIA,
      internalCornerStrategy: JunctionType.CORNER_L,
    },
    openings: {
      headerStrategy: HeaderStrategy.PROVISIONAL_BOXED,
      minSillHeight: 0.8,
      defaultDoorHeight: 2.05,
    }
  },
  planning: {
    beamWidth: 10,
    topKLocalCandidates: 3,
    pruningThreshold: 0.8,
    maxExpansionsPerStep: 50
  }
};
