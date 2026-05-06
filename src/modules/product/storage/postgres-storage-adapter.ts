import { ProyectoDTO, VersionProyectoDTO } from '../types';
import { ProjectStorage } from './storage-adapter';
import { getPool } from './db-config';

export class PostgresStorageAdapter implements ProjectStorage {

    async healthCheck(): Promise<boolean> {
        try {
            const pool = getPool();
            await pool.query('SELECT 1');
            return true;
        } catch { return false; }
    }

    async saveProject(project: ProyectoDTO): Promise<void> {
        const pool = getPool();
        const existing = await this.getProject(project.id);

        if (!existing) {
            // INSERT
            await pool.query(
                `INSERT INTO proyectos (id, nombre, cliente, estado, fecha_creacion, fecha_actualizacion, version_actual)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [project.id, project.nombre, project.cliente, project.estado,
                 project.fechaCreacion, project.fechaActualizacion, project.versionActual]
            );
        } else {
            // UPDATE
            await pool.query(
                `UPDATE proyectos SET nombre=$2, cliente=$3, estado=$4,
                 fecha_actualizacion=$5, version_actual=$6 WHERE id=$1`,
                [project.id, project.nombre, project.cliente, project.estado,
                 project.fechaActualizacion, project.versionActual]
            );
        }

        // Upsert all versions
        for (let i = 0; i < project.historialVersiones.length; i++) {
            const v = project.historialVersiones[i];
            await pool.query(
                `INSERT INTO versiones_proyecto (id, proyecto_id, numero_version, snapshot_json, fecha_creacion)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (id) DO NOTHING`,
                [v.id, project.id, i + 1, JSON.stringify(v), v.fecha]
            );
        }

        // Upsert configuracion
        const vActual = project.historialVersiones.find(v => v.id === project.versionActual);
        if (vActual?.configuracion) {
            await pool.query(
                `INSERT INTO configuraciones (proyecto_id, configuracion_json)
                 VALUES ($1, $2)
                 ON CONFLICT (proyecto_id) DO UPDATE SET configuracion_json = EXCLUDED.configuracion_json`,
                [project.id, JSON.stringify(vActual.configuracion)]
            );
        }

        // Upsert produccion paneles
        if (project.produccion?.estadosPorPanel) {
            for (const [panelId, estado] of Object.entries(project.produccion.estadosPorPanel)) {
                await pool.query(
                    `INSERT INTO produccion_paneles (proyecto_id, panel_id, estado)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (proyecto_id, panel_id) DO UPDATE SET estado = EXCLUDED.estado`,
                    [project.id, panelId, estado]
                );
            }
        }

        // Upsert produccion muros
        if (project.produccion?.estadosPorMuro) {
            for (const [muroId, estado] of Object.entries(project.produccion.estadosPorMuro)) {
                await pool.query(
                    `INSERT INTO produccion_muros (proyecto_id, muro_id, estado)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (proyecto_id, muro_id) DO UPDATE SET estado = EXCLUDED.estado`,
                    [project.id, muroId, estado]
                );
            }
        }
    }

    async getProject(id: string): Promise<ProyectoDTO | null> {
        const pool = getPool();
        const r = await pool.query(`SELECT * FROM proyectos WHERE id = $1`, [id]);
        if (!r.rows.length) return null;

        const row = r.rows[0];
        const versiones = await this._getVersiones(pool, id);
        const produccion = await this._getProduccion(pool, id);

        const proyecto: ProyectoDTO = {
            id: row.id,
            nombre: row.nombre,
            cliente: row.cliente,
            estado: row.estado,
            fechaCreacion: row.fecha_creacion,
            fechaActualizacion: row.fecha_actualizacion,
            versionActual: row.version_actual,
            historialVersiones: versiones,
            produccion
        };
        return proyecto;
    }

    async listProjects(): Promise<ProyectoDTO[]> {
        const pool = getPool();
        const r = await pool.query(`SELECT id FROM proyectos ORDER BY fecha_actualizacion DESC`);
        const results: ProyectoDTO[] = [];
        for (const row of r.rows) {
            const p = await this.getProject(row.id);
            if (p) results.push(p);
        }
        return results;
    }

    async deleteProject(id: string): Promise<void> {
        const pool = getPool();
        await pool.query(`DELETE FROM proyectos WHERE id = $1`, [id]);
    }

    private async _getVersiones(pool: any, proyectoId: string): Promise<VersionProyectoDTO[]> {
        const r = await pool.query(
            `SELECT snapshot_json FROM versiones_proyecto WHERE proyecto_id=$1 ORDER BY numero_version`,
            [proyectoId]
        );
        return r.rows.map((row: any) =>
            typeof row.snapshot_json === 'string'
                ? JSON.parse(row.snapshot_json)
                : row.snapshot_json
        );
    }

    private async _getProduccion(pool: any, proyectoId: string): Promise<any> {
        const paneles = await pool.query(`SELECT panel_id, estado FROM produccion_paneles WHERE proyecto_id=$1`, [proyectoId]);
        const muros = await pool.query(`SELECT muro_id, estado FROM produccion_muros WHERE proyecto_id=$1`, [proyectoId]);

        const estadosPorPanel: Record<string, string> = {};
        const estadosPorMuro: Record<string, string> = {};
        for (const r of paneles.rows) estadosPorPanel[r.panel_id] = r.estado;
        for (const r of muros.rows) estadosPorMuro[r.muro_id] = r.estado;

        if (!paneles.rows.length && !muros.rows.length) return undefined;

        const vals = Object.values(estadosPorPanel);
        const terminados = vals.filter(e => ['fabricado','despachado','montado','cerrado'].includes(e)).length;
        const avancePorcentaje = vals.length ? Math.round(terminados / vals.length * 100) : 0;

        return { estadoGlobal: avancePorcentaje === 100 ? 'cerrado' : avancePorcentaje > 0 ? 'en_fabricacion' : 'pendiente', avancePorcentaje, estadosPorPanel, estadosPorMuro };
    }
}
