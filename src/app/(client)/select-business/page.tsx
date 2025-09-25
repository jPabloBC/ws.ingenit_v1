'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabase/client';
import { businessesService } from '@/services/supabase/businesses';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

import { Check, Store, ArrowRight, Wine, Hammer, Book, Utensils, ShoppingCart } from 'lucide-react';

const storeTypes = [
  {
    id: 'almacen',
    name: 'Almacén',
    description: 'Tienda de abarrotes, minimarket, almacén de barrio',
    icon: <ShoppingCart className="h-10 w-10 text-blue-400" strokeWidth={1.5} />
  },
  {
    id: 'botilleria',
    name: 'Botillería',
    description: 'Venta de bebidas alcohólicas y productos relacionados',
  icon: <Wine className="h-10 w-10 text-amber-500" strokeWidth={1.5} />
  },
  {
    id: 'ferreteria',
    name: 'Ferretería',
    description: 'Venta de herramientas, materiales y artículos de ferretería',
  icon: <Hammer className="h-10 w-10 text-gray-500" strokeWidth={1.5} />
  },
  {
    id: 'libreria',
    name: 'Librería',
    description: 'Venta de libros, útiles escolares y de oficina',
  icon: <Book className="h-10 w-10 text-green-600" strokeWidth={1.5} />
  },
  {
    id: 'restaurante',
    name: 'Restaurante',
    description: 'Servicio de comida y bebidas',
  icon: <Utensils className="h-10 w-10 text-rose-500" strokeWidth={1.5} />
  }
];


export default function SelectBusinessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <SelectBusinessContent />
    </Suspense>
  );
}

function SelectBusinessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [selectedStoreTypes, setSelectedStoreTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [hasCheckedUser, setHasCheckedUser] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);
  const ranForUserRef = useRef<Set<string>>(new Set());
  const navigatingRef = useRef(false);

  const email = searchParams.get('email');

  const checkUserStatus = useCallback(async () => {
    if (!user?.id) {
      // Si no hay usuario aún, no hacemos nada (spinner controlado por safety timeout)
      return;
    }
    if (ranForUserRef.current.has(user.id)) {
      return;
    }
    ranForUserRef.current.add(user.id);
    console.log('[SelectBusiness] checkUserStatus start user:', user.id, 'email param:', email);
    setAttemptError(null);

    try {
      if (email && user.email && user.email !== email) {
        console.warn('[SelectBusiness] Email mismatch. session:', user.email, 'param:', email);
        toast.error('El email no coincide con tu sesión');
        setCheckingUser(false);
        setHasCheckedUser(true);
        router.push('/login');
        return;
      }

      // Consultar por user_id (más robusto que por email)
      const { data: userData, error } = await supabase
        .from('ws_users')
        .select('store_types')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[SelectBusiness] Error checking user data:', error);
        setAttemptError('Error verificando tu cuenta');
        setCheckingUser(false);
        setHasCheckedUser(true);
        return;
      }

      if (userData?.store_types && userData.store_types.length > 0) {
        console.log('[SelectBusiness] User already has store_types, redirecting dashboard');
        toast.success('Ya tienes un negocio configurado');
        setCheckingUser(false);
        setHasCheckedUser(true);
        if (!navigatingRef.current) {
          navigatingRef.current = true;
          router.push('/dashboard');
        }
        return;
      }

      // Mostrar formulario
      setCheckingUser(false);
      setHasCheckedUser(true);
      console.log('[SelectBusiness] No store_types -> mostrar selección');
    } catch (error: any) {
      console.error('[SelectBusiness] Error in checkUserStatus catch:', error);
      setAttemptError(error?.message || 'Error verificando tu cuenta');
      setCheckingUser(false);
      setHasCheckedUser(true);
    }
  }, [user?.id, user?.email, email, router]);

  // Efecto simplificado: ejecutar cuando user cambie y no se haya verificado aún
  useEffect(() => {
    if (user?.id && user.id !== lastUserIdRef.current) {
      lastUserIdRef.current = user.id;
      setHasCheckedUser(false);
      setCheckingUser(true);
    }
    if (user?.id && !hasCheckedUser) {
      setCheckingUser(true);
      checkUserStatus();
    }
  }, [user?.id, hasCheckedUser, checkUserStatus]);

  // Safety timeout para evitar quedarse colgado en "Verificando tu cuenta..."
  useEffect(() => {
    if (!checkingUser) return;
    const safety = setTimeout(() => {
      if (checkingUser) {
        console.warn('[SelectBusiness] Safety timeout liberando spinner, mostrando formulario');
        setCheckingUser(false);
        setHasCheckedUser(true);
      }
    }, 5000);
    return () => clearTimeout(safety);
  }, [checkingUser]);

  const handleStoreTypeToggle = (storeTypeId: string) => {
    setSelectedStoreTypes(prev => 
      prev.includes(storeTypeId) 
        ? prev.filter(id => id !== storeTypeId)
        : [...prev, storeTypeId]
    );
  };

  const handleCompleteSelection = async () => {
    if (selectedStoreTypes.length === 0) {
      toast.error('Debes seleccionar al menos un tipo de negocio');
      return;
    }

    setLoading(true);

    try {
      // Actualizar el usuario con los tipos de negocio seleccionados
      const { error } = await supabase
        .from('ws_users')
        .update({ 
          store_types: selectedStoreTypes,
          updated_at: new Date().toISOString()
        })
        .eq('email', user!.email);

      if (error) {
        console.error('Error updating user:', error);
        toast.error('Error guardando tu selección');
        return;
      }
      // Crear negocios por defecto (uno por cada tipo seleccionado) si aún no existen
      try {
        const creation = await businessesService.createDefaultBusinesses(user!.id, selectedStoreTypes);
        if (!creation.success) {
          console.warn('[SelectBusiness] No se pudieron crear negocios por defecto:', creation.error);
        } else {
          console.log('[SelectBusiness] Negocios creados:', creation.businesses?.length || 0);
          // Guardar el primero como seleccionado
          if (creation.businesses && creation.businesses.length > 0) {
            const first = creation.businesses[0];
            // Verificar que estamos en el cliente antes de usar localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('selectedBusinessId', first.id);
              localStorage.setItem('selectedStoreType', first.store_type);
            }
          }
        }
      } catch (e) {
        console.error('[SelectBusiness] Error creando negocios por defecto:', e);
      }

      toast.success('¡Perfecto! Tu negocio está configurado');
      if (!navigatingRef.current) {
        navigatingRef.current = true;
        router.push('/dashboard');
      }

    } catch (error) {
      console.error('Error completing selection:', error);
      toast.error('Error completando la configuración');
    } finally {
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-sm bg-slate-900/30" />
        <div className="relative z-10 text-center p-8 rounded-xl border border-white/10 bg-white/5 shadow-xl max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-200 text-sm tracking-wide">Verificando tu cuenta...</p>
          <p className="text-slate-400 text-xs mt-3">Si esto tarda demasiado se mostrará la selección automáticamente.</p>
        </div>
      </div>
    );
  }

  if (attemptError) {
    return (
      <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-sm bg-slate-900/40" />
        <div className="relative z-10 max-w-md w-full mx-auto p-8 rounded-xl bg-white/10 border border-red-400/30 shadow-lg">
          <h2 className="text-red-300 font-semibold mb-2 text-center">Error verificando tu sesión</h2>
            <p className="text-slate-200 text-sm mb-4 text-center">{attemptError}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setAttemptError(null); setCheckingUser(true); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition"
              >Reintentar</button>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition"
              >Login</button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-md bg-slate-900/40" />
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/10 border border-blue-400/30 rounded-2xl flex items-center justify-center shadow-inner">
            <Store className="h-10 w-10 text-blue-300" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Selecciona tu tipo de negocio</h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base md:text-lg">
            Cuéntanos qué tipo de negocio tienes para personalizar tu experiencia.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {storeTypes.map(storeType => {
            const isAlmacen = storeType.id === 'almacen';
            const active = selectedStoreTypes.includes(storeType.id);
            const disabled = !isAlmacen;
            return (
              <button
                type="button"
                key={storeType.id}
                onClick={() => !disabled && handleStoreTypeToggle(storeType.id)}
                disabled={disabled}
                className={`group relative rounded-xl border p-6 text-left transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
                  active
                    ? 'border-blue-400/60 bg-blue-500/10 ring-2 ring-blue-400/40'
                    : 'border-white/10 bg-white/5 hover:border-blue-300/40 hover:bg-blue-400/5'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 drop-shadow-sm flex items-center justify-center">{storeType.icon}</div>
                  <h3 className="font-semibold text-white mb-2 text-lg">{storeType.name}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 min-h-[48px]">{storeType.description}</p>
                  {active && (
                    <div className="flex items-center justify-center gap-1 text-blue-300 font-medium text-sm">
                      <Check className="h-4 w-4" /> Seleccionado
                    </div>
                  )}
                  {disabled && (
                    <span className="absolute left-1/2 bottom-4 -translate-x-1/2 bg-black/70 text-white text-base px-5 py-2 rounded-full z-20 select-none pointer-events-none flex items-center gap-2 shadow-lg" style={{backdropFilter:'blur(2.5px)', fontWeight:'bold', letterSpacing:'0.5px'}}>
                      <Hammer className="h-5 w-5 text-yellow-400 mr-1" strokeWidth={2} />
                      Próximamente
                    </span>
                  )}
                  <div className={`absolute inset-0 rounded-xl pointer-events-none transition opacity-0 group-hover:opacity-100 ${active ? 'bg-blue-400/5' : 'bg-blue-300/5'}`} />
                  {disabled && (
                    <div className="absolute inset-0 rounded-xl bg-black/40 z-10 pointer-events-none" style={{backdropFilter:'blur(1.5px)'}} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={handleCompleteSelection}
            disabled={loading || selectedStoreTypes.length === 0}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-md bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500 text-white font-semibold tracking-wide transition shadow-lg shadow-blue-900/30"
          >
            <span>{loading ? 'Guardando...' : 'Continuar'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
