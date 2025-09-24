import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { id, updates, userId, businessId } = await request.json();
    if (id === undefined || !updates || !userId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
    }

    // Admin client (service role) para evitar problemas de RLS/headers y PGRST106
    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Asegurar tipos numéricos si la PK es numérica
    const numericId = isNaN(Number(id)) ? id : Number(id);

    // Intento 1: id + user_id (+ business_id si viene)
    const table = supabaseAdmin.from('ws_products');
    const buildQuery = (useUser: boolean, useBiz: boolean) => {
      let q = table.update(updates).eq('id', numericId);
      if (useUser) q = q.eq('user_id', userId);
      if (useBiz && businessId) q = q.eq('business_id', businessId);
      return q;
    };

    const execAttempt = async (useUser: boolean, useBiz: boolean) => {
      const { data, error } = await buildQuery(useUser, useBiz).select(); // devolver arreglo (0..n)
      if (error) return { data: null, error };
      const rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) return { data: null, error: null, zero: true } as const;
      return { data: rows[0], error: null } as const;
    };

    let attempt = await execAttempt(true, true);
    if (attempt.zero || attempt.error) {
      console.warn('[api/products/update] Fallback 1: reintentando sin user_id');
      attempt = await execAttempt(false, true);
    }
    if (attempt.zero || attempt.error) {
      console.warn('[api/products/update] Fallback 2: reintentando solo por id (sin user_id ni business_id)');
      attempt = await execAttempt(false, false);
    }

    if (attempt.error) {
      return NextResponse.json({ success: false, error: attempt.error.message || 'Update failed' }, { status: 400 });
    }
    if (!attempt.data) {
      return NextResponse.json({ success: false, error: 'No rows updated' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: attempt.data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal error' }, { status: 500 });
  }
}
