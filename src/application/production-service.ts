import { PostgresStorageAdapter } from '../modules/product/storage/postgres-storage-adapter';
import { getPool } from '../modules/product/storage/db-config';

export class ProductionService {
    private storage = new PostgresStorageAdapter();

    async getProjectProduction(projectId: string) {
        const pool = getPool();
        
        // Obtener estado global (usando pool por ahora hasta que movamos todo a StorageAdapter)
        const globalRes = await pool.query(
            'SELECT * FROM produccion_proyectos WHERE proyecto_id = $1',
            [projectId]
        );
        
        // Obtener estado de paneles
        const panelsRes = await pool.query(
            'SELECT panel_id, estado FROM produccion_paneles WHERE proyecto_id = $1',
            [projectId]
        );

        if (globalRes.rows.length === 0) {
            return {
                proyecto_id: projectId,
                estado_global: 'pendiente',
                avance_porcentaje: 0,
                paneles: []
            };
        }

        return {
            ...globalRes.rows[0],
            paneles: panelsRes.rows
        };
    }

    async updateProduction(projectId: string, data: any) {
        const pool = getPool();
        const { estado_global, avance_porcentaje, paneles } = data;

        try {
            await pool.query('BEGIN');

            // 1. Actualizar global
            await pool.query(
                `INSERT INTO produccion_proyectos (proyecto_id, estado_global, avance_porcentaje, fecha_actualizacion)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT (proyecto_id) DO UPDATE SET
                 estado_global = EXCLUDED.estado_global,
                 avance_porcentaje = EXCLUDED.avance_porcentaje,
                 fecha_actualizacion = NOW()`,
                [projectId, estado_global, avance_porcentaje]
            );

            // 2. Actualizar paneles
            if (Array.isArray(paneles)) {
                for (const p of paneles) {
                    await pool.query(
                        `INSERT INTO produccion_paneles (proyecto_id, panel_id, estado)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (proyecto_id, panel_id) DO UPDATE SET
                         estado = EXCLUDED.estado`,
                        [projectId, p.panel_id, p.estado]
                    );
                }
            }

            await pool.query('COMMIT');
            return { ok: true };
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    }
}

export const productionService = new ProductionService();
