
'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
  const [hasAttempted, setHasAttempted] = useState(false);
  const pathname = usePathname();

  // Rutas donde no queremos bloquear por conectividad inicial (onboarding/auth)
  const bypassPrefixes = ['/login', '/register', '/register-simple'];
  const bypassExact = ['/select-business'];
  const bypass = bypassExact.includes(pathname) || bypassPrefixes.some(p => pathname.startsWith(p));

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isOnline) {
        setShowError(true);
        setHasAttempted(true);
        return;
      }
      if (bypass) {
        setHasAttempted(true);
        return; // no bloqueo en rutas de onboarding/auth
      }
      setIsChecking(true);
      const isReachable = await checkSupabaseConnectivity();
      if (!cancelled) {
        setShowError(!isReachable);
        setIsChecking(false);
        setHasAttempted(true);
      }
    };
    run();

    // Timeout de seguridad real (no se reinicia) para evitar spinner infinito
    const safety = setTimeout(() => {
      if (!cancelled) {
        setIsChecking(false);
        setHasAttempted(true);
      }
    }, 4500);
    return () => { cancelled = true; clearTimeout(safety); };
  // OJO: NO incluir isChecking aquí para que el timeout no se reinicie continuamente
  }, [isOnline, checkSupabaseConnectivity, bypass]);

  // Si no hay conexión a internet
  if (!isOnline) {
    return fallback || <ConnectivityError showRetryButton={false} />;
  }

  // Si hay conexión pero Supabase no es alcanzable tras intento
  if (hasAttempted && showError && !isSupabaseReachable) {
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
  if (!bypass && isChecking) {
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
