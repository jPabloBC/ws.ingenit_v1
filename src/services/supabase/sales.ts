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
  product_name?: string;
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
  business_id?: string; // soporte multi-negocio
  app_id?: string; // identificador de la app, NOT NULL en ws_sales
  items: Omit<SaleItem, 'id' | 'sale_id'>[];
}

export const getSales = async (): Promise<Sale[]> => {
  try {
    console.log('Fetching sales with items and products...');
    const { data, error } = await supabase
      .from('ws_sales')
      .select(`
        *,
        ws_sale_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales with joins:', error);
      return [];
    }

    // Mapear ws_sale_items a items para compatibilidad frontend
    const mapped = (data || []).map((sale: any) => ({
      ...sale,
      items: sale.ws_sale_items || []
    }));

    console.log('Consulta con joins exitosa, obtenidos', mapped.length, 'registros');
    return mapped;
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

    // --- Validación de stock previa (no insertar venta si algún item excede stock) ---
    if (!saleData.items || saleData.items.length === 0) {
      return { success: false, error: 'La venta no contiene ítems' };
    }

    const uniqueProductIds = Array.from(new Set(saleData.items.map(i => i.product_id)));
    const { data: productStocks, error: stockError } = await supabase
      .from('ws_products')
      .select('id, stock')
      .in('id', uniqueProductIds);

    if (stockError) {
      console.error('Error fetching product stocks:', stockError);
      return { success: false, error: 'No se pudieron validar los stocks' };
    }

    const stockMap = new Map<string, number>(
      (productStocks || []).map(p => [p.id, (p as any).stock || 0])
    );

    for (const item of saleData.items) {
      const available = stockMap.get(item.product_id);
      if (available === undefined) {
        return { success: false, error: 'Producto inexistente en inventario' };
      }
      if (available < item.quantity) {
        return { success: false, error: `Stock insuficiente para producto ${item.product_id} (solicitado ${item.quantity}, disponible ${available})` };
      }
    }
    
    // Preparar los datos de la venta sin la columna notes si no existe
    const DEFAULT_APP_ID = '550e8400-e29b-41d4-a716-446655440000';
    const resolvedAppId = saleData.app_id || DEFAULT_APP_ID;

    const saleInsertData: any = {
      user_id: saleData.user_id, // Agregar user_id
      customer_id: saleData.customer_id,
      total_amount: saleData.total_amount,
      payment_method: saleData.payment_method,
      status: saleData.status,
      app_id: resolvedAppId
    };

    // Agregar business_id si está disponible
    if (saleData.business_id) {
      saleInsertData.business_id = saleData.business_id;
    }
    
    // Solo agregar notes si está definido
    if (saleData.notes !== undefined && saleData.notes !== null) {
      saleInsertData.notes = saleData.notes;
    }
    
    const tryInsert = async (payload: any) => {
      return await supabase
        .from('ws_sales')
        .insert([payload])
        .select()
        .single();
    };

    let { data, error } = await tryInsert(saleInsertData);
    if (error) {
      // Si la columna business_id no existe en este entorno, reintentar sin ella
      const msg = (error.message || '').toLowerCase();
      if ((error.code === 'PGRST204' || msg.includes('business_id')) && saleInsertData.business_id) {
        console.warn('⚠️ ws_sales.business_id no existe en el esquema actual. Reintentando sin business_id.');
        delete saleInsertData.business_id;
        const retry = await tryInsert(saleInsertData);
        data = retry.data as any;
        error = retry.error as any;
      }
    }
    if (error) {
      console.error('Error creating sale:', error);
      return { success: false, error: error.message };
    }

    // Crear los items de la venta
    if (data && saleData.items.length > 0) {
      // Generador de UUID v4 compatible en navegador y Node
      const generateUUID = (): string => {
        try {
          const g: any = (globalThis as any);
          if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
        } catch (_) {}
        const rnd = (a?: number) => ((a ?? Math.random()) * 16) | 0;
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = rnd();
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      // Intento 1: insertar sin id, esperando que la BD tenga default en id
      let includeBusinessId = Boolean(saleData.business_id);
      // Asegura que cada item de venta guarde el nombre del producto
      const baseMap = (withId: boolean) => saleData.items.map(item => ({
        ...(withId ? { id: generateUUID() } : {}),
        ...item,
        product_name: item.product_name || '',
        sale_id: data.id,
        app_id: resolvedAppId,
        created_at: new Date().toISOString(),
        ...(includeBusinessId && saleData.business_id ? { business_id: saleData.business_id } : {})
      }));

      let saleItemsBase = baseMap(false);
      let itemsInserted = saleItemsBase;
      let insertError: any = null;
      // Primer intento
      {
        const { error: itemsError1 } = await supabase
          .from('ws_sale_items')
          .insert(saleItemsBase);
        insertError = itemsError1;
      }

      // Si la columna business_id no existe en esta tabla, reintentar sin business_id
      if (insertError) {
        const code0 = insertError.code || '';
        const message0 = insertError.message || '';
        const undefinedBusiness = code0 === '42703' || /business_id|column .* does not exist/i.test(message0);
        if (includeBusinessId && undefinedBusiness) {
          includeBusinessId = false;
          saleItemsBase = baseMap(false);
          const { error: itemsError0b } = await supabase
            .from('ws_sale_items')
            .insert(saleItemsBase);
          insertError = itemsError0b;
        }
      }

      if (insertError) {
        const code1 = insertError.code || '';
        const message1 = insertError.message || '';
        const isNullId = code1 === '23502' && /column "id"|columna "id"|null value in column "id"/i.test(message1);
        if (isNullId) {
          // Intento 2: asignar UUIDs locales para id (si la columna es uuid, funcionará)
          const saleItemsWithIds = baseMap(true);
          const { error: itemsError2 } = await supabase
            .from('ws_sale_items')
            .insert(saleItemsWithIds);
          if (itemsError2) {
            console.error('Error creating sale items (fallback with UUID):', itemsError2);
            const code2 = (itemsError2 as any).code || '';
            const message2 = (itemsError2 as any).message || '';
            const typeMismatch = code2 === '22P02' || code2 === '42804' || /invalid input syntax|uuid|integer/i.test(message2);
            if (typeMismatch) {
              return {
                success: false,
                error:
                  'No se pudo crear ws_sale_items: la columna id no tiene default y no es de tipo uuid. Ejecute fix-ws-sale-items-id-default.sql para configurar un default (secuencia o gen_random_uuid()).'
              };
            }
            return { success: false, error: (itemsError2 as any).message };
          }
          // Usaremos el arreglo con ids para las actualizaciones de stock
          itemsInserted = saleItemsWithIds;
        } else {
          // Mejorar feedback de error de inserción de items
          return { success: false, error: `No se pudieron guardar los productos de la venta: ${insertError.message}` };
        }
      }

      // Decrementar stock de los productos involucrados con control optimista
      for (const item of itemsInserted) {
        try {
          // Re-fetch para minimizar riesgo de condición de carrera
            const { data: productRow, error: fetchErr } = await supabase
              .from('ws_products')
              .select('id, stock')
              .eq('id', item.product_id)
              .single();
            if (fetchErr || !productRow) {
              throw new Error(`No se pudo leer stock de producto ${item.product_id}`);
            }
            const currentStock = (productRow as any).stock || 0;
            if (currentStock < item.quantity) {
              throw new Error(`Stock insuficiente durante confirmación (producto ${item.product_id})`);
            }
            const newStock = currentStock - item.quantity;
            // Control optimista: sólo actualizar si el stock sigue igual al leído
            const { data: updData, error: updErr } = await supabase
              .from('ws_products')
              .update({ stock: newStock })
              .eq('id', item.product_id)
              .eq('stock', currentStock)
              .select('id');
            if (updErr || !updData || updData.length === 0) {
              throw new Error(`Conflicto de stock al actualizar producto ${item.product_id}`);
            }
        } catch (e) {
          console.error('Error controlado actualizando stock, iniciando rollback de venta:', e);
          // Rollback best-effort: eliminar items y venta
          if (data?.id) {
            await supabase.from('ws_sale_items').delete().eq('sale_id', data.id);
            await supabase.from('ws_sales').delete().eq('id', data.id);
          }
          return { success: false, error: (e as Error).message };
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