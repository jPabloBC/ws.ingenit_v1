'use client';
import { useEffect } from 'react';
import { History, CreditCard, Settings, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import SubscriptionPanel from '@/components/subscription/SubscriptionPanel';
export default function SubscriptionSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuración de Suscripción
          </h1>
          <p className="text-gray-600">
            Gestiona tu plan de suscripción y métodos de pago
          </p>
        </div>

        {/* Panel de Suscripción */}
        <SubscriptionPanel />

        {/* Información Adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Historial de Pagos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <History className="h-5 w-5 mr-2 text-blue-600" />
                Historial de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No hay pagos registrados</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Los pagos aparecerán aquí una vez que realices tu primera transacción
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Soporte y Ayuda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Soporte y Ayuda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">¿Necesitas ayuda?</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Nuestro equipo de soporte está disponible para ayudarte con cualquier pregunta sobre tu suscripción.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      <span>Email: soporte@ingenit.cl</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      <span>WhatsApp: +56 9 3757 0007</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      <span>Horario: Lunes a Viernes 9:00 - 18:00</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Información Importante</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Los cambios de plan son inmediatos</li>
                        <li>• Puedes cancelar en cualquier momento</li>
                        <li>• No hay penalizaciones por cancelación</li>
                        <li>• Facturación automática mensual/anual</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  ¿Cómo funciona el plan gratuito?
                </h4>
                <p className="text-gray-600 text-sm">
                  El plan gratuito te permite usar la plataforma sin límite de tiempo, pero con restricciones: 
                  máximo 5 productos y 5 unidades de stock por producto. Es perfecto para empezar y probar la plataforma.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  ¿Puedo cambiar de plan en cualquier momento?
                </h4>
                <p className="text-gray-600 text-sm">
                  Sí, puedes cambiar tu plan en cualquier momento desde esta página. Los cambios se aplican inmediatamente 
                  y se factura proporcionalmente según el tiempo restante de tu plan actual.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  ¿Qué métodos de pago aceptan?
                </h4>
                <p className="text-gray-600 text-sm">
                  Aceptamos tarjetas de crédito/débito, WebPay y transferencias bancarias. Todos los pagos se procesan 
                  de forma segura y recibirás una factura por email.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  ¿Hay descuentos disponibles?
                </h4>
                <p className="text-gray-600 text-sm">
                  Sí, ofrecemos un 20% de descuento en el plan anual. Esto significa que pagas $144.000 en lugar de 
                  $180.000, ahorrando $36.000 al año.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  ¿Puedo cancelar mi suscripción?
                </h4>
                <p className="text-gray-600 text-sm">
                  Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de administración. 
                  No hay penalizaciones y mantendrás acceso hasta el final del período facturado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 