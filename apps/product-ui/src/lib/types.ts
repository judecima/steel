export interface ProjectConfiguration {
  alturaMuro: number;
  espesorPerfil: number;
  separacionMontantes: number;
  tipoPerfil: string;
  material: string;
  tipoCubierta: string;
  tipoFundacion: string;
}

export interface ProjectVersion {
  id: string;
  fecha: string;
  nota: string;
  configuracion: ProjectConfiguration;
}

export interface Project {
  id: string;
  nombre: string;
  cliente: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  estado: 'borrador' | 'validado' | 'presupuestado' | 'fabricacion' | 'montaje' | 'finalizado';
  versionActual: string;
  historialVersiones: ProjectVersion[];
}

export interface ApiHealth {
  status: string;
  database: string;
  timestamp: string;
}
