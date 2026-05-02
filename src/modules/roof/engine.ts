import { HouseInput, RoofMetadata } from '../../core/types';
import { round } from '../../utils/math';

export function resolveRoofMetadata(input: HouseInput): RoofMetadata {
  const { width, minHeight, roofType, roofSlope } = input;
  
  // Basic slope calculation (tangent of angle * distance)
  // In one_slope: slope applies to Length usually, or specified width
  // For simplicity MVP: slope along width
  const heightDelta = round(width * Math.tan(roofSlope * (Math.PI / 180)));

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
