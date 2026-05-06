import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../../../../../../src/modules/product/storage/db-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pool = getPool();
  try {
    const res = await pool.query(
      'SELECT * FROM presupuestos WHERE proyecto_id = $1 ORDER BY fecha_creacion DESC LIMIT 1',
      [params.id]
    );
    return NextResponse.json(res.rows[0] || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pool = getPool();
  try {
    const body = await request.json();
    const { items_json, total, moneda, estado } = body;

    const res = await pool.query(
      `INSERT INTO presupuestos (proyecto_id, items_json, total, moneda, estado, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [params.id, JSON.stringify(items_json), total, moneda || 'USD', estado || 'confirmado']
    );

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
