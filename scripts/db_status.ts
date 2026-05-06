import { getMigrationStatus, runMigrations } from '../src/modules/product/storage/migrations';
import { getDbConfig, closePool } from '../src/modules/product/storage/db-config';

declare var process: any;

async function main() {
    const cfg = getDbConfig();
    console.log('=== ESTADO DE BASE DE DATOS ===');
    console.log(`Conexión: ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}\n`);

    try {
        const status = await getMigrationStatus();

        console.log('Tablas:');
        for (const t of status.tables) {
            const icon = t.rows >= 0 ? '✓' : '✗';
            const filas = t.rows >= 0 ? `${t.rows} filas` : 'NO EXISTE';
            console.log(`  ${icon} ${t.name.padEnd(30)} ${filas}`);
        }

        if (status.lastMigration) {
            console.log(`\nÚltima migración: ${new Date(status.lastMigration).toLocaleString('es-AR')}`);
        } else {
            console.log('\n⚠️  Sin migraciones registradas. Ejecuta: npm run db:migrate');
        }

        await closePool();
    } catch (err: any) {
        console.error(`❌ Error: ${err.message}`);
        console.log('Verifica la conexión con: npm run db:test-connection');
        await closePool();
        process.exit(1);
    }
}

main();
