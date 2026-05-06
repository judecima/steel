export const LOCALIZACION = {
    roles: {
        'common': 'Montante Común',
        'king': 'Montante Principal',
        'jack': 'Montante de Apoyo',
        'cripple': 'Montante Corto',
        'cripple_top': 'Montante Corto Superior',
        'cripple_bottom': 'Montante Corto Inferior',
        'sill': 'Solera de Ventana',
        'header': 'Dintel',
        'corner': 'Esquina',
        'junction': 'Encuentro',
        'solera_superior': 'Solera Superior',
        'solera_inferior': 'Solera Inferior',
        'montante_principal': 'Montante Principal',
        'montante_apoyo': 'Montante de Apoyo',
        'montante_corto_superior': 'Montante Corto Superior',
        'montante_corto_inferior': 'Montante Corto Inferior',
        'solera_ventana': 'Solera de Ventana',
        'antepecho': 'Antepecho'
    },
    aberturas: {
        'ventana': 'Ventana',
        'puerta': 'Puerta',
        'window': 'Ventana',
        'door': 'Puerta',
        'opening': 'Abertura'
    },
    tipos: {
        'wall': 'Muro',
        'panel': 'Panel',
        'stud': 'Montante',
        'track': 'Solera',
        'opening': 'Abertura',
        'header': 'Dintel',
        'roof': 'Techo',
        'foundation': 'Fundación',
        'anchor': 'Anclaje',
        'warning_marker': 'Marcador de Advertencia',
        'label_anchor': 'Punto de Etiqueta',
        'muro': 'Muro',
        'montante': 'Montante',
        'solera': 'Solera',
        'abertura': 'Abertura',
        'puerta': 'Puerta',
        'dintel': 'Dintel',
        'techo': 'Techo',
        'anclaje': 'Anclaje',
        'fundacion': 'Fundación',
        'advertencia': 'Advertencia',
        'marcador_viga_externa': 'Requisito Viga Externa',
        'box_inspeccion': 'Caja de Inspección',
        'indicador_estructural': 'Indicador Estructural'
    },
    techos: {
        'one_slope': 'Techo a un agua',
        'two_slope': 'Techo a dos aguas',
        'two_slopes': 'Techo a dos aguas'
    },
    orientaciones: {
        'north': 'Norte',
        'south': 'Sur',
        'east': 'Este',
        'west': 'Oeste',
        'norte': 'Norte',
        'sur': 'Sur',
        'este': 'Este',
        'oeste': 'Oeste'
    },
    estados: {
        'preliminary_pass': 'Verificación preliminar aprobada',
        'preliminary_fail': 'Falla preliminar',
        'requires_engineer_review': 'Requiere revisión estructural',
        'insufficient_data': 'Datos insuficientes',
        'not_checked': 'No verificado'
    },
    metadatos: {
        'id': 'ID técnico',
        'sourceId': 'Fuente',
        'type': 'Tipo',
        'role': 'Rol',
        'wallId': 'Muro',
        'panelId': 'Panel',
        'openingId': 'Abertura',
        'headerId': 'Dintel',
        'roofType': 'Tipo de techo',
        'orientation': 'Orientación',
        'position': 'Posición',
        'width': 'Ancho',
        'height': 'Alto',
        'length': 'Largo',
        'depth': 'Profundidad',
        'span': 'Luz',
        'strategy': 'Estrategia',
        'status': 'Estado',
        'requiresStructuralValidation': 'Requiere validación estructural',
        'metadata': 'Metadatos',
        'note': 'Nota',
        'message': 'Mensaje'
    },
    estrategias: {
        'provisional_boxed_header': 'Dintel Cajón Provisional',
        'dintel_simple': 'Dintel Simple PGC',
        'dintel_compuesto': 'Dintel Compuesto Doble',
        'dintel_reticulado': 'Dintel Reticulado Estructural',
        'dintel_tubular': 'Dintel Tubular Industrial',
        'requiere_viga_estructural_externa': 'Viga Estructural Externa (Requerido)',
        'trussed_beam': 'Viga Reticulada',
        'tube_beam': 'Viga Tubo'
    },
    varios: {
        'structural': 'Estructural',
        'non_structural': 'No Estructural',
        'loadbearing': 'Portante',
        'non_loadbearing': 'No Portante'
    },
    ui: {
        'total_objects': 'Objetos Totales',
        'metadata': 'Metadatos',
        'type': 'Tipo',
        'sourceId': 'ID fuente',
        'layer': 'Capa',
        'objeto': 'Objeto',
        'etiqueta': 'Etiqueta',
        'id_tecnico': 'ID técnico',
        'id_fuente': 'Fuente',
        'capa': 'Capa',
        'objetos': 'Objetos',
        'etiquetas': 'Etiquetas',
        'advertencias': 'Advertencias'
    },
    modos: {
        'estandar': 'Estándar',
        'estructural': 'Estructural',
        'taller': 'Taller',
        'montaje': 'Montaje',
        'inspeccion': 'Inspección'
    }
};

