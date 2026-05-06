export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateStr;
  }
}

export const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  validado: 'Validado',
  presupuestado: 'Presupuestado',
  fabricacion: 'Fabricación',
  montaje: 'Montaje',
  finalizado: 'Finalizado',
};

export function getEstadoColor(estado: string): string {
  const colors: Record<string, string> = {
    borrador: '#64748b',
    validado: '#22c55e',
    presupuestado: '#f59e0b',
    fabricacion: '#3b82f6',
    montaje: '#818cf8',
    finalizado: '#4f46e5',
  };
  return colors[estado] || '#64748b';
}
