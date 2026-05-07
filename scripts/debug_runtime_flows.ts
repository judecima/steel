/**
 * TEST: Phase 9F - Runtime Flow Simulation
 * Simula el ciclo de vida completo: Crear -> Abertura -> Muro Interno -> PDF.
 */

import { PostgresStorageAdapter } from '../src/modules/product/storage/postgres-storage-adapter';
import { EngineFacade } from '../src/modules/product/engine-facade';
import { generateId } from '../src/utils/ids';
import { PdfExporter } from '../src/modules/planos/pdf-exporter';

const storage = new PostgresStorageAdapter();

async function runFlowSimulation() {
    console.log('--- SIMULACIÓN DE FLUJO DE RUNTIME ---');

    const projectId = `debug_flow_${Date.now()}`;
    const initialConfig = {
        width: 6.0,
        length: 4.0,
        anchoVivienda: 6.0,
        largoVivienda: 4.0,
        alturaMuro: 2.6,
        tipoCubierta: "one_slope" as const,
        pendienteTecho: 10,
        separacionMontantes: 0.4,
        direccionCaida: "ancho" as const,
        aberturas: [],
        murosInternos: []
    };

    console.log('\n1. Generando proyecto inicial...');
    const result = EngineFacade.generate(initialConfig as any);
    
    const project = {
        id: projectId,
        nombre: "Debug Flow Project",
        cliente: "Auditoría Interna",
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estado: 'borrador',
        versionActual: "v1",
        historialVersiones: [
            {
                id: "v1",
                fecha: new Date().toISOString(),
                configuracion: initialConfig,
                resultadoMotor: result
            }
        ]
    };

    await storage.saveProject(project as any);
    console.log('   Proyecto guardado:', projectId);

    console.log('\n2. Agregando abertura en wall_east...');
    // Simulando el comportamiento del endpoint
    const wallId = "wall_east";
    const nuevaOp = {
        id: generateId('op'),
        wallId,
        tipo: 'ventana',
        ancho: 1.2,
        alto: 1.0,
        antepecho: 0.9,
        posicion: 2.0
    };

    const updatedConfig = { ...initialConfig, aberturas: [nuevaOp] };
    const resultWithOp = EngineFacade.generate(updatedConfig as any);
    console.log('   Abertura generada con éxito:', !!resultWithOp);

    console.log('\n3. Agregando muro interior...');
    const nuevoMuroInt = {
        id: generateId('iw'),
        startX: 1.0,
        startZ: 1.0,
        endX: 1.0,
        endZ: 4.0,
        height: 2.6,
        thickness: 0.1,
        aberturas: []
    };
    const finalConfig = { ...updatedConfig, murosInternos: [nuevoMuroInt] };
    const finalResult = EngineFacade.generate(finalConfig as any);
    console.log('   Muro interior generado con éxito:', !!finalResult);

    console.log('\n4. Simulando Generación de PDF...');
    // Mock de un paquete de planos para el exporter
    const mockPkg: any = {
        id: "pkg_debug",
        hojas: [
            {
                id: "sheet_1",
                codigoHoja: "G-01",
                numeroHoja: 1,
                titleBlock: {
                    proyecto: "DEBUG",
                    cliente: "DEBUG",
                    fecha: "2026-05-06",
                    disclaimer: "Audit only"
                },
                entities: [
                    { type: 'line', start: { x: 0, y: 0 }, end: { x: 5, y: 0 } }
                ],
                dimensions: [
                    { value: '5.00', start: { x: 0, y: 0 }, end: { x: 5, y: 0 } }
                ],
                tables: [],
                warnings: []
            }
        ]
    };

    try {
        const pdfData = await PdfExporter.export(mockPkg);
        console.log('   PDF generado con éxito. Tamaño:', pdfData.length, 'bytes');
    } catch (pdfError: any) {
        console.error('   ERROR EN PDF:', pdfError.message);
    }

    console.log('\n--- SIMULACIÓN FINALIZADA ---');
}

runFlowSimulation().catch(console.error);
