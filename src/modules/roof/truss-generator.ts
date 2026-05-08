import { HouseInput, Truss, TrussProfile } from '../../core/types';
import { generateId } from '../../utils/ids';
import { round } from '../../utils/math';
import { ENGINE_CONFIG } from '../../core/config';
import { getDefaultProfile } from '../rules/studs';

export function generateTrusses(input: HouseInput): Truss[] {
  const { width, length, roofSlope } = input;
  // RULE: Truss spacing MUST match stud spacing for in-line framing (structural load transfer)
  const trussSpacing = ENGINE_CONFIG.rules.studs.defaultSpacing;
  const profileType = getDefaultProfile();
  
  const trusses: Truss[] = [];
  const angleRad = (roofSlope * Math.PI) / 180;
  const deltaHeight = round(width * Math.tan(angleRad));
  const topChordLength = round(Math.sqrt(Math.pow(width, 2) + Math.pow(deltaHeight, 2)));

  let currentPos = 0;
  while (currentPos <= length + 0.01) {
    const trussId = generateId('truss');
    const profiles: TrussProfile[] = [];

    // 1. Bottom Chord (Cordón inferior - horizontal)
    profiles.push({
      id: generateId('truss_bottom'),
      type: 'bottom_chord',
      length: width,
      profileType,
      start: { x: 0, y: 0 },
      end: { x: width, y: 0 }
    });

    // 2. Top Chord (Cordón superior - inclinado)
    profiles.push({
      id: generateId('truss_top'),
      type: 'top_chord',
      length: topChordLength,
      profileType,
      start: { x: 0, y: 0 },
      end: { x: width, y: deltaHeight }
    });

    // 3. Vertical Web at high end (Parante de cierre)
    profiles.push({
      id: generateId('truss_vertical'),
      type: 'vertical_web',
      length: deltaHeight,
      profileType,
      start: { x: width, y: 0 },
      end: { x: width, y: deltaHeight }
    });

    // 4. Intermediate Webs (Reticulado interno)
    let webPos = 0.6;
    while (webPos < width - 0.1) {
        const hWeb = round(webPos * Math.tan(angleRad));
        
        // Vertical Web
        profiles.push({
            id: generateId('truss_web_v'),
            type: 'vertical_web',
            length: hWeb,
            profileType,
            start: { x: webPos, y: 0 },
            end: { x: webPos, y: hWeb }
        });
        
        // Diagonal Web (N-Truss style)
        const nextWebPos = Math.min(webPos + 0.6, width);
        const hNextWeb = round(nextWebPos * Math.tan(angleRad));
        const diagLen = round(Math.sqrt(Math.pow(nextWebPos - webPos, 2) + Math.pow(hNextWeb, 2)));
        
        profiles.push({
            id: generateId('truss_web_d'),
            type: 'diagonal_web',
            length: diagLen,
            profileType,
            start: { x: webPos, y: 0 },
            end: { x: nextWebPos, y: hNextWeb }
        });

        webPos += 0.6;
    }

    trusses.push({
      id: trussId,
      positionZ: round(currentPos),
      span: width,
      heightStart: 0,
      heightEnd: deltaHeight,
      profiles
    });

    currentPos += trussSpacing;
  }

  return trusses;
}
