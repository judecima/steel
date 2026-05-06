import { runMigrations, getMigrationStatus } from '../src/modules/product/storage/migrations';
import { closePool } from '../src/modules/product/storage/db-config';

declare var process: any;

async function main() {
    console.log('=== EJECUTANDO MIGRACIONES ===');
    const result = await runMigrations();
    if (result.error) {
        console.error(`❌ Error en migración: ${result.error}`);
        process.exit(1);
    }
    console.log(`✅ Migraciones completadas: ${result.migrated} sentencias ejecutadas.`);

    const status = await getMigrationStatus();
    console.log('\n📋 Estado actual de tablas:');
    for (const t of status.tables) {
        const marker = t.rows >= 0 ? '✓' : '✗';
        console.log(`  ${marker} ${t.name}: ${t.rows >= 0 ? t.rows + ' filas' : 'NO EXISTE'}`);
    }
    if (status.lastMigration) {
        console.log(`\n🕐 Última migración: ${status.lastMigration}`);
    }

    await closePool();
}

main().catch(e => { console.error(e); process.exit(1); });
