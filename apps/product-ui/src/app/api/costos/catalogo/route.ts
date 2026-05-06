import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../../../../../src/modules/product/storage/db-config';

export async function GET() {
  const pool = getPool();
  try {
    const res = await pool.query('SELECT * FROM catalogo_costos ORDER BY codigo ASC');
    return NextResponse.json(res.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const pool = getPool();
  try {
    const body = await request.json(); // Array de ítems
    
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Body debe ser un array' }, { status: 400 });
    }

    await pool.query('BEGIN');
    for (const item of body) {
      await pool.query(
        `INSERT INTO catalogo_costos (codigo, descripcion, unidad, precio_unitario, moneda, fecha_actualizacion)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (codigo) DO UPDATE SET
         descripcion = EXCLUDED.descripcion,
         unidad = EXCLUDED.unidad,
         precio_unitario = EXCLUDED.precio_unitario,
         moneda = EXCLUDED.moneda,
         fecha_actualizacion = NOW()`,
        [item.codigo, item.descripcion, item.unidad, item.precio_unitario, item.moneda || 'USD']
      );
    }
    await pool.query('COMMIT');
    
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    await pool.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
