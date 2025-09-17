
'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ConnectivityErrorProps {
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export default function ConnectivityError({ onRetry, showRetryButton = true }: ConnectivityErrorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar estado inicial
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="mb-4">
          <WifiOff className="h-16 w-16 text-red-500 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Sin Conexión a Internet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          Verifica tu conexión a internet y vuelve a intentar.
        </p>
        <div className="flex items-center text-sm text-gray-500">
          <Wifi className="h-4 w-4 mr-2" />
          Esperando conexión...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="mb-4">
        <Wifi className="h-16 w-16 text-green-500 mx-auto" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Error de Conectividad
      </h3>
      <p className="text-gray-600 mb-6 max-w-md">
        No se pudo conectar con el servidor. Esto puede deberse a:
      </p>
      <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
        <li>• El servidor está temporalmente no disponible</li>
        <li>• Problemas de configuración de red</li>
      </ul>
      {showRetryButton && (
        <Button onClick={handleRetry} className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar {retryCount > 0 && `(${retryCount})`}
        </Button>
      )}
    </div>
  );
}
