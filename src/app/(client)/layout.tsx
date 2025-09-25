'use client';
import { usePathname } from 'next/navigation';
import SecurityGuard from '@/components/SecurityGuard';
import Layout from '@/components/layout/Layout';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Rutas que NO necesitan el layout completo (solo protección básica)
  const minimalLayoutRoutes = ['/onboarding', '/select-business'];
  const needsMinimalLayout = minimalLayoutRoutes.some(route => pathname.startsWith(route));

  return (
    <SecurityGuard>
      {needsMinimalLayout ? (
        // Layout mínimo para onboarding
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      ) : (
        // Layout completo para todas las demás rutas del cliente
        <Layout>
          {children}
        </Layout>
      )}
    </SecurityGuard>
  );
}
