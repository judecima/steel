
import { PostgresStorageAdapter } from './src/modules/product/storage/postgres-storage-adapter';
import { SceneBuilder } from './src/modules/render/scene-builder';

async function auditProject() {
    const storage = new PostgresStorageAdapter();
    const id = 'test_9e_1778102309619';
    const project = await storage.getProject(id);
    
    if (!project) {
        console.log("Project not found");
        return;
    }
    
    const version = project.historialVersiones.find(v => v.id === project.versionActual);
    if (!version || !version.resultadoMotor) {
        console.log("No version or no resultadoMotor");
        return;
    }
    
    try {
        const renderDTO = SceneBuilder.buildIndustrialScene(version.resultadoMotor);
        console.log("Render DTO built successfully");
        console.log("Base objects:", renderDTO.escenaBase.objects.length);
        console.log("Modes available:", Object.keys(renderDTO.modos));
        
        const estandar = renderDTO.modos.estandar;
        console.log("Estandar mode objects:", estandar?.objects?.length);
        
        if (renderDTO.escenaBase.objects.length === 0 && (!estandar || estandar.objects.length === 0)) {
            console.log("WARNING: Scene is EMPTY");
        }
    } catch (e: any) {
        console.error("FAILED to build industrial scene:", e.message);
    }
    
    process.exit(0);
}

auditProject().catch(console.error);
