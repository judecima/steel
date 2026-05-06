import { getPool } from './db-config';

const MIGRATIONS: string[] = [
`CREATE TABLE IF NOT EXISTS proyectos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    cliente TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'borrador',
    fecha_creacion TIMESTAMPTZ NOT NULL,
    fecha_actualizacion TIMESTAMPTZ NOT NULL,
    version_actual TEXT NOT NULL
)`,

`CREATE TABLE IF NOT EXISTS versiones_proyecto (
    id TEXT PRIMARY KEY,
    proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    numero_version INT NOT NULL DEFAULT 1,
    snapshot_json JSONB NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL
)`,

`CREATE TABLE IF NOT EXISTS configuraciones (
    id SERIAL PRIMARY KEY,
    proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    configuracion_json JSONB NOT NULL,
    UNIQUE(proyecto_id)
)`,

`CREATE TABLE IF NOT EXISTS resultados_motor (
    id SERIAL PRIMARY KEY,
    proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    resultado_json JSONB NOT NULL
)`,

`CREATE TABLE IF NOT EXISTS exportaciones (
    id SERIAL PRIMARY KEY,
    proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    ruta_archivo TEXT,
    metadata_json JSONB
)`,

`CREATE TABLE IF NOT EXISTS produccion_paneles (
    id SERIAL PRIMARY KEY,
    proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    panel_id TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    UNIQUE(proyecto_id, panel_id)
)`,

`CREATE TABLE IF NOT EXISTS produccion_muros (
    id SERIAL PRIMARY KEY,
    proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    muro_id TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    UNIQUE(proyecto_id, muro_id)
)`,

`CREATE TABLE IF NOT EXISTS catalogo_costos (
    id SERIAL PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    precio_unitario NUMERIC(12,2)
)`,

`CREATE TABLE IF NOT EXISTS migraciones_ejecutadas (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    ejecutada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`
];

export async function runMigrations(): Promise<{ migrated: number; error?: string }> {
    const pool = getPool();
    let migrated = 0;
    try {
        for (let i = 0; i < MIGRATIONS.length; i++) {
            await pool.query(MIGRATIONS[i]);
            migrated++;
        }
        // Record migration execution
        await pool.query(
            `INSERT INTO migraciones_ejecutadas (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING`,
            [`migration_baseline_${new Date().toISOString().split('T')[0]}`]
        );
        return { migrated };
    } catch (err: any) {
        return { migrated, error: err.message };
    }
}

export async function getMigrationStatus(): Promise<{ tables: { name: string; rows: number }[]; lastMigration: string | null }> {
    const pool = getPool();
    const tableNames = ['proyectos','versiones_proyecto','configuraciones','resultados_motor','exportaciones','produccion_paneles','produccion_muros','catalogo_costos','migraciones_ejecutadas'];
    const tables: { name: string; rows: number }[] = [];
    let lastMigration: string | null = null;

    for (const t of tableNames) {
        try {
            const r = await pool.query(`SELECT COUNT(*) as cnt FROM ${t}`);
            tables.push({ name: t, rows: parseInt(r.rows[0].cnt, 10) });
        } catch {
            tables.push({ name: t, rows: -1 });
        }
    }

    try {
        const r = await pool.query(`SELECT ejecutada_en FROM migraciones_ejecutadas ORDER BY id DESC LIMIT 1`);
        if (r.rows.length > 0) lastMigration = r.rows[0].ejecutada_en;
    } catch { /* tabla no existe aún */ }

    return { tables, lastMigration };
}
