'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Crown, Zap, Star, AlertTriangle, Info } from 'lucide-react';
import Button from '@/components/ui/Button';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  maxStores: number;
  maxProducts: number;
  maxStockPerProduct: number;
  features: string[];
  limitations: string[];
  color: string;
  popular?: boolean;
  recommended?: boolean;
}

export default function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const router = useRouter();

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "free",
      name: "Plan Gratuito",
      price: "Gratis",
      maxStores: 1,
      maxProducts: 5,
      maxStockPerProduct: 3,
      features: [
        "1 tipo de negocio",
        "Máximo 5 productos",
        "Máximo 3 unidades por producto",
        "10 días de prueba",
        "Soporte básico por email",
        "Reportes básicos"
      ],
      limitations: [
        "Solo 1 tipo de negocio",
        "Máximo 5 productos",
        "Máximo 3 unidades por producto",
        "Sin integración con WebPay",
        "Sin reportes avanzados"
      ],
      color: "gray"
    },
    {
      id: "single",
      name: "Single Store",
      price: "$10.000/mes",
      maxStores: 1,
      maxProducts: -1, // Ilimitado
      maxStockPerProduct: -1, // Ilimitado
      features: [
        "1 tipo de negocio",
        "Productos ilimitados",
        "Stock ilimitado",
        "Soporte prioritario",
        "Reportes avanzados",
        "Integración con WebPay",
        "Backup automático"
      ],
      limitations: [
        "Solo 1 tipo de negocio"
      ],
      color: "blue"
    },
    {
      id: "double",
      name: "Double Store",
      price: "$15.000/mes",
      maxStores: 2,
      maxProducts: -1,
      maxStockPerProduct: -1,
      features: [
        "2 tipos de negocio",
        "Productos ilimitados",
        "Stock ilimitado",
        "Soporte prioritario",
        "Reportes avanzados",
        "Integración con WebPay",
        "Backup automático",
        "Análisis de ventas"
      ],
      limitations: [
        "Máximo 2 tipos de negocio"
      ],
      color: "green"
    },
    {
      id: "triple",
      name: "Triple Store",
      price: "$18.000/mes",
      maxStores: 3,
      maxProducts: -1,
      maxStockPerProduct: -1,
      features: [
        "3 tipos de negocio",
        "Productos ilimitados",
        "Stock ilimitado",
        "Soporte prioritario",
        "Reportes avanzados",
        "Integración con WebPay",
        "Backup automático",
        "Análisis de ventas",
        "Predicciones de stock"
      ],
      limitations: [
        "Máximo 3 tipos de negocio"
      ],
      color: "purple"
    },
    {
      id: "quad",
      name: "Quad Store",
      price: "$22.000/mes",
      maxStores: 4,
      maxProducts: -1,
      maxStockPerProduct: -1,
      features: [
        "4 tipos de negocio",
        "Productos ilimitados",
        "Stock ilimitado",
        "Soporte prioritario",
        "Reportes avanzados",
        "Integración con WebPay",
        "Backup automático",
        "Análisis de ventas",
        "Predicciones de stock",
        "Dashboard personalizado"
      ],
      limitations: [
        "Máximo 4 tipos de negocio"
      ],
      color: "orange"
    },
    {
      id: "full",
      name: "Full Access",
      price: "$25.000/mes",
      maxStores: -1, // Ilimitado
      maxProducts: -1,
      maxStockPerProduct: -1,
      features: [
        "Tipos de negocio ilimitados",
        "Productos ilimitados",
        "Stock ilimitado",
        "Soporte VIP 24/7",
        "Reportes avanzados",
        "Integración con WebPay",
        "Backup automático",
        "Análisis de ventas",
        "Predicciones de stock",
        "Dashboard personalizado",
        "API personalizada",
        "White-label disponible"
      ],
      limitations: [],
      color: "red",
      popular: true,
      recommended: true
    }
  ];

  const getPlanColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "border-blue-200 bg-blue-50";
      case "orange":
        return "border-orange-200 bg-orange-50";
      case "green":
        return "border-green-200 bg-green-50";
      case "purple":
        return "border-purple-200 bg-purple-50";
      case "red":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleUpgrade = () => {
    if (selectedPlan === 'free') {
      router.push('/register');
    } else {
      // Aquí iría la lógica para actualizar a un plan de pago
      router.push('/subscription');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planes de Suscripción
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Elige el plan que mejor se adapte a tu negocio. Todos los planes incluyen soporte técnico y actualizaciones automáticas.
          </p>
        </div>

        {/* Información General */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Info className="h-5 w-5 mr-2" />
              Información Importante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Plan Gratuito</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 10 días de prueba gratuita</li>
                  <li>• 1 tipo de negocio</li>
                  <li>• Máximo 5 productos</li>
                  <li>• Máximo 3 unidades por producto</li>
                  <li>• Soporte básico por email</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Planes de Pago</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Productos y stock ilimitados</li>
                  <li>• Múltiples tipos de negocio</li>
                  <li>• Integración con WebPay</li>
                  <li>• Reportes avanzados</li>
                  <li>• Soporte prioritario</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`${getPlanColorClasses(plan.color)} transition-all duration-300 hover:scale-105 ${
                selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''
              } ${plan.popular ? 'ring-2 ring-yellow-400' : ''}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {plan.popular && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Crown className="h-3 w-3 mr-1" />
                        Popular
                      </span>
                    )}
                    {plan.recommended && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Star className="h-3 w-3 mr-1" />
                        Recomendado
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {plan.price}
                </div>
                {plan.id === 'free' && (
                  <p className="text-sm text-gray-600">
                    Incluye 10 días de prueba
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Características */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Características</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitaciones */}
                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Limitaciones</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Botón de acción */}
                <div className="pt-4">
                  <Button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full ${
                      selectedPlan === plan.id 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    } text-white`}
                  >
                    {selectedPlan === plan.id ? 'Seleccionado' : 'Seleccionar Plan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Acción */}
        {selectedPlan && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Zap className="h-5 w-5 mr-2" />
                Plan Seleccionado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800">
                    Has seleccionado el <strong>{subscriptionPlans.find(p => p.id === selectedPlan)?.name}</strong>
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {selectedPlan === 'free' 
                      ? 'Crea tu cuenta gratuita para comenzar'
                      : 'Actualiza tu suscripción para acceder a todas las funcionalidades'
                    }
                  </p>
                </div>
                <Button
                  onClick={handleUpgrade}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {selectedPlan === 'free' ? 'Crear Cuenta Gratuita' : 'Actualizar Suscripción'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900">¿Puedo cambiar de plan en cualquier momento?</h4>
              <p className="text-sm text-gray-600">
                Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu dashboard.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">¿Qué pasa si excedo los límites del plan gratuito?</h4>
              <p className="text-sm text-gray-600">
                El sistema te notificará cuando te acerques a los límites y te sugerirá actualizar a un plan de pago.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">¿Incluye soporte técnico?</h4>
              <p className="text-sm text-gray-600">
                Todos los planes incluyen soporte técnico. Los planes de pago incluyen soporte prioritario.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">¿Puedo cancelar en cualquier momento?</h4>
              <p className="text-sm text-gray-600">
                Sí, puedes cancelar tu suscripción en cualquier momento sin penalización.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            ¿Necesitas ayuda para elegir el plan correcto?
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => router.push('/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Crear Cuenta Gratuita
            </Button>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
            >
              Ya tengo cuenta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 