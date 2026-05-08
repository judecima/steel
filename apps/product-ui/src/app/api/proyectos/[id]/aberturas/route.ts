import { NextRequest, NextResponse } from "next/server";
import { projectService } from "../../../../../../../../src/application/project-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const result = await projectService.addOpening(params.id, {
        wallId: body.wallId,
        tipo: body.tipo || body.type,
        ancho: Number(body.ancho || body.width),
        alto: Number(body.alto || body.height),
        posicion: Number(body.posicion || body.position),
        antepecho: Number(body.antepecho || body.sillHeight || 0)
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API-ABERTURAS] Error:", error);
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}
