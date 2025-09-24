'use client';
import { usePathname } from 'next/navigation';
import SecurityGuard from '@/components/SecurityGuard';
import ConnectivityChecker from '@/components/ConnectivityChecker';
import ConnectionManager from '@/components/ConnectionManager';
import { ProductsProvider } from '@/contexts/ProductsContext';
import { CategoriesProvider } from '@/contexts/CategoriesContext';
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
      <ConnectivityChecker>
        <ConnectionManager>
          <ProductsProvider>
            <CategoriesProvider>
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
            </CategoriesProvider>
          </ProductsProvider>
        </ConnectionManager>
      </ConnectivityChecker>
    </SecurityGuard>
  );
}
