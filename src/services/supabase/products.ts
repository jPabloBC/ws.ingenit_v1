import { supabase } from './client';
import { usageService } from './usage';

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode?: string | null;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  category_id: string;
  supplier_id: string | null;
  image_url: string | null;
  brand?: string | null;
  user_id?: string | null;
  store_type?: string | null;
  business_id?: string | null; // Nueva columna para multi-negocio
  app_id?: string | null;
  // Extended OFF metadata (optional)
  general_name?: string | null;
  quantity?: string | null;
  packaging?: string | null;
  labels?: string[] | null;
  categories_list?: string[] | null;
  countries_sold?: string[] | null;
  origin_ingredients?: string | null;
  manufacturing_places?: string | null;
  traceability_code?: string | null;
  official_url?: string | null;
  off_metadata?: any | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  barcode?: string;
  brand?: string;
  sku?: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  category_id?: string;
  supplier_id?: string;
  image_url?: string;
  business_id?: string; // Nueva columna para multi-negocio
  app_id?: string; // Identificador de la aplicación
  general_name?: string;
  quantity?: string;
  packaging?: string;
  labels?: string[];
  categories_list?: string[];
  countries_sold?: string[];
  origin_ingredients?: string;
  manufacturing_places?: string;
  traceability_code?: string;
  official_url?: string;
  off_metadata?: any;
  user_id?: string;
  store_type?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  barcode?: string | null;
  brand?: string | null;
  price?: number;
  cost?: number;
  stock?: number;
  min_stock?: number;
  category_id?: string;
  supplier_id?: string;
  image_url?: string;
  general_name?: string | null;
  quantity?: string | null;
  packaging?: string | null;
  labels?: string[] | null;
  categories_list?: string[] | null;
  countries_sold?: string[] | null;
  origin_ingredients?: string | null;
  manufacturing_places?: string | null;
  traceability_code?: string | null;
  official_url?: string | null;
  off_metadata?: any | null;
}

export const getProducts = async (businessId?: string): Promise<Product[]> => {
  try {
    console.log('🔄 Fetching products...');

    if (!businessId) {
      console.warn('⚠️ getProducts llamado sin businessId. Devolviendo lista vacía para forzar selección de negocio.');
      return [];
    }
    
    // Verificar sesión primero
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return [];
    }
    
    if (!session) {
      console.log('⚠️  No active session, returning empty products');
      return [];
    }
    
    console.log('✅ Active session found for user:', session.user.email);
    
    // Timeout individual para productos (5 segundos)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Products timeout')), 5000)
    );
    
    // Consulta filtrada por business_id para aislamiento multi-negocio
    let queryPromise = supabase
      .from('ws_products')
      .select('*')
      .eq('user_id', session.user.id); // Solo productos del usuario actual
    
    // Filtrar por business_id (ya validado arriba)
    queryPromise = queryPromise.eq('business_id', businessId);
    
    queryPromise = queryPromise.order('created_at', { ascending: false });

    console.log('📊 Executing query...');
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('❌ Error fetching products:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Si no existe la tabla o hay problemas de relación, devolver array vacío
      if (error.code === 'PGRST116' || 
          error.message.includes('relation') || 
          error.message.includes('does not exist') ||
          error.message.includes('schema cache') ||
          error.code === 'PGRST200' ||
          error.message.includes('timeout')) {
        console.log('⚠️  Table ws_products does not exist or timeout, returning empty array');
        return [];
      }
      
      // Si es un error de RLS o permisos
      if (error.code === 'PGRST301' || error.message.includes('RLS') || error.message.includes('policy')) {
        console.log('⚠️  RLS policy error, user may not have access to products');
        return [];
      }
      
      // Si la columna business_id todavía no existe (migración pendiente)
      if (error.message && error.message.toLowerCase().includes('business_id')) {
        console.warn('⚠️  Column business_id missing. Returning empty products until migration runs.');
        return [];
      }
      throw error;
    }

    console.log('✅ Products fetched successfully:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📦 Sample product:', {
        id: data[0].id,
        name: data[0].name,
        sku: data[0].sku,
        user_id: data[0].user_id,
        business_id: data[0].business_id
      });
    }
    return data || [];
  } catch (error) {
    console.error('❌ Error in getProducts:', error);
    // En caso de cualquier error, devolver array vacío para que la página funcione
    return [];
  }
};

