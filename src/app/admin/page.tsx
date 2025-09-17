'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { supabase } from '@/services/supabase/client';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Verificar rol directamente
      const checkRole = async () => {
        try {
          const { data: profile } = await supabase
            .from('ws_users')
            .select('role')
            .eq('user_id', user.id)
            .single();

          console.log('Profile found:', profile);

          if (profile && ['dev', 'admin'].includes(profile.role)) {
            console.log('User is dev/admin, going to admin dashboard');
            router.push('/admin/dashboard');
          } else {
            console.log('User is not dev/admin, going to customer dashboard');
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error checking role:', error);
          router.push('/dashboard');
        }
      };

      checkRole();
    } else {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Verificando acceso...</p>
      </div>
    </div>
  );
} 