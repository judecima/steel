import * as path from 'path';
import * as fs from 'fs';

// Load .env manually to avoid requiring dotenv as a prod dependency in browser bundles
function loadEnv(): void {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx < 0) continue;
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
    }
}

loadEnv();

export interface DbConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}

export function getDbConfig(): DbConfig {
    return {
        host:     process.env.POSTGRES_HOST     || 'localhost',
        port:     parseInt(process.env.POSTGRES_PORT || '5432', 10),
        database: process.env.POSTGRES_DB       || 'steel_projects',
        user:     process.env.POSTGRES_USER     || 'steel_app',
        password: process.env.POSTGRES_PASSWORD || ''
    };
}

let _pool: any = null;

export function getPool(): any {
    if (_pool) return _pool;
    const { Pool } = require('pg');
    _pool = new Pool(getDbConfig());
    return _pool;
}

export async function closePool(): Promise<void> {
    if (_pool) { await _pool.end(); _pool = null; }
}
