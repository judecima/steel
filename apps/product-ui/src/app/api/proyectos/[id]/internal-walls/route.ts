import { NextRequest, NextResponse } from 'next/server';
import { PostgresStorageAdapter } from '../../../../../../../../src/modules/product/storage/postgres-storage-adapter';
import { normalizarConfiguracionParametrica } from '../../../../../lib/parametric-config';
import { ensureActiveVersion } from '../../../../../lib/project-repair';
import { generateId } from '../../../../../../../../src/utils/ids';
import { EngineFacade } from '../../../../../../../../src/modules/product/engine-facade';
import { mapUIConfigToEngineInput } from '../../../../../../../../src/modules/product/map-ui-config-to-engine-input';
import { ensureProjectPersistenceDefaults } from '../../../../../../../../src/modules/product/storage/storage-utils';

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

    // --- ATOMIC REGENERATION CHECK ---
    const tempConfig = JSON.parse(JSON.stringify(config));
    if (!tempConfig.murosInternos) tempConfig.murosInternos = [];
    tempConfig.murosInternos.push(nuevoMuro);

    const input = mapUIConfigToEngineInput(tempConfig);

    try {
        const result = EngineFacade.generate(input);
        
        repaired.historialVersiones[activeVersionIndex].configuracion = tempConfig;
        repaired.historialVersiones[activeVersionIndex].resultadoMotor = result;
        
        const finalProject = ensureProjectPersistenceDefaults(repaired);
        await storage.saveProject(finalProject);

        return NextResponse.json({ ok: true, wall: nuevoMuro, renderScene: result });
    } catch (regError: any) {
        console.error("[INTERNAL_WALL_REG] Structural validation failed:", regError.message);
        return NextResponse.json({ 
            ok: false, 
            code: "STRUCTURAL_VALIDATION_FAILED", 
            message: regError.message 
        }, { status: 200 });
    }
    } catch (error: any) {
        console.error("[INTERNAL_WALL_POST] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
