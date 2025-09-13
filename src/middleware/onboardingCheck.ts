import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/services/supabase/client';
import { supabaseAdmin } from '@/services/supabase/admin';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();

  const { pathname } = request.nextUrl;

  // Rutas públicas que NO requieren autenticación
  const publicRoutes = ['/', '/plans', '/auth/callback'];
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // Rutas de autenticación permitidas (SIN verify-email para usuarios no verificados)
  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Si es ruta pública, permitir acceso
  if (isPublicRoute) {
    return res;
  }

  // Obtener la sesión actual
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si no hay sesión, redirigir al login
  if (!session) {
    if (isAuthRoute) {
      return res; // Permitir acceso a rutas de auth
    }
    // Permitir verify-email solo si tiene parámetros válidos
    if (pathname === '/verify-email') {
      const token = request.nextUrl.searchParams.get('token');
      const email = request.nextUrl.searchParams.get('email');
      if (token && email) {
        return res; // Permitir acceso con parámetros válidos
      }
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si hay sesión, verificar email
  if (session.user) {
    try {
      // Verificar en ws_email_verifications si está verificado
      const { data: verification } = await supabaseAdmin
        .from('ws_email_verifications')
        .select('verified')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // BLOQUEO TOTAL: Si no está verificado en nuestra tabla, SOLO permitir rutas de auth
      if (!verification?.verified) {
        console.log('🚫 Middleware: Usuario no verificado bloqueado:', session.user.email);
        if (isAuthRoute) {
          return res; // Permitir solo rutas de auth
        }
        // BLOQUEAR TODO LO DEMÁS - redirigir al login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      console.error('Error verificando email en middleware:', error);
      // BLOQUEO TOTAL: En caso de error, redirigir al login
      if (isAuthRoute) {
        return res; // Permitir solo rutas de auth
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Si el email está verificado, verificar perfil en ws_users
    try {
        const { data: profile } = await supabaseAdmin
          .from('ws_users')
          .select('id')
          .eq('user_id', session.user.id)
        .maybeSingle();

      // BLOQUEO TOTAL: Si no tiene perfil, SOLO permitir onboarding
      if (!profile) {
        if (pathname === '/onboarding') {
          return res; // Permitir onboarding
        }
        // BLOQUEAR TODO LO DEMÁS
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }

      // Si tiene perfil y está en onboarding, redirigir al dashboard
      if (profile && pathname === '/onboarding') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

    } catch (error) {
      console.error('Error checking profile:', error);
      // BLOQUEO TOTAL: En caso de error, redirigir a onboarding
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
