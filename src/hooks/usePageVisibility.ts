import { useEffect, useRef, useState } from 'react';

interface PageVisibilityState {
  isVisible: boolean;
  isOnline: boolean;
  lastVisibilityChange: number;
}

export const usePageVisibility = () => {
  const [state, setState] = useState<PageVisibilityState>({
    isVisible: typeof window !== 'undefined' ? !document.hidden : true,
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    lastVisibilityChange: Date.now()
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityChangeCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      const now = Date.now();
      
      setState(prev => ({
        ...prev,
        isVisible,
        lastVisibilityChange: now
      }));

      // Si la página vuelve a ser visible, ejecutar callback de refresh
      if (isVisible && visibilityChangeCallbackRef.current) {
        console.log('[PageVisibility] Página visible - ejecutando refresh');
        visibilityChangeCallbackRef.current();
      }
    };

    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mantener conexión activa con heartbeat ligero
    const startHeartbeat = () => {
      if (intervalRef.current) return;
      
      intervalRef.current = setInterval(() => {
        // Heartbeat más permisivo - mantener conexión activa incluso en segundo plano
        const timeSinceLastChange = Date.now() - state.lastVisibilityChange;
        // Extender el tiempo de heartbeat activo a 60 segundos
        if (state.isVisible || timeSinceLastChange < 60000) { // Aumentado a 60s
          // Heartbeat ligero - solo verificar conectividad
          if (navigator.onLine) {
            // Opcional: hacer ping a un endpoint ligero
            fetch('/api/health', { 
              method: 'HEAD',
              cache: 'no-cache'
            }).catch(() => {
              // Silenciar errores de heartbeat
            });
          }
        }
      }, 30000); // Mantener 30s para heartbeat regular
    };

    startHeartbeat();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [state.lastVisibilityChange, state.isVisible]);

  // Función para registrar callback de refresh
  const setVisibilityChangeCallback = (callback: () => void) => {
    visibilityChangeCallbackRef.current = callback;
  };

  return {
    isVisible: state.isVisible,
    isOnline: state.isOnline,
    shouldMaintainConnection: state.isVisible || (Date.now() - state.lastVisibilityChange) < 60000, // Aumentado a 60s para mantener conexión
    setVisibilityChangeCallback
  };
};


