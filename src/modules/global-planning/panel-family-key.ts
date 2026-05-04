import { Wall } from '../../core/types';
import { PanelizationCandidate } from '../intelligence/types';

export function resolvePanelFamilyKey(wall: Wall, candidate: PanelizationCandidate): string {
    // Group by width bucket (e.g. rounded to nearest 0.5m)
    const widthBucket = Math.round(wall.length * 2) / 2;
    
    // Group by opening pattern similarity
    const openingKey = wall.openings.map(o => `${o.type}_${Math.round(o.width * 10)}`).join('|');
    
    // Group by structural role similarity
    const roleKey = wall.role;
    
    // Add strategy to distinguish different local constructive resolutions
    const strategyKey = candidate.strategy;

    return `${widthBucket}_${openingKey}_${roleKey}_${strategyKey}`;
}
