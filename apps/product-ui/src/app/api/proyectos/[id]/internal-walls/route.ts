import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../../../src/modules/product/storage/postgres-storage-adapter';
import { normalizarConfiguracionParametrica } from '../../../../../lib/parametric-config';
import { ensureActiveVersion } from '../../../../../lib/project-repair';
import { generateId } from '../../../../../../../../src/utils/ids';
import { EngineFacade } from '../../../../../../../../src/modules/product/engine-facade';

const storage = new PostgresStorageAdapter();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await storage.getProject(params.id);
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const body = await request.json();
    const startX = parseFloat(body.startX);
    const startZ = parseFloat(body.startZ);
    const endX = parseFloat(body.endX);
    const endZ = parseFloat(body.endZ);

    if (!Number.isFinite(startX) || !Number.isFinite(startZ)) {
        throw new Error("Punto inicial inválido para pared interna");
    }
    if (!Number.isFinite(endX) || !Number.isFinite(endZ)) {
        throw new Error("Punto final inválido para pared interna");
    }

    const lengthMm = Math.hypot(endX - startX, endZ - startZ) * 1000;
    if (lengthMm < 300) {
        throw new Error("La pared interna debe medir al menos 300 mm (0.3m)");
    }

    const { project: repaired } = ensureActiveVersion(project);
    const activeVersionIndex = repaired.historialVersiones.findIndex(v => v.id === repaired.versionActual);
    
    if (activeVersionIndex === -1) return NextResponse.json({ error: 'Versión activa no encontrada' }, { status: 500 });

    const config = normalizarConfiguracionParametrica(repaired.historialVersiones[activeVersionIndex].configuracion);
    
    const nuevoMuro = {
      id: generateId('iw'),
      startX,
      startZ,
      endX,
      endZ,
      height: parseFloat(body.height || config.alturaMuro),
      thickness: parseFloat(body.thickness || 0.1),
      aberturas: []
    };

    if (!config.murosInternos) config.murosInternos = [];
    config.murosInternos.push(nuevoMuro);
    
    repaired.historialVersiones[activeVersionIndex].configuracion = config;
    repaired.fechaActualizacion = new Date().toISOString();
    
    // Auto-Regenerar (Phase 9F Requirement)
    const input = {
      width: config.anchoVivienda,
      length: config.largoVivienda,
      minHeight: config.alturaMuro,
      roofType: config.tipoCubierta,
      roofSlope: config.pendienteTecho,
      openings: config.aberturas?.map(a => ({
          wallId: a.wallId,
          type: a.tipo === 'puerta' ? 'door' : 'window',
          width: a.ancho,
          height: a.alto,
          position: a.posicion,
          sillHeight: a.antepecho
      })),
      internalWalls: config.murosInternos.map(mw => ({
          id: mw.id,
          startXmm: mw.startX * 1000,
          startZmm: mw.startZ * 1000,
          endXmm: mw.endX * 1000,
          endZmm: mw.endZ * 1000,
          heightMm: mw.height * 1000,
          thicknessMm: mw.thickness * 1000,
          openings: []
      }))
    } as any;

    const result = EngineFacade.generate(input);
    repaired.historialVersiones[activeVersionIndex].resultadoMotor = result;

    await storage.saveProject(repaired);

    return NextResponse.json({ ok: true, wall: nuevoMuro, renderScene: result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
