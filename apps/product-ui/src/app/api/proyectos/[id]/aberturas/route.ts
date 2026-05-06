import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../../../src/modules/product/storage/postgres-storage-adapter';
import { normalizarConfiguracionParametrica } from '../../../../../lib/parametric-config';
import { ensureActiveVersion } from '../../../../../lib/project-repair';
import { generateId } from '../../../../../../../../src/utils/ids';

const storage = new PostgresStorageAdapter();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await storage.getProject(params.id);
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

  const { project: repaired } = ensureActiveVersion(project);
  const activeVersion = repaired.historialVersiones.find(v => v.id === repaired.versionActual);
  
  return NextResponse.json(activeVersion?.configuracion.aberturas || []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await storage.getProject(params.id);
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

  const body = await request.json();
  const { project: repaired } = ensureActiveVersion(project);
  const activeVersionIndex = repaired.historialVersiones.findIndex(v => v.id === repaired.versionActual);
  
  if (activeVersionIndex === -1) return NextResponse.json({ error: 'Versión activa no encontrada' }, { status: 500 });

  const config = normalizarConfiguracionParametrica(repaired.historialVersiones[activeVersionIndex].configuracion);
  
  const nuevaAbertura = {
    id: generateId('op'),
    wallId: body.wallId,
    tipo: body.tipo,
    ancho: parseFloat(body.ancho),
    alto: parseFloat(body.alto),
    antepecho: parseFloat(body.antepecho || 0),
    posicion: parseFloat(body.posicion),
    createdAt: new Date().toISOString()
  };

  if (!config.aberturas) config.aberturas = [];
  config.aberturas.push(nuevaAbertura);
  
  repaired.historialVersiones[activeVersionIndex].configuracion = config;
  repaired.fechaActualizacion = new Date().toISOString();
  
  await storage.saveProject(repaired);
  
  // Auto-Regenerar (Phase 9F)
  const input = {
      width: config.anchoVivienda,
      length: config.largoVivienda,
      minHeight: config.alturaMuro,
      roofType: config.tipoCubierta,
      roofSlope: config.pendienteTecho,
      openings: config.aberturas?.map((a: any) => ({
          wallId: a.wallId,
          type: a.tipo === 'puerta' ? 'door' : 'window',
          width: a.ancho,
          height: a.alto,
          position: a.posicion,
          sillHeight: a.antepecho
      })),
      internalWalls: config.murosInternos?.map((mw: any) => ({
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

  try {
      const { EngineFacade } = require('../../../../../../../../src/modules/product/engine-facade');
      const result = EngineFacade.generate(input);
      repaired.historialVersiones[activeVersionIndex].resultadoMotor = result;
      await storage.saveProject(repaired);
      return NextResponse.json({ ok: true, opening: nuevaAbertura, renderScene: result });
  } catch (regError: any) {
      console.warn("[ABERTURA_REG] Falló regeneración automática:", regError.message);
      return NextResponse.json({ ok: true, opening: nuevaAbertura, warning: 'Regeneración fallida' });
  }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const openingId = request.nextUrl.searchParams.get('openingId');
    if (!openingId) return NextResponse.json({ error: 'Falta openingId' }, { status: 400 });

    const project = await storage.getProject(params.id);
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const { project: repaired } = ensureActiveVersion(project);
    const activeVersionIndex = repaired.historialVersiones.findIndex(v => v.id === repaired.versionActual);
    
    if (activeVersionIndex === -1) return NextResponse.json({ error: 'Versión activa no encontrada' }, { status: 500 });

    const config = repaired.historialVersiones[activeVersionIndex].configuracion;
    if (config.aberturas) {
        config.aberturas = config.aberturas.filter(a => a.id !== openingId);
    }

    repaired.fechaActualizacion = new Date().toISOString();
    await storage.saveProject(repaired);

    return NextResponse.json({ success: true });
}