export function t(category, key) {
    const map = LOCALIZACION[category];
    if (!map) return key;
    return map[key] || key;
}

export function traducirValorMetadata(key, value) {
    if (typeof value !== 'string') return String(value);

    const keyCategoryMap = {
        'type': 'tipos',
        'Tipo': 'tipos',
        'role': 'roles',
        'Rol': 'roles',
        'roofType': 'techos',
        'orientation': 'orientaciones',
        'strategy': 'estrategias',
        'Estrategia': 'estrategias',
        'status': 'estados',
        'Estado': 'estados'
    };

    const category = keyCategoryMap[key];
    if (category) {
        return t(category, value);
    }

    if (LOCALIZACION.varios[value]) {
        return t('varios', value);
    }

    return value;
}

export function traducirOrientacion(id) {
    const lower = id.toLowerCase();
    if (lower.includes('north') || lower.includes('norte')) return t('orientaciones', 'north');
    if (lower.includes('south') || lower.includes('sur')) return t('orientaciones', 'south');
    if (lower.includes('east') || lower.includes('este')) return t('orientaciones', 'east');
    if (lower.includes('west') || lower.includes('oeste')) return t('orientaciones', 'west');
    return id;
}

export function traducirIdMuro(id) {
    const orientation = traducirOrientacion(id);
    return `Muro ${orientation}`;
}

export function traducirIdPanel(id) {
    const orientation = traducirOrientacion(id);
    const parts = id.split('_');
    let index = '1';
    const lastPart = parts[parts.length - 1];
    if (!isNaN(parseInt(lastPart))) {
        index = (parseInt(lastPart) + 1).toString();
    }
    return `Panel ${orientation} ${index}`;
}

export function traducirIdAbertura(id) {
    if (id.includes('ventana')) return 'Ventana';
    if (id.includes('puerta')) return 'Puerta';
    return 'Abertura';
}

export function traducirIdRender(id) {
    if (id.includes('render_wall_')) return traducirIdMuro(id.replace('render_wall_', ''));
    if (id.includes('render_panel_')) return traducirIdPanel(id.replace('render_panel_', ''));
    if (id.includes('render_stud_')) return 'Montante';
    if (id.includes('render_track_')) return 'Solera';
    if (id.includes('render_opening_')) return 'Vacío de Abertura';
    if (id.includes('render_header_')) return 'Dintel';
    if (id.includes('render_roof_')) return 'Techo';
    if (id.includes('render_foundation')) return 'Fundación';
    if (id.includes('render_anchor')) return 'Anclaje';
    return id;
}

export function crearEtiquetaDesdeIdTecnico(id) {
    if (!id) return id;
    if (id.startsWith('wall_')) return traducirIdMuro(id);
    if (id.startsWith('panel_')) return traducirIdPanel(id);
    if (id.startsWith('abertura_')) return traducirIdAbertura(id);
    if (id.startsWith('render_')) return traducirIdRender(id);
    return id;
}
