import { supabase } from './client';

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'single' | 'double' | 'triple' | 'quad' | 'full';
  status: 'active' | 'inactive' | 'cancelled';
  max_stores: number;
  max_products: number;
  max_stock_per_product: number;
  trial_days: number;
  trial_end_date: string;
  created_at: string;
  updated_at: string;
}

export interface Usage {
  current_stores: number;
  current_products: number;
  total_stock: number;
  days_remaining: number;
  is_trial_active: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  max_stores: number;
  max_products: number;
  max_stock_per_product: number;
  features: string[];
  popular?: boolean;
}

// Definición de planes según los requerimientos
export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    max_stores: 1,
    max_products: 5,
    max_stock_per_product: 3,
    features: [
      '1 tipo de negocio',
      '5 productos máximo',
      '3 unidades máximo por producto',
      '10 días de prueba',
      'Funcionalidades básicas'
    ]
  },
  {
    id: 'single',
    name: 'Single Store',
    price: 10000,
    max_stores: 1,
    max_products: -1, // Sin límite
    max_stock_per_product: -1, // Sin límite
    features: [
      '1 tipo de negocio',
      'Productos ilimitados',
      'Stock ilimitado',
      'Todas las funcionalidades',
      'Soporte por email'
    ]
  },
  {
    id: 'double',
    name: 'Double Store',
    price: 15000,
    max_stores: 2,
    max_products: -1,
    max_stock_per_product: -1,
    features: [
      '2 tipos de negocio',
      'Productos ilimitados',
      'Stock ilimitado',
      'Todas las funcionalidades',
      'Soporte por email'
    ]
  },
  {
    id: 'triple',
    name: 'Triple Store',
    price: 18000,
    max_stores: 3,
    max_products: -1,
    max_stock_per_product: -1,
    features: [
      '3 tipos de negocio',
      'Productos ilimitados',
      'Stock ilimitado',
      'Todas las funcionalidades',
      'Soporte prioritario'
    ]
  },
  {
    id: 'quad',
    name: 'Quad Store',
    price: 22000,
    max_stores: 4,
    max_products: -1,
    max_stock_per_product: -1,
    features: [
      '4 tipos de negocio',
      'Productos ilimitados',
      'Stock ilimitado',
      'Todas las funcionalidades',
      'Soporte prioritario',
      'Reportes avanzados'
    ]
  },
  {
    id: 'full',
    name: 'Full Access',
    price: 25000,
    max_stores: -1, // Sin límite
    max_products: -1,
    max_stock_per_product: -1,
    popular: true,
    features: [
      'Todos los tipos de negocio',
      'Productos ilimitados',
      'Stock ilimitado',
      'Todas las funcionalidades',
      'Soporte prioritario',
      'Reportes avanzados',
      'Integración con WebPay'
    ]
  }
];

// Crear suscripción gratuita para un usuario
export const createFreeSubscription = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('ws_subscriptions')
      .insert({
        user_id: userId,
        plan: 'free',
        status: 'active',
        max_stores: 1,
        max_products: 5,
        max_stock_per_product: 3,
        trial_days: 10,
        trial_end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 días
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating free subscription:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error:', error);
    return { data: null, error };
  }
};

// Obtener suscripción de un usuario
export const getSubscription = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('ws_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error:', error);
    return { data: null, error };
  }
};

// Obtener uso actual del usuario
export const getUsage = async (userId: string): Promise<{ data: Usage | null, error: any }> => {
  try {
    // Obtener suscripción
    const { data: subscription, error: subError } = await getSubscription(userId);
    if (subError) {
      return { data: null, error: subError };
    }

    if (!subscription) {
      return { data: null, error: 'No subscription found' };
    }

    // Obtener uso desde la tabla ws_usage
    const { data: usageData, error: usageError } = await supabase
      .from('ws_usage')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (usageError && usageError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching usage:', usageError);
      return { data: null, error: usageError };
    }

    const currentStores = usageData?.current_stores || 0;
    const currentProducts = usageData?.current_products || 0;
    const totalStock = usageData?.total_stock || 0;
    
    const trialEndDate = new Date(subscription.trial_end_date);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const isTrialActive = subscription.plan === 'free' && daysRemaining > 0;

    const usage: Usage = {
      current_stores: currentStores,
      current_products: currentProducts,
      total_stock: totalStock,
      days_remaining: daysRemaining,
      is_trial_active: isTrialActive
    };

    return { data: usage, error: null };
  } catch (error) {
    console.error('Error:', error);
    return { data: null, error };
  }
};

