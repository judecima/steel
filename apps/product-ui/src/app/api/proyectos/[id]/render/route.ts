import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../../../src/modules/product/storage/postgres-storage-adapter';
import { SceneBuilder } from '../../../../../../../../src/modules/render/scene-builder';
import { ensureActiveVersion } from '@/lib/project-repair';
import { withTimeout } from '@/lib/server/withTimeout';

const storage = new PostgresStorageAdapter();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await withTimeout(
      (async () => {
        const project = await storage.getProject(params.id);
        if (!project) {
          return NextResponse.json({ 
            ok: false, 
            code: 'PROJECT_NOT_FOUND', 
            message: 'Proyecto no encontrado' 
          }, { status: 404 });
        }

        // Reparar invariante si es necesario
        const { project: repaired, repaired: wasRepaired, warning } = ensureActiveVersion(project);
        if (wasRepaired) {
            console.warn(`[REPAIR-RENDER] Proyecto ${params.id} reparado: ${warning}`);
            await storage.saveProject(repaired);
        }

        const version = repaired.historialVersiones.find(v => v.id === repaired.versionActual);
        
        if (!version || !version.resultadoMotor) {
          return NextResponse.json({ 
            ok: false,
            code: 'PROJECT_NOT_GENERATED',
            message: 'Debe generar el proyecto antes de visualizar.'
          }, { status: 200 }); 
        }

        const renderDTO = SceneBuilder.buildIndustrialScene(version.resultadoMotor);
        
        // Inyectar metadatos del proyecto para el visor
        renderDTO.escenaBase.metadata = {
          ...renderDTO.escenaBase.metadata,
          projectId: project.id,
          nombreProyecto: project.nombre,
          cliente: project.cliente
        };

        return NextResponse.json({
          ok: true,
          scene: renderDTO
        });
      })(),
      5000,
      'Tiempo agotado cargando escena de visualización'
    );
  } catch (error: any) {
    console.error('[API-RENDER] Error:', error);
    const code = error.message === 'Tiempo agotado cargando escena de visualización' 
      ? 'RENDER_TIMEOUT' 
      : 'RENDER_GENERATION_FAILED';
      
    return NextResponse.json({ 
      ok: false,
      code,
      message: error.message,
      details: error.stack
    }, { status: 500 });
  }
}
