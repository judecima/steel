import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '../../../../../../../../src/application/project-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await projectService.regenerateProject(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API-REGENERAR] Error:', error);
    return NextResponse.json({ 
      ok: false,
      error: error.message 
    }, { status: 500 });
  }
}
