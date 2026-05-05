import { Muro } from '../../core/types';
import { PanelizationCandidate } from '../intelligence/types';

export function resolvePanelFamilyKey(muro: Muro, candidate: PanelizationCandidate): string {
    // Agrupar por cubo de ancho (ej. redondeado al 0.5m más cercano)
    const widthBucket = Math.round(muro.length * 2) / 2;
    
    // Agrupar por similitud en el patrón de aberturas
    const openingKey = muro.aberturas.map(o => `${o.type}_${Math.round(o.width * 10)}`).join('|');
    
    // Agrupar por similitud en el rol estructural
    const roleKey = muro.role;
    
    // Agregar estrategia para distinguir diferentes resoluciones constructivas locales
    const strategyKey = candidate.strategy;

    return `${widthBucket}_${openingKey}_${roleKey}_${strategyKey}`;
}
