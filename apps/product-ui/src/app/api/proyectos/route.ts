import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../src/modules/product/storage/postgres-storage-adapter';
import { ensureActiveVersion } from '@/lib/project-repair';

const storage = new PostgresStorageAdapter();

export async function GET() {
  try {
    const projects = await storage.listProjects();
    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Garantizar IDs mínimos
    if (!body.id) body.id = 'proj_' + Date.now();
    
    // Reparar/Garantizar versión inicial
    const { project: repaired } = ensureActiveVersion(body);

    await storage.saveProject(repaired);
    return NextResponse.json(repaired, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
