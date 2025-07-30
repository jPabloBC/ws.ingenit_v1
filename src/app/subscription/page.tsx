'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { getSubscription, getUsage, SUBSCRIPTION_PLANS, getPlanById } from '@/services/supabase/subscriptions';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';
import { Crown, Check, X, CreditCard, Calendar, Package, Store, Zap } from 'lucide-react';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  useEffect(() => {
    loadSubscriptionData();
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const [subscriptionData, usageData] = await Promise.all([
        getSubscription(user.id),
        getUsage(user.id)
      ]);

      setSubscription(subscriptionData.data);
      setUsage(usageData.data);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Error al cargar la información de suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      toast.error('No puedes cambiar al plan gratuito');
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
      case 'full':
        return Crown;
      case 'quad':
      case 'triple':
      case 'double':
      case 'single':
        return Store;
      default:
        return Package;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'full':
        return 'text-yellow-500';
      case 'quad':
        return 'text-purple-500';
      case 'triple':
        return 'text-blue-500';
      case 'double':
        return 'text-green-500';
      case 'single':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Suscripción y Planes</h1>
          <p className="text-gray-600 mt-2">Elige el plan que mejor se adapte a tus necesidades</p>
        </div>

        {/* Estado actual */}
        {subscription && usage && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Tu Suscripción Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getPlanById(subscription.plan)?.name || subscription.plan.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600">Plan Actual</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{usage.current_stores}</div>
                  <div className="text-sm text-gray-600">Tiendas Usadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{usage.current_products}</div>
                  <div className="text-sm text-gray-600">Productos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{usage.total_stock}</div>
                  <div className="text-sm text-gray-600">Stock Total</div>
                </div>
              </div>
              
              {subscription.plan === 'free' && usage.is_trial_active && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Período de prueba activo
                      </p>
                      <p className="text-sm text-yellow-700">
                        Te quedan {usage.days_remaining} días de prueba gratuita
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {subscription.plan === 'free' && !usage.is_trial_active && (
                <div className="mt-4 p-4 bg-red-50 rounded-md">
                  <div className="flex items-center">
                    <X className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Período de prueba expirado
                      </p>
                      <p className="text-sm text-red-700">
                        Actualiza tu plan para continuar usando la plataforma
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const IconComponent = getPlanIcon(plan.id);
            const iconColor = getPlanColor(plan.id);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Más Popular
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
                    {plan.price > 0 && <span className="text-sm text-gray-500">/mes</span>}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tiendas:</span>
                      <span className="font-medium">
                        {plan.max_stores === -1 ? 'Ilimitadas' : plan.max_stores}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Productos:</span>
                      <span className="font-medium">
                        {plan.max_products === -1 ? 'Ilimitados' : plan.max_products}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock por producto:</span>
                      <span className="font-medium">
                        {plan.max_stock_per_product === -1 ? 'Ilimitado' : plan.max_stock_per_product}
                      </span>
                    </div>
                  </div>

                  {plan.id === subscription?.plan ? (
                    <Button
                      className="w-full bg-gray-100 text-gray-600 cursor-not-allowed"
                      disabled
                    >
                      Plan Actual
                    </Button>
                  ) : plan.id === 'free' ? (
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      className="w-full"
                      variant="outline"
                    >
                      Volver al Gratuito
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Actualizar a {plan.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Información adicional */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Información Importante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Período de Prueba</h4>
                  <p className="text-sm text-gray-600">
                    Todos los nuevos usuarios tienen 10 días de prueba gratuita con acceso completo a todas las funcionalidades.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Límites por Plan</h4>
                  <p className="text-sm text-gray-600">
                    El plan gratuito tiene límites estrictos: 1 tienda, 5 productos máximo y 3 unidades por producto. Los planes pagos eliminan estos límites.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Pagos Seguros</h4>
                  <p className="text-sm text-gray-600">
                    Utilizamos WebPay para procesar todos los pagos de forma segura. Tus datos están protegidos.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Cancelación</h4>
                  <p className="text-sm text-gray-600">
                    Puedes cancelar tu suscripción en cualquier momento desde tu panel de control.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 