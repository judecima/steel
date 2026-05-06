import { getPool, getDbConfig, closePool } from '../src/modules/product/storage/db-config';

declare var process: any;

async function main() {
    const cfg = getDbConfig();
    console.log('=== VERIFICANDO CONEXIÓN POSTGRESQL ===');
    console.log(`Host:     ${cfg.host}:${cfg.port}`);
    console.log(`Base:     ${cfg.database}`);
    console.log(`Usuario:  ${cfg.user}`);

    try {
        const pool = getPool();
        const r = await pool.query('SELECT version(), current_database(), current_user, NOW() as now');
        const row = r.rows[0];
        console.log('\n✅ Conexión exitosa');
        console.log(`   Versión:   ${row.version.split(' ').slice(0,2).join(' ')}`);
        console.log(`   Base:      ${row.current_database}`);
        console.log(`   Usuario:   ${row.current_user}`);
        console.log(`   Hora DB:   ${new Date(row.now).toLocaleString('es-AR')}`);
        await closePool();
        process.exit(0);
    } catch (err: any) {
        console.error(`\n❌ Conexión fallida: ${err.message}`);
        await closePool();
        process.exit(1);
    }
}

main();
