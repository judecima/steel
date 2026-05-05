import { ResultadoDisenoDintelAbertura } from './types';

/**
 * Genera el desglose detallado de dinteles para el reporte estructural.
 */
export function generarDesgloseDinteles(disenos: ResultadoDisenoDintelAbertura[]): string {
    if (disenos.length === 0) return '_No se detectaron aberturas que requieran dinteles específicos._';

    let markdown = '### Desglose de Clasificación y Diseño de Dinteles\n\n';
    markdown += '| Abertura | Luz | Categoría | Estrategia Seleccionada | Estado |\n';
    markdown += '| :--- | :--- | :--- | :--- | :--- |\n';

    for (const d of disenos) {
        const estadoEmoji = d.estado === 'preliminary_pass' ? '✅' : d.estado === 'requires_engineer_review' ? '⚠️' : '❌';
        const categoriaLabel = d.clasificacion.categoria.replace(/_/g, ' ');
        const estrategiaLabel = d.candidatoSeleccionado?.estrategia.replace(/_/g, ' ') || 'Ninguna';
        
        markdown += `| ${d.aberturaId} | ${d.clasificacion.luz.toFixed(2)}m | ${categoriaLabel} | ${estrategiaLabel} | ${estadoEmoji} |\n`;
    }

    markdown += '\n#### Detalles y Recomendaciones por Abertura\n\n';

    for (const d of disenos) {
        markdown += `**Abertura ${d.aberturaId}**\n`;
        markdown += `- **Razón**: ${d.clasificacion.razon}\n`;
        markdown += `- **Recomendación**: ${d.recomendacion}\n`;
        
        if (d.candidatoSeleccionado) {
            const c = d.candidatoSeleccionado;
            markdown += `- **Dimensionado Preliminar**: ${c.perfiles.join(' + ')} (h=${c.altura.toFixed(2)}m)\n`;
            if (c.ratioUtilizacion !== undefined) {
                markdown += `- **Utilización Estimada**: ${(c.ratioUtilizacion * 100).toFixed(1)}%\n`;
            }
        }

        if (d.advertencias.length > 0) {
            markdown += `- **Advertencias**:\n`;
            d.advertencias.forEach(adv => markdown += `  - ⚠️ ${adv}\n`);
        }
        
        if (d.clasificacion.requiereRevisionEstructural) {
            markdown += `- **IMPORTANTE**: Requiere revisión y firma de un ingeniero responsable.\n`;
        }
        
        markdown += '\n---\n';
    }

    return markdown;
}
