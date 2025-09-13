import { supabaseAdmin } from '@/services/supabase/admin';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface VerifyEmailPageProps {
  searchParams: Promise<{
    token?: string;
    email?: string;
  }>;
}

interface VerificationResult {
  status: 'success' | 'error' | 'expired' | 'already_verified';
  message: string;
  email?: string;
  hasBusiness?: boolean;
}

async function verifyEmailToken(token: string, email: string): Promise<VerificationResult> {
  try {
    // Verificar que el token existe en ws_email_verifications
    const { data: verificationData, error: verificationError } = await supabaseAdmin
      .from('ws_email_verifications')
      .select('*')
      .eq('verification_token', token)
      .eq('email', email)
      .single();

    if (verificationError || !verificationData) {
      return {
        status: 'error',
        message: 'Token inválido o no encontrado'
      };
    }

    // Verificar si ya está verificado
    if (verificationData.verified) {
      // Verificar si ya tiene negocio seleccionado
      const { data: userData } = await supabaseAdmin
        .from('ws_users')
        .select('store_types, email_verified')
        .eq('email', email)
        .single();

      return {
        status: 'already_verified',
        message: 'Tu email ya estaba verificado',
        email,
        hasBusiness: userData?.store_types && userData.store_types.length > 0
      };
    }

    // Verificar si el token ha expirado (24 horas)
    const tokenAge = Date.now() - new Date(verificationData.created_at).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

    if (tokenAge > maxAge) {
      return {
        status: 'expired',
        message: 'El enlace de verificación ha expirado. Solicita uno nuevo.'
      };
    }

    // Actualizar email_verified en ws_users
    const { error: updateError } = await supabaseAdmin
      .from('ws_users')
      .update({ email_verified: true })
      .eq('email', email);

    if (updateError) {
      return {
        status: 'error',
        message: 'Error al verificar el email. Intenta nuevamente.'
      };
    }

    // Marcar verificación como completada
    await supabaseAdmin
      .from('ws_email_verifications')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('verification_token', token);

    // Verificar si ya tiene negocio seleccionado
    const { data: userData } = await supabaseAdmin
      .from('ws_users')
      .select('store_types')
      .eq('email', email)
      .single();

    return {
      status: 'success',
      message: '¡Email verificado exitosamente!',
      email,
      hasBusiness: userData?.store_types && userData.store_types.length > 0
    };

    } catch (error) {
    console.error('Error verificando email:', error);
    return {
      status: 'error',
      message: 'Error interno del servidor'
    };
  }
}

export default async function VerifyEmail({ searchParams }: VerifyEmailPageProps) {
  const resolvedSearchParams = await searchParams;
  const { token, email } = resolvedSearchParams;
  
  let result: VerificationResult = {
    status: 'error',
    message: 'Parámetros inválidos'
  };

  try {
    if (token && email) {
      result = await verifyEmailToken(token, email);
    }
  } catch (error) {
    console.error('Error en VerifyEmail:', error);
    result = {
      status: 'error',
      message: 'Error interno del servidor'
    };
  }

  const getStatusIcon = () => {
    switch (result.status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'expired':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'already_verified':
        return <AlertTriangle className="h-16 w-16 text-blue-500" />;
      default:
        return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'expired':
        return 'text-yellow-600';
      case 'already_verified':
        return 'text-blue-600';
      default:
        return 'text-red-600';
    }
  };

  const getNextAction = () => {
    if (result.status === 'success' || result.status === 'already_verified') {
      if (result.hasBusiness) {
        return {
          text: 'Iniciar Sesión',
          href: '/login',
          description: 'Tu cuenta está completamente configurada. Inicia sesión para acceder al dashboard.'
        };
      } else {
        return {
          text: 'Continuar Configuración',
          href: `/register?email=${encodeURIComponent(result.email || '')}`,
          description: 'Email verificado. Continúa con la configuración del negocio.'
        };
      }
    } else if (result.status === 'expired') {
      return {
        text: 'Solicitar Nuevo Enlace',
        href: '/login',
        description: 'Inicia sesión para reenviar el enlace de verificación'
      };
    } else {
      return {
        text: 'Volver al Login',
        href: '/login',
        description: 'Intenta nuevamente o contacta soporte'
      };
    }
  };

  const nextAction = getNextAction();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              {getStatusIcon()}
              
              <h1 className={`mt-4 text-2xl font-bold ${getStatusColor()}`}>
                {result.status === 'success' && '¡Verificación Exitosa!'}
                {result.status === 'error' && 'Error de Verificación'}
                {result.status === 'expired' && 'Enlace Expirado'}
                {result.status === 'already_verified' && 'Ya Verificado'}
              </h1>

              <p className="mt-2 text-gray-600">
                {result.message}
              </p>
              
              {result.email && (
                <p className="mt-1 text-sm text-gray-500">
                  Email: {result.email}
                </p>
              )}
              
              <div className="mt-6">
                <a
                  href={nextAction.href}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue4 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {nextAction.text}
                </a>
                
                <p className="mt-2 text-xs text-gray-500">
                  {nextAction.description}
                </p>
              </div>

              {result.status === 'expired' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700">
                    <strong>Nota:</strong> Los enlaces de verificación expiran después de 24 horas por seguridad.
                  </p>
                </div>
              )}

              {result.status === 'success' && !result.hasBusiness && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>Siguiente paso:</strong> Inicia sesión en cualquier dispositivo para continuar con la configuración del negocio.
                  </p>
                </div>
              )}

              {result.status === 'success' && result.hasBusiness && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    <strong>¡Listo!</strong> Tu cuenta está completamente configurada. Inicia sesión en cualquier dispositivo para acceder al dashboard.
                </p>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}