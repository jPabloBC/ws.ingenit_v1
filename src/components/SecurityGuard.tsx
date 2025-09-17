'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  // Rutas exentas (no aplicar guard estricto): auth y onboarding inicial
  const exemptPrefixes = ['/login', '/register', '/register-simple'];
  const exemptExact = ['/select-business'];
  const isExempt = exemptExact.includes(pathname) || exemptPrefixes.some(p => pathname.startsWith(p));
  const router = useRouter();

  useEffect(() => {
    // Si la ruta está exenta: no bloquear visualización; solo esperamos a que Auth cargue para evitar flicker
    if (isExempt) {
      if (!loading) {
        setIsAuthorized(true);
        setIsChecking(false);
      }
      return;
    }

    const checkSecurity = async () => {
      if (loading) return; // Esperar a que termine de cargar el auth

      if (!user) {
        console.log('🚫 SecurityGuard: No hay usuario, redirigiendo a login');
        router.push('/login');
        return;
      }

      console.log('✅ SecurityGuard: Usuario autenticado:', user.email);
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkSecurity();
  }, [user?.id, loading, router, isExempt]);

  // Timeout de seguridad para evitar carga infinita
  useEffect(() => {
    if (isExempt) return; // No aplicar timeout en rutas exentas
    const timeout = setTimeout(() => {
      // Solo forzar redirect si terminó loading y sigue sin user autorizado
      if (!loading && (isChecking || !user)) {
        console.log('🚫 SecurityGuard: Timeout de carga (sin user), redirigiendo a login');
        router.push('/login');
      }
    }, 12000); // Aumentamos a 12s para dar margen tras login/redirect

    return () => clearTimeout(timeout);
  }, [loading, isChecking, user, router, isExempt]);

  if (!isExempt && (loading || isChecking)) {
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

  if (!isExempt && !isAuthorized) {
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
