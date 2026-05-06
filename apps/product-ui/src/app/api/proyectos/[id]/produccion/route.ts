import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../../../../../../src/modules/product/storage/db-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pool = getPool();
  try {
    const { id } = params;
    
    // 1. Obtener estado global
    const globalRes = await pool.query(
      'SELECT * FROM produccion_proyectos WHERE proyecto_id = $1',
      [id]
    );
    
    // 2. Obtener estado de paneles
    const panelsRes = await pool.query(
      'SELECT panel_id, estado FROM produccion_paneles WHERE proyecto_id = $1',
      [id]
    );

    if (globalRes.rows.length === 0) {
      // Devolver estructura inicial si no existe
      return NextResponse.json({
        proyecto_id: id,
        estado_global: 'pendiente',
        avance_porcentaje: 0,
        paneles: []
      });
    }

    return NextResponse.json({
      ...globalRes.rows[0],
      paneles: panelsRes.rows
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pool = getPool();
  try {
    const { id } = params;
    const body = await request.json();
    const { estado_global, avance_porcentaje, paneles } = body;

    await pool.query('BEGIN');

    // 1. Actualizar global
    await pool.query(
      `INSERT INTO produccion_proyectos (proyecto_id, estado_global, avance_porcentaje, fecha_actualizacion)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (proyecto_id) DO UPDATE SET
       estado_global = EXCLUDED.estado_global,
       avance_porcentaje = EXCLUDED.avance_porcentaje,
       fecha_actualizacion = NOW()`,
      [id, estado_global, avance_porcentaje]
    );

    // 2. Actualizar paneles
    if (Array.isArray(paneles)) {
      for (const p of paneles) {
        await pool.query(
          `INSERT INTO produccion_paneles (proyecto_id, panel_id, estado)
           VALUES ($1, $2, $3)
           ON CONFLICT (proyecto_id, panel_id) DO UPDATE SET
           estado = EXCLUDED.estado`,
          [id, p.panel_id, p.estado]
        );
      }
    }

    await pool.query('COMMIT');
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    await pool.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
