import { supabase } from '@/services/supabase/client';

export interface PublicProduct {
  id?: string;
  barcode?: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  price?: number;
  image_url?: string;
  quantity?: string;
  packaging?: string;
  country?: string;
  source?: string;
  verified?: boolean;
  verification_count?: number;
  created_at?: string;
  created_by?: string;
  // Información nutricional
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

// Convert PublicProduct to ProductApiResult format
export const convertToProductApiResult = (product: PublicProduct): any => {
  return {
    id: `public_${product.id}`,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image_url,
    brand: product.brand,
    category: product.category,
    barcode: product.barcode,
    source: 'api' as const,
    api_name: 'Productos Públicos',
    quantity: product.quantity,
    packaging: product.packaging,
    country: product.country || 'Chile',
    nutrition_info: product.calories || product.protein || product.carbs || product.fat ? {
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat
    } : undefined,
    verified: product.verified,
    verification_count: product.verification_count
  };
};

// Buscar productos públicos por texto
export const searchPublicProducts = async (
  searchTerm: string, 
  limit: number = 20
): Promise<PublicProduct[]> => {
  try {
    // First try with RPC function (if it exists after migration)
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('search_public_products', {
          search_term: searchTerm,
          limit_count: limit
        });

      if (!rpcError) {
        return rpcData || [];
      }
    } catch (_rpcErr) {
      // RPC function doesn't exist, fall back to direct query
    }

    // Fallback: Use direct query (works with both table and VIEW)
    const { data, error } = await supabase
      .from('public_products')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order('verified', { ascending: false })
      .order('verification_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error buscando productos públicos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en searchPublicProducts:', error);
    return [];
  }
};

// Buscar producto por código de barras
export const searchPublicProductByBarcode = async (
  barcode: string
): Promise<PublicProduct | null> => {
  try {
    // First try with RPC function (if it exists after migration)
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('search_public_products_by_barcode', {
          barcode_input: barcode
        });

      if (!rpcError && rpcData && rpcData.length > 0) {
        return rpcData[0];
      }
    } catch (_rpcErr) {
      // RPC function doesn't exist, fall back to direct query
    }

    // Fallback: Use direct query (works with both table and VIEW)
    const { data, error } = await supabase
      .from('public_products')
      .select('*')
      .eq('barcode', barcode)
      .order('verified', { ascending: false })
      .order('verification_count', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      console.error('Error buscando producto por código de barras:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en searchPublicProductByBarcode:', error);
    return null;
  }
};

// Agregar producto a la tabla pública
export const addPublicProduct = async (
  product: Omit<PublicProduct, 'id' | 'created_at' | 'created_by' | 'verification_count'>
): Promise<PublicProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('public_products')
      .insert([{
        ...product,
        source: product.source || 'user_contributed'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error agregando producto público:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en addPublicProduct:', error);
    return null;
  }
};

// Verificar un producto (incrementar contador de verificación)
export const verifyPublicProduct = async (productId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('increment_product_verification', {
        product_id: productId
      });

    if (error) {
      console.error('Error verificando producto:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error en verifyPublicProduct:', error);
    return false;
  }
};

// Obtener productos públicos por categoría
export const getPublicProductsByCategory = async (
  category: string, 
  limit: number = 20
): Promise<PublicProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('public_products')
      .select('*')
      .eq('category', category)
      .order('verified', { ascending: false })
      .order('verification_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error obteniendo productos por categoría:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en getPublicProductsByCategory:', error);
    return [];
  }
};

// Convertir PublicProduct a ProductApiResult para compatibilidad
export const convertPublicProductToApiResult = (product: PublicProduct) => {
  return {
    id: `public_${product.id}`,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image_url,
    brand: product.brand,
    category: product.category,
    barcode: product.barcode,
    source: 'api' as const,
    api_name: 'Base Pública de Usuarios',
    quantity: product.quantity,
    packaging: product.packaging,
    country: product.country || 'Chile',
    nutrition_info: (product.calories || product.protein || product.carbs || product.fat) ? {
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat
    } : undefined,
    // Campos adicionales para mostrar verificación
    verified: product.verified,
    verification_count: product.verification_count
  };
};