import { CodeReference } from './types';

export const NORMATIVE_CODES = {
  CIRSOC_303: {
    code: 'CIRSOC 303',
    description: 'Reglamento Argentino de Elementos Estructurales de Acero de Sección Abierta Conformados en Frío',
    status: 'preliminary_reference'
  },
  CIRSOC_101: {
    code: 'CIRSOC 101-2025',
    description: 'Reglamento Argentino de Cargas Permanentes y Sobrecargas Mínimas de Diseño',
    status: 'preliminary_reference'
  },
  CIRSOC_102: {
    code: 'CIRSOC 102-2025',
    description: 'Reglamento Argentino de Acción del Viento sobre las Construcciones',
    status: 'preliminary_reference'
  },
  CIRSOC_103: {
    code: 'INPRES-CIRSOC 103',
    description: 'Normas Argentinas para Construcciones Sismorresistentes',
    status: 'preliminary_reference'
  }
};

export function getCodeReference(codeKey: keyof typeof NORMATIVE_CODES, clause: string): CodeReference {
  const ref = NORMATIVE_CODES[codeKey];
  return {
    code: ref.code,
    clause,
    description: ref.description,
    status: ref.status
  };
}
