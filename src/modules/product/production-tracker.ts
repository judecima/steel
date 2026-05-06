import { EstadoProduccion, ProduccionProyectoDTO } from './types';
import { Panel, Muro } from '../../core/types';

export function inicializarProduccion(panels: Panel[], muros: Muro[]): ProduccionProyectoDTO {
    const estadosPorPanel: Record<string, EstadoProduccion> = {};
    const estadosPorMuro: Record<string, EstadoProduccion> = {};

    for (const panel of panels) {
        estadosPorPanel[panel.id] = EstadoProduccion.PENDIENTE;
    }
    for (const muro of muros) {
        estadosPorMuro[muro.id] = EstadoProduccion.PENDIENTE;
    }

    return {
        estadoGlobal: EstadoProduccion.PENDIENTE,
        avancePorcentaje: 0,
        estadosPorPanel,
        estadosPorMuro
    };
}

export function actualizarEstadoPanel(
    produccion: ProduccionProyectoDTO,
    panelId: string,
    nuevoEstado: EstadoProduccion
): ProduccionProyectoDTO {
    const estadosPorPanel = { ...produccion.estadosPorPanel, [panelId]: nuevoEstado };
    return recalcular({ ...produccion, estadosPorPanel });
}

export function actualizarEstadoMuro(
    produccion: ProduccionProyectoDTO,
    muroId: string,
    nuevoEstado: EstadoProduccion
): ProduccionProyectoDTO {
    const estadosPorMuro = { ...produccion.estadosPorMuro, [muroId]: nuevoEstado };
    return recalcular({ ...produccion, estadosPorMuro });
}

function recalcular(p: ProduccionProyectoDTO): ProduccionProyectoDTO {
    const panelValues = Object.values(p.estadosPorPanel);
    const terminados = panelValues.filter(e =>
        e === EstadoProduccion.FABRICADO ||
        e === EstadoProduccion.DESPACHADO ||
        e === EstadoProduccion.MONTADO ||
        e === EstadoProduccion.CERRADO
    ).length;

    const avancePorcentaje = panelValues.length > 0
        ? Math.round((terminados / panelValues.length) * 100)
        : 0;

    const estadoGlobal = avancePorcentaje === 100
        ? EstadoProduccion.CERRADO
        : avancePorcentaje > 0
            ? EstadoProduccion.EN_FABRICACION
            : EstadoProduccion.PENDIENTE;

    return { ...p, avancePorcentaje, estadoGlobal };
}
