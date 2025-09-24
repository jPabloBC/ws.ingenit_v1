'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCategories } from '@/services/supabase/categories';

interface Category {
  id: string;
  name: string;
  store_type?: string;
  business_id?: string;
  created_at: string;
}

interface CategoriesContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  loadCategories: (forceRefresh?: boolean) => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};

interface CategoriesProviderProps {
  children: React.ReactNode;
}

export const CategoriesProvider: React.FC<CategoriesProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<{ data: Category[]; timestamp: number } | null>(null);

  // Cargar cache desde sessionStorage al inicializar
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('categories-cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Verificar si los datos no son muy viejos (10 minutos)
        if (now - parsed.timestamp < 10 * 60 * 1000) {
          setCategories(parsed.data);
          setCache(parsed);
        }
      }
    } catch (error) {
      console.warn('Error loading categories cache:', error);
    }
  }, []);

  // Guardar cache en sessionStorage cuando cambie
  useEffect(() => {
    if (cache) {
      try {
        sessionStorage.setItem('categories-cache', JSON.stringify(cache));
      } catch (error) {
        console.warn('Error saving categories cache:', error);
      }
    }
  }, [cache]);

  const loadCategories = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Verificar cache primero
    if (!forceRefresh && cache && now - cache.timestamp < 5 * 60 * 1000) { // 5 minutos TTL
      setCategories(cache.data);
      return;
    }

    // Evitar cargas múltiples simultáneas
    if (loading) {
      console.log('📂 CategoriesContext: Already loading, skipping...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getCategories();
      // console.log('📂 CategoriesContext: Categories loaded:', data.length);
      
      // Actualizar cache
      const newCache = { data, timestamp: now };
      setCache(newCache);
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, [cache, loading]);

  const refreshCategories = useCallback(async () => {
    await loadCategories(true);
  }, [loadCategories]);

  const value: CategoriesContextType = {
    categories,
    loading,
    error,
    loadCategories,
    refreshCategories
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};
