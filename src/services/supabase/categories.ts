import { supabase } from './client';

// Tras la migración add-business-id-to-ws-categories.sql asumimos que business_id existe.
// Conservamos estructura simple; si falla (entorno desactualizado) hacemos fallback sin filtro.

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description: string;
  color: string;
  store_type?: string;
  business_id?: string; // opcional hasta que exista la columna
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
}

export const getCategories = async (storeType?: string, businessId?: string): Promise<Category[]> => {
  try {
    // Verificar sesión primero
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return [];
    }
    
    if (!session) {
      return [];
    }
    
    // Consulta base inicial (posible filtrada)
    let query = supabase.from('ws_categories').select('*').order('name', { ascending: true }).limit(100);
    
    // Filtrar por store_type si se proporciona
    if (storeType) {
      query = query.eq('store_type', storeType);
    }
    // Filtrar por business_id directamente (columna asumida existente). Si falla por ausencia (entorno viejo), caeremos al catch.
    if (businessId) {
      query = query.eq('business_id', businessId);
    }
    
  const { data, error } = await query;

    if (error) {
      // Si la columna business_id no existe (ambiente no migrado), reintentar sin filtro.
      if (error.code === '42703' && /business_id/.test(error.message)) {
        console.warn('⚠️ ws_categories.business_id no existe aún. Fallback sin filtro.');
        const retry = await supabase.from('ws_categories').select('*').order('name', { ascending: true }).limit(100);
        if (retry.error) return [];
        return retry.data || [];
      }

      console.error('❌ Error fetching categories:', error);
      console.error('Error details:', {
        code: (error as any).code,
        message: (error as any).message,
        details: (error as any).details,
        hint: (error as any).hint
      });

      // Si hay error, devolver array vacío en casos conocidos
      if (error.code === 'PGRST116' || 
          error.message.includes('relation') || 
          error.message.includes('does not exist') ||
          error.message.includes('schema cache') ||
          error.code === 'PGRST200') {
        console.log('⚠️  Table ws_categories does not exist, returning empty array');
        return [];
      }
      if (error.code === 'PGRST301' || error.message.includes('RLS') || error.message.includes('policy')) {
        console.log('⚠️  RLS policy error, user may not have access to categories');
        return [];
      }
      return [];
    }

    // Si no hay resultados y se aplicó algún filtro, intentar fallback sin filtros para diagnóstico
    if ((data?.length || 0) === 0 && (storeType || businessId)) {
      console.warn('⚠️ 0 categorías con filtros. Intentando fallback sin filtros para diagnóstico. storeType=', storeType, 'businessFilterApplied=', !!businessId);
      const fallback = await supabase
        .from('ws_categories')
        .select('*')
        .order('name', { ascending: true })
        .limit(100);
      if (fallback.error) {
        console.error('❌ Fallback categories error:', fallback.error);
        return [];
      }
      console.log('✅ Fallback categorías sin filtros:', fallback.data?.length || 0);
      if ((fallback.data?.length || 0) > 0 && storeType) {
        const distinctStoreTypes = Array.from(new Set(fallback.data!.map(c => (c as any).store_type)));
        console.log('🔍 store_type solicitada=', storeType, 'store_types en BD=', distinctStoreTypes);
      }
      // Devolver fallback solo para visualización (no re-filtramos). El frontend mostrará todas si hay.
      return fallback.data || [];
    }

  // console.log('✅ Categories fetched successfully:', data?.length || 0, 'storeTypeFilter=', storeType, 'businessFilterApplied=', !!businessId);
    if (data && data.length > 0) {
      // console.log('📂 Sample category:', { id: data[0].id, name: data[0].name, store_type: (data[0] as any).store_type });
    }
    return data || [];
  } catch (error) {
    console.error('Error in getCategories:', error);
    // En caso de cualquier error, devolver array vacío
    return [];
  }
};

export const getCategory = async (id: string): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('ws_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCategory:', error);
    return null;
  }
};

export const createCategory = async (categoryData: CreateCategoryData, opts?: { businessId?: string }): Promise<Category | null> => {
  try {
    const payload: CreateCategoryData = { ...categoryData };
    if (opts?.businessId) {
      payload.business_id = opts.businessId;
    }
    console.log('Creating category:', payload);
    
    const { data, error } = await supabase
      .from('ws_categories')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    console.log('Category created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createCategory:', error);
    throw error;
  }
};

export const updateCategory = async (id: string, updates: UpdateCategoryData): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('ws_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateCategory:', error);
    return null;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ws_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    return false;
  }
}; 