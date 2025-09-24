import { useEffect, useRef } from 'react';

interface UseRobustIntervalOptions {
  delay: number;
  enabled?: boolean;
  runOnMount?: boolean;
}

export const useRobustInterval = (
  callback: () => void,
  options: UseRobustIntervalOptions
) => {
  const { delay, enabled = true, runOnMount = false } = options;
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRunRef = useRef<number>(0);

  // Mantener callback actualizado
  callbackRef.current = callback;

  useEffect(() => {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return;
    
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Ejecutar inmediatamente si se solicita
    if (runOnMount) {
      callbackRef.current();
      lastRunRef.current = Date.now();
    }

    const startInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastRun = now - lastRunRef.current;
        
        // Solo ejecutar si ha pasado suficiente tiempo
        // Esto previene ejecuciones múltiples cuando la página vuelve a ser visible
        if (timeSinceLastRun >= delay * 0.8) { // 80% del delay para tolerancia
          callbackRef.current();
          lastRunRef.current = now;
        }
      }, delay);
    };

    startInterval();

    // Manejar cambios de visibilidad y foco para mantener el intervalo activo
    const handleVisibilityChange = () => {
      if (typeof window !== 'undefined' && !document.hidden) {
        // Página visible - verificar si necesitamos ejecutar callback
        const now = Date.now();
        const timeSinceLastRun = now - lastRunRef.current;
        
        // Ser más agresivo: ejecutar si ha pasado más de la mitad del delay
        if (timeSinceLastRun >= delay * 0.5) {
          console.log('[RobustInterval] Ejecutando callback por visibilidad');
          callbackRef.current();
          lastRunRef.current = now;
        }
        
        // Reiniciar intervalo
        startInterval();
      }
    };

    const handleWindowFocus = () => {
      // Ventana recupera foco - verificar si necesitamos ejecutar callback
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;
      
      // Ser más agresivo: ejecutar si ha pasado más de la mitad del delay
      if (timeSinceLastRun >= delay * 0.5) {
        console.log('[RobustInterval] Ejecutando callback por foco de ventana');
        callbackRef.current();
        lastRunRef.current = now;
      }
      
      // Reiniciar intervalo
      startInterval();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [delay, enabled, runOnMount]);

  // Función para ejecutar manualmente
  const executeNow = () => {
    callbackRef.current();
    lastRunRef.current = Date.now();
  };

  return { executeNow };
};


