
import { PostgresStorageAdapter } from './src/modules/product/storage/postgres-storage-adapter';
import { getPool } from './src/modules/product/storage/db-config';

async function checkProject() {
    const storage = new PostgresStorageAdapter();
    const id = 'test_9e_1778102309619';
    
    console.log(`Checking project ${id}...`);
    const project = await storage.getProject(id);
    
    if (!project) {
        console.log("Project NOT found");
        return;
    }
    
    console.log("Project found:", project.nombre);
    console.log("Active version ID:", project.versionActual);
    
    const version = project.historialVersiones.find(v => v.id === project.versionActual);
    if (!version) {
        console.log("Active version NOT found in history");
    } else {
        console.log("Active version found");
        console.log("Has resultadoMotor:", !!version.resultadoMotor);
        if (version.resultadoMotor) {
            console.log("Panels count:", version.resultadoMotor.construction?.panels?.length);
        }
    }
    
    const pool = getPool();
    const exports = await pool.query('SELECT * FROM exportaciones WHERE proyecto_id = $1', [id]);
    console.log("Exports count:", exports.rowCount);
    
    process.exit(0);
}

checkProject().catch(err => {
    console.error(err);
    process.exit(1);
});
