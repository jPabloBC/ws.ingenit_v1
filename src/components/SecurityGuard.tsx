'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, X, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseAdmin } from '@/services/supabase/admin';
import { supabase } from '@/services/supabase/client';
import toast from 'react-hot-toast';

interface SecurityGuardProps {
  children: React.ReactNode;
}

export default function SecurityGuard({ children }: SecurityGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkSecurity = async () => {
      if (loading) return; // Esperar a que termine de cargar el auth

      // Si no hay usuario, redirigir al login
      if (!user) {
        router.push('/login');
        return;
      }

      // Verificar que el email esté confirmado
      if (!user.email_confirmed_at) {
        console.log('🚫 SecurityGuard: Usuario no verificado bloqueado:', user.email);
        toast.error('Debes verificar tu email antes de continuar');
        // Cerrar sesión inmediatamente para forzar re-verificación
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      // Verificar que exista el perfil en ws_users
      try {
      const { data: profile, error: profileError } = await supabaseAdmin
          .from('ws_users')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError || !profile) {
          console.log('Perfil no encontrado. Redirigiendo al onboarding...');
          router.push('/onboarding');
          return;
        }

        // Todo está bien
        setIsAuthorized(true);
        setIsChecking(false);
      } catch (error) {
        console.error('Error verificando perfil:', error);
        setError('Error verificando tu cuenta');
        setIsChecking(false);
      }
    };

    checkSecurity();
  }, [user, loading, router]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verificando seguridad...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras verificamos tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error de Verificación
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Reintentar
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Ir al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso No Autorizado
          </h2>
          <p className="text-gray-600 mb-4">
            Tu cuenta no cumple con los requisitos de seguridad.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
