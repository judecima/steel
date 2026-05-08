import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '../../../../../../../../../src/application/export-service';

import { withTimeout } from '@/lib/server/withTimeout';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await withTimeout(
      (async () => {
        const result = await exportService.generateIndustrialPackage(params.id);
        return NextResponse.json(result);
      })(),
      30000,
      'Tiempo agotado generando exportaciones'
    );
  } catch (error: any) {
    console.error("[API-EXPORT-GENERAR] Error:", error);
    return NextResponse.json({ 
      ok: false, 
      code: error.message === 'Tiempo agotado generando exportaciones' ? 'EXPORT_TIMEOUT' : 'EXPORT_FAILED',
      message: error.message,
      status: 'error'
    }, { status: 500 });
  }
}
