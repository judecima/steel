import { ConfiguracionProyectoDTO } from './types';
import { HouseInput } from '../../core/types';

/**
 * Mapea la configuración de la UI (formato persistencia) al input técnico del motor.
 * Resuelve el drift entre nombres de campos (anchoVivienda vs width, etc.)
 */
export function mapUIConfigToEngineInput(config: ConfiguracionProyectoDTO): HouseInput {
  return {
    width: config.anchoVivienda,
    length: config.largoVivienda,
    minHeight: config.alturaMuro,
    roofType: config.tipoCubierta,
    roofSlope: config.pendienteTecho,
    panelMaxLength: config.panelMaxLengthM,
    panelPreferredLength: config.panelPreferredLengthM,
    openings: config.aberturas?.map(a => ({
        wallId: a.wallId,
        type: a.tipo === 'puerta' ? 'door' : 'window',
        width: a.ancho,
        height: a.alto,
        position: a.posicion,
        sillHeight: a.antepecho
    })),
    internalWalls: config.murosInternos?.map(mw => ({
        id: mw.id,
        startXmm: mw.startX * 1000,
        startZmm: mw.startZ * 1000,
        endXmm: mw.endX * 1000,
        endZmm: mw.endZ * 1000,
        heightMm: mw.height * 1000,
        thicknessMm: mw.thickness * 1000,
        openings: mw.aberturas?.map(op => ({
            id: op.id,
            wallId: mw.id,
            wallKind: 'internal' as const,
            type: op.tipo === 'puerta' ? 'door' : 'window',
            positionMm: op.posicion * 1000,
            widthMm: op.ancho * 1000,
            heightMm: op.alto * 1000,
            sillHeightMm: op.antepecho * 1000
        })) || []
    }))
  };
}
