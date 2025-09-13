'use client';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { StoreProvider } from '@/contexts/StoreContext';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';

interface ConditionalProvidersProps {
  children: React.ReactNode;
}

export default function ConditionalProviders({ children }: ConditionalProvidersProps) {
  const pathname = usePathname();
  
  // Páginas que NO necesitan providers (páginas públicas)
  const publicPages = ['/', '/plans', '/auth/callback'];
  
  const isPublicPage = publicPages.includes(pathname);
  
  if (isPublicPage) {
    // Para páginas públicas, solo renderizar los children sin providers
    return <>{children}</>;
  }
  
  // Para páginas privadas, usar todos los providers
  return (
    <AuthProvider>
      <StoreProvider>
        <AdminRouteGuard>
          {children}
        </AdminRouteGuard>
      </StoreProvider>
    </AuthProvider>
  );
}
