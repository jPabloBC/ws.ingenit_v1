'use client';
import { useState, useEffect } from 'react';
import { Calendar, Check, Crown, Package, X, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService} from '@/services/supabase/subscriptions';
import toast from 'react-hot-toast';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();
  // Removido: loading no usado
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadSubscriptionData();
  }, [user, router]);

  const loadSubscriptionData = async () => {
    // Implementar carga de datos de suscripción
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };























  // Removido: handlePlanSelect no usado

  const handleUpgrade = async (planId: string) => {
    // Si es el plan gratuito, no permitir pago
    if (planId === 'free' || planId === '1') { // Asumiendo que el plan gratuito tiene ID 1
      toast.error('No puedes cambiar al plan gratuito');
      return;
    }

    // Si ya tienes este plan, no hacer nada
    if (subscription?.plan_id === parseInt(planId)) {
      toast('Ya tienes este plan activo');
      return;
    }

    try {
      // TODO: Implementar integración con WebPay
      console.log('Iniciando pago para plan:', planId);
      
      // Simular proceso de pago
      toast.success('Redirigiendo a WebPay...');
      
      // Aquí iría la integración real con WebPay
      // const webpayUrl = await initiateWebPayPayment(planId);
      // window.location.href = webpayUrl;
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar el pago');
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'annual':
        return Crown;
      case 'monthly':
        return Store;
      default:
        return Package;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'annual':
        return 'text-yellow-500';
      case 'monthly':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Suscripción y Planes</h1>
          <p className="text-gray-600 mt-2">
            {subscription?.plan_name === 'Plan Gratuito' 
              ? 'Actualiza tu plan para acceder a más funcionalidades y aumentar los límites'
              : 'Gestiona tu suscripción actual y explora otros planes disponibles'
            }
          </p>
        </div>

        {/* Estado actual */}
        {subscription && usage ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-blue-600" />
                Tu Plan Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {subscription.plan_name || 'Plan Gratuito'}
                  </div>
                  <div className="text-sm text-gray-600">Plan Actual</div>
                  {subscription.billing_cycle && (
                    <div className="text-xs text-gray-500 mt-1">
                      {subscription.billing_cycle === 'annual' ? 'Facturación anual' : 'Facturación mensual'}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {usage.current_products || 0}
                  </div>
                  <div className="text-sm text-gray-600">Productos</div>
                  {usage.max_products && (
                    <div className="text-xs text-gray-500 mt-1">
                      Máximo: {usage.max_products}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {usage.current_stock_total || 0}
                  </div>
                  <div className="text-sm text-gray-600">Stock Total</div>
                  {usage.max_stock_per_product && (
                    <div className="text-xs text-gray-500 mt-1">
                      Máx. por producto: {usage.max_stock_per_product}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Información adicional del plan */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Características de tu plan:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Incluye:</h5>
                    <ul className="space-y-1">
                      {subscription.features?.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {subscription.limitations && subscription.limitations.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Limitaciones:</h5>
                      <ul className="space-y-1">
                        {subscription.limitations.map((limitation: string, index: number) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <X className="h-3 w-3 text-red-500 mr-2 flex-shrink-0" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mensaje especial para plan gratuito */}
              {subscription.plan_name === 'Plan Gratuito' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Plan gratuito activo
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Actualiza tu plan para acceder a más funcionalidades y aumentar los límites de productos y stock.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-blue-600" />
                Tu Plan Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Plan Gratuito</h3>
                <p className="text-gray-600 mb-4">
                  Actualmente tienes el plan gratuito activo. Actualiza tu plan para acceder a más funcionalidades.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">5</div>
                    <div className="text-sm text-gray-600">Productos máximos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">5</div>
                    <div className="text-sm text-gray-600">Stock por producto</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const IconComponent = getPlanIcon(plan.billing_cycle);
            const iconColor = getPlanColor(plan.billing_cycle);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${
                  plan.is_popular ? 'ring-2 ring-blue-500 scale-105' : ''
                } ${
                  subscription?.plan_id === plan.id ? 'ring-2 ring-green-500 bg-green-50' : ''
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Más Popular
                    </span>
                  </div>
                )}
                {subscription?.plan_id === plan.id && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      Tu Plan
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <IconComponent className={`h-12 w-12 ${iconColor}`} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Gratis' : formatCurrency(plan.price)}
                    {plan.price > 0 && <span className="text-sm text-gray-500">/{plan.billing_cycle === 'annual' ? 'año' : 'mes'}</span>}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button                     onClick={() => handleUpgrade(plan.id.toString())}
                    className={`w-full ${
                      subscription?.plan_id === plan.id 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : plan.price === 0 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : ''
                    }`}
                    disabled={subscription?.plan_id === plan.id || plan.price === 0}
                  >
                    {subscription?.plan_id === plan.id 
                      ? 'Plan Actual' 
                      : plan.price === 0 
                        ? 'Plan Gratuito' 
                        : 'Elegir Plan'
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
    </div>
  );
} 
