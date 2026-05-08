import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '../../../../../../../../src/application/export-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exports = await exportService.getProjectExports(params.id);
    return NextResponse.json({
        ok: true,
        exportaciones: exports
    });
  } catch (error: any) {
    console.error("[API-EXPORT-LIST] Error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
}
