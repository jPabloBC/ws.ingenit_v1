'use client';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { StoreProvider } from '@/contexts/StoreContext';

interface ConditionalProvidersProps {
  children: React.ReactNode;
}

export default function ConditionalProviders({ children }: ConditionalProvidersProps) {
  const pathname = usePathname();
  
  // Clasificación de rutas
  const purePublicPages = ['/', '/plans']; // Ningún provider
  const authPages = ['/login', '/register', '/register-simple']; // Solo AuthProvider
  const onboardingPages = ['/select-business']; // Necesita Auth (usuario ya logueado) pero no store/admin aún

  const isPurePublic = purePublicPages.includes(pathname);
  const isAuthPage = authPages.some(p => pathname.startsWith(p));
  const isOnboarding = onboardingPages.includes(pathname);

  // 1. Páginas totalmente públicas (sin AuthContext)
  if (isPurePublic) return <>{children}</>;

  // 2. Páginas de autenticación: necesitan AuthProvider para usar useAuth pero no Store/Admin
  if (isAuthPage) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  // 3. Onboarding (select-business): requiere Auth (usuario autenticado) pero no carga store todavía
  if (isOnboarding) {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  }

  // 4. Resto de páginas privadas (dashboard, etc.)
  return (
    <AuthProvider>
      <StoreProvider>
        {children}
      </StoreProvider>
    </AuthProvider>
  );
}
