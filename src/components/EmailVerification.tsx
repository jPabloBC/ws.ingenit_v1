'use client';
// Removido: import no usado
import { Check, CheckCircle, Mail, RefreshCw } from 'lucide-react';;
// Removido: import no usado
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface EmailVerificationProps {
  email: string;
  onVerified?: () => void;
}

export default function EmailVerification({ email, onVerified }: EmailVerificationProps) {
  // Removido: variable no usada
  const [sent, setSent] = useState(false);

  const resendVerificationEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        console.error('Error al reenviar email:', error);
        toast.error('Error al reenviar el email de verificación');
        return;
      }

      setSent(true);
      toast.success('Email de verificación reenviado. Revisa tu correo.');
    } catch {
      console.error('Error inesperado:', error);
      toast.error('Error inesperado al reenviar el email');
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    setLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error al verificar estado:', error);
        toast.error('Error al verificar el estado de verificación');
        return;
      }

      if (session?.user?.email_confirmed_at) {
        toast.success('¡Email verificado correctamente!');
        onVerified?.();
      } else {
        toast('El email aún no ha sido verificado. Revisa tu correo.');
      }
    } catch {
      console.error('Error inesperado:', error);
      toast.error('Error inesperado al verificar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <Mail className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Verifica tu email
          </h3>
          <p className="text-blue-800 mb-4">
            Hemos enviado un email de verificación a <strong>{email}</strong>. 
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </p>
          
          <div className="space-y-3">
            <div className="flex space-x-2">
              <LucideButton                 onClick={resendVerificationEmail}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                <span>{sent ? 'Reenviado' : 'Reenviar email'}</span>
              </LucideButton>
              
              <LucideButton                 onClick={checkVerificationStatus}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>Verificar estado</span>
              </LucideButton>
            </div>
            
            {sent && (
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Email reenviado exitosamente</span>
              </div>
            )}
            
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">¿No recibiste el email?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Revisa tu carpeta de spam o correo no deseado</li>
                <li>Asegúrate de que el email esté escrito correctamente</li>
                <li>Espera unos minutos y vuelve a intentar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
