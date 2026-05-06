import { Panel, BillOfMaterials, BOMItem, StudRole, HeaderStrategy } from '../../core/types';
import { logger } from '../../utils/logger';
import { round } from '../../utils/math';
import { getDefaultTrack, getDefaultProfile } from '../rules/studs';

export function calculateBOM(panels: Panel[]): BillOfMaterials {
  const cutList: BOMItem[] = [];
  const trackProfile = getDefaultTrack();
  const studProfile = getDefaultProfile();
  const defaultThickness = 0.9;

  panels.forEach(panel => {
    // 1. Add studs
    if (panel.studs) {
      panel.studs.forEach(stud => {
        cutList.push({
          profileType: stud.profileType,
          thickness: defaultThickness,
          length: round(stud.height),
          quantity: 1,
          role: stud.role,
          sourceEntityId: panel.id
        });
      });
    }

    // 2. Add tracks
    cutList.push({ 
        profileType: trackProfile, 
        thickness: defaultThickness, 
        length: round(panel.width), 
        quantity: 2, 
        role: 'track',
        sourceEntityId: panel.id
    });

    // 3. Add headers (Dinteles)
    if (panel.aberturas) {
      panel.aberturas.forEach(op => {
          if (op.header) {
              const headerPieces = 2; // Logic for provisional boxed header
              cutList.push({ 
                  profileType: studProfile, 
                  thickness: defaultThickness, 
                  length: round(op.header.span + 0.1), 
                  quantity: headerPieces, 
                  role: op.header.strategy,
                  sourceEntityId: panel.id
              });
          }
      });
    }
  });

  // Aggregation
  const aggregatedMap = new Map<string, { profile: string, thickness: number, role: string, length: number }>();
  
  cutList.forEach(item => {
    const key = `${item.profileType}_${item.thickness}_${item.role}`;
    const current = aggregatedMap.get(key) || { 
        profile: item.profileType, 
        thickness: item.thickness, 
        role: item.role, 
        length: 0 
    };
    current.length += item.length * item.quantity;
    aggregatedMap.set(key, current);
  });

  const aggregated = Array.from(aggregatedMap.values()).map(data => ({
    profileType: data.profile,
    thickness: data.thickness,
    role: data.role,
    totalLinearMeters: round(data.length)
  }));

  logger.log('BOM_GENERATED', 'system', 'Clean BOM generation from construction metadata');

  return {
    aggregated,
    cutList
  };
}
