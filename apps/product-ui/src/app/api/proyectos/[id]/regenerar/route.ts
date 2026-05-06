import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../../../src/modules/product/storage/postgres-storage-adapter';
import { EngineFacade } from '../../../../../../../../src/modules/product/engine-facade';
import { HouseInput } from '../../../../../../../../src/core/types';
import { normalizarConfiguracionParametrica } from '@/lib/parametric-config';
import { ensureActiveVersion } from '@/lib/project-repair';

const storage = new PostgresStorageAdapter();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await storage.getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // Reparar invariante antes de proceder
    const { project: repaired, repaired: wasRepaired, warning } = ensureActiveVersion(project);
    if (wasRepaired) {
        console.warn(`[REPAIR-REGENERAR] Proyecto ${params.id} reparado: ${warning}`);
        await storage.saveProject(repaired);
    }
    
    const version = repaired.historialVersiones.find(v => v.id === repaired.versionActual);
    if (!version) {
      return NextResponse.json({ error: 'Versión actual no encontrada después de reparación' }, { status: 404 });
    }

    // Usar normalizador para garantizar integridad antes de pasar al motor
    const config = normalizarConfiguracionParametrica(version.configuracion);

    // Mapping DTO to Engine Input
    const input: HouseInput = {
      width: config.anchoVivienda,
      length: config.largoVivienda,
      minHeight: config.alturaMuro,
      roofType: config.tipoCubierta,
      roofSlope: config.pendienteTecho,
      openings: (config.aberturas || []).map(a => ({
        wallId: a.wallId,
        type: a.tipo === 'puerta' ? 'door' : 'window',
        width: a.ancho,
        height: a.alto,
        position: a.posicion,
        sillHeight: a.antepecho
      }))
    };

    console.log(`[API-REGENERAR] Iniciando motor para proyecto ${params.id}...`);
    
    // Ejecutar Motor
    const result = EngineFacade.generate(input);

    // Persistir resultado en la versión
    version.resultadoMotor = result;
    
    // Actualizar estado del proyecto si es necesario
    if (project.estado === 'borrador' as any) {
        project.estado = 'validado' as any;
    }

    await storage.saveProject(project);

    return NextResponse.json({
      status: "completado",
      message: "Proyecto regenerado exitosamente",
      repairedVersion: wasRepaired,
      repairWarning: warning,
      stats: {
        walls: result.house.muros.length,
        panels: result.construction.panels.length,
        bomItems: result.bom.aggregated.length
      }
    });
  } catch (error: any) {
    console.error('[API-REGENERAR] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
