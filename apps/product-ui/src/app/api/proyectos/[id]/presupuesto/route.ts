import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '../../../../../../../../src/application/export-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await exportService.getProjectBudget(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API-PRESUPUESTO] Error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
}
