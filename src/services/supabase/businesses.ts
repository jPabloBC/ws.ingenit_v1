import { supabase } from '@/services/supabase/client';

export interface Business {
  id: string;
  user_id: string;
  name: string;
  store_type: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  configuration: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessData {
  name: string;
  store_type: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  configuration?: Record<string, any>;
}

export interface UpdateBusinessData {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  configuration?: Record<string, any>;
  is_active?: boolean;
}

export const businessesService = {
  // Obtener todos los negocios del usuario
  getUserBusinesses: async (userId: string): Promise<Business[]> => {
    try {
      const { data, error } = await supabase
        .from('ws_businesses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user businesses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserBusinesses:', error);
      return [];
    }
  },

  // Obtener un negocio específico
  getBusiness: async (businessId: string): Promise<Business | null> => {
    try {
      const { data, error } = await supabase
        .from('ws_businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (error) {
        console.error('Error fetching business:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBusiness:', error);
      return null;
    }
  },

  // Crear un nuevo negocio
  createBusiness: async (businessData: CreateBusinessData, userId: string): Promise<{ success: boolean; data?: Business; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('ws_businesses')
        .insert([{
          ...businessData,
          user_id: userId,
          configuration: businessData.configuration || {}
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating business:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createBusiness:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  },

  // Actualizar un negocio
  updateBusiness: async (businessId: string, updateData: UpdateBusinessData): Promise<{ success: boolean; data?: Business; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('ws_businesses')
        .update(updateData)
        .eq('id', businessId)
        .select()
        .single();

      if (error) {
        console.error('Error updating business:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateBusiness:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  },

  // Desactivar un negocio (soft delete)
  deactivateBusiness: async (businessId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('ws_businesses')
        .update({ is_active: false })
        .eq('id', businessId);

      if (error) {
        console.error('Error deactivating business:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deactivateBusiness:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  },

  // Obtener negocios por tipo de tienda
  getBusinessesByStoreType: async (userId: string, storeType: string): Promise<Business[]> => {
    try {
      const { data, error } = await supabase
        .from('ws_businesses')
        .select('*')
        .eq('user_id', userId)
        .eq('store_type', storeType)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching businesses by store type:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBusinessesByStoreType:', error);
      return [];
    }
  },

  // Crear negocios automáticamente basados en store_types del usuario
  createDefaultBusinesses: async (userId: string, storeTypes: string[]): Promise<{ success: boolean; businesses?: Business[]; error?: string }> => {
    try {
      const businessesToCreate = storeTypes.map(storeType => ({
        user_id: userId,
        name: `Mi ${storeType.charAt(0).toUpperCase() + storeType.slice(1)}`,
        store_type: storeType,
        description: `Negocio principal de ${storeType}`,
        configuration: {}
      }));

      const { data, error } = await supabase
        .from('ws_businesses')
        .insert(businessesToCreate)
        .select();

      if (error) {
        console.error('Error creating default businesses:', error);
        return { success: false, error: error.message };
      }

      return { success: true, businesses: data };
    } catch (error) {
      console.error('Error in createDefaultBusinesses:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
};
