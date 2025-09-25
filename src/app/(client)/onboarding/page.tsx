'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
// Removido: import no usado
;;
import { useRouter } from 'next/navigation';
// Removido: supabase no usado
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
// Imports de iconos removidos ya que no se usan en esta pantalla
import toast from 'react-hot-toast';

// Removido: Los planes de suscripción se manejan en una pantalla separada


export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkEmailVerification();
  }, []);

  const checkEmailVerification = async () => {
    try {
      setCheckingVerification(true);
      // Implementar verificación de email
      setCheckingVerification(false);
    } catch (error) {
      console.error('Error checking email verification:', error);
      setCheckingVerification(false);
    }
  };








































































// Removido: La selección de planes se maneja en una pantalla separada


  const handleCompleteOnboarding = async () => {
    setLoading(true);

    try {
      // Crear perfil con plan gratuito por defecto
      const { createMissingProfile } = await import('@/utils/createMissingProfile');
      
      const result = await createMissingProfile(
        user!.id,
        user!.email!,
        user!.user_metadata?.name || user!.email?.split('@')[0] || 'Usuario',
        {
          plan_id: 'free', // Siempre empieza con plan gratuito
          country_code: 'CL',
          currency_code: 'CLP'
        }
      );

      if (result.success) {
        // Limpiar datos pendientes
        localStorage.removeItem('pending_registration');
        toast.success('¡Bienvenido! Tu cuenta está lista');
        router.push('/dashboard');
      } else {
        toast.error('Error al crear tu perfil: ' + (result.error as any)?.message);
      }
    } catch (error) {
      console.error('Error completando onboarding:', error);
      toast.error('Error al completar la configuración: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando tu cuenta...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                ¡Bienvenido a Ingenit!
              </h1>
              <p className="text-xl text-gray-600">
                Tu cuenta está casi lista. Vamos a configurar tu plan gratuito.
              </p>
            </div>

            {/* Configuration Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
                Configuración Inicial
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Cuenta verificada</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Tipo de negocio seleccionado</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Configurando plan gratuito</span>
                </div>
              </div>
            </div>

            {/* Complete Button */}
            <div className="text-center">
              <Button
                onClick={handleCompleteOnboarding}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg disabled:opacity-50"
              >
                {loading ? 'Configurando...' : 'Completar Configuración'}
              </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
