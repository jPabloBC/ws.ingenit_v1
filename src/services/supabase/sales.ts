import { supabase } from './client';

export interface Sale {
  id: string;
  sale_number: string;
  customer_id: string | null;
  total_amount: number;
  payment_method: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    name: string;
    email: string;
  };
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    name: string;
    sku: string;
  };
}

export interface CreateSaleData {
  customer_id?: string;
  total_amount: number;
  payment_method: string;
  status: string;
  notes?: string;
  items: Omit<SaleItem, 'id' | 'sale_id'>[];
}

export const getSales = async (): Promise<Sale[]> => {
  try {
    const { data, error } = await supabase
      .from('ws_sales')
      .select(`
        *,
        ws_customers(name, email),
        ws_sale_items(
          *,
          ws_products(name, sku)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSales:', error);
    throw error;
  }
};

export const getSale = async (id: string): Promise<Sale | null> => {
  try {
    const { data, error } = await supabase
      .from('ws_sales')
      .select(`
        *,
        ws_customers(name, email),
        ws_sale_items(
          *,
          ws_products(name, sku)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching sale:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSale:', error);
    return null;
  }
};

export const createSale = async (saleData: CreateSaleData): Promise<Sale | null> => {
  try {
    console.log('Creating sale:', saleData);
    
    const { data, error } = await supabase
      .from('ws_sales')
      .insert([{
        customer_id: saleData.customer_id,
        total_amount: saleData.total_amount,
        payment_method: saleData.payment_method,
        status: saleData.status,
        notes: saleData.notes
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating sale:', error);
      throw error;
    }

    // Crear los items de la venta
    if (data && saleData.items.length > 0) {
      const saleItems = saleData.items.map(item => ({
        ...item,
        sale_id: data.id
      }));

      const { error: itemsError } = await supabase
        .from('ws_sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('Error creating sale items:', itemsError);
        throw itemsError;
      }
    }

    console.log('Sale created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createSale:', error);
    throw error;
  }
};

export const updateSale = async (id: string, updates: Partial<Sale>): Promise<Sale | null> => {
  try {
    const { data, error } = await supabase
      .from('ws_sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sale:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateSale:', error);
    return null;
  }
};

export const deleteSale = async (id: string): Promise<boolean> => {
  try {
    // Primero eliminar los items de la venta
    const { error: itemsError } = await supabase
      .from('ws_sale_items')
      .delete()
      .eq('sale_id', id);

    if (itemsError) {
      console.error('Error deleting sale items:', itemsError);
      return false;
    }

    // Luego eliminar la venta
    const { error } = await supabase
      .from('ws_sales')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting sale:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSale:', error);
    return false;
  }
};

export const generateSaleNumber = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .rpc('generate_sale_number');

    if (error) {
      console.error('Error generating sale number:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in generateSaleNumber:', error);
    throw error;
  }
}; 