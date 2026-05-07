import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../../../src/modules/product/storage/postgres-storage-adapter';
import { normalizarConfiguracionParametrica } from '../../../../../lib/parametric-config';
import { ensureActiveVersion } from '../../../../../lib/project-repair';
import { generateId } from '../../../../../../../../src/utils/ids';
import { EngineFacade } from '../../../../../../../../src/modules/product/engine-facade';
import { mapUIConfigToEngineInput } from '../../../../../../../../src/modules/product/map-ui-config-to-engine-input';
import { ensureProjectPersistenceDefaults } from '../../../../../../../../src/modules/product/storage/storage-utils';

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
  const body = await request.json();
  
  function normalizeWallId(value: string) {
    const aliases: Record<string, string> = {
      wall_north: "wall_north",
      wall_south: "wall_south",
      wall_east: "wall_east",
      wall_west: "wall_west",
      "Muro Norte": "wall_north",
      "Muro Sur": "wall_south",
      "Muro Este": "wall_east",
      "Muro Oeste": "wall_west",
      norte: "wall_north",
      sur: "wall_south",
      este: "wall_east",
      oeste: "wall_west",
    };
    const raw = value?.trim?.();
    return aliases[raw] || aliases[value] || null;
  }

  const wallId = normalizeWallId(body.wallId);
  if (!wallId) {
    return NextResponse.json({
      ok: false,
      code: "INVALID_WALL_ID",
      message: `Muro inválido para abertura: ${body.wallId}`,
    }, { status: 200 });
  }

  const project = await storage.getProject(params.id);
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

  const { project: repaired } = ensureActiveVersion(project);
  const activeVersionIndex = repaired.historialVersiones.findIndex(v => v.id === repaired.versionActual);
  
  if (activeVersionIndex === -1) return NextResponse.json({ error: 'Versión activa no encontrada' }, { status: 500 });

  const config = normalizarConfiguracionParametrica(repaired.historialVersiones[activeVersionIndex].configuracion);
  
  const nuevaAbertura = {
    id: generateId('op'),
    wallId,
    tipo: body.tipo,
    ancho: parseFloat(body.ancho),
    alto: parseFloat(body.alto),
    antepecho: parseFloat(body.antepecho || 0),
    posicion: parseFloat(body.posicion),
    createdAt: new Date().toISOString()
  };

  // --- ATOMIC REGENERATION CHECK ---
  // Clonar configuración para validar sin romper persistencia si falla
  const tempConfig = JSON.parse(JSON.stringify(config));
  if (!tempConfig.aberturas) tempConfig.aberturas = [];
  tempConfig.aberturas.push(nuevaAbertura);

  const input = mapUIConfigToEngineInput(tempConfig);

  const activeVersion = repaired.historialVersiones[activeVersionIndex];
  console.log("[FLOW_OPENING] activeVersion", activeVersion?.id);
  console.log("[FLOW_OPENING] configBefore", config);
  console.log("[FLOW_OPENING] openingsBefore", config.aberturas);
  console.log("[FLOW_OPENING] engineInput", input);
  console.log("[FLOW_OPENING] generate:start");

  try {
      const result = EngineFacade.generate(input);
      
      repaired.historialVersiones[activeVersionIndex].configuracion = tempConfig;
      repaired.historialVersiones[activeVersionIndex].resultadoMotor = result;
      
      const finalProject = ensureProjectPersistenceDefaults(repaired);
      await storage.saveProject(finalProject);
      
      return NextResponse.json({ ok: true, opening: nuevaAbertura, renderScene: result });
  } catch (regError: any) {
      console.error("[FLOW_OPENING] failed", {
          message: regError instanceof Error ? regError.message : String(regError),
          stack: regError instanceof Error ? regError.stack : undefined,
      });
      // NO guardamos nada en la DB
      return NextResponse.json({ 
          ok: false, 
          code: 'STRUCTURAL_VALIDATION_FAILED', 
          message: regError.message 
      }, { status: 200 });
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

    const finalProject = ensureProjectPersistenceDefaults(repaired);
    await storage.saveProject(finalProject);

    return NextResponse.json({ success: true });
}
