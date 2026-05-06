import { PostgresStorageAdapter } from '../src/modules/product/storage/postgres-storage-adapter';
import { ensureActiveVersion } from '../apps/product-ui/src/lib/project-repair';
import { closePool } from '../src/modules/product/storage/db-config';

async function runRepair() {
    console.log('--- PROJECT VERSION REPAIR SCRIPT ---');
    const storage = new PostgresStorageAdapter();
    const connected = await storage.healthCheck();
    
    if (!connected) {
        console.error('FAIL: No connection to PostgreSQL');
        process.exit(1);
    }

    const projects = await storage.listProjects();
    console.log(`Auditing ${projects.length} projects...`);

    let repairedCount = 0;

    for (const project of projects) {
        const { project: repaired, repaired: wasRepaired, warning } = ensureActiveVersion(project);
        
        if (wasRepaired) {
            console.log(`[FIXING] Project ${project.id} ("${project.nombre}"): ${warning}`);
            await storage.saveProject(repaired);
            repairedCount++;
        }
    }

    console.log('-----------------------------------');
    console.log(`Audit complete. ${repairedCount} projects repaired.`);
    console.log('-----------------------------------');

    await closePool();
}

runRepair().catch(err => {
    console.error('CRITICAL ERROR:', err);
    process.exit(1);
});
