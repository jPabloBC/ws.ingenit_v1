import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// IMPORTANTE: No usar el cliente de Supabase del lado del middleware (Edge) porque
// está configurado para usar localStorage y en este entorno no existe, resultando
// siempre en sesión nula y redirecciones en bucle.
// Más adelante se puede migrar a cookies con @supabase/ssr si se requiere control server-side.

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const res = NextResponse.next();

  // Rutas públicas que NO requieren autenticación
  const publicRoutes = [
    '/',
    '/plans',
    '/auth/callback',
    '/api/webhook'
  ];
  
  // Rutas de autenticación permitidas
  const authRoutes = [
    '/login',
    '/register',
    '/verify-email'
  ];

  // Rutas de admin
  const adminRoutes = ['/admin'];
  
  // Rutas del cliente (requieren autenticación + verificación)
  const clientRoutes = ['/dashboard', '/calendar', '/categories', '/customers', 
    '/events', '/inventory', '/kitchen', '/menu', '/orders', '/payment', 
    '/quick-sales', '/repairs', '/reports', '/reservations', '/sales', 
    '/services', '/settings', '/stock', '/subscription', '/suppliers', 
    '/tables', '/warehouse', '/onboarding', '/select-business'];

  const isPublicRoute = publicRoutes.some(route => pathname === route);
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isClientRoute = clientRoutes.some(route => pathname.startsWith(route));

  // Si es ruta pública, permitir acceso
  if (isPublicRoute) {
    return res;
  }

  // Si es ruta de API, permitir (manejan su propia autenticación)
  if (pathname.startsWith('/api/')) {
    return res;
  }

  // =============================================
  //  MODO DEGRADADO (sin verificación server-side)
  // =============================================
  // Mientras no tengamos sesión accesible vía cookies (SSR), evitamos usar
  // Supabase en middleware para no romper el flujo de navegación.
  // El control de acceso se realizará en el cliente (AuthContext + páginas).

  // Permitir siempre rutas de auth y públicas
  if (isAuthRoute || isPublicRoute) {
    return res;
  }

  // Permitir siempre select-business y onboarding para que el cliente decida
  if (pathname === '/select-business' || pathname === '/onboarding') {
    return res;
  }

  // Para rutas de cliente/admin en este modo: simplemente continuar.
  // (Si quieres bloquear, aquí podrías redirigir a /login, pero eso causaría
  // loops sin sesión SSR. Mantener abierto hasta implementar SSR auth cookie.)
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
