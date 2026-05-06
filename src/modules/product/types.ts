import { ProjectResult, HouseInput } from '../../core/types';

export enum EstadoProyecto {
    BORRADOR = 'borrador',
    VALIDADO = 'validado',
    PRESUPUESTADO = 'presupuestado',
    FABRICACION = 'fabricacion',
    MONTAJE = 'montaje',
    FINALIZADO = 'finalizado'
}

export enum EstadoProduccion {
    PENDIENTE = 'pendiente',
    EN_FABRICACION = 'en_fabricacion',
    FABRICADO = 'fabricado',
    DESPACHADO = 'despachado',
    MONTADO = 'montado',
    CERRADO = 'cerrado'
}

export interface ConfiguracionProyectoDTO {
    anchoVivienda: number;
    largoVivienda: number;
    alturaMuro: number;
    pendienteTecho: number;
    espesorPerfil: number;
    separacionMontantes: number;
    tipoPerfil: string;
    material: string;
    tipoCubierta: 'one_slope' | 'two_slope';
    tipoFundacion: string;
    direccionCaida: 'ancho' | 'largo';
    // Nuevos campos Fase 9F
    panelMaxLengthM?: number;
    panelPreferredLengthM?: number;
    aberturas?: {
        id: string;
        wallId: string;
        tipo: 'puerta' | 'ventana';
        ancho: number;
        alto: number;
        antepecho: number;
        posicion: number;
        createdAt: string;
    }[];
    murosInternos?: {
        id: string;
        startX: number;
        startZ: number;
        endX: number;
        endZ: number;
        height: number;
        thickness: number;
        aberturas: {
            id: string;
            tipo: 'puerta' | 'ventana';
            ancho: number;
            alto: number;
            antepecho: number;
            posicion: number;
            createdAt: string;
        }[];
    }[];
}

export interface VersionProyectoDTO {
    id: string;
    fecha: string;
    configuracion: ConfiguracionProyectoDTO;
    resultadoMotor?: ProjectResult; // El resultado técnico generado
    nota?: string;
}

export interface ItemPresupuesto {
    concepto: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number | null; // null si no hay precio en catálogo
    subtotal: number | null;
}

export interface PresupuestoProyectoDTO {
    items: ItemPresupuesto[];
    costoTotal: number | null;
    costoM2: number | null;
    desperdicioEstimado: number; // porcentaje
    moneda: string;
}

export interface ProduccionProyectoDTO {
    estadoGlobal: EstadoProduccion;
    avancePorcentaje: number;
    estadosPorPanel: Record<string, EstadoProduccion>;
    estadosPorMuro: Record<string, EstadoProduccion>;
}

export interface ProyectoDTO {
    id: string;
    nombre: string;
    cliente: string;
    fechaCreacion: string;
    fechaActualizacion: string;
    estado: EstadoProyecto;
    versionActual: string; // ID de la versión activa
    historialVersiones: VersionProyectoDTO[];
    presupuesto?: PresupuestoProyectoDTO;
    produccion?: ProduccionProyectoDTO;
}

export interface CatalogoPrecios {
    perfiles: Record<string, number>; // precio por metro lineal
    accesorios: Record<string, number>;
    manoDeObra: Record<string, number>;
}
