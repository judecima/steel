import { Panel, StudRole, Abertura, HeaderStrategy } from '../../core/types';
import { generateId } from '../../utils/ids';
import { logger } from '../../utils/logger';
import { getDefaultProfile } from '../rules/studs';

export function applyOpeningReinforcements(panel: Panel): void {
  const profile = getDefaultProfile();

  panel.aberturas.forEach(op => {
    const relPos = op.position - panel.offset;

    logger.log('OPENING_REINFORCEMENT_APPLIED', panel.id, `Aplicando refuerzo para ${op.type}`, { relPos, width: op.width });

    // Formalizar metadatos del Dintel durante la fase de refuerzo
    op.dintel = {
        strategy: HeaderStrategy.PROVISIONAL_BOXED,
        span: op.width,
        requiresStructuralValidation: true
    };

    // 1. Montantes Principales (King Studs)
    panel.studs.push({ id: generateId('montante_principal'), role: StudRole.MONTANTE_PRINCIPAL, position: relPos - 0.05, height: panel.height, profileType: profile });
    panel.studs.push({ id: generateId('montante_principal'), role: StudRole.MONTANTE_PRINCIPAL, position: relPos + op.width + 0.05, height: panel.height, profileType: profile });

    // 2. Montantes de Apoyo (Jack Studs)
    const headerHeight = op.height + op.sillHeight;
    panel.studs.push({ id: generateId('montante_apoyo'), role: StudRole.MONTANTE_APOYO, position: relPos, height: headerHeight, profileType: profile });
    panel.studs.push({ id: generateId('montante_apoyo'), role: StudRole.MONTANTE_APOYO, position: relPos + op.width, height: headerHeight, profileType: profile });

    // 3. Buscar posiciones modulares que caen dentro de la abertura
    const buffer = 0.02;
    const interruptedStuds = panel.studs.filter(s => 
        s.role === StudRole.COMMON && 
        s.position > relPos + buffer && 
        s.position < relPos + op.width - buffer
    );
    
    const modularPositions = interruptedStuds.map(s => s.position);
    if (modularPositions.length === 0) {
        modularPositions.push(relPos + op.width / 2); // Fallback si es angosto
    }

    // 4. Montantes Cortos Superiores (Top Cripples)
    const provisionalHeaderThickness = 0.2;
    const crippleHeightTop = panel.height - (headerHeight + provisionalHeaderThickness);
    if (crippleHeightTop > 0.1) {
        modularPositions.forEach(pos => {
            panel.studs.push({ id: generateId('montante_corto'), role: StudRole.MONTANTE_CORTO_SUPERIOR, position: pos, height: crippleHeightTop, yOffset: headerHeight + provisionalHeaderThickness, profileType: profile });
        });
    }

    // 5. Solera de Ventana y Montantes Cortos Inferiores (solo Ventanas)
    if ((op.type === 'ventana' || op.type === 'window') && op.sillHeight > 0.1) {
        // Solera de Ventana (horizontal)
        panel.studs.push({ id: generateId('solera_ventana'), role: StudRole.SOLERA_VENTANA, position: relPos, height: op.width, yOffset: op.sillHeight, profileType: profile });
        
        // Montantes Cortos Inferiores (Bottom Cripples)
        modularPositions.forEach(pos => {
            panel.studs.push({ id: generateId('montante_corto'), role: StudRole.MONTANTE_CORTO_INFERIOR, position: pos, height: op.sillHeight, yOffset: 0, profileType: profile });
        });
    }

    // 6. Limpieza de Montantes Comunes
    panel.studs = panel.studs.filter(s => {
        if (s.role !== StudRole.COMMON) return true;
        const buffer = 0.02;
        return s.position < relPos - buffer || s.position > relPos + op.width + buffer;
    });
  });
}
