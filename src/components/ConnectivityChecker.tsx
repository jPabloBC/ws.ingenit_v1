'use client';
// Removido: import no usado
import { useConnectivity } from '@/hooks/useConnectivity';
import ConnectivityError from './ConnectivityError';

interface ConnectivityCheckerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ConnectivityChecker({ children, fallback }: ConnectivityCheckerProps) {
  const { isOnline, isSupabaseReachable, lastError, checkSupabaseConnectivity } = useConnectivity();
  const [isChecking, setIsChecking] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Verificar conectividad inicial
    const checkInitialConnectivity = async () => {
      if (!isOnline) {
        setShowError(true);
        return;
      }

      setIsChecking(true);
      const isReachable = await checkSupabaseConnectivity();
      setShowError(!isReachable);
      setIsChecking(false);
    };

    checkInitialConnectivity();
  }, [isOnline, checkSupabaseConnectivity]);

  // Si no hay conexión a internet
  if (!isOnline) {
    return fallback || <ConnectivityError showRetryButton={false} />;
  }

  // Si hay conexión pero Supabase no es alcanzable
  if (showError && !isSupabaseReachable) {
    return fallback || (
      <ConnectivityError 
        onRetry={async () => {
          setIsChecking(true);
          const isReachable = await checkSupabaseConnectivity();
          setShowError(!isReachable);
          setIsChecking(false);
        }}
        showRetryButton={true}
      />
    );
  }

  // Si está verificando conectividad
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando conectividad...</p>
        </div>
      </div>
    );
  }

  // Todo está bien, mostrar contenido
  return <>{children}</>;
}
