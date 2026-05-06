import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    status: "pendiente",
    message: "Regeneración pendiente de implementar en Fase 8"
  });
}
