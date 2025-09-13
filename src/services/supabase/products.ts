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

export const getProducts = async (): Promise<Product[]> => {
  try {
    console.log('Fetching products...');
    
    // Primero verificar si el usuario está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.id);
    
    const { data, error } = await supabase
      .from('ws_products')
      .select(`
        *,
        ws_categories(name),
        ws_suppliers(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    console.log('Products fetched successfully:', data?.length || 0);
    console.log('Sample product:', data?.[0]);
    return data || [];
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw error;
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

export const createProduct = async (productData: CreateProductData, userId: string, storeType?: string): Promise<{ success: boolean; data?: Product; error?: string }> => {
  try {
    console.log('Creating product:', productData);
    
    // Verificar límites de suscripción
    const canAdd = await usageService.canAddProduct(userId);
    if (!canAdd) {
      return { success: false, error: 'No puedes agregar más productos. Actualiza tu plan.' };
    }

    // Verificar límite de stock por producto
    const userLimits = await usageService.getUserLimits(userId);
    if (userLimits && userLimits.max_stock_per_product !== null) {
      if (productData.stock > userLimits.max_stock_per_product) {
        return { 
          success: false, 
          error: `El stock máximo permitido es ${userLimits.max_stock_per_product} unidades. Actualiza tu plan para aumentar el límite.` 
        };
      }
    }
    
    // Agregar user_id y store_type para la generación de SKU
    const productDataWithUser = {
      ...productData,
      user_id: userId,
      store_type: storeType || 'almacen' // Default si no se proporciona
    };
    
    // Filtrar campos undefined para permitir que el trigger de SKU funcione
    const cleanData = Object.fromEntries(
      Object.entries(productDataWithUser).filter(([_, value]) => value !== undefined)
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