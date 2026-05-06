const STORAGE_KEY = 'steel_projects_v1';
const projects = [
    {
        id: 'proj_123',
        nombre: 'Proyecto Test Browser',
        cliente: 'Cliente Test',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estado: 'borrador',
        versionActual: 'v1',
        historialVersiones: [{
            id: 'v1',
            fecha: new Date().toISOString(),
            configuracion: { alturaMuro: 2.6, espesorPerfil: 0.9, separacionMontantes: 0.4, tipoPerfil: 'PGC 100x0.9', material: 'acero_galvanizado', tipoCubierta: 'one_slope', tipoFundacion: 'losa' },
            nota: 'Inicial'
        }]
    }
];
localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
console.log('Seeded projects:', projects);
