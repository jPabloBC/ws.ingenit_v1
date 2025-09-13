'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageLayout from '@/components/layout/PageLayout';
import Section from '@/components/ui/Section';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
          setVerificationStatus('error');
          setMessage('Token o email no válidos');
          return;
        }

      // Verificar el token en ws_email_verifications (vista de public)
      const { data: verificationData, error: verificationError } = await supabase
        .from('ws_email_verifications')
        .select('*')
        .eq('verification_token', token)
        .eq('email', email)
        .eq('verified', false)
        .single();

        if (verificationError || !verificationData) {
          console.error('Error verificando token:', verificationError);
          setVerificationStatus('error');
          setMessage('Token inválido o expirado. Por favor, solicita un nuevo enlace de verificación.');
          return;
        }

      // Marcar como verificado en ws_email_verifications (vista de public)
      const { error: updateError } = await supabase
        .from('ws_email_verifications')
        .update({ 
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', verificationData.id);

        if (updateError) {
          console.error('Error actualizando verificación:', updateError);
          setVerificationStatus('error');
          setMessage('Error al verificar el email. Por favor, intenta nuevamente.');
          return;
        }

      // Actualizar ws_users (vista de public) para marcar email como verificado
      const { error: userUpdateError } = await supabase
        .from('ws_users')
        .update({ email_verified: true })
        .eq('user_id', verificationData.user_id);

        if (userUpdateError) {
          console.error('Error actualizando usuario:', userUpdateError);
          // No fallar aquí, la verificación principal ya está completa
        }

        setVerificationStatus('success');
        setMessage('¡Email verificado exitosamente!');
        toast.success('¡Email verificado exitosamente!');
        
        // Redirigir al login después de verificar el email
        setTimeout(() => {
          router.push('/login');
        }, 10000);
      } catch (error) {
        console.error('Error en verificación:', error);
        setVerificationStatus('error');
        setMessage('Error interno. Por favor, intenta nuevamente.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <PageLayout>
      <Section className="bg-white pt-16">
        <div className="max-w-md mx-auto text-center py-16">
          {verificationStatus === 'loading' && (
            <>
              <div className="mb-6">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Verificando tu email...
              </h1>
              <p className="text-gray-600">
                Por favor espera mientras verificamos tu cuenta.
              </p>
            </>
          )}

          {verificationStatus === 'success' && (
            <>
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Email Verificado!
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Redirigiendo al registro...
              </p>
            </>
          )}

          {verificationStatus === 'error' && (
            <>
              <div className="mb-6">
                <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Error de Verificación
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/register')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Volver al Registro
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Ir al Login
                </button>
              </div>
            </>
          )}
        </div>
      </Section>
    </PageLayout>
  );
}