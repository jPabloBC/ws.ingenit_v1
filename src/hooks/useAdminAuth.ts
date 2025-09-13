import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase/client';
interface UseAdminAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export function useAdminAuth(options: UseAdminAuthOptions = {}) {
  const { redirectTo = '/dashboard', requireAuth = true, requireAdmin = true } = options;
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return;

      // Si no requiere autenticación, autorizar
      if (!requireAuth) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // Verificar si hay usuario
      if (!user) {
        setIsAuthorized(false);
        setIsLoading(false);
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      // Si requiere admin, verificar rol
      if (requireAdmin) {
        if (!['admin', 'dev'].includes(userRole || '')) {
          setIsAuthorized(false);
          setIsLoading(false);
          router.push(redirectTo);
          return;
        }
      }

      // Verificación adicional en el servidor
      try {
        const { data: profile, error } = await supabase
          .from('ws_users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error || !profile) {
          setIsAuthorized(false);
          setIsLoading(false);
          router.push(redirectTo);
          return;
        }

        if (requireAdmin && !['admin', 'dev'].includes(profile.role)) {
          setIsAuthorized(false);
          setIsLoading(false);
          router.push(redirectTo);
          return;
        }

        setIsAuthorized(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error verifying admin auth:', error);
        setIsAuthorized(false);
        setIsLoading(false);
        router.push(redirectTo);
      }
    };

    checkAuth();
  }, [user, userRole, loading, requireAuth, requireAdmin, redirectTo, router]);

  return {
    isAuthorized,
    isLoading: loading || isLoading,
    user,
    userRole,
    isAdmin: ['admin', 'dev'].includes(userRole || '')
  };
}
