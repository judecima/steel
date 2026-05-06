import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../../../../../../src/modules/product/storage/db-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pool = getPool();
  try {
    const res = await pool.query(
      'SELECT * FROM exportaciones WHERE proyecto_id = $1 ORDER BY fecha_creacion DESC',
      [params.id]
    );
    return NextResponse.json(res.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
