import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../../src/modules/product/storage/postgres-storage-adapter';
import { normalizarConfiguracionParametrica } from '@/lib/parametric-config';
import { ensureActiveVersion } from '@/lib/project-repair';

const storage = new PostgresStorageAdapter();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let project = await storage.getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // Reparar invariante si es necesario
    const { project: repaired, repaired: wasRepaired, warning } = ensureActiveVersion(project);
    if (wasRepaired) {
        console.warn(`[REPAIR] Proyecto ${params.id} reparado: ${warning}`);
        await storage.saveProject(repaired);
        project = repaired;
    }

    return NextResponse.json({
        ...project,
        repairedVersion: wasRepaired,
        repairWarning: warning
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    body.id = params.id;
    
    // Normalizar configuraciones
    if (body.historialVersiones) {
        body.historialVersiones = body.historialVersiones.map((v: any) => ({
            ...v,
            configuracion: normalizarConfiguracionParametrica(v.configuracion)
        }));
    }

    // Reparar invariante
    const { project: repaired, repaired: wasRepaired, warning } = ensureActiveVersion(body);

    await storage.saveProject(repaired);
    return NextResponse.json({
        ...repaired,
        repairedVersion: wasRepaired,
        repairWarning: warning
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await storage.deleteProject(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
