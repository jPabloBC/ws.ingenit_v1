'use client';
import { useEffect, useRef } from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface ConnectionManagerProps {
  children: React.ReactNode;
}

export default function ConnectionManager({ children }: ConnectionManagerProps) {
  const { isVisible, isOnline, shouldMaintainConnection } = usePageVisibility();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  useEffect(() => {
    // Mantener conexiones activas cuando la página está visible o recientemente oculta
    if (shouldMaintainConnection && isOnline) {
      // Resetear intentos de reconexión cuando hay conectividad
      reconnectAttempts.current = 0;
    }
  }, [shouldMaintainConnection, isOnline]);

  useEffect(() => {
    // Manejar reconexión cuando vuelve a estar online
    if (isOnline && !isVisible) {
      // Página no visible pero online - mantener conexiones
      // console.log('Manteniendo conexiones activas en segundo plano');
    }
  }, [isOnline, isVisible]);

  // No mostrar nada - solo manejar conexiones en segundo plano
  return <>{children}</>;
}


