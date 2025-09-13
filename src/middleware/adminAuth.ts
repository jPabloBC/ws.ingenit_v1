import { supabase } from '@/services/supabase/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function adminAuthMiddleware(request: NextRequest) {
  const res = NextResponse.next();

  try {
    // Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.redirect(new URL('/login?redirect=/admin/dashboard', request.url));
    }

    if (!session) {
      return NextResponse.redirect(new URL('/login?redirect=/admin/dashboard', request.url));
    }

    // Verificar rol de administrador
    const { data: profile, error: profileError } = await supabase
      .from('ws_users')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (!profile || !['admin', 'dev'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Usuario autenticado y es admin - continuar
    return res;

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return NextResponse.redirect(new URL('/login?redirect=/admin/dashboard', request.url));
  }
}
