import { useState, useEffect, useCallback } from 'react';
interface ConnectivityState {
  isOnline: boolean;
  isSupabaseReachable: boolean;
  lastError: string | null;
}

export const useConnectivity = () => {
  const [state, setState] = useState<ConnectivityState>({
    isOnline: true,
    isSupabaseReachable: true,
    lastError: null
  });

  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true, lastError: null }));
    };

    const handleOffline = () => {
      setState(prev => ({ 
        ...prev, 
        isOnline: false, 
        isSupabaseReachable: false,
        lastError: 'Sin conexión a internet'
      }));
    };

    // Verificar estado inicial
    setState(prev => ({ ...prev, isOnline: navigator.onLine }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkSupabaseConnectivity = useCallback(async () => {
    try {
      const response = await fetch('https://juupotamdjqzpxuqdtco.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDIyMTgsImV4cCI6MjA2NTI3ODIxOH0.8aXgTBg4vhs0DmTKPg9WGTvQ9hHBd_uCGHgt89ZfM_E',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDIyMTgsImV4cCI6MjA2NTI3ODIxOH0.8aXgTBg4vhs0DmTKPg9WGTvQ9hHBd_uCGHgt89ZfM_E'
        }
      });
      
      setState(prev => ({ 
        ...prev, 
        isSupabaseReachable: response.ok,
        lastError: response.ok ? null : 'Servidor no disponible'
      }));
      
      return response.ok;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSupabaseReachable: false,
        lastError: 'Error de conectividad con el servidor'
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    checkSupabaseConnectivity
  };
};
