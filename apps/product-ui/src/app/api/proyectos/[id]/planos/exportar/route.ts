import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '../../../../../../../../../src/application/export-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await exportService.exportDrawings(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API-PLANOS-EXPORT] Error:", error);
    return NextResponse.json({ 
      ok: false, 
      code: "PDF_EXPORT_FAILED",
      message: error.message 
    }, { status: 500 });
  }
}
