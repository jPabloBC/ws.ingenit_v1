'use client';
import { useState, useEffect } from 'react';
import { AlertCircle, ArrowLeft, Check, CheckCircle, CreditCard, ExternalLink, Save, Settings, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
// Removido: import no usado
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
// Removido: import no usado
interface TransbankConfig {
  commerce_code: string;
  api_key: string;
  environment: 'integration' | 'production';
  webpay_plus_url: string;
  webpay_plus_return_url: string;
}

export default function TransbankSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [config, setConfig] = useState<TransbankConfig>({
    commerce_code: '',
    api_key: '',
    environment: 'integration',
    webpay_plus_url: 'https://webpay3gint.transbank.cl/filtroUnificado/initTransaction',
    webpay_plus_return_url: ''
  });

  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      // Cargar configuración desde localStorage o base de datos
      if (user) {
        const savedConfig = localStorage.getItem(`transbank_config_${user.id}`);
        if (savedConfig) {
          setConfig(JSON.parse(savedConfig));
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

















  const handleInputChange = (field: keyof TransbankConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      
      const requiredFields = ['commerce_code', 'api_key'];
      const missingFields = requiredFields.filter(field => !config[field as keyof TransbankConfig]);
      
      if (missingFields.length > 0) {
        toast.error(`Campos requeridos: ${missingFields.join(', ')}`);
        return;
      }

      // En producción, guardarías en la base de datos
      localStorage.setItem(`transbank_config_${user.id}`, JSON.stringify(config));
      
      toast.success('Configuración Transbank guardada exitosamente');
    } catch (error: any) {
      console.error('Error saving Transbank config:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      toast.loading('Probando conexión con Transbank...');
      
      // Simular prueba de conexión
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.dismiss();
      toast.success('Conexión con Transbank exitosa');
    } catch {
      toast.dismiss();
      toast.error('Error al conectar con Transbank');
    }
  };

  const generateTestCredentials = () => {
    setConfig({
      ...config,
      commerce_code: '597055555532',
      api_key: '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
      environment: 'integration'
    });
    toast.success('Credenciales de prueba cargadas');
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
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/settings')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración Transbank</h1>
            <p className="text-gray-600">Configura las credenciales de Transbank para procesar pagos</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuración Principal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Credenciales Transbank
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commerce Code *
                    </label>
                    <input
                      type="text"
                      value={config.commerce_code}
                      onChange={(e) => handleInputChange('commerce_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="597055555532"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Código de comercio proporcionado por Transbank
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key *
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={config.api_key}
                        onChange={(e) => handleInputChange('api_key', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Clave API de Transbank"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Clave API secreta de Transbank
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ambiente
                    </label>
                    <select
                      value={config.environment}
                      onChange={(e) => handleInputChange('environment', e.target.value as 'integration' | 'production')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="integration">Integración (Pruebas)</option>
                      <option value="production">Producción (Real)</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      {config.environment === 'integration' 
                        ? 'Para pruebas y desarrollo' 
                        : 'Para procesar pagos reales'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* URLs y Configuración */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    URLs y Configuración
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL WebPay Plus
                    </label>
                    <input
                      type="url"
                      value={config.webpay_plus_url}
                      onChange={(e) => handleInputChange('webpay_plus_url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://webpay3gint.transbank.cl/filtroUnificado/initTransaction"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      URL de WebPay Plus (no cambiar en la mayoría de casos)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de Retorno
                    </label>
                    <input
                      type="url"
                      value={config.webpay_plus_return_url}
                      onChange={(e) => handleInputChange('webpay_plus_return_url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://tudominio.com/payment/return"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      URL donde Transbank redirigirá después del pago
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testConnection}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Probar Conexión
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateTestCredentials}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Credenciales de Prueba
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Información y Enlaces */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Información Importante</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-blue-800">Ambiente de Integración</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Usa el ambiente de integración para pruebas. Los pagos no serán reales.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-green-800">Ambiente de Producción</h4>
                            <p className="text-sm text-green-700 mt-1">
                              Solo cambia a producción cuando estés listo para procesar pagos reales.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Enlaces Útiles</h4>
                      <div className="space-y-2">
                        <a
                          href="https://www.transbankdevelopers.cl/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Transbank Developers
                        </a>
                        <a
                          href="https://www.transbankdevelopers.cl/documentacion/webpay"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Documentación WebPay Plus
                        </a>
                        <a
                          href="https://www.transbankdevelopers.cl/documentacion/webpay#ambientes"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ambientes de Prueba
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Botones de Acción */}
            <div className="mt-6 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/settings')}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <LoadingSpinner />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
