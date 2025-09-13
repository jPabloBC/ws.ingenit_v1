import { supabaseAdmin as supabase } from './admin';

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
  user_id: string;
  customer_id?: string;
  total_amount: number;
  payment_method: string;
  status: string;
  notes?: string;
  items: Omit<SaleItem, 'id' | 'sale_id'>[];
}

export const getSales = async (): Promise<Sale[]> => {
  try {
    console.log('Fetching sales...');
    
    // Primero intentar una consulta simple para verificar que la tabla existe
    const { data: simpleData, error: simpleError } = await supabase
      .from('ws_sales')
      .select('id, total_amount, payment_method, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (simpleError) {
      console.error('Error en consulta simple:', simpleError);
      return [];
    }

    console.log('Consulta simple exitosa, obtenidos', simpleData?.length || 0, 'registros');

    // Ahora intentar la consulta completa con joins
    try {
      // Usar una consulta SQL directa para evitar problemas con el esquema cache
      const { data, error } = await supabase
        .rpc('get_sales_with_items', {});

      if (error) {
        console.error('Error fetching sales with RPC:', error);
        // Si falla la consulta RPC, intentar con joins automáticos
        const { data: joinData, error: joinError } = await supabase
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

        if (joinError) {
          console.error('Error fetching sales with joins:', joinError);
          // Si falla la consulta con joins, devolver los datos simples con valores por defecto
          return (simpleData || []).map(item => ({
            ...item,
            sale_number: item.id || '',
            customer_id: null,
            notes: null,
            updated_at: item.created_at || new Date().toISOString()
          }));
        }

        console.log('Consulta con joins exitosa, obtenidos', joinData?.length || 0, 'registros');
        return joinData || [];
      }

      console.log('Consulta RPC exitosa, obtenidos', data?.length || 0, 'registros');
      console.log('Primera venta de RPC:', data?.[0]);
      return data || [];
    } catch (joinError) {
      console.error('Error en consulta con joins:', joinError);
      // Si hay un error en los joins, devolver los datos simples con valores por defecto
      return (simpleData || []).map(item => ({
        ...item,
        sale_number: item.id || '',
        customer_id: null,
        notes: null,
        updated_at: item.created_at || new Date().toISOString()
      }));
    }
  } catch (error) {
    console.error('Error in getSales:', error);
    return [];
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

export const createSale = async (saleData: CreateSaleData): Promise<{ success: boolean; data?: Sale; error?: string }> => {
  try {
    console.log('Creating sale:', saleData);
    
    // Preparar los datos de la venta sin la columna notes si no existe
    const saleInsertData: any = {
      user_id: saleData.user_id, // Agregar user_id
      customer_id: saleData.customer_id,
      total_amount: saleData.total_amount,
      payment_method: saleData.payment_method,
      status: saleData.status
    };
    
    // Solo agregar notes si está definido
    if (saleData.notes !== undefined && saleData.notes !== null) {
      saleInsertData.notes = saleData.notes;
    }
    
    const { data, error } = await supabase
      .from('ws_sales')
      .insert([saleInsertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating sale:', error);
      return { success: false, error: error.message };
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
        return { success: false, error: itemsError.message };
      }

      // Decrementar stock de los productos involucrados
      for (const item of saleItems) {
        try {
          const { data: productRow, error: fetchErr } = await supabase
            .from('ws_products')
            .select('id, stock')
            .eq('id', item.product_id)
            .single();
          if (fetchErr || !productRow) continue;
          const newStock = Math.max(0, (productRow.stock || 0) - (item.quantity || 0));
          const { error: updErr } = await supabase
            .from('ws_products')
            .update({ stock: newStock })
            .eq('id', item.product_id);
          if (updErr) {
            console.error('Error updating product stock:', updErr);
          }
        } catch (e) {
          console.error('Unexpected error updating stock:', e);
        }
      }
    }

    console.log('Sale created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in createSale:', error);
    return { success: false, error: 'Error interno del servidor' };
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