import { 
  StructuralAnalysisResult, MemberCheckResult, HeaderCheckResult, 
  RoofStructuralCheckResult, AnchorCheckResult, StructuralStatus, 
  StructuralCertificationLevel, CodeReference, ResultadoDisenoDintelAbertura
} from './types';
import { generarDesgloseDinteles } from './generador-reporte-dintel';

export function buildStructuralReport(
  memberChecks: MemberCheckResult[],
  dintelChecks: HeaderCheckResult[],
  disenosDintel: ResultadoDisenoDintelAbertura[],
  roofCheck: RoofStructuralCheckResult,
  anchorCheck: AnchorCheckResult,
  missingDataFromEngine: string[]
): StructuralAnalysisResult {
  
  const allMissingData = [...missingDataFromEngine];
  const allWarnings = [
    'LIMITE DE SEGURIDAD: Este es solo un chequeo estructural PRELIMINAR.',
    'NO utilice este reporte para la construcción. La aprobación de un ingeniero profesional es obligatoria.'
  ];
  const criticalItems: string[] = [];
  const codeRefsMap = new Map<string, CodeReference>();

  let overallStatus: StructuralStatus = 'preliminary_pass';

  // Agregar Chequeo de Anclaje
  if (anchorCheck.status === 'insufficient_data') {
    allMissingData.push(...anchorCheck.requiredData.map(d => `Datos de anclaje: ${d}`));
    overallStatus = downgradeStatus(overallStatus, 'insufficient_data');
  } else if (anchorCheck.status === 'requires_engineer_review') {
    criticalItems.push('Los anclajes requieren revisión de ingeniería.');
    overallStatus = downgradeStatus(overallStatus, 'requires_engineer_review');
  }
  allWarnings.push(...anchorCheck.warnings);

  // Agregar Chequeo de Techo
  if (roofCheck.status === 'requires_engineer_review') {
    criticalItems.push(`La luz del techo (${roofCheck.span}m) requiere diseño de cercha/reticulado.`);
    overallStatus = downgradeStatus(overallStatus, 'requires_engineer_review');
  } else if (roofCheck.status === 'insufficient_data') {
    overallStatus = downgradeStatus(overallStatus, 'insufficient_data');
  }
  allWarnings.push(...roofCheck.warnings);

  // Agregar Dinteles
  for (const hc of dintelChecks) {
    if (hc.status === 'insufficient_data') {
      overallStatus = downgradeStatus(overallStatus, 'insufficient_data');
    } else if (hc.status === 'requires_engineer_review') {
      criticalItems.push(`El dintel en ${hc.aberturaId} luz ${hc.span}m requiere revisión (${hc.recommendation})`);
      overallStatus = downgradeStatus(overallStatus, 'requires_engineer_review');
    } else if (hc.status === 'preliminary_fail') {
      overallStatus = downgradeStatus(overallStatus, 'preliminary_fail');
    }
    allWarnings.push(...hc.warnings);
    hc.codeReferences.forEach(ref => codeRefsMap.set(ref.code, ref));
  }

  // Agregar Miembros
  let hasIncompleteMemberData = false;
  let hasCompleteMemberData = false;

  for (const mc of memberChecks) {
    if (mc.status === 'insufficient_data') {
      hasIncompleteMemberData = true;
      overallStatus = downgradeStatus(overallStatus, 'insufficient_data');
    } else {
      hasCompleteMemberData = true;
    }
    
    if (mc.status === 'requires_engineer_review') {
      overallStatus = downgradeStatus(overallStatus, 'requires_engineer_review');
    } else if (mc.status === 'preliminary_fail') {
      criticalItems.push(`El miembro ${mc.memberId} falló el chequeo preliminar (UR: ${mc.utilizationRatio?.toFixed(2)})`);
      overallStatus = downgradeStatus(overallStatus, 'preliminary_fail');
    }
    allWarnings.push(...mc.warnings);
    mc.codeReferences.forEach(ref => codeRefsMap.set(ref.code, ref));
  }

  // Determinar nivel de certificación
  let certificationLevel: StructuralCertificationLevel = 'preliminary_structural_checks';
  if (overallStatus === 'insufficient_data' || overallStatus === 'requires_engineer_review' || overallStatus === 'preliminary_fail') {
    certificationLevel = 'engineer_review_required';
  }

  // Generar Resumen
  let summary = `## REPORTE ESTRUCTURAL PRELIMINAR\n\n`;
  summary += `**Estado General**: ${overallStatus.toUpperCase()}\n`;
  summary += `**Nivel de Certificación**: ${certificationLevel.replace(/_/g, ' ')}\n\n`;
  
  summary += `> [!WARNING]\n`;
  summary += `> Este es un reporte generado automáticamente para validación técnica preliminar.\n`;
  summary += `> NO constituye una aprobación final ni reemplaza la firma de un ingeniero matriculado.\n`;
  summary += `> Toda abertura de gran luz o componente crítico REQUIERE revisión profesional.\n\n`;

  summary += `### Resumen de Componentes\n`;
  summary += `- Montantes y Perfiles: ${memberChecks.length} verificados\n`;
  summary += `- Dinteles: ${dintelChecks.length} verificados\n`;
  summary += `- Techo: ${roofCheck.status}\n`;
  summary += `- Anclajes: ${anchorCheck.status}\n\n`;

  // Insertar desglose detallado de dinteles
  summary += generarDesgloseDinteles(disenosDintel);

  if (allMissingData.length > 0) {
    summary += `### Datos Faltantes para Certificación\n`;
    Array.from(new Set(allMissingData)).forEach(d => summary += `- ${d}\n`);
    summary += `\n`;
  }

  return {
    status: overallStatus,
    certificationLevel,
    memberChecks,
    dintelChecks,
    disenosDintel,
    roofCheck,
    anchorCheck,
    criticalItems: Array.from(new Set(criticalItems)),
    missingData: Array.from(new Set(allMissingData)),
    warnings: Array.from(new Set(allWarnings)),
    codeReferences: Array.from(codeRefsMap.values()),
    summary
  };
}

function downgradeStatus(current: StructuralStatus, next: StructuralStatus): StructuralStatus {
  const ranks: Record<StructuralStatus, number> = {
    'preliminary_pass': 0,
    'requires_engineer_review': 1,
    'insufficient_data': 2,
    'preliminary_fail': 3,
    'not_checked': -1
  };
  return ranks[next] > ranks[current] ? next : current;
}
