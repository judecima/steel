import { NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../src/modules/product/storage/postgres-storage-adapter';
import { runMigrations } from '../../../../../../src/modules/product/storage/migrations';

export async function GET() {
  try {
    await runMigrations();
    const storage = new PostgresStorageAdapter();
    const isOk = await storage.healthCheck();
    
    if (isOk) {
      return NextResponse.json({ status: 'ok', database: 'connected' });
    } else {
      return NextResponse.json({ status: 'error', database: 'disconnected' }, { status: 503 });
    }
  } catch (error: any) {
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