export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('ws_products')
      .select(`
        *,
        ws_categories(name),
        ws_suppliers(name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getProduct:', error);
    return null;
  }
};

interface CreateProductOptions { businessId: string }

export const createProduct = async (productData: CreateProductData, options: CreateProductOptions): Promise<{ success: boolean; data?: Product; error?: string }> => {
  try {
    console.log('Creating product:', productData);
    if (!options?.businessId) {
      console.error('createProduct called without businessId');
      return { success: false, error: 'Business no seleccionado' };
    }
    
    // Obtener sesión actual para user_id
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Usuario no autenticado' };
    }
    
    // Determinar app_id: usar el proporcionado, o intentar derivarlo de un perfil futuro (no disponible aquí), o fallback constante
    const DEFAULT_APP_ID = '550e8400-e29b-41d4-a716-446655440000';
    const resolvedAppId = productData.app_id || DEFAULT_APP_ID;

    // Normalizar y preparar base de inserción
    const productDataWithBusiness: any = {
      ...productData,
      user_id: session.user.id,
      business_id: options.businessId,
      app_id: resolvedAppId
    };

    // Generar SKU numérico si no viene: timestamp (en segundos) + 4 dígitos aleatorios
    const makeNumericSku = () => {
      const ts = Math.floor(Date.now() / 1000); // segundos desde epoch
      const rand4 = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
      return `${ts}${rand4}`;
    };

    // Garantizar unicidad por user+business con hasta 3 reintentos
    const ensureUniqueNumericSku = async (): Promise<string> => {
      if (productDataWithBusiness.sku) return productDataWithBusiness.sku;
      for (let i = 0; i < 3; i++) {
        const candidate = makeNumericSku();
        const { data: exists, error: qErr } = await supabase
          .from('ws_products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', productDataWithBusiness.user_id)
          .eq('business_id', productDataWithBusiness.business_id)
          .eq('sku', candidate);
        if (qErr) {
          console.warn('SKU uniqueness check failed, proceeding with candidate:', qErr);
          return candidate;
        }
        if (!exists) return candidate;
      }
      return makeNumericSku();
    };

    if (!productDataWithBusiness.sku) {
      productDataWithBusiness.sku = await ensureUniqueNumericSku();
    }
    
    // Filtrar campos undefined para permitir que el trigger de SKU funcione
    const cleanData = Object.fromEntries(
      Object.entries(productDataWithBusiness).filter(([_, value]) => value !== undefined)
    );

    const { data, error } = await supabase
      .from('ws_products')
      .insert([cleanData])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }

    console.log('Product created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in createProduct:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

export const updateProduct = async (id: string, updates: UpdateProductData, userId: string): Promise<{ success: boolean; data?: Product; error?: string }> => {
  try {
    // Si se está actualizando el stock, verificar límites
    if (updates.stock !== undefined) {
      const userLimits = await usageService.getUserLimits(userId);
      if (userLimits && userLimits.max_stock_per_product !== null) {
        if (updates.stock > userLimits.max_stock_per_product) {
          return { 
            success: false, 
            error: `El stock máximo permitido es ${userLimits.max_stock_per_product} unidades. Actualiza tu plan para aumentar el límite.` 
          };
        }
      }
    }

    const { data, error } = await supabase
      .from('ws_products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ws_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return false;
  }
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('ws_products')
      .select(`
        *,
        ws_categories(name),
        ws_suppliers(name)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchProducts:', error);
    throw error;
  }
};

export const updateStock = async (id: string, quantity: number, userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Obtener el producto actual para verificar límites
    const currentProduct = await getProduct(id);
    if (!currentProduct) {
      return { success: false, error: 'Producto no encontrado' };
    }

    // Verificar límite de stock por producto
    const canAddStockResult = await usageService.canAddStock(userId);
    if (!canAddStockResult) {
      return { success: false, error: 'No puedes agregar más stock. Actualiza tu plan.' };
    }

    const { error } = await supabase
      .from('ws_products')
      .update({ stock: quantity })
      .eq('id', id);

    if (error) {
      console.error('Error updating stock:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateStock:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}; 