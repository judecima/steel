/**
 * Mapa centralizado de localización de dominio para visibilidad de usuario.
 */

export const LOCALIZACION_DOMINIO = {
    // Roles de Montantes y Entramado
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

    // Tipos de Abertura
    aberturas: {
        'ventana': 'Ventana',
        'puerta': 'Puerta',
        'window': 'Ventana',
        'door': 'Puerta',
        'opening': 'Abertura'
    },

    // Tipos de Objeto de Renderizado
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
        'advertencia': 'Advertencia'
    },

    // Tipos de Techo
    techos: {
        'one_slope': 'Techo a un agua',
        'two_slope': 'Techo a dos aguas',
        'two_slopes': 'Techo a dos aguas'
    },

    // Orientaciones
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

    // Estados Estructurales
    estados: {
        'preliminary_pass': 'Verificación preliminar aprobada',
        'preliminary_fail': 'Falla preliminar',
        'requires_engineer_review': 'Requiere revisión estructural',
        'insufficient_data': 'Datos insuficientes',
        'not_checked': 'No verificado'
    },

    // Claves de Metadatos
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

    // Estrategias
    estrategias: {
        'provisional_boxed_header': 'Dintel Cajón Provisional',
        'trussed_beam': 'Viga Reticulada',
        'tube_beam': 'Viga Tubo'
    },

    // Varios / Enums genéricos
    varios: {
        'structural': 'Estructural',
        'non_structural': 'No Estructural',
        'loadbearing': 'Portante',
        'non_loadbearing': 'No Portante',
        'external_loadbearing': 'Muro Portante Exterior',
        'internal_loadbearing': 'Muro Portante Interior'
    },

    // UI del Visor
    ui: {
        'title': 'Visor de QA Visual - Proyecto Steel',
        'controls': 'Controles de QA',
        'layers': 'Capas',
        'stats': 'Estadísticas de Escena',
        'selection_info': 'Información de Selección',
        'focus': 'Enfocar',
        'isolate': 'Aislar Capa',
        'loading': 'Cargando datos de renderizado...',
        'wireframe': 'Estructura Alámbrica',
        'grid': 'Grilla de Referencia',
        'axis': 'Ejes de Referencia',
        'labels': 'Mostrar Etiquetas',
        'roof_opacity': 'Opacidad de Techo',
        'total_objects': 'Objetos Totales',
        'objeto': 'Objeto',
        'etiqueta': 'Etiqueta',
        'id_tecnico': 'ID técnico',
        'id_fuente': 'ID fuente',
        'capa': 'Capa'
    }
};

/**
 * Función de utilidad para obtener la traducción de un término.
 */
export function t(category: keyof typeof LOCALIZACION_DOMINIO, key: string): string {
    const map = LOCALIZACION_DOMINIO[category] as Record<string, string>;
    if (!map) return key;
    return map[key] || key;
}

/**
 * Traduce un valor de metadato basado en su clave.
 */
export function traducirValorMetadata(key: string, value: any): string {
    if (typeof value !== 'string') return String(value);

    // Mapeo de claves a categorías de traducción
    const keyCategoryMap: Record<string, keyof typeof LOCALIZACION_DOMINIO> = {
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

    // Caso especial para booleanos u otros términos en 'varios'
    if (LOCALIZACION_DOMINIO.varios[value as keyof typeof LOCALIZACION_DOMINIO['varios']]) {
        return t('varios', value);
    }

    return value;
}
