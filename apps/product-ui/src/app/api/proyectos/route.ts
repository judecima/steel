import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../src/modules/product/storage/postgres-storage-adapter';

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
    await storage.saveProject(body);
    return NextResponse.json(body, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
