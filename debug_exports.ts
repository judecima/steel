
import { getPool } from './src/modules/product/storage/db-config';
import * as fs from 'fs';
import * as path from 'path';

async function testExportsLogic() {
    const projectId = 'test_9e_1778102309619';
    try {
        const pool = getPool();
        console.log("Querying DB...");
        const errorCheck = await pool.query(
          `SELECT * FROM exportaciones 
           WHERE proyecto_id = $1 AND (tipo = 'error_generacion' OR tipo = 'error_planos')
           ORDER BY fecha_creacion DESC LIMIT 1`,
          [projectId]
        );
        console.log("Rows:", errorCheck.rowCount);
        
        const exportBaseDir = path.join(process.cwd(), './tools/qa-viewer/exports'); // Path adjustment for script
        console.log("Check dir:", exportBaseDir);
        
        process.exit(0);
    } catch (e: any) {
        console.error("LOGIC FAILED:", e.message);
        process.exit(1);
    }
}

testExportsLogic();