// Verificar si el usuario puede agregar más stores
export const canAddStore = async (userId: string): Promise<{ can: boolean, error?: string }> => {
  try {
    const { data: subscription, error: subError } = await getSubscription(userId);
    if (subError || !subscription) {
      return { can: false, error: 'No subscription found' };
    }

    const { data: usage, error: usageError } = await getUsage(userId);
    if (usageError || !usage) {
      return { can: false, error: 'Cannot check usage' };
    }

    // Verificar si está en período de prueba
    if (subscription.plan === 'free' && !usage.is_trial_active) {
      return { can: false, error: 'Período de prueba expirado. Actualiza tu plan para agregar más tiendas.' };
    }

    // Verificar límite de stores
    if (subscription.max_stores !== -1 && usage.current_stores >= subscription.max_stores) {
      return { can: false, error: `Has alcanzado el límite de ${subscription.max_stores} tienda(s). Actualiza tu plan para agregar más tiendas.` };
    }

    return { can: true };
  } catch (error) {
    console.error('Error:', error);
    return { can: false, error: 'Error verificando límites de tiendas' };
  }
};

// Verificar si el usuario puede agregar más productos
export const canAddProduct = async (userId: string): Promise<{ can: boolean, error?: string }> => {
  try {
    const { data: subscription, error: subError } = await getSubscription(userId);
    if (subError || !subscription) {
      return { can: false, error: 'No subscription found' };
    }

    const { data: usage, error: usageError } = await getUsage(userId);
    if (usageError || !usage) {
      return { can: false, error: 'Cannot check usage' };
    }

    // Verificar si está en período de prueba
    if (subscription.plan === 'free' && !usage.is_trial_active) {
      return { can: false, error: 'Período de prueba expirado. Actualiza tu plan para agregar más productos.' };
    }

    // Verificar límite de productos
    if (subscription.max_products !== -1 && usage.current_products >= subscription.max_products) {
      return { can: false, error: `Has alcanzado el límite de ${subscription.max_products} productos. Actualiza tu plan para agregar más productos.` };
    }

    return { can: true };
  } catch (error) {
    console.error('Error:', error);
    return { can: false, error: 'Error verificando límites de productos' };
  }
};

// Verificar si el usuario puede agregar más stock a un producto
export const canAddStock = async (userId: string, currentStock: number, additionalStock: number): Promise<{ can: boolean, error?: string }> => {
  try {
    const { data: subscription, error: subError } = await getSubscription(userId);
    if (subError || !subscription) {
      return { can: false, error: 'No subscription found' };
    }

    // Verificar límite de stock por producto
    if (subscription.max_stock_per_product !== -1 && (currentStock + additionalStock) > subscription.max_stock_per_product) {
      return { can: false, error: `No puedes tener más de ${subscription.max_stock_per_product} unidades por producto en tu plan actual.` };
    }

    return { can: true };
  } catch (error) {
    console.error('Error:', error);
    return { can: false, error: 'Error verificando límites de stock' };
  }
};

// Obtener plan por ID
export const getPlanById = (planId: string): Plan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

// Actualizar suscripción (para cuando se pague)
export const updateSubscription = async (userId: string, planId: string, paymentData: any) => {
  try {
    const plan = getPlanById(planId);
    if (!plan) {
      return { data: null, error: 'Invalid plan' };
    }

    const { data, error } = await supabase
      .from('ws_subscriptions')
      .update({
        plan: planId,
        status: 'active',
        max_stores: plan.max_stores,
        max_products: plan.max_products,
        max_stock_per_product: plan.max_stock_per_product,
        trial_days: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return { data: null, error };
    }

    // Registrar el pago
    await supabase
      .from('ws_payments')
      .insert({
        user_id: userId,
        subscription_id: data.id,
        amount: paymentData.amount,
        currency: 'CLP',
        payment_method: 'webpay',
        status: 'completed',
        transaction_id: paymentData.transactionId,
        created_at: new Date().toISOString()
      });

    return { data, error: null };
  } catch (error) {
    console.error('Error:', error);
    return { data: null, error };
  }
}; 