'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, CheckCircle, CreditCard, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subscriptionService, subscriptionUtils } from '@/services/supabase/subscriptions';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface SubscriptionPanelProps {
  className?: string;
}

export default function SubscriptionPanel({ className = '' }: SubscriptionPanelProps) {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [userLimits, setUserLimits] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos de suscripción
      const subscriptionData = await subscriptionService.getCurrentSubscription(user!.id);

      setCurrentPlan(subscriptionData);
      // TODO: Implement getAvailablePlans
      setAvailablePlans([]);
      // TODO: Implement getUserLimits
      setUserLimits(null);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Error al cargar datos de suscripción');
    } finally {
      setLoading(false);
    }
  };





















  const handlePlanChange = async (planId: number) => {
    try {
      toast.loading('Procesando cambio de plan...');
      
      // Crear nueva suscripción
      const newSubscription = await subscriptionService.createSubscription(
        user!.id,
        planId
      );

      if (newSubscription) {
        toast.success('Plan actualizado correctamente');
        await loadSubscriptionData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Error al cambiar el plan');
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Plan Actual */}
      <Card className="border-blue8 bg-blue15">
        <CardHeader>
          <CardTitle className="flex items-center text-blue1">
            <Crown className="h-5 w-5 mr-2 text-blue8" />
            Plan Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-blue1">{currentPlan.plan_name}</h3>
                  <p className="text-gray2">
                    {subscriptionUtils.formatPrice(currentPlan.plan_price)} / {currentPlan.billing_cycle === 'annual' ? 'año' : 'mes'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    currentPlan.subscription_status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {currentPlan.subscription_status === 'active' ? 'Activo' : 'Pendiente'}
                  </span>
                </div>
              </div>

              {/* Límites de uso */}
              {userLimits && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue1 mb-2">Productos</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-gray2">
                        {userLimits.current_products} / {userLimits.max_products || '∞'}
                      </span>
                      {!userLimits.can_add_product && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white/50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue1 mb-2">Stock Total</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-gray2">
                        {userLimits.current_stock_total} / {userLimits.max_stock_per_product || '∞'}
                      </span>
                      {!userLimits.can_add_stock && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Próximo pago */}
              {currentPlan.next_billing_date && (
                <div className="flex items-center text-gray2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Próximo pago: {new Date(currentPlan.next_billing_date).toLocaleDateString('es-CL')}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray2">No tienes un plan activo</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planes Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue1">Planes Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 rounded-lg border-2 ${
                  plan.id === currentPlan?.plan_id
                    ? 'border-blue8 bg-blue15'
                    : 'border-gray8 bg-white hover:border-blue8 transition-colors'
                }`}
              >
                {/* Badge para plan popular */}
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue8 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Más Popular
                    </span>
                  </div>
                )}

                {/* Badge para descuento */}
                {plan.discount_percentage > 0 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {plan.discount_percentage}% Descuento
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-blue1 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-blue1">
                    {subscriptionUtils.formatPrice(plan.price)}
                  </div>
                  <p className="text-gray2 text-sm">
                    / {plan.billing_cycle === 'annual' ? 'año' : 'mes'}
                  </p>
                </div>

                {/* Características */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-gray2">
                      <CheckCircle className="h-4 w-4 text-blue8 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Límites */}
                {subscriptionUtils.hasLimits(plan) && (
                  <div className="mb-6 p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold text-gray2 text-sm mb-2">Límites:</h4>
                    <p className="text-xs text-gray2">{subscriptionUtils.getLimitsDescription(plan)}</p>
                  </div>
                )}

                {/* Botón de acción */}
                <button
                  onClick={() => handlePlanChange(plan.id)}
                  disabled={plan.id === currentPlan?.plan_id}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    plan.id === currentPlan?.plan_id
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : plan.is_popular
                      ? 'bg-blue8 text-white hover:bg-blue6'
                      : 'bg-blue15 text-blue8 hover:bg-blue8 hover:text-white'
                  }`}
                >
                  {plan.id === currentPlan?.plan_id ? 'Plan Actual' : 'Elegir Plan'}
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Información de Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-blue1">
            <CreditCard className="h-5 w-5 mr-2 text-blue8" />
            Información de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue15 rounded-lg p-4">
              <h4 className="font-semibold text-blue1 mb-2">Métodos de Pago Aceptados</h4>
              <div className="flex items-center space-x-4 text-sm text-gray2">
                <span>• Tarjetas de crédito/débito</span>
                <span>• WebPay</span>
                <span>• Transferencia bancaria</span>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Información Importante</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Los cambios de plan se aplican inmediatamente</li>
                <li>• Puedes cancelar tu suscripción en cualquier momento</li>
                <li>• El plan gratuito no tiene límite de tiempo</li>
                <li>• El descuento anual se aplica automáticamente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 