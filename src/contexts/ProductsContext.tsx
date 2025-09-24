'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getProducts, Product, getProductsByBusiness } from '@/services/supabase/products';

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  loadProducts: (businessId: string, userId: string, forceRefresh?: boolean) => Promise<void>;
  refreshProducts: (businessId: string, userId: string) => Promise<void>;
  updateProduct: (updatedProduct: Product) => void;
  addProduct: (newProduct: Product) => void;
  removeProduct: (productId: string) => void;
  getProductsForBusiness: (businessId: string) => Product[];
  invalidateCache: (businessId?: string, userId?: string) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

interface ProductsProviderProps {
  children: React.ReactNode;
}

export const ProductsProvider: React.FC<ProductsProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, { data: Product[]; timestamp: number }>>(new Map());
  // DEBUG flag (puedes poner a false para silenciar logs)
  const DEBUG = true; // Activado temporalmente para diagnóstico
  
  // Intentos recientes de respuestas vacías para cada clave
  const emptyAttemptsRef = useRef<Map<string, number>>(new Map());
  // Referencia a productos actuales para comparación dentro de callbacks
  const productsRef = useRef<Product[]>([]);
  useEffect(() => { productsRef.current = products; }, [products]);
  // Intentos de fallback por business
  const fallbackAttemptsRef = useRef<Map<string, number>>(new Map());
  
  // Referencias para evitar dependencias circulares
  const loadingRef = useRef(false);
  const cacheRef = useRef<Map<string, { data: Product[]; timestamp: number }>>(new Map());
  // Solicitudes de refresco forzado pendientes mientras hay una carga en curso
  const pendingForceRef = useRef<{ businessId: string; userId: string } | null>(null);

  // Sincronizar refs con estados
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  
  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  // Cargar cache desde sessionStorage al inicializar
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('products-cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        const cacheMap = new Map<string, { data: Product[]; timestamp: number }>(parsed);
        setCache(cacheMap);
        
        // Cargar productos del cache más reciente
        const mostRecent = Array.from(cacheMap.entries())
          .sort(([,a], [,b]) => b.timestamp - a.timestamp)[0];
        
        if (mostRecent && Date.now() - mostRecent[1].timestamp < 5 * 60 * 1000) { // 5 minutos
          setProducts(mostRecent[1].data);
        }
      }
    } catch (error) {
      console.warn('Error loading products cache:', error);
    }
  }, []);

  // Guardar cache en sessionStorage cuando cambie
  useEffect(() => {
    try {
      const cacheArray = Array.from(cache.entries());
      sessionStorage.setItem('products-cache', JSON.stringify(cacheArray));
    } catch (error) {
      console.warn('Error saving products cache:', error);
    }
  }, [cache]);

  const loadProducts = useCallback(async (businessId: string, userId: string, forceRefresh = false) => {
    const cacheKey = `${businessId}-${userId}`;
    const now = Date.now();
    
    // Verificar cache primero (solo si no es forzado)
    if (!forceRefresh) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && now - cached.timestamp < 2 * 60 * 1000) { // 2 minutos TTL
        if (DEBUG) console.log('[ProductsContext] ✅ Cache hit', { cacheKey, count: cached.data.length });
        setProducts(cached.data);
        return;
      }
    }

    // Evitar cargas múltiples simultáneas: si ya estamos cargando y llega otro forceRefresh, lo marcamos como pendiente
    if (loadingRef.current) {
      if (forceRefresh) {
        pendingForceRef.current = { businessId, userId };
      }
      return; // No iniciar otra carga ahora
    }

    setLoading(true);
    setError(null);

    const loadStartedAt = Date.now();
    let watchdogCleared = false;
    // Watchdog: si loading se queda atrapado > 12s, liberar para permitir reintentos
    const watchdog = setTimeout(() => {
      if (loadingRef.current) {
        if (DEBUG) console.warn('[ProductsContext] ⏱️ Watchdog liberando estado de carga tras 12s');
        setLoading(false);
      }
    }, 12000);

    try {
      if (DEBUG) console.log('[ProductsContext] 🔄 Fetch start', { cacheKey, forceRefresh });
      const data = await getProducts(businessId);
      const duration = Date.now() - loadStartedAt;
      if (DEBUG) console.log('[ProductsContext] ✅ Fetch end', { count: data.length, ms: duration });

      // Manejo especial de respuestas vacías para evitar "desaparición" de productos por errores transitorios
      if (data.length === 0) {
        const previousCount = productsRef.current.length;
        const attemptsMap = emptyAttemptsRef.current;
        const prevAttempts = attemptsMap.get(cacheKey) || 0;

        // Si antes había productos y ahora viene vacío, considerarlo sospechoso (posible sesión momentáneamente nula / RLS / race)
        if (previousCount > 0 && !forceRefresh) {
          if (DEBUG) console.warn('[ProductsContext] ⚠️ Resultado vacío inesperado. Conservando productos anteriores y reintentando.', { previousCount, prevAttempts });
          attemptsMap.set(cacheKey, prevAttempts + 1);
          // Programar reintento rápido (solo uno cada 3s máx)
          if (prevAttempts < 3) {
            setTimeout(() => {
              if (!loadingRef.current) {
                loadProducts(businessId, userId, true);
              }
            }, 3000 * (prevAttempts + 1));
          }
          return; // No sobreescribimos productos ni cache
        }

        // Si es primer load (previousCount === 0), aceptamos vacío pero NO lo cacheamos para permitir reintento manual / visibilidad
        if (previousCount === 0) {
          if (DEBUG) console.log('[ProductsContext] ℹ️ Inventario vacío inicial (no se cachea para permitir reintentos rápidos)');
          setProducts([]);
          // Programar reintento pasivo en 5s si sigue vacío
          if (prevAttempts < 2) {
            attemptsMap.set(cacheKey, prevAttempts + 1);
            setTimeout(() => {
              if (!loadingRef.current && productsRef.current.length === 0) {
                loadProducts(businessId, userId, true);
              }
            }, 5000);
          }
          return;
        }
      }

      // Respuesta con datos > 0: resetear intentos vacíos y cachear normalmente
      if (data.length > 0) {
        emptyAttemptsRef.current.set(cacheKey, 0);
        setCache(prev => new Map(prev.set(cacheKey, { data, timestamp: now })));
        setProducts(data);
      }
    } catch (err: any) {
      const message: string = err?.message || 'UNKNOWN_ERROR';
      if (DEBUG) console.error('[ProductsContext] ❌ Error principal getProducts:', message);

      // No borrar productos previos; registrar error
      let errorLabel = 'Error al cargar productos';
      if (message.startsWith('NO_SESSION')) errorLabel = 'Sesión no disponible';
      else if (message.startsWith('SESSION_ERROR')) errorLabel = 'Error de sesión';
      else if (message.startsWith('TIMEOUT_ERROR')) errorLabel = 'Timeout al cargar productos';
      else if (message.startsWith('RLS_ERROR')) errorLabel = 'Restricción de acceso (RLS)';
      else if (message.startsWith('STRUCTURE_ERROR')) errorLabel = 'Estructura de tabla / migración incompleta';
      setError(errorLabel);

      // Fallback habilitado sólo si hay businessId y tipos recuperables
      const recoverable = /NO_SESSION|SESSION_ERROR|TIMEOUT_ERROR|RLS_ERROR|GENERIC_DB_ERROR|STRUCTURE_ERROR/.test(message);
      if (recoverable) {
        const bizId = businessId; // usar parámetro original directamente
        if (bizId) {
          const prevFallbacks = fallbackAttemptsRef.current.get(bizId) || 0;
          if (prevFallbacks < 2) {
            fallbackAttemptsRef.current.set(bizId, prevFallbacks + 1);
            (async () => {
              try {
                if (DEBUG) console.log('[ProductsContext] 🔁 Intento fallback getProductsByBusiness', { bizId, attempt: prevFallbacks + 1 });
                const fbData = await getProductsByBusiness(bizId);
                if (fbData.length > 0) {
                  if (DEBUG) console.log('[ProductsContext] ✅ Fallback trajo datos', fbData.length);
                  if (productsRef.current.length === 0) {
                    setProducts(fbData);
                    setCache(prev => new Map(prev.set(`${bizId}-${userId}`, { data: fbData, timestamp: Date.now() })));
                    setError(errorLabel + ' (modo degradado)');
                  }
                } else if (DEBUG) {
                  console.warn('[ProductsContext] Fallback vacío');
                }
              } catch (fbErr) {
                if (DEBUG) console.error('[ProductsContext] ❌ Fallback error:', fbErr);
              }
            })();
          } else if (DEBUG) {
            console.log('[ProductsContext] 🔁 Fallback límite alcanzado');
          }
        }
      }

      // Reintento rápido especializado para NO_SESSION / SESSION_ERROR
      if (/NO_SESSION|SESSION_ERROR/.test(message)) {
        if (DEBUG) console.log('[ProductsContext] ⏳ Reintento rápido por sesión en 1500ms');
        setTimeout(() => {
          if (!loadingRef.current) {
            loadProducts(businessId, userId, true);
          }
        }, 1500);
      }
    } finally {
      clearTimeout(watchdog);
      watchdogCleared = true;
      setLoading(false);
      // Si quedó un forceRefresh pendiente, ejecutarlo (solo uno)
      if (pendingForceRef.current) {
        const pending = pendingForceRef.current;
        pendingForceRef.current = null;
        // Pequeño delay para permitir que React procese estado previo
        setTimeout(() => {
          if (!loadingRef.current) {
            loadProducts(pending.businessId, pending.userId, true);
          }
        }, 50);
      }
    }
  }, [setProducts, setLoading, setError, setCache]); // DEPENDENCIAS CORREGIDAS

  const refreshProducts = useCallback(async (businessId: string, userId: string) => {
    await loadProducts(businessId, userId, true);
  }, [loadProducts]);

  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts(prev => {
      const newProducts = prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      // Mantener el mismo orden para evitar re-renderizados
      return newProducts;
    });
    
    // Actualizar cache de forma optimizada
    const cacheKey = `${updatedProduct.business_id}-${updatedProduct.user_id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      const updatedData = cached.data.map(p => 
        p.id === updatedProduct.id ? updatedProduct : p
      );
      setCache(prev => new Map(prev.set(cacheKey, { data: updatedData, timestamp: Date.now() })));
    }
  }, [cache]);

  const addProduct = useCallback((newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    
    // Actualizar cache
    const cacheKey = `${newProduct.business_id}-${newProduct.user_id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      const updatedData = [newProduct, ...cached.data];
      setCache(prev => new Map(prev.set(cacheKey, { data: updatedData, timestamp: Date.now() })));
    }
  }, [cache]);

  const removeProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    
    // Actualizar todos los caches que contengan este producto
    setCache(prev => {
      const newCache = new Map();
      prev.forEach((value, key) => {
        const updatedData = value.data.filter(p => p.id !== productId);
        newCache.set(key, { data: updatedData, timestamp: Date.now() });
      });
      return newCache;
    });
  }, []);

  const getProductsForBusiness = useCallback((businessId: string) => {
    return products.filter(p => p.business_id === businessId);
  }, [products]);

  const invalidateCache = useCallback((businessId?: string, userId?: string) => {
    if (DEBUG) console.log('[ProductsContext] 🗑️ Invalidando cache', { businessId, userId });
    
    if (businessId && userId) {
      // Invalidar cache específico
      const cacheKey = `${businessId}-${userId}`;
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });
      
      // También limpiar intentos de fallback
      emptyAttemptsRef.current.delete(cacheKey);
      fallbackAttemptsRef.current.delete(businessId);
      
      if (DEBUG) console.log('[ProductsContext] ✅ Cache invalidado para', cacheKey);
    } else {
      // Invalidar todo el cache
      setCache(new Map());
      emptyAttemptsRef.current.clear();
      fallbackAttemptsRef.current.clear();
      
      if (DEBUG) console.log('[ProductsContext] ✅ Todo el cache invalidado');
    }
  }, []);

  const value: ProductsContextType = {
    products,
    loading,
    error,
    loadProducts,
    refreshProducts,
    updateProduct,
    addProduct,
    removeProduct,
    getProductsForBusiness,
    invalidateCache
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};
