import { supabase } from './client';
import { canAddProduct, canAddStock } from './subscriptions';

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  category_id: string;
  supplier_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  category_id: string;
  supplier_id?: string;
  image_url?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  stock?: number;
  min_stock?: number;
  category_id?: string;
  supplier_id?: string;
  image_url?: string;
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    console.log('Fetching products...');
    
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

export const createProduct = async (productData: CreateProductData, userId: string): Promise<{ success: boolean; data?: Product; error?: string }> => {
  try {
    console.log('Creating product:', productData);
    
    // Verificar límites de suscripción
    const { can, error: limitError } = await canAddProduct(userId);
    if (!can) {
      return { success: false, error: limitError };
    }

    // Verificar límite de stock por producto
    const { can: canAddStockResult, error: stockError } = await canAddStock(userId, 0, productData.stock);
    if (!canAddStockResult) {
      return { success: false, error: stockError };
    }
    
    // Filtrar campos undefined para permitir que el trigger de SKU funcione
    const cleanData = Object.fromEntries(
      Object.entries(productData).filter(([_, value]) => value !== undefined)
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
      const currentProduct = await getProduct(id);
      if (currentProduct) {
        const { can, error: stockError } = await canAddStock(userId, currentProduct.stock, updates.stock - currentProduct.stock);
        if (!can) {
          return { success: false, error: stockError };
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
    const { can, error: stockError } = await canAddStock(userId, currentProduct.stock, quantity - currentProduct.stock);
    if (!can) {
      return { success: false, error: stockError };
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