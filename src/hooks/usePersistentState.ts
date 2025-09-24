import { useState, useEffect, useRef } from 'react';

interface UsePersistentStateOptions {
  key: string;
  defaultValue: any;
  ttl?: number; // Time to live in milliseconds
}

export const usePersistentState = <T>(
  options: UsePersistentStateOptions
) => {
  const { key, defaultValue, ttl = 10 * 60 * 1000 } = options; // 10 minutos por defecto
  const [state, setState] = useState<T>(defaultValue);
  const initializedRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);

  // Cargar estado desde sessionStorage al inicializar
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Verificar si los datos no son muy viejos
        if (now - parsed.timestamp < ttl) {
          setState(parsed.data);
          lastUpdateRef.current = parsed.timestamp;
        } else {
          // Datos muy viejos, limpiar
          sessionStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn(`Error loading persistent state for ${key}:`, error);
    }
  }, [key, ttl]);

  // Guardar estado en sessionStorage cuando cambie
  useEffect(() => {
    if (!initializedRef.current) return;
    
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return;

    try {
      const dataToStore = {
        data: state,
        timestamp: Date.now()
      };
      sessionStorage.setItem(key, JSON.stringify(dataToStore));
      lastUpdateRef.current = Date.now();
    } catch (error) {
      console.warn(`Error saving persistent state for ${key}:`, error);
    }
  }, [key, state]);

  // Función para limpiar el estado persistente
  const clearState = () => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem(key);
      setState(defaultValue);
      lastUpdateRef.current = 0;
    } catch (error) {
      console.warn(`Error clearing persistent state for ${key}:`, error);
    }
  };

  // Función para forzar actualización del timestamp
  const touchState = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.timestamp = Date.now();
        sessionStorage.setItem(key, JSON.stringify(parsed));
        lastUpdateRef.current = Date.now();
      }
    } catch (error) {
      console.warn(`Error touching persistent state for ${key}:`, error);
    }
  };

  return {
    state,
    setState,
    clearState,
    touchState,
    isStale: () => {
      const now = Date.now();
      return now - lastUpdateRef.current > ttl;
    }
  };
};


