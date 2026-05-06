import { PostgresStorageAdapter } from '../src/modules/product/storage/postgres-storage-adapter';
import { normalizePanelGeometry } from '../src/modules/planos/pdf-scene-adapter';
import { PlanoPackageBuilder } from '../src/modules/planos/plano-package-builder';

async function debugPdfExport() {
    const projectId = 'test_9e_1778102309619'; // Using the one from previous context or a known one
    console.log(`--- DEBUGGING PDF EXPORT GEOMETRY for ${projectId} ---`);

    const storage = new PostgresStorageAdapter();
    try {
        const project = await storage.getProject(projectId);
        if (!project) {
            console.error('Project not found');
            return;
        }

        const pkg = await PlanoPackageBuilder.build(project);
        console.log(`Total sheets: ${pkg.hojas.length}`);

        pkg.hojas.forEach(sheet => {
            console.log(`\nSheet: ${sheet.titulo} (${sheet.codigoHoja})`);
            
            // Validate Entities
            sheet.entities.forEach((entity, idx) => {
                if (entity.type === 'line' || entity.type === 'path') {
                    const geo = normalizePanelGeometry(entity);
                    if (!geo.start || !geo.end) {
                        console.warn(`  [!] Invalid geometry in entity ${idx} (${entity.type}):`, entity);
                    }
                }
            });

            // Validate Dimensions
            sheet.dimensions.forEach((dim, idx) => {
                const geo = normalizePanelGeometry(dim);
                if (!geo.start || !geo.end) {
                    console.warn(`  [!] Invalid geometry in dimension ${idx}:`, dim);
                }
            });

            // Validate Tables
            sheet.tables.forEach((table, idx) => {
                if (!table.position) {
                    console.warn(`  [!] Table ${idx} missing position:`, table.title);
                }
            });
        });

        console.log('\n--- DEBUG COMPLETED ---');
    } catch (error: any) {
        console.error('!!! DEBUG FAILED:', error.message);
    }
}

debugPdfExport();
