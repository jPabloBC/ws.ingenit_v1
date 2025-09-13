'use client';
import { useEffect } from 'react';
import { setupErrorHandling } from '@/lib/errorHandler';

export default function ErrorHandler() {
  useEffect(() => {
    // Setup error handling
    setupErrorHandling();

    // Additional protection against extension errors
    const handleGlobalError = (event: ErrorEvent) => {
      const message = event.message || event.filename || '';
      
      // Suprimir errores de extensiones
      if (message.includes('content_script') || 
          message.includes('chrome-extension') ||
          message.includes('moz-extension') ||
          message.includes('deref')) {
        event.preventDefault();
        return false;
      }
      
      // Manejar errores de conectividad de Supabase
      if (message.includes('Failed to fetch') || 
          message.includes('NetworkError') ||
          message.includes('TypeError: Failed to fetch')) {
        console.warn('Error de conectividad detectado:', message);
        // No prevenir el error, solo loggearlo
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || event.reason || '';
      
      // Suprimir errores de extensiones
      if (message.includes('content_script') || 
          message.includes('chrome-extension') ||
          message.includes('moz-extension') ||
          message.includes('deref')) {
        event.preventDefault();
        return false;
      }
      
      // Manejar errores de conectividad de Supabase
      if (message.includes('Failed to fetch') || 
          message.includes('NetworkError') ||
          message.includes('TypeError: Failed to fetch')) {
        console.warn('Error de conectividad en Promise:', message);
        // No prevenir el error, solo loggearlo
        return false;
      }
    };

    // Add global error handlers
    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    // Cleanup function
    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    };
  }, []);

  // Este componente no renderiza nada visible
  return null;
}
