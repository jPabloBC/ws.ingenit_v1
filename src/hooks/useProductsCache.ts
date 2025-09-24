import { useState, useEffect, useCallback } from 'react';
import { useDataCache } from './useDataCache';
import { getProducts } from '@/services/supabase/products';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  cost: number;
  min_stock: number;
  category_id: string;
  business_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  ws_categories?: { name: string };
  ws_suppliers?: { name: string };
}

export const useProductsCache = (businessId: string | null, userId: string | null) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cache = useDataCache<Product[]>(`products-${businessId}-${userId}`, {
    ttl: 2 * 60 * 1000, // 2 minutos TTL
    maxAge: 5 * 60 * 1000 // 5 minutos máximo
  });

  const loadProducts = useCallback(async (forceRefresh = false) => {
    if (!businessId || !userId) {
      setProducts([]);
      return;
    }

    const cacheKey = `products-${businessId}-${userId}`;
    
    // Si ya está cargando, no hacer otra petición
    if (cache.isLoading(cacheKey)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await cache.getOrFetch(
        cacheKey,
        () => getProducts(businessId),
        forceRefresh
      );

      if (data) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [businessId, userId, cache]);

  // Cargar productos solo cuando cambian los parámetros esenciales
  useEffect(() => {
    if (businessId && userId) {
      loadProducts();
    }
  }, [businessId, userId]); // Solo dependencias esenciales

  const refreshProducts = useCallback(() => {
    loadProducts(true);
  }, [loadProducts]);

  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts(prev => 
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    
    // Actualizar cache
    const cacheKey = `products-${businessId}-${userId}`;
    const currentData = cache.get(cacheKey);
    if (currentData) {
      const updatedData = currentData.map(p => 
        p.id === updatedProduct.id ? updatedProduct : p
      );
      cache.set(cacheKey, updatedData);
    }
  }, [businessId, userId, cache]);

  const addProduct = useCallback((newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    
    // Actualizar cache
    const cacheKey = `products-${businessId}-${userId}`;
    const currentData = cache.get(cacheKey);
    if (currentData) {
      cache.set(cacheKey, [newProduct, ...currentData]);
    }
  }, [businessId, userId, cache]);

  const removeProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    
    // Actualizar cache
    const cacheKey = `products-${businessId}-${userId}`;
    const currentData = cache.get(cacheKey);
    if (currentData) {
      const updatedData = currentData.filter(p => p.id !== productId);
      cache.set(cacheKey, updatedData);
    }
  }, [businessId, userId, cache]);

  return {
    products,
    loading,
    error,
    loadProducts,
    refreshProducts,
    updateProduct,
    addProduct,
    removeProduct
  };
};


