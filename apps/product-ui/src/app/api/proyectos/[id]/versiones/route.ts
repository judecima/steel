import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../../../src/modules/product/storage/postgres-storage-adapter';

const storage = new PostgresStorageAdapter();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const version = await request.json();
    const project = await storage.getProject(params.id);
    
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    project.historialVersiones.push(version);
    project.versionActual = version.id;
    project.fechaActualizacion = new Date().toISOString();

    await storage.saveProject(project);
    return NextResponse.json(version, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
