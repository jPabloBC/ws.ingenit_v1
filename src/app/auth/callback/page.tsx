'use client';
import { supabase } from '@/services/supabase/client';
import { useState, useEffect } from 'react';
// Removido: import no usado
import { Check, CheckCircle, Loader2, X, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Removido: import no usado
// Removido: import no usado
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(7);
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Obtener la sesión actual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error obteniendo sesión:', error);
          setStatus('error');
          setMessage('Error de autenticación. Por favor, intenta nuevamente.');
          toast.error('Error de autenticación');
          return;
        }

        if (session?.user) {
          // Usuario autenticado - verificación exitosa
          setStatus('success');
          setMessage('¡Correo verificado exitosamente! Ya puedes acceder a tu cuenta.');
          toast.success('¡Correo verificado! Ya puedes acceder a tu cuenta.');
          
          // Iniciar contador de redirección
          const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                router.push('/dashboard');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          // No hay sesión - redirigir al login
          setStatus('error');
          setMessage('No se encontró sesión activa. Por favor, inicia sesión.');
          toast.error('Sesión no encontrada');
          
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (error) {
        console.error('Error inesperado:', error);
        setStatus('error');
        setMessage('Error inesperado. Por favor, intenta nuevamente.');
        toast.error('Error inesperado');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verificando tu cuenta...
            </h2>
            <p className="text-gray-600">
              Por favor espera mientras verificamos tu email.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Correo Verificado!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Tu correo electrónico ha sido verificado exitosamente.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                ✅ Ya puedes acceder a tu cuenta en Ingenit
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 font-medium">
                Serás redirigido al login en {countdown} segundos...
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Si no eres redirigido automáticamente, haz clic en el botón de abajo.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Ir al Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error de verificación
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/register')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Volver al registro
              </button>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Ir al login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
