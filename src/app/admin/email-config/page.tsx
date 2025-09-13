'use client';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { Check, CheckCircle, RefreshCw, Send, X, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EmailConfigPage() {
  // Removido: variable no usada
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkEmailConfiguration();
    }
  }, [user]);

  const checkEmailConfiguration = async () => {
    setLoading(true);
    try {
      // Verificar configuración de auth
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        setEmailStatus({
          status: 'error',
          message: 'Error al verificar autenticación: ' + authError.message
        });
        return;
      }

      // Verificar si hay usuarios con email no verificado
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        setEmailStatus({
          status: 'warning',
          message: 'No se pudo verificar usuarios: ' + usersError.message
        });
        return;
      }

      const unverifiedUsers = users.users.filter(u => !u.email_confirmed_at);
      
      setEmailStatus({
        status: 'success',
        message: `Configuración verificada. ${unverifiedUsers.length} usuarios sin verificar.`,
        unverifiedCount: unverifiedUsers.length,
        totalUsers: users.users.length
      });

    } catch (error) {
      console.error('Error checking email config:', error);
      setEmailStatus({
        status: 'error',
        message: 'Error al verificar configuración: ' + (error as any).message
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Por favor ingresa un correo de prueba');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail
      });

      if (error) {
        toast.error('Error al enviar correo de prueba: ' + error.message);
      } else {
        toast.success('Correo de prueba enviado exitosamente');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Error al enviar correo de prueba');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (emailStatus?.status) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <XCircle className="h-6 w-6 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <RefreshCw className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (emailStatus?.status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuración de Email
          </h1>
          <p className="text-gray-600">
            Verifica y configura el envío de correos de verificación
          </p>
        </div>

        {/* Estado de la configuración */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Estado de la Configuración
            </h2>
            <button
              onClick={checkEmailConfiguration}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verificar
            </button>
          </div>

          {emailStatus && (
            <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
              <div className="flex items-center">
                {getStatusIcon()}
                <div className="ml-3">
                  <p className="font-medium">{emailStatus.message}</p>
                  {emailStatus.unverifiedCount !== undefined && (
                    <p className="text-sm mt-1">
                      Usuarios sin verificar: {emailStatus.unverifiedCount} / {emailStatus.totalUsers}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Envío de correo de prueba */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Enviar Correo de Prueba
          </h2>
          
          <div className="flex gap-4">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={sendTestEmail}
              disabled={loading || !testEmail}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Prueba
            </button>
          </div>
        </div>

        {/* Instrucciones de configuración */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Instrucciones de Configuración
          </h3>
          
          <div className="space-y-4 text-blue-800">
            <div>
              <h4 className="font-medium mb-2">1. Verificar configuración en Supabase:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Ve a Authentication → Settings en tu panel de Supabase</li>
                <li>Verifica que "Enable email confirmations" esté activado</li>
                <li>Revisa la URL del sitio en "Site URL"</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Configurar SMTP personalizado (recomendado):</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Ve a Authentication → Settings → SMTP Settings</li>
                <li>Configura un proveedor SMTP (Gmail, SendGrid, etc.)</li>
                <li>Esto evita limitaciones del servicio por defecto</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Verificar plantillas de email:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Ve a Authentication → Email Templates</li>
                <li>Verifica que la plantilla de confirmación esté configurada</li>
                <li>El enlace debe apuntar a tu dominio + /auth/callback</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Para desarrollo local:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Usa ngrok para exponer localhost</li>
                <li>Configura la URL en Supabase como: https://tu-dominio.ngrok.io</li>
                <li>Actualiza la URL de callback en las plantillas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
