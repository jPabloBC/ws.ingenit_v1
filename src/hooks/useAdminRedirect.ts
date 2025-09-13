import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminRedirect = () => {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && (userRole === 'dev' || userRole === 'admin')) {
      const currentPath = window.location.pathname;
      
      // Rutas que deben redirigir al admin
      const userRoutes = [
        '/',
        '/dashboard',
        '/inventory',
        '/sales',
        '/customers',
        '/categories',
        '/stock',
        '/warehouse',
        '/quick-sales',
        '/tables',
        '/menu',
        '/orders',
        '/kitchen',
        '/subscription',
        '/settings',
        '/plans',
        '/select-store'
      ];

      // Verificar si está en una ruta de usuario normal
      const shouldRedirect = userRoutes.some(route => 
        currentPath === route || currentPath.startsWith(route + '/')
      );

      if (shouldRedirect && !currentPath.startsWith('/admin')) {
        console.log(`Redirigiendo usuario ${userRole} de ${currentPath} a /admin/dashboard`);
        router.push("/admin/dashboard");
      }
    }
  }, [user, loading, userRole, router]);

  return { shouldRedirect: !loading && user && (userRole === 'dev' || userRole === 'admin') };
};

