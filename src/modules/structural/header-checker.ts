import { StructuralMember, HeaderCheckResult, StructuralStatus, ResultadoDisenoDintelAbertura, CandidatoDisenoDintel, EstrategiaDintel } from './types';
import { STRUCTURAL_ASSUMPTIONS } from './structural-assumptions';
import { getCodeReference } from './code-references';
import { clasificarAbertura } from './clasificador-estructural-aberturas';
import { seleccionarEstrategiasPosibles, obtenerRecomendacionTexto } from './selector-estrategia-dintel';
import { verificarDintelCompuesto } from './verificador-dintel-compuesto';
import { verificarDintelReticulado } from './verificador-dintel-reticulado';
import { verificarDintelTubular } from './verificador-dintel-tubular';

/**
 * Ejecuta el análisis avanzado de dinteles para todas las aberturas.
 */
export function checkHeaders(members: StructuralMember[]): { checks: HeaderCheckResult[], disenos: ResultadoDisenoDintelAbertura[] } {
  const checks: HeaderCheckResult[] = [];
  const disenos: ResultadoDisenoDintelAbertura[] = [];

  for (const member of members.filter(m => m.type === 'dintel')) {
    const aberturaId = member.sourceElementId;
    const luz = member.length;
    const wallRole = member.metadata.wallRole || 'unknown';

    // 1. Clasificar
    const dummyAbertura = { id: aberturaId, width: luz, type: member.metadata.type || 'ventana' } as any;
    const clasificacion = clasificarAbertura(dummyAbertura, wallRole);

    // 2. Seleccionar Estrategias
    const estrategias = seleccionarEstrategiasPosibles(clasificacion);

    // 3. Evaluar Candidatos
    const candidatos: CandidatoDisenoDintel[] = [];
    for (const est of estrategias) {
        if (est === 'dintel_simple') {
            candidatos.push({
                id: `simple_${aberturaId}`,
                aberturaId,
                estrategia: 'dintel_simple',
                luz,
                altura: 0.1,
                perfiles: [member.profileId],
                estado: luz > STRUCTURAL_ASSUMPTIONS.thresholds.umbralesDinteles.luzMaximaPequena ? 'requires_engineer_review' : 'preliminary_pass',
                advertencias: [],
                referenciasNormativas: [getCodeReference('CIRSOC_303', '6.1')]
            });
        } else if (est === 'dintel_compuesto') {
            candidatos.push(verificarDintelCompuesto(aberturaId, luz, [member.profileId, member.profileId]));
        } else if (est === 'dintel_reticulado') {
            candidatos.push(verificarDintelReticulado(aberturaId, luz));
        } else if (est === 'dintel_tubular') {
            candidatos.push(verificarDintelTubular(aberturaId, luz));
        } else if (est === 'requiere_viga_estructural_externa') {
            candidatos.push({
                id: `viga_externa_${aberturaId}`,
                aberturaId,
                estrategia: 'requiere_viga_estructural_externa',
                luz,
                altura: 0.2,
                perfiles: ['VIGA_EXTERNA_HORMIGON_O_ACERO'],
                estado: 'requires_engineer_review',
                advertencias: ['Requiere dimensionamiento fuera del sistema Steel Frame estándar.'],
                referenciasNormativas: []
            });
        }
    }

    // 4. Elegir mejor candidato (el que tenga mejor estado o el primero de la lista de estrategias prioritarias)
    const candidatoSeleccionado = candidatos[0];

    const resultado: ResultadoDisenoDintelAbertura = {
        aberturaId,
        clasificacion,
        candidatos,
        candidatoSeleccionado,
        estado: clasificacion.requiereRevisionEstructural ? 'requires_engineer_review' : (candidatoSeleccionado?.estado || 'not_checked'),
        recomendacion: obtenerRecomendacionTexto(clasificacion.estrategiaRecomendada),
        advertencias: [...clasificacion.requiereRevisionEstructural ? ['Requiere revisión estructural profesional obligatoria por luz.'] : [], ...candidatoSeleccionado?.advertencias || []],
        datosFaltantes: [],
        referenciasNormativas: candidatoSeleccionado?.referenciasNormativas || []
    };

    disenos.push(resultado);

    // Mantener compatibilidad con HeaderCheckResult (Audit scripts y reportes actuales)
    checks.push({
      aberturaId,
      status: resultado.estado,
      span: luz,
      selectedHeader: candidatoSeleccionado?.id || member.profileId,
      recommendation: resultado.recomendacion,
      warnings: resultado.advertencias,
      codeReferences: resultado.referenciasNormativas
    });
  }

  return { checks, disenos };
}
