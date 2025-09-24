import { supabase } from './client';

export interface UserLimits {
  max_products: number | null;
  max_stock_per_product: number | null;
  max_categories: number | null;
  max_suppliers: number | null;
  max_users: number | null;
  plan_type: string;
  plan_name: string;
}

export interface UsageStats {
  products_count: number;
  categories_count: number;
  suppliers_count: number;
  users_count: number;
  total_stock: number;
}

export const usageService = {
  // Obtener límites del usuario basado en su plan
  getUserLimits: async (userId: string): Promise<UserLimits | null> => {
    try {
      console.log('🔄 getUserLimits called for userId:', userId);
      
      // Timeout de 5 segundos para evitar que se cuelgue
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('getUserLimits timeout')), 5000);
      });
      
      const rpcPromise = supabase.rpc('get_user_current_plan', {
        user_id: userId
      });
      
      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);

      if (error) {
        // Si la función no existe, devolver límites por defecto para desarrollo
        if (error.code === 'PGRST202' || error.message.includes('Could not find the function')) {
          console.log('⚠️ RPC function get_user_current_plan not found, using default limits');
          return {
            max_products: null, // Sin límite
            max_stock_per_product: null, // Sin límite
            max_categories: null, // Sin límite
            max_suppliers: null, // Sin límite
            max_users: null, // Sin límite
            plan_type: 'free',
            plan_name: 'Plan Gratuito'
          };
        }
        console.error('Error getting user limits:', error);
        return null;
      }

      console.log('🔄 getUserLimits result:', data);
      return data;
    } catch (error) {
      console.error('Error in getUserLimits:', error);
      // En caso de error, devolver límites por defecto
      return {
        max_products: null, // Sin límite
        max_stock_per_product: null, // Sin límite
        max_categories: null, // Sin límite
        max_suppliers: null, // Sin límite
        max_users: null, // Sin límite
        plan_type: 'free',
        plan_name: 'Plan Gratuito'
      };
    }
  },

  // Verificar si el usuario puede agregar más productos
  canAddProduct: async (userId: string): Promise<boolean> => {
    try {
      // Verificar si la función RPC existe, si no, permitir por defecto
      const { data, error } = await supabase.rpc('check_user_limits', {
        user_id: userId,
        action: 'add_product'
      });

      if (error) {
        // Si la función no existe (PGRST202), permitir por defecto
        if (error.code === 'PGRST202' || error.message.includes('Could not find the function')) {
          console.log('⚠️ RPC function check_user_limits not found, allowing product creation by default');
          return true;
        }
        console.error('Error checking product limit:', error);
        return false;
      }

      return data?.can_add || false;
    } catch (error) {
      console.error('Error in canAddProduct:', error);
      // En caso de error, permitir por defecto para desarrollo
      return true;
    }
  },

  // Verificar si el usuario puede agregar más stock
  canAddStock: async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_user_limits', {
        user_id: userId,
        action: 'add_stock'
      });

      if (error) {
        console.error('Error checking stock limit:', error);
        return false;
      }

      return data?.can_add || false;
    } catch (error) {
      console.error('Error in canAddStock:', error);
      return false;
    }
  },

  // Verificar si el usuario puede agregar más categorías
  canAddCategory: async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_user_limits', {
        user_id: userId,
        action: 'add_category'
      });

      if (error) {
        console.error('Error checking category limit:', error);
        return false;
      }

      return data?.can_add || false;
    } catch (error) {
      console.error('Error in canAddCategory:', error);
      return false;
    }
  },

  // Verificar si el usuario puede agregar más proveedores
  canAddSupplier: async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_user_limits', {
        user_id: userId,
        action: 'add_supplier'
      });

      if (error) {
        console.error('Error checking supplier limit:', error);
        return false;
      }

      return data?.can_add || false;
    } catch (error) {
      console.error('Error in canAddSupplier:', error);
      return false;
    }
  },

  // Obtener estadísticas de uso del usuario
  getUsageStats: async (userId: string): Promise<UsageStats | null> => {
    try {
      const { data, error } = await supabase
        .from('ws_usage')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error getting usage stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUsageStats:', error);
      return null;
    }
  },

  // Crear suscripción gratuita para nuevo usuario
  createFreeSubscription: async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('create_free_subscription', {
        user_id: userId
      });

      if (error) {
        console.error('Error creating free subscription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createFreeSubscription:', error);
      return false;
    }
  },

  // Actualizar estadísticas de uso
  updateUsageStats: async (userId: string, stats: Partial<UsageStats>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ws_usage')
        .upsert({
          user_id: userId,
          ...stats,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating usage stats:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUsageStats:', error);
      return false;
    }
  }
};
