import { useEffect, useRef } from 'react';

// Hook que previene absolutamente cualquier ejecución múltiple
export function useOncePerUser(callback: () => void, userId?: string | null) {
  const executedRef = useRef<Set<string>>(new Set());
  const isExecutingRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    // Persistencia en sessionStorage para sobrevivir remounts / HMR
    const key = `once_per_user_${userId}`;
    const alreadyRan = executedRef.current.has(userId) || (typeof window !== 'undefined' && sessionStorage.getItem(key) === '1');
    if (alreadyRan || isExecutingRef.current) return;

    isExecutingRef.current = true;
    console.log(`🔒 Ejecutando callback ÚNICA VEZ para user: ${userId}`);
    try {
      callback();
      executedRef.current.add(userId);
      if (typeof window !== 'undefined') sessionStorage.setItem(key, '1');
    } catch (error) {
      console.error('Error in useOncePerUser callback:', error);
    } finally {
      isExecutingRef.current = false;
    }
  }, [userId, callback]);

  // Función para limpiar el historial si es necesario
  const clearHistory = () => {
    executedRef.current.clear();
  };

  return { clearHistory };
}