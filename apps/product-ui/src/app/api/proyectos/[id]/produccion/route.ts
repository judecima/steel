import { NextRequest, NextResponse } from 'next/server';
import { productionService } from '../../../../../../../../src/application/production-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await productionService.getProjectProduction(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API-PRODUCCION-GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const result = await productionService.updateProduction(params.id, body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API-PRODUCCION-PUT] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
