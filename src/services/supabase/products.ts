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
  barcode?: string;
  brand?: string;
  sku?: string;
  price?: number;
  cost?: number;
  stock?: number;
  min_stock?: number;
  category_id?: string;
  supplier_id?: string | null;
  image_url?: string | null;
}

export const getProducts = async (businessId?: string): Promise<Product[]> => {
  // Política nueva: SOLO devolvemos [] cuando realmente no hay datos (businessId faltante o consulta vacía).
  // Cualquier condición anómala lanza error para que la capa superior decida sin borrar el estado previo.
  if (!businessId) {
    return [];
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`SESSION_ERROR:${sessionError.message}`);
  }
  if (!session) {
    throw new Error('NO_SESSION');
  }

  const { data, error } = await supabase
    .from('ws_products')
    .select('id,name,description,sku,stock,price,cost,min_stock,category_id,supplier_id,image_url,created_at,updated_at,barcode,brand,user_id,store_type,business_id,app_id,general_name,quantity,packaging,labels,categories_list,countries_sold,origin_ingredients,manufacturing_places,traceability_code,official_url,off_metadata')
    .eq('user_id', session.user.id)
    .eq('business_id', businessId)
    .limit(50);

  if (error) {
    // Clasificar algunos errores conocidos para posible fallback
    const meta = {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    };
    // Errores de ausencia de tabla o migraciones: lanzar con prefijo para manejo específico
    if (
      error.code === 'PGRST116' ||
      error.message.includes('relation') ||
      error.message.includes('does not exist') ||
      error.message.includes('schema cache') ||
      error.code === 'PGRST200'
    ) {
      throw new Error('STRUCTURE_ERROR:' + JSON.stringify(meta));
    }
    if (error.message.includes('timeout')) {
      throw new Error('TIMEOUT_ERROR:' + JSON.stringify(meta));
    }
    if (error.code === 'PGRST301' || error.message.includes('RLS') || error.message.includes('policy')) {
      throw new Error('RLS_ERROR:' + JSON.stringify(meta));
    }
    throw new Error('GENERIC_DB_ERROR:' + JSON.stringify(meta));
  }

  return (data || []).map((item) => ({
    ...item,
    description: item.description ?? '',
    supplier_id: item.supplier_id ?? null,
    image_url: item.image_url ?? null,
    created_at: item.created_at ?? '',
    updated_at: item.updated_at ?? '',
    barcode: item.barcode ?? null,
    brand: item.brand ?? null,
    user_id: item.user_id ?? null,
    store_type: item.store_type ?? null,
    business_id: item.business_id ?? null,
    app_id: item.app_id ?? null,
    general_name: item.general_name ?? null,
    quantity: item.quantity ?? null,
    packaging: item.packaging ?? null,
    labels: item.labels ?? null,
    categories_list: item.categories_list ?? null,
    countries_sold: item.countries_sold ?? null,
    origin_ingredients: item.origin_ingredients ?? null,
    manufacturing_places: item.manufacturing_places ?? null,
    traceability_code: item.traceability_code ?? null,
    official_url: item.official_url ?? null,
    off_metadata: item.off_metadata ?? null
  }));
};

// Obtener productos por business_id sin filtrar por user_id
// Útil para paneles o diagnósticos donde algunas filas históricas carecen de user_id
export const getProductsByBusiness = async (businessId: string): Promise<Product[]> => {
  try {
    if (!businessId) return [];

    // Timeout corto para evitar bloqueos
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('ProductsByBusiness timeout')), 5000)
    );

    const queryPromise = supabase
      .from('ws_products')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
    if (error) {
      console.warn('⚠️ getProductsByBusiness error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('⚠️ getProductsByBusiness exception:', err);
    return [];
  }
};

export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('ws_products')
      .select('*')
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

export const updateProduct = async (
  id: string,
  updates: UpdateProductData,
  userId: string,
  businessId?: string | null
): Promise<{ success: boolean; data?: Product; error?: string }> => {
  try {
    const res = await fetch('/api/products/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates, userId, businessId })
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.success) {
      return { success: false, error: payload?.error || `HTTP ${res.status}` };
    }
    return { success: true, data: payload.data };
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return { success: false, error: (error as any)?.message || 'Error interno del servidor' };
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