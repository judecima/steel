import { Panel, BillOfMaterials, BOMItem } from '../../core/types';
import { logger } from '../../utils/logger';
import { round } from '../../utils/math';
import { getDefaultTrack, getDefaultProfile } from '../rules/studs';

const ROLE_TRANSLATIONS: Record<string, string> = {
    'common': 'Montante común',
    'montante_principal': 'Montante rey',
    'montante_apoyo': 'Montante de apoyo',
    'montante_corto_superior': 'Montante corto superior',
    'montante_corto_inferior': 'Montante corto inferior',
    'corner': 'Montante de esquina',
    'junction': 'Encuentro T',
    'solera_ventana': 'Solera de ventana',
    'solera_inferior': 'Solera inferior',
    'solera_superior': 'Solera superior',
    'provisional_boxed_header': 'Dintel (Boxed)',
    'track': 'Solera',
    'cercha_bottom_chord': 'Cercha - Cordón inferior',
    'cercha_top_chord': 'Cercha - Cordón superior',
    'cercha_vertical_web': 'Cercha - Montante',
    'cercha_diagonal_web': 'Cercha - Diagonal'
};

function translateRole(role: string): string {
    return ROLE_TRANSLATIONS[role] || role;
}

export function calculateBOM(panels: Panel[], trusses: import('../../core/types').Truss[] = []): BillOfMaterials {
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
    // Bottom track (Solera inferior - horizontal)
    // Recorte PGU: Si hay puertas, descontar su ancho de la solera inferior
    let bottomTrackLength = panel.width;
    if (panel.aberturas) {
        panel.aberturas.forEach(op => {
            if (op.tipo === 'puerta' || op.tipo === 'door') {
                bottomTrackLength -= op.width;
            }
        });
    }

    cutList.push({ 
        profileType: trackProfile, 
        thickness: defaultThickness, 
        length: round(Math.max(0, bottomTrackLength)), 
        quantity: 1, 
        role: 'solera_inferior',
        sourceEntityId: panel.id
    });

    // Top track (Solera superior - puede ser inclinada)
    const hDelta = Math.abs(panel.heightEnd - panel.heightStart);
    const slopedLength = Math.sqrt(Math.pow(panel.width, 2) + Math.pow(hDelta, 2));
    
    cutList.push({ 
        profileType: trackProfile, 
        thickness: defaultThickness, 
        length: round(slopedLength), 
        quantity: 1, 
        role: 'solera_superior',
        sourceEntityId: panel.id
    });

    // 3. Add headers (Dinteles)
    if (panel.aberturas) {
      panel.aberturas.forEach(op => {
          if (op.dintel) {
              const headerPieces = 2; // Logic for provisional boxed header
              cutList.push({ 
                  profileType: studProfile, 
                  thickness: defaultThickness, 
                  length: round(op.dintel.span + 0.1), 
                  quantity: headerPieces, 
                  role: op.dintel.strategy,
                  sourceEntityId: panel.id
              });
          }
      });
    }
  });

  // 4. Add Trusses
  trusses.forEach(truss => {
      truss.profiles.forEach(profile => {
          cutList.push({
              profileType: profile.profileType,
              thickness: defaultThickness,
              length: round(profile.length),
              quantity: 1,
              role: `cercha_${profile.type}`,
              sourceEntityId: truss.id
          });
      });
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
