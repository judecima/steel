import { PostgresStorageAdapter } from '../src/modules/product/storage/postgres-storage-adapter';
import { ProyectoDTO, EstadoProyecto } from '../src/modules/product/types';

async function inject() {
    const storage = new PostgresStorageAdapter();
    const id = 'proj_test_planos_123';
    
    const project: ProyectoDTO = {
        id,
        nombre: 'Proyecto Test Planos',
        cliente: 'Cliente Planos',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estado: EstadoProyecto.VALIDADO,
        versionActual: 'v1',
        historialVersiones: [
            {
                id: 'v1',
                fecha: new Date().toISOString(),
                configuracion: {
                    alturaMuro: 3,
                    espesorPerfil: 0.9,
                    separacionMontantes: 0.4,
                    tipoPerfil: 'PGC 100',
                    material: 'Acero Galvanizado',
                    tipoCubierta: 'one_slope',
                    tipoFundacion: 'platea'
                },
                resultadoMotor: {
                    id: 'res_1',
                    construction: {
                        panels: [
                            {
                                id: 'panel_test_1',
                                wallId: 'wall_1',
                                role: 'structural' as any,
                                width: 3,
                                height: 3,
                                offset: 0,
                                studs: [
                                    { id: 's1', role: 'common' as any, position: 0, height: 3, profileType: 'PGC 100' },
                                    { id: 's2', role: 'common' as any, position: 0.4, height: 3, profileType: 'PGC 100' }
                                ],
                                aberturas: [],
                                junctions: []
                            }
                        ]
                    } as any,
                    house: {
                        muros: [
                            { id: 'wall_1', start: { x: 0, y: 0 }, end: { x: 3, y: 0 }, length: 3, heightStart: 3, heightEnd: 3, role: 'external_loadbearing' as any, aberturas: [] }
                        ]
                    } as any,
                    bom: { aggregated: [], cutList: [] },
                    logs: [],
                    status: 'constructive_precheck_passed' as any,
                    assumptions: [],
                    warnings: []
                } as any
            }
        ]
    };

    await storage.saveProject(project);
    console.log('Proyecto inyectado:', id);
    process.exit(0);
}

inject();
