import { HouseInput, RoofMetadata } from '../../core/types';
import { round } from '../../utils/math';
import { logger } from '../../utils/logger';

export function resolveRoofMetadata(input: HouseInput): RoofMetadata {
  const { width, minHeight, roofType, roofSlope } = input;
  
  // Basic slope calculation (tangent of angle * distance)
  // RULE: Slope ALWAYS across width (ancho)
  const heightDelta = round(width * Math.tan(roofSlope * (Math.PI / 180)));
  
  logger.log('roof_slope_axis', 'engine', 'Calculando pendiente sobre el ancho', {
    direccionCaida: 'ancho',
    ancho: width,
    largo: input.length,
    anguloTechoGrados: roofSlope,
    deltaAltura: heightDelta
  });

  if (roofType === 'one_slope') {
    return {
      type: 'one_slope',
      slope: roofSlope,
      lowSideHeight: minHeight,
      highSideHeight: round(minHeight + heightDelta)
    };
  } else {
    // two_slope (gable)
    const halfWidth = width / 2;
    const peakDelta = round(halfWidth * Math.tan(roofSlope * (Math.PI / 180)));
    return {
      type: 'two_slope',
      slope: roofSlope,
      lowSideHeight: minHeight,
      highSideHeight: round(minHeight + peakDelta),
      peakPosition: halfWidth
    };
  }
}
