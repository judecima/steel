import { NextRequest, NextResponse } from "next/server";
import { projectService } from "../../../../../../../../src/application/project-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const result = await projectService.addInternalWall(params.id, {
        startX: Number(body.startX),
        startZ: Number(body.startZ),
        endX: Number(body.endX),
        endZ: Number(body.endZ),
        height: Number(body.height),
        thickness: Number(body.thickness)
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API-INTERNAL-WALLS] Error:", error);
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}
