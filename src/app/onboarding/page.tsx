'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
// Removido: import no usado
;;
import { useRouter } from 'next/navigation';
// Removido: supabase no usado
import { supabaseAdmin } from '@/services/supabase/admin';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
// Imports de iconos removidos ya que no se usan en esta pantalla
import toast from 'react-hot-toast';
import SecurityGuard from '@/components/SecurityGuard';

// Removido: Los planes de suscripción se manejan en una pantalla separada

const storeTypes = [
  { id: 'retail', name: 'Retail/Tienda', description: 'Venta de productos físicos' },
  { id: 'restaurant', name: 'Restaurante', description: 'Servicio de comida y bebidas' },
  { id: 'services', name: 'Servicios', description: 'Prestación de servicios profesionales' },
  { id: 'ecommerce', name: 'E-commerce', description: 'Venta online de productos' },
  { id: 'other', name: 'Otro', description: 'Otro tipo de negocio' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedStoreTypes, setSelectedStoreTypes] = useState<string[]>([]);
  // Removido: variable no usada
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

  const handleStoreTypeToggle = (storeTypeId: string) => {
    setSelectedStoreTypes(prev => 
      prev.includes(storeTypeId) 
        ? prev.filter(id => id !== storeTypeId)
        : [...prev, storeTypeId]
    );
  };

  const handleCompleteOnboarding = async () => {
    if (selectedStoreTypes.length === 0) {
      toast.error('Debes seleccionar al menos un tipo de negocio');
      return;
    }

    setLoading(true);

    try {
      // Crear perfil con plan gratuito por defecto
      const { createMissingProfile } = await import('@/utils/createMissingProfile');
      
      const result = await createMissingProfile(
        user!.id,
        user!.email!,
        user!.user_metadata?.name || user!.email?.split('@')[0] || 'Usuario',
        {
          store_types: selectedStoreTypes,
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
    <SecurityGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                ¡Bienvenido a Ingenit!
              </h1>
              <p className="text-xl text-gray-600">
                Cuéntanos sobre tu negocio para personalizar tu experiencia
              </p>
            </div>

          {/* Store Type Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              ¿Qué tipo de negocio tienes?
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Puedes seleccionar múltiples opciones
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeTypes.map((storeType) => (
                <Card
                  key={storeType.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedStoreTypes.includes(storeType.id)
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleStoreTypeToggle(storeType.id)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{storeType.name}</h3>
                    <p className="text-gray-600 text-sm">{storeType.description}</p>
                    {selectedStoreTypes.includes(storeType.id) && (
                      <div className="mt-2 text-blue-600 font-semibold text-sm">
                        ✓ Seleccionado
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Complete Button */}
          <div className="text-center">
            <Button               onClick={handleCompleteOnboarding}
              disabled={loading || selectedStoreTypes.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg disabled:opacity-50"
            >
              {loading ? 'Configurando...' : 'Continuar con Plan Gratuito'}
            </Button>
          </div>
        </div>
      </div>
    </div>
    </SecurityGuard>
  );
}
